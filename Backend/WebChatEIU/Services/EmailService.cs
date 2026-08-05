using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace WebChatEIU.Services
{
    // Gửi email kích hoạt tài khoản qua SMTP (MailKit) — trước đây activation
    // code bị trả thẳng trong response của /Users/register nên ai gọi API
    // cũng tự kích hoạt được, bước "xác thực email" chỉ mang tính hình thức.
    //
    // Nếu chưa cấu hình SMTP trong appsettings (Email:Host rỗng) thì fallback:
    // chỉ log code ra console server thay vì gửi thật — để dev/demo chạy được
    // ngay không cần tài khoản SMTP thật, nhưng code KHÔNG BAO GIỜ lộ qua API
    // response nữa dù có cấu hình SMTP hay chưa.
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendActivationEmailAsync(string toEmail, string fullname, string activationCode)
        {
            var host = _configuration["Email:Host"];

            if (string.IsNullOrWhiteSpace(host))
            {
                _logger.LogWarning(
                    "[DEV EMAIL] SMTP chưa được cấu hình (Email:Host rỗng trong appsettings). " +
                    "Activation code cho {Email}: {Code}",
                    toEmail, activationCode);
                return;
            }

            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                _configuration["Email:FromName"] ?? "EZone",
                _configuration["Email:FromAddress"] ?? _configuration["Email:Username"]));

            message.To.Add(new MailboxAddress(fullname, toEmail));
            message.Subject = "EZone - Activate your account";

            message.Body = new TextPart("plain")
            {
                Text =
                    $"Hi {fullname},\n\n" +
                    $"Your EZone activation code is: {activationCode}\n\n" +
                    "Enter this code in the app to activate your account.\n\n" +
                    "If you didn't sign up for EZone, you can ignore this email."
            };

            var port = int.TryParse(_configuration["Email:Port"], out var parsedPort) ? parsedPort : 587;
            var useSsl = bool.TryParse(_configuration["Email:UseSsl"], out var parsedSsl) && parsedSsl;

            using var client = new SmtpClient();

            await client.ConnectAsync(
                host,
                port,
                useSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls);

            await client.AuthenticateAsync(_configuration["Email:Username"], _configuration["Email:Password"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}
