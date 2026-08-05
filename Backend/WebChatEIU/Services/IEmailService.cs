namespace WebChatEIU.Services
{
    public interface IEmailService
    {
        Task SendActivationEmailAsync(string toEmail, string fullname, string activationCode);
    }
}
