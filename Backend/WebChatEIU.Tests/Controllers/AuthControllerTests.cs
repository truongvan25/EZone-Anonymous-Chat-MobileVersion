using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;
using WebChatEIU.Controllers;
using WebChatEIU.Data;
using WebChatEIU.DTOs;
using WebChatEIU.Models;

namespace WebChatEIU.Tests.Controllers
{
    // Test thật gọi trực tiếp AuthController.Login (trước đây file này chỉ
    // assert trên biến string khai báo tay, không hề đụng tới controller).
    public class AuthControllerTests
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

            return new ConfigurationBuilder()
                .AddInMemoryCollection(settings)
                .Build();
        }

        private static async Task<Users> SeedUser(
            ApplicationDbContext context,
            string email = "test@eiu.edu.vn",
            string password = "123456",
            bool isActive = true,
            bool isBanned = false)
        {
            var user = new Users
            {
                Email = email,
                Fullname = "Test User",
                Password = BCrypt.Net.BCrypt.HashPassword(password),
                MajorCode = "SE",
                IsActive = isActive,
                IsBanned = isBanned,
            };

            context.Users.Add(user);
            await context.SaveChangesAsync();

            return user;
        }

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOkWithToken()
        {
            var context = CreateContext();
            await SeedUser(context);
            var controller = new AuthController(context, CreateConfig());

            var result = await controller.Login(new LoginDto { Email = "test@eiu.edu.vn", Password = "123456" });

            var ok = Assert.IsType<OkObjectResult>(result);
            var token = (string?)ok.Value!.GetType().GetProperty("token")!.GetValue(ok.Value);
            Assert.False(string.IsNullOrEmpty(token));
        }

        [Fact]
        public async Task Login_WithWrongPassword_ReturnsUnauthorized()
        {
            var context = CreateContext();
            await SeedUser(context);
            var controller = new AuthController(context, CreateConfig());

            var result = await controller.Login(new LoginDto { Email = "test@eiu.edu.vn", Password = "wrong-password" });

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Login_WithNonExistentEmail_ReturnsUnauthorized()
        {
            var context = CreateContext();
            var controller = new AuthController(context, CreateConfig());

            var result = await controller.Login(new LoginDto { Email = "nobody@eiu.edu.vn", Password = "123456" });

            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Login_WithInactiveAccount_ReturnsBadRequest()
        {
            var context = CreateContext();
            await SeedUser(context, isActive: false);
            var controller = new AuthController(context, CreateConfig());

            var result = await controller.Login(new LoginDto { Email = "test@eiu.edu.vn", Password = "123456" });

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Account is not activated", badRequest.Value);
        }

        [Fact]
        public async Task Login_WithBannedAccount_ReturnsBadRequest()
        {
            var context = CreateContext();
            await SeedUser(context, isBanned: true);
            var controller = new AuthController(context, CreateConfig());

            var result = await controller.Login(new LoginDto { Email = "test@eiu.edu.vn", Password = "123456" });

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Account is banned", badRequest.Value);
        }
    }
}
