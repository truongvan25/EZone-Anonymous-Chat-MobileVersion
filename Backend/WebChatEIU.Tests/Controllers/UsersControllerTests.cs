using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using WebChatEIU.Controllers;
using WebChatEIU.Data;
using WebChatEIU.DTOs;
using WebChatEIU.Models;
using WebChatEIU.Services;

namespace WebChatEIU.Tests.Controllers
{
    // Test thật cho luồng Register/Activate/Delete account — các API bắt buộc
    // theo yêu cầu đề bài (Register API, và Delete data API cho account).
    public class UsersControllerTests
    {
        private static ApplicationDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options);
        }

        private static IConfiguration CreateConfig()
        {
            var settings = new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "test-super-secret-key-for-unit-tests-only-1234567890",
                ["Jwt:Issuer"] = "WebChatEIU.Tests",
                ["Jwt:Audience"] = "WebChatEIU.Tests",
            };

            return new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        }

        private static UsersController CreateController(ApplicationDbContext context, int? currentUserId = null)
        {
            // Email:Host rỗng trong CreateConfig() -> EmailService tự fallback
            // sang chỉ log, không cố gửi SMTP thật trong lúc test.
            var emailService = new EmailService(CreateConfig(), NullLogger<EmailService>.Instance);
            var controller = new UsersController(context, CreateConfig(), emailService, NullLogger<UsersController>.Instance);

            if (currentUserId.HasValue)
            {
                var identity = new ClaimsIdentity(new[] { new Claim("userId", currentUserId.Value.ToString()) }, "Test");
                controller.ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
                };
            }

            return controller;
        }

        // ------------------------- Register -------------------------

        [Fact]
        public async Task Register_WithNewEmail_CreatesInactiveUserWithStoredCode()
        {
            var context = CreateContext();
            var controller = CreateController(context);

            var result = await controller.Register(new RegisterDto
            {
                Fullname = "New User",
                Email = "newuser@eiu.edu.vn",
                Password = "123456",
                MajorCode = "SE",
            });

            var saved = await context.Users.FirstOrDefaultAsync(u => u.Email == "newuser@eiu.edu.vn");
            Assert.NotNull(saved);
            Assert.False(saved!.IsActive);
            Assert.False(string.IsNullOrEmpty(saved.ActiveCode));

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Register_ResponseDoesNotLeakActivationCode()
        {
            // Trước đây response trả thẳng activationCode -> ai gọi API cũng tự
            // kích hoạt được. Giờ code chỉ được gửi qua email (hoặc log server
            // nếu SMTP chưa cấu hình), KHÔNG được xuất hiện trong response.
            var context = CreateContext();
            var controller = CreateController(context);

            var result = await controller.Register(new RegisterDto
            {
                Fullname = "New User",
                Email = "noleak@eiu.edu.vn",
                Password = "123456",
                MajorCode = "SE",
            });

            var ok = Assert.IsType<OkObjectResult>(result);
            var activationCodeProp = ok.Value!.GetType().GetProperty("activationCode");
            Assert.Null(activationCodeProp);
        }

        [Theory]
        [InlineData("notaneiuemail@gmail.com")]
        [InlineData("missing-at-sign.eiu.edu.vn")]
        [InlineData("")]
        public async Task Register_WithInvalidEmailFormat_ReturnsBadRequest(string invalidEmail)
        {
            var context = CreateContext();
            var controller = CreateController(context);

            var result = await controller.Register(new RegisterDto
            {
                Fullname = "New User",
                Email = invalidEmail,
                Password = "123456",
                MajorCode = "SE",
            });

            Assert.IsType<BadRequestObjectResult>(result);
            Assert.False(await context.Users.AnyAsync(u => u.Email == invalidEmail));
        }

        [Fact]
        public async Task Register_WithExistingEmail_ReturnsBadRequest()
        {
            var context = CreateContext();
            context.Users.Add(new Users
            {
                Email = "taken@eiu.edu.vn",
                Fullname = "Existing",
                Password = "hashed",
                MajorCode = "SE",
            });
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.Register(new RegisterDto
            {
                Fullname = "New User",
                Email = "taken@eiu.edu.vn",
                Password = "123456",
                MajorCode = "SE",
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ------------------------- Activate -------------------------

        [Fact]
        public async Task ActivateByPost_WithValidCode_ActivatesAccount()
        {
            var context = CreateContext();
            var user = new Users
            {
                Email = "toactivate@eiu.edu.vn",
                Fullname = "To Activate",
                Password = "hashed",
                MajorCode = "SE",
                IsActive = false,
                ActiveCode = "654321",
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.ActivateByPost(new ActivateDto { Email = user.Email, Code = "654321" });

            Assert.IsType<OkObjectResult>(result);

            var updated = await context.Users.FirstAsync(u => u.Email == "toactivate@eiu.edu.vn");
            Assert.True(updated.IsActive);
            Assert.Null(updated.ActiveCode);
        }

        [Fact]
        public async Task ActivateByPost_WithInvalidCode_ReturnsBadRequest()
        {
            var context = CreateContext();
            var controller = CreateController(context);

            var result = await controller.ActivateByPost(new ActivateDto { Email = "x@eiu.edu.vn", Code = "000000" });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task ActivateByPost_WhenAlreadyActive_ReturnsBadRequest()
        {
            var context = CreateContext();
            context.Users.Add(new Users
            {
                Email = "already@eiu.edu.vn",
                Fullname = "Already Active",
                Password = "hashed",
                MajorCode = "SE",
                IsActive = true,
                ActiveCode = "111111",
            });
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.ActivateByPost(new ActivateDto { Email = "already@eiu.edu.vn", Code = "111111" });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ------------------------- Delete account (soft delete) -------------------------

        [Fact]
        public async Task DeleteAccount_WithCorrectPassword_SoftDeletesUser()
        {
            var context = CreateContext();
            var user = new Users
            {
                Email = "delete@eiu.edu.vn",
                Fullname = "Delete Me",
                Password = BCrypt.Net.BCrypt.HashPassword("123456"),
                MajorCode = "SE",
                IsActive = true,
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, currentUserId: user.UserId);

            var result = await controller.DeleteAccount(user.UserId, new DeleteAccountDto { Password = "123456" });

            Assert.IsType<OkObjectResult>(result);

            // Global query filter (!IsDeleted) phải ẩn user này khỏi mọi query bình thường.
            var stillVisible = await context.Users.FirstOrDefaultAsync(u => u.UserId == user.UserId);
            Assert.Null(stillVisible);

            var raw = await context.Users.IgnoreQueryFilters().FirstAsync(u => u.UserId == user.UserId);
            Assert.True(raw.IsDeleted);
            Assert.NotNull(raw.DeletedAt);
        }

        [Fact]
        public async Task DeleteAccount_WithWrongPassword_ReturnsBadRequest()
        {
            var context = CreateContext();
            var user = new Users
            {
                Email = "wrongpass@eiu.edu.vn",
                Fullname = "User",
                Password = BCrypt.Net.BCrypt.HashPassword("123456"),
                MajorCode = "SE",
                IsActive = true,
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, currentUserId: user.UserId);

            var result = await controller.DeleteAccount(user.UserId, new DeleteAccountDto { Password = "wrong" });

            Assert.IsType<BadRequestObjectResult>(result);

            var stillThere = await context.Users.FirstOrDefaultAsync(u => u.UserId == user.UserId);
            Assert.NotNull(stillThere);
            Assert.False(stillThere!.IsDeleted);
        }

        [Fact]
        public async Task DeleteAccount_ByDifferentUser_ReturnsForbid()
        {
            var context = CreateContext();
            var user = new Users
            {
                Email = "victim@eiu.edu.vn",
                Fullname = "Victim",
                Password = BCrypt.Net.BCrypt.HashPassword("123456"),
                MajorCode = "SE",
                IsActive = true,
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            // currentUserId khác với user bị nhắm tới -> phải bị chặn
            var controller = CreateController(context, currentUserId: user.UserId + 999);

            var result = await controller.DeleteAccount(user.UserId, new DeleteAccountDto { Password = "123456" });

            Assert.IsType<ForbidResult>(result);
        }

        // ------------------------- Get profile (GetMe) -------------------------

        [Fact]
        public async Task GetMe_WhenUserExists_ReturnsProfileFields()
        {
            var context = CreateContext();
            var user = new Users
            {
                Email = "me@eiu.edu.vn",
                Fullname = "My Name",
                Password = "hashed",
                MajorCode = "SE",
                Gender = "Male",
                IsActive = true,
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, currentUserId: user.UserId);

            var result = await controller.GetMe();

            var ok = Assert.IsType<OkObjectResult>(result);
            var type = ok.Value!.GetType();
            Assert.Equal("me@eiu.edu.vn", (string?)type.GetProperty("email")!.GetValue(ok.Value));
            Assert.Equal("My Name", (string?)type.GetProperty("fullname")!.GetValue(ok.Value));
            Assert.Equal("Male", (string?)type.GetProperty("gender")!.GetValue(ok.Value));
        }

        [Fact]
        public async Task GetMe_WhenUserNotFound_ReturnsNotFound()
        {
            var context = CreateContext();
            // Không seed user nào -> userId trong claim không tồn tại trong DB
            var controller = CreateController(context, currentUserId: 12345);

            var result = await controller.GetMe();

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task GetMe_WhenUserIsSoftDeleted_ReturnsNotFound()
        {
            var context = CreateContext();
            var user = new Users
            {
                Email = "gone@eiu.edu.vn",
                Fullname = "Gone",
                Password = "hashed",
                MajorCode = "SE",
                IsActive = true,
                IsDeleted = true,
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, currentUserId: user.UserId);

            var result = await controller.GetMe();

            // Global query filter (!IsDeleted) phải ẩn user này ngay cả khi JWT còn hạn.
            Assert.IsType<NotFoundObjectResult>(result);
        }

        // ------------------------- Update profile (UpdateUsers) -------------------------

        [Fact]
        public async Task UpdateUsers_BySelf_UpdatesFieldsAndReturnsNoContent()
        {
            var context = CreateContext();
            var user = new Users
            {
                Email = "editme@eiu.edu.vn",
                Fullname = "Old Name",
                Password = "hashed",
                MajorCode = "SE",
                IsActive = true,
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, currentUserId: user.UserId);

            var result = await controller.UpdateUsers(user.UserId, new UpdateUserDto
            {
                Fullname = "New Name",
                Gender = "Female",
                MajorCode = "IT",
                SocialLink = "https://fb.com/newname",
            });

            Assert.IsType<NoContentResult>(result);

            var updated = await context.Users.FirstAsync(u => u.UserId == user.UserId);
            Assert.Equal("New Name", updated.Fullname);
            Assert.Equal("Female", updated.Gender);
            Assert.Equal("IT", updated.MajorCode);
            Assert.Equal("https://fb.com/newname", updated.SocialLink);
        }

        [Fact]
        public async Task UpdateUsers_ByDifferentUser_ReturnsForbid()
        {
            var context = CreateContext();
            var user = new Users
            {
                Email = "notyours@eiu.edu.vn",
                Fullname = "Not Yours",
                Password = "hashed",
                MajorCode = "SE",
                IsActive = true,
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, currentUserId: user.UserId + 999);

            var result = await controller.UpdateUsers(user.UserId, new UpdateUserDto { Fullname = "Hacked" });

            Assert.IsType<ForbidResult>(result);

            var unchanged = await context.Users.FirstAsync(u => u.UserId == user.UserId);
            Assert.Equal("Not Yours", unchanged.Fullname);
        }

        [Fact]
        public async Task UpdateUsers_WhenUserNotActive_ReturnsNotFound()
        {
            var context = CreateContext();
            var user = new Users
            {
                Email = "inactive@eiu.edu.vn",
                Fullname = "Inactive",
                Password = "hashed",
                MajorCode = "SE",
                IsActive = false,
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, currentUserId: user.UserId);

            var result = await controller.UpdateUsers(user.UserId, new UpdateUserDto { Fullname = "Whatever" });

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task UpdateUsers_WithAvatarFile_SavesFileAndSetsAvatarUrl()
        {
            var context = CreateContext();
            var user = new Users
            {
                Email = "avatar@eiu.edu.vn",
                Fullname = "Avatar User",
                Password = "hashed",
                MajorCode = "SE",
                IsActive = true,
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = CreateController(context, currentUserId: user.UserId);

            var fileContent = System.Text.Encoding.UTF8.GetBytes("fake-image-bytes");
            var stream = new MemoryStream(fileContent);
            var avatarFile = new Microsoft.AspNetCore.Http.FormFile(stream, 0, fileContent.Length, "AvatarFile", "avatar.jpg")
            {
                Headers = new Microsoft.AspNetCore.Http.HeaderDictionary(),
                ContentType = "image/jpeg",
            };

            var result = await controller.UpdateUsers(user.UserId, new UpdateUserDto
            {
                Fullname = "Avatar User",
                AvatarFile = avatarFile,
            });

            Assert.IsType<NoContentResult>(result);

            var updated = await context.Users.FirstAsync(u => u.UserId == user.UserId);
            Assert.NotNull(updated.AvatarUrl);
            Assert.StartsWith("/avatar_images/", updated.AvatarUrl);
            Assert.EndsWith(".jpg", updated.AvatarUrl);

            // Dọn file thật đã được ghi ra đĩa trong lúc test để không rác bin folder.
            var savedPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", updated.AvatarUrl!.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(savedPath))
            {
                File.Delete(savedPath);
            }
        }
    }
}
