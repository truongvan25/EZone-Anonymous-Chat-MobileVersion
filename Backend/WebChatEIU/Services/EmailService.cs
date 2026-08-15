using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace WebChatEIU.Services
{
    /// <summary>
    /// Gửi email xác thực tài khoản qua SMTP (MailKit).
    /// Nếu chưa cấu hình SMTP (Email:Host rỗng) → fallback log code ra console
    /// để dev/demo chạy được mà không cần tài khoản SMTP thật.
    /// </summary>
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
            message.Subject = "[EZone] Mã xác thực tài khoản của bạn";

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = BuildHtmlBody(fullname, activationCode),
                TextBody = BuildPlainTextBody(fullname, activationCode)
            };

            message.Body = bodyBuilder.ToMessageBody();

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

        // ────────────────────────────────────────────────────────────────────
        //  HTML Email Template
        // ────────────────────────────────────────────────────────────────────
        private static string BuildHtmlBody(string fullname, string code)
        {
            var year = DateTime.UtcNow.Year;

            return $@"
<!DOCTYPE html>
<html lang=""vi"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
</head>
<body style=""margin:0; padding:0; background-color:#f4f4f7; font-family:'Segoe UI',Roboto,Arial,sans-serif;"">

  <!-- Outer wrapper -->
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#f4f4f7;"">
    <tr>
      <td align=""center"" style=""padding:40px 16px;"">

        <!-- Card container -->
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0""
               style=""max-width:520px; background-color:#ffffff; border-radius:16px;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08); overflow:hidden;"">

          <!-- ===== Header Banner ===== -->
          <tr>
            <td style=""background: linear-gradient(135deg, #E91E63 0%, #FF5252 100%);
                        padding:36px 32px; text-align:center;"">
              <div style=""font-size:40px; margin-bottom:8px;"">🔐</div>
              <h1 style=""margin:0; color:#ffffff; font-size:26px; font-weight:800;
                         letter-spacing:0.5px;"">
                EZone
              </h1>
              <p style=""margin:6px 0 0; color:rgba(255,255,255,0.9); font-size:14px; font-weight:500;"">
                Anonymous Chat for EIU Students
              </p>
            </td>
          </tr>

          <!-- ===== Body Content ===== -->
          <tr>
            <td style=""padding:32px 32px 24px;"">

              <p style=""margin:0 0 8px; color:#1a1a2e; font-size:18px; font-weight:700;"">
                Xin chào {fullname}! 👋
              </p>

              <p style=""margin:0 0 24px; color:#555; font-size:15px; line-height:1.6;"">
                Cảm ơn bạn đã đăng ký tài khoản <strong style=""color:#E91E63;"">EZone</strong>.
                Để hoàn tất việc đăng ký, vui lòng nhập mã xác thực bên dưới vào ứng dụng:
              </p>

              <!-- OTP Code Box -->
              <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"">
                <tr>
                  <td align=""center"" style=""padding:8px 0 28px;"">
                    <div style=""display:inline-block; background:#FFF0F3; border:2px solid #E91E63;
                                border-radius:14px; padding:20px 40px;"">
                      <span style=""font-size:36px; font-weight:900; letter-spacing:10px;
                                   color:#E91E63; font-family:'Courier New',monospace;"">
                        {code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Warning -->
              <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0""
                     style=""background-color:#FFF8E1; border-left:4px solid #FFA000;
                            border-radius:8px; margin-bottom:24px;"">
                <tr>
                  <td style=""padding:14px 16px;"">
                    <p style=""margin:0; color:#6D4C00; font-size:13px; line-height:1.6;"">
                      ⚠️ <strong>Lưu ý bảo mật:</strong> Mã xác thực này chỉ sử dụng được một lần.
                      Vui lòng <strong>không chia sẻ mã này</strong> với bất kỳ ai.
                      EZone sẽ không bao giờ yêu cầu bạn cung cấp mã này qua tin nhắn hay điện thoại.
                    </p>
                  </td>
                </tr>
              </table>

              <p style=""margin:0; color:#888; font-size:13px; line-height:1.5; text-align:center;"">
                Nếu bạn không đăng ký tài khoản EZone, vui lòng bỏ qua email này.
              </p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style=""padding:0 32px;"">
              <hr style=""border:none; border-top:1px solid #eee; margin:0;"" />
            </td>
          </tr>

          <!-- ===== Footer ===== -->
          <tr>
            <td style=""padding:20px 32px 28px; text-align:center;"">
              <p style=""margin:0 0 4px; color:#aaa; font-size:12px;"">
                Email này được gửi tự động từ hệ thống <strong>EZone</strong>.
                Vui lòng không trả lời email này.
              </p>
              <p style=""margin:0 0 4px; color:#aaa; font-size:12px;"">
                © {year} EZone Team — Eastern International University
              </p>
              <p style=""margin:0; color:#ccc; font-size:11px;"">
                Developed with ❤️ by EZone Team
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>";
        }

        // ────────────────────────────────────────────────────────────────────
        //  Plain-text fallback (khi mail client không hỗ trợ HTML)
        // ────────────────────────────────────────────────────────────────────
        private static string BuildPlainTextBody(string fullname, string code)
        {
            var year = DateTime.UtcNow.Year;

            return
                "[EZone] Mã xác thực tài khoản của bạn\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                $"Xin chào {fullname}!\n\n" +
                "Cảm ơn bạn đã đăng ký tài khoản EZone.\n" +
                "Mã xác thực của bạn là:\n\n" +
                $"    ▶  {code}\n\n" +
                "⚠️ Lưu ý bảo mật:\n" +
                "  • Mã xác thực này chỉ sử dụng được một lần.\n" +
                "  • Vui lòng không chia sẻ mã này với bất kỳ ai.\n" +
                "  • EZone sẽ không bao giờ yêu cầu bạn cung cấp mã\n" +
                "    qua tin nhắn hay điện thoại.\n\n" +
                "Nếu bạn không đăng ký tài khoản EZone,\n" +
                "vui lòng bỏ qua email này.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                $"© {year} EZone Team — Eastern International University\n" +
                "Developed with ❤ by EZone Team\n";
        }
    }
}
