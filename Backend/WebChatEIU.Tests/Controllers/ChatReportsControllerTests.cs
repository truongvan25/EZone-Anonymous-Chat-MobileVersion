using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using WebChatEIU.Controllers;
using WebChatEIU.Data;
using WebChatEIU.DTOs;
using WebChatEIU.Models;

namespace WebChatEIU.Tests.Controllers
{
    // Test thật cho Create/Update/Delete data API — 3 trong 9 API tối thiểu
    // đề bài yêu cầu, đều nằm trong ChatReportsController.
    public class ChatReportsControllerTests
    {
        private static ApplicationDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options);
        }

        private static ChatReportsController CreateController(ApplicationDbContext context, int? currentUserId = null)
        {
            var controller = new ChatReportsController(context);

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

        private static async Task<ChatRooms> SeedRoom(ApplicationDbContext context)
        {
            var room = new ChatRooms
            {
                User1Id = 1,
                User2Id = 2,
                User1Nickname = "Ghost1",
                User2Nickname = "Ghost2",
                Status = ChatRooms.RoomStatus.Active,
            };
            context.ChatRooms.Add(room);
            await context.SaveChangesAsync();
            return room;
        }

        // ------------------------- Create -------------------------

        [Fact]
        public async Task CreateReport_ByParticipant_SetsReportedUserToTheOtherParticipant()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);
            var controller = CreateController(context);

            var report = new ChatReports
            {
                RoomId = room.RoomId,
                ReporterId = 1,
                Reason = "spam",
                ViolatingMessage = "buy followers now",
            };

            var result = await controller.CreateReport(report);

            Assert.IsType<OkObjectResult>(result);

            var saved = await context.ChatReports.FirstAsync(r => r.RoomId == room.RoomId);
            Assert.Equal(2, saved.ReportedUserId);
            Assert.Equal("Pending", saved.Status);
            Assert.Equal("User", saved.Type);
        }

        [Fact]
        public async Task CreateReport_AlwaysSetsTypeToUser_EvenIfClientSendsAuto()
        {
            // Client không được tự xưng "Auto" để né audit trail thật.
            var context = CreateContext();
            var room = await SeedRoom(context);
            var controller = CreateController(context);

            var report = new ChatReports
            {
                RoomId = room.RoomId,
                ReporterId = 1,
                Reason = "spam",
                ViolatingMessage = "buy followers now",
                Type = "Auto",
            };

            await controller.CreateReport(report);

            var saved = await context.ChatReports.FirstAsync(r => r.RoomId == room.RoomId);
            Assert.Equal("User", saved.Type);
        }

        [Fact]
        public async Task CreateReport_ByNonParticipant_ReturnsBadRequest()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);
            var controller = CreateController(context);

            var report = new ChatReports
            {
                RoomId = room.RoomId,
                ReporterId = 999,
                Reason = "spam",
                ViolatingMessage = "buy followers now",
            };

            var result = await controller.CreateReport(report);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task CreateReport_WhenRoomNotFound_ReturnsNotFound()
        {
            var context = CreateContext();
            var controller = CreateController(context);

            var report = new ChatReports
            {
                RoomId = 12345,
                ReporterId = 1,
                Reason = "spam",
                ViolatingMessage = "buy followers now",
            };

            var result = await controller.CreateReport(report);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task CreateReport_AlwaysSetsIsSeenByAdminFalse_EvenIfClientSendsTrue()
        {
            // Client không được tự đánh dấu "đã xem" để né badge của Admin.
            var context = CreateContext();
            var room = await SeedRoom(context);
            var controller = CreateController(context);

            var report = new ChatReports
            {
                RoomId = room.RoomId,
                ReporterId = 1,
                Reason = "spam",
                ViolatingMessage = "buy followers now",
                IsSeenByAdmin = true,
            };

            await controller.CreateReport(report);

            var saved = await context.ChatReports.FirstAsync(r => r.RoomId == room.RoomId);
            Assert.False(saved.IsSeenByAdmin);
        }

        // ------------------------- Unread badge -------------------------

        [Fact]
        public async Task GetUnreadCount_ReturnsOnlyUnseenReports()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);

            context.ChatReports.AddRange(
                new ChatReports { RoomId = room.RoomId, ReporterId = 1, ReportedUserId = 2, Reason = "a", ViolatingMessage = "m1", IsSeenByAdmin = false },
                new ChatReports { RoomId = room.RoomId, ReporterId = 2, ReportedUserId = 1, Reason = "b", ViolatingMessage = "m2", IsSeenByAdmin = false },
                new ChatReports { RoomId = room.RoomId, ReporterId = 1, ReportedUserId = 2, Reason = "c", ViolatingMessage = "m3", IsSeenByAdmin = true }
            );
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.GetUnreadCount();

            var ok = Assert.IsType<OkObjectResult>(result);
            var count = (int)ok.Value!.GetType().GetProperty("count")!.GetValue(ok.Value)!;

            Assert.Equal(2, count);
        }

        [Fact]
        public async Task MarkReportsSeen_SetsAllUnseenReportsToSeen()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);

            context.ChatReports.AddRange(
                new ChatReports { RoomId = room.RoomId, ReporterId = 1, ReportedUserId = 2, Reason = "a", ViolatingMessage = "m1", IsSeenByAdmin = false },
                new ChatReports { RoomId = room.RoomId, ReporterId = 2, ReportedUserId = 1, Reason = "b", ViolatingMessage = "m2", IsSeenByAdmin = false }
            );
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.MarkReportsSeen();

            Assert.IsType<OkObjectResult>(result);
            Assert.True(await context.ChatReports.AllAsync(r => r.IsSeenByAdmin));

            var countAfter = await controller.GetUnreadCount() as OkObjectResult;
            var count = (int)countAfter!.Value!.GetType().GetProperty("count")!.GetValue(countAfter.Value)!;
            Assert.Equal(0, count);
        }

        // ------------------------- Update -------------------------

        [Fact]
        public async Task UpdateReportStatus_WithValidStatus_UpdatesStatus()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);
            var report = new ChatReports
            {
                RoomId = room.RoomId,
                ReporterId = 1,
                ReportedUserId = 2,
                Reason = "spam",
                ViolatingMessage = "msg",
                Status = "Pending",
            };
            context.ChatReports.Add(report);
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.UpdateReportStatus(report.ReportId, new UpdateReportStatusDto { Status = "Resolved" });

            Assert.IsType<OkObjectResult>(result);

            var updated = await context.ChatReports.FirstAsync(r => r.ReportId == report.ReportId);
            Assert.Equal("Resolved", updated.Status);
        }

        [Fact]
        public async Task UpdateReportStatus_WithInvalidStatus_ReturnsBadRequest()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);
            var report = new ChatReports
            {
                RoomId = room.RoomId,
                ReporterId = 1,
                ReportedUserId = 2,
                Reason = "spam",
                ViolatingMessage = "msg",
                Status = "Pending",
            };
            context.ChatReports.Add(report);
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.UpdateReportStatus(report.ReportId, new UpdateReportStatusDto { Status = "NotARealStatus" });

            Assert.IsType<BadRequestObjectResult>(result);

            var unchanged = await context.ChatReports.FirstAsync(r => r.ReportId == report.ReportId);
            Assert.Equal("Pending", unchanged.Status);
        }

        [Fact]
        public async Task UpdateReportStatus_WhenReportNotFound_ReturnsNotFound()
        {
            var context = CreateContext();
            var controller = CreateController(context);

            var result = await controller.UpdateReportStatus(999, new UpdateReportStatusDto { Status = "Resolved" });

            Assert.IsType<NotFoundObjectResult>(result);
        }

        // ------------------------- Delete -------------------------

        [Fact]
        public async Task DeleteReport_RemovesReportFromDb()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);
            var report = new ChatReports
            {
                RoomId = room.RoomId,
                ReporterId = 1,
                ReportedUserId = 2,
                Reason = "spam",
                ViolatingMessage = "msg",
            };
            context.ChatReports.Add(report);
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.DeleteReport(report.ReportId);

            Assert.IsType<OkObjectResult>(result);
            Assert.False(await context.ChatReports.AnyAsync(r => r.ReportId == report.ReportId));
        }

        // ------------------------- Ban -------------------------

        [Fact]
        public async Task BanReportedUser_SetsIsBannedTrue()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);

            context.Users.Add(new Users { UserId = 2, Email = "bad@eiu.edu.vn", Fullname = "Bad Actor", Password = "hashed", MajorCode = "SE" });

            var report = new ChatReports
            {
                RoomId = room.RoomId,
                ReporterId = 1,
                ReportedUserId = 2,
                Reason = "spam",
                ViolatingMessage = "msg",
            };
            context.ChatReports.Add(report);
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.BanReportedUser(report.ReportId);

            Assert.IsType<OkObjectResult>(result);

            var bannedUser = await context.Users.FirstAsync(u => u.UserId == 2);
            Assert.True(bannedUser.IsBanned);
        }

        // ------------------------- Unban -------------------------

        [Fact]
        public async Task UnbanReportedUser_SetsIsBannedFalse()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);

            context.Users.Add(new Users
            {
                UserId = 2,
                Email = "bad@eiu.edu.vn",
                Fullname = "Bad Actor",
                Password = "hashed",
                MajorCode = "SE",
                IsBanned = true,
            });

            var report = new ChatReports
            {
                RoomId = room.RoomId,
                ReporterId = 1,
                ReportedUserId = 2,
                Reason = "spam",
                ViolatingMessage = "msg",
            };
            context.ChatReports.Add(report);
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.UnbanReportedUser(report.ReportId);

            Assert.IsType<OkObjectResult>(result);

            var unbannedUser = await context.Users.FirstAsync(u => u.UserId == 2);
            Assert.False(unbannedUser.IsBanned);
        }

        [Fact]
        public async Task UnbanReportedUser_WhenReportNotFound_ReturnsNotFound()
        {
            var context = CreateContext();
            var controller = CreateController(context);

            var result = await controller.UnbanReportedUser(999);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        // ------------------------- Get reports (Admin list) -------------------------

        [Fact]
        public async Task GetReports_IncludesIsReportedUserBannedFlag()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);

            context.Users.AddRange(
                new Users { UserId = 2, Email = "banned@eiu.edu.vn", Fullname = "Banned", Password = "hashed", MajorCode = "SE", IsBanned = true },
                new Users { UserId = 1, Email = "clean@eiu.edu.vn", Fullname = "Clean", Password = "hashed", MajorCode = "SE", IsBanned = false }
            );

            context.ChatReports.AddRange(
                new ChatReports { RoomId = room.RoomId, ReporterId = 1, ReportedUserId = 2, Reason = "a", ViolatingMessage = "m1" },
                new ChatReports { RoomId = room.RoomId, ReporterId = 2, ReportedUserId = 1, Reason = "b", ViolatingMessage = "m2" }
            );
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.GetReports();

            var ok = Assert.IsType<OkObjectResult>(result);
            var data = (System.Collections.IEnumerable)ok.Value!.GetType().GetProperty("data")!.GetValue(ok.Value)!;

            foreach (var item in data)
            {
                var reportedUserId = (int)item.GetType().GetProperty("ReportedUserId")!.GetValue(item)!;
                var isBanned = (bool)item.GetType().GetProperty("IsReportedUserBanned")!.GetValue(item)!;

                Assert.Equal(reportedUserId == 2, isBanned);
            }
        }

        [Fact]
        public async Task GetReports_FilterByType_ReturnsOnlyMatchingType()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);

            context.ChatReports.AddRange(
                new ChatReports { RoomId = room.RoomId, ReporterId = 1, ReportedUserId = 2, Reason = "spam", ViolatingMessage = "m1", Type = "User" },
                new ChatReports { RoomId = room.RoomId, ReporterId = 2, ReportedUserId = 2, Reason = "Auto-detected sensitive content", ViolatingMessage = "m2", Type = "Auto" }
            );
            await context.SaveChangesAsync();

            var controller = CreateController(context);

            var result = await controller.GetReports(type: "Auto");

            var ok = Assert.IsType<OkObjectResult>(result);
            var data = (System.Collections.IEnumerable)ok.Value!.GetType().GetProperty("data")!.GetValue(ok.Value)!;

            var items = data.Cast<object>().ToList();
            Assert.Single(items);
            Assert.Equal("Auto", items[0].GetType().GetProperty("Type")!.GetValue(items[0]));
        }

        // ------------------------- My reports -------------------------

        [Fact]
        public async Task GetMyReports_ReturnsOnlyReportsSubmittedByCurrentUser()
        {
            var context = CreateContext();
            var room = await SeedRoom(context);

            context.ChatReports.AddRange(
                new ChatReports { RoomId = room.RoomId, ReporterId = 1, ReportedUserId = 2, Reason = "a", ViolatingMessage = "m1" },
                new ChatReports { RoomId = room.RoomId, ReporterId = 2, ReportedUserId = 1, Reason = "b", ViolatingMessage = "m2" }
            );
            await context.SaveChangesAsync();

            var controller = CreateController(context, currentUserId: 1);

            var result = await controller.GetMyReports();

            var ok = Assert.IsType<OkObjectResult>(result);
            var reports = Assert.IsAssignableFrom<System.Collections.Generic.IEnumerable<ChatReports>>(ok.Value);
            Assert.Single(reports);
            Assert.All(reports, r => Assert.Equal(1, r.ReporterId));
        }
    }
}
