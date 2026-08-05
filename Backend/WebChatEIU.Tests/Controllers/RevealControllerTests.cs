using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using WebChatEIU.Controllers;
using WebChatEIU.Data;
using WebChatEIU.Models;

namespace WebChatEIU.Tests.Controllers
{
    // Thay cho RevealServiceTests.cs cũ (chỉ assert bool khai báo tay, không hề
    // gọi RevealController thật). Ở đây gọi trực tiếp các action thật với DB
    // in-memory, giả lập claims "userId" như khi đã Authorize thật.
    public class RevealControllerTests
    {
        private static ApplicationDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options);
        }

        private static RevealController CreateController(ApplicationDbContext context, int currentUserId)
        {
            var controller = new RevealController(context);

            var identity = new ClaimsIdentity(new[] { new Claim("userId", currentUserId.ToString()) }, "Test");
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };

            return controller;
        }

        private static async Task<ChatRooms> SeedRoom(
            ApplicationDbContext context,
            int affinityScore = 0,
            bool user1Revealed = false,
            bool user2Revealed = false,
            bool isRevealed = false)
        {
            var room = new ChatRooms
            {
                User1Id = 1,
                User2Id = 2,
                User1Nickname = "Ghost1",
                User2Nickname = "Ghost2",
                AffinityScore = affinityScore,
                User1Revealed = user1Revealed,
                User2Revealed = user2Revealed,
                IsRevealed = isRevealed,
                Status = ChatRooms.RoomStatus.Active,
            };

            context.ChatRooms.Add(room);
            await context.SaveChangesAsync();

            return room;
        }

        [Fact]
        public async Task RequestReveal_WhenAffinityTooLow_ReturnsBadRequest()
        {
            var context = CreateContext();
            var room = await SeedRoom(context, affinityScore: 0);
            var controller = CreateController(context, currentUserId: 1);

            var result = await controller.RequestReveal(room.RoomId, 1);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task RequestReveal_WithAffinityJustBelowThreshold_ReturnsBadRequest()
        {
            // Ngưỡng thật là AffinityScore >= 10 -> 9 vẫn phải bị chặn.
            var context = CreateContext();
            var room = await SeedRoom(context, affinityScore: 9);
            var controller = CreateController(context, currentUserId: 1);

            var result = await controller.RequestReveal(room.RoomId, 1);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task RequestReveal_BySingleUser_DoesNotFullyRevealYet()
        {
            var context = CreateContext();
            var room = await SeedRoom(context, affinityScore: 10);
            var controller = CreateController(context, currentUserId: 1);

            var result = await controller.RequestReveal(room.RoomId, 1);

            var ok = Assert.IsType<OkObjectResult>(result);
            var updated = Assert.IsType<ChatRooms>(ok.Value);
            Assert.True(updated.User1Revealed);
            Assert.False(updated.User2Revealed);
            Assert.False(updated.IsRevealed);
        }

        [Fact]
        public async Task RequestReveal_ByBothUsers_SetsIsRevealedTrue()
        {
            var context = CreateContext();
            var room = await SeedRoom(context, affinityScore: 10, user1Revealed: true);
            var controller = CreateController(context, currentUserId: 2);

            var result = await controller.RequestReveal(room.RoomId, 2);

            var ok = Assert.IsType<OkObjectResult>(result);
            var updated = Assert.IsType<ChatRooms>(ok.Value);
            Assert.True(updated.User1Revealed);
            Assert.True(updated.User2Revealed);
            Assert.True(updated.IsRevealed);
        }

        [Fact]
        public async Task RequestReveal_ByUserNotInRoom_ReturnsBadRequest()
        {
            // affinityScore đủ ngưỡng để chắc chắn test này chặn đúng vì lý do
            // "user not in room", không lẫn với lý do affinity chưa đủ.
            var context = CreateContext();
            var room = await SeedRoom(context, affinityScore: 10);
            var controller = CreateController(context, currentUserId: 999);

            var result = await controller.RequestReveal(room.RoomId, 999);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GetRevealStatus_ReturnsCanRevealTrue_WhenAffinityAtLeastTen()
        {
            var context = CreateContext();
            var room = await SeedRoom(context, affinityScore: 12, user1Revealed: true);
            var controller = CreateController(context, currentUserId: 1);

            var result = await controller.GetRevealStatus(room.RoomId);

            var ok = Assert.IsType<OkObjectResult>(result);
            var canReveal = (bool)ok.Value!.GetType().GetProperty("canReveal")!.GetValue(ok.Value)!;
            Assert.True(canReveal);
        }

        [Fact]
        public async Task GetRevealStatus_ByUserNotInRoom_ReturnsBadRequest()
        {
            var context = CreateContext();
            var room = await SeedRoom(context, affinityScore: 5);
            var controller = CreateController(context, currentUserId: 999);

            var result = await controller.GetRevealStatus(room.RoomId);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GetRevealedIdentity_BeforeReveal_ReturnsBadRequest()
        {
            var context = CreateContext();
            var room = await SeedRoom(context, affinityScore: 5);
            var controller = CreateController(context, currentUserId: 1);

            var result = await controller.GetRevealedIdentity(room.RoomId, 1);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GetRevealedIdentity_AfterReveal_ReturnsPartnerInfo()
        {
            var context = CreateContext();
            var room = await SeedRoom(context, affinityScore: 12, user1Revealed: true, user2Revealed: true, isRevealed: true);

            context.Users.Add(new Users
            {
                UserId = 2,
                Email = "partner@eiu.edu.vn",
                Fullname = "Partner Name",
                Password = "hashed",
                MajorCode = "SE",
            });
            await context.SaveChangesAsync();

            var controller = CreateController(context, currentUserId: 1);
            var result = await controller.GetRevealedIdentity(room.RoomId, 1);

            var ok = Assert.IsType<OkObjectResult>(result);
            var fullname = (string?)ok.Value!.GetType().GetProperty("fullname")!.GetValue(ok.Value);
            Assert.Equal("Partner Name", fullname);
        }
    }
}
