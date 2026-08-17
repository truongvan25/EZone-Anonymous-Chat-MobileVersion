using Xunit;
using WebChatEIU.Services;

namespace WebChatEIU.Tests.Services
{
    public class MatchmakingServiceTests
    {
        [Fact]
        public void FindMatch_Should_Return_Null_When_Only_One_User()
        {
            // Arrange

            var service =
                new MatchmakingService(null);

            service.RegisterUser("conn1", 1);

            // Act

            var (partnerConnectionId, roomId) =
                service.FindMatch("conn1");

            // Assert

            Assert.Null(partnerConnectionId);
            Assert.Equal(0, roomId);
        }

        [Fact]
        public void ConsumeBanned_Should_Return_True_Once_After_MarkBanned()
        {
            // Arrange

            var service =
                new MatchmakingService(null);

            service.MarkBanned("bannedConn");

            // Act

            bool firstConsume = service.ConsumeBanned("bannedConn");
            bool secondConsume = service.ConsumeBanned("bannedConn");

            // Assert

            Assert.True(firstConsume);
            Assert.False(secondConsume); // đã bị remove ở lần consume đầu
        }

        [Fact]
        public void ConsumeBanned_Should_Return_False_When_Never_Marked()
        {
            // Arrange

            var service =
                new MatchmakingService(null);

            // Act

            bool consumed = service.ConsumeBanned("neverMarkedConn");

            // Assert

            Assert.False(consumed);
        }
    }
}