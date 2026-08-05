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
