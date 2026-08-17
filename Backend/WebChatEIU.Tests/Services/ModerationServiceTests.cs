using Xunit;
using WebChatEIU.Services;

namespace WebChatEIU.Tests.Services
{
    public class ModerationServiceTests
    {
        [Theory]
        [InlineData("0901234567")]
        [InlineData("test@gmail.com")]
        [InlineData("https://facebook.com/abc")]
        [InlineData("facebook")]
        public void IsSensitive_Should_Return_True_For_Private_Info(string message)
        {
            var service = new ModerationService();

            var result = service.IsSensitive(message);

            Assert.True(result);
        }

        [Theory]
        [InlineData("hello bạn")]
        [InlineData("hôm nay học gì")]
        [InlineData("mình thích nghe nhạc")]
        public void IsSensitive_Should_Return_False_For_Normal_Message(string message)
        {
            var service = new ModerationService();

            var result = service.IsSensitive(message);

            Assert.False(result);
        }

        [Theory]
        [InlineData("0901234567")]
        [InlineData("test@gmail.com")]
        [InlineData("https://facebook.com/test")]
        [InlineData("facebook")]
        [InlineData("zalo")]
        [InlineData("sex")]
        public void IsSensitive_Should_Return_True_When_Message_Contains_Private_Or_Banned_Content(string message)
        {
            var service = new ModerationService();

            var result = service.IsSensitive(message);

            Assert.True(result);
        }

        [Theory]
        [InlineData("hello bạn")]
        [InlineData("hôm nay học gì")]
        [InlineData("mình thích nghe nhạc")]
        public void IsSensitive_Should_Return_False_When_Message_Is_Normal(string message)
        {
            var service = new ModerationService();

            var result = service.IsSensitive(message);

            Assert.False(result);
        }

        // "tên"/"name" đã bị bỏ khỏi banned words vì quá rộng — hỏi tên
        // bình thường không được phép ăn oan nữa (mâu thuẫn với tính năng
        // Reveal của chính app).
        [Theory]
        [InlineData("tên bạn là gì?")]
        [InlineData("what's your name")]
        [InlineData("mình tên Van")]
        public void IsSensitive_Should_Return_False_For_Normal_Name_Questions(string message)
        {
            var service = new ModerationService();

            var result = service.IsSensitive(message);

            Assert.False(result);
        }

        // "dm" giờ dùng regex có ranh giới từ — không được dính oan các từ
        // hợp lệ chứa "dm"/"cc" như substring.
        [Theory]
        [InlineData("admin")]
        [InlineData("seldom")]
        [InlineData("cccd của tôi bị mất")]
        public void IsSensitive_Should_Return_False_For_Words_Containing_Old_Substrings(string message)
        {
            var service = new ModerationService();

            var result = service.IsSensitive(message);

            Assert.False(result);
        }

        // Từ khoá mới thêm — mạng xã hội khác + mời chào tài chính/lừa đảo.
        [Theory]
        [InlineData("add tao discord đi")]
        [InlineData("nhắn qua whatsapp nha")]
        [InlineData("cho tao xin snapchat")]
        [InlineData("chuyển khoản cho tao 500k")]
        [InlineData("có ai muốn vay tiền không")]
        [InlineData("tham gia đa cấp kiếm tiền nhanh")]
        [InlineData("dm mày")]
        public void IsSensitive_Should_Return_True_For_New_Banned_Keywords(string message)
        {
            var service = new ModerationService();

            var result = service.IsSensitive(message);

            Assert.True(result);
        }
    }
}