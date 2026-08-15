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

        
    }
}