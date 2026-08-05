namespace WebChatEIU.DTOs
{
    // Đăng kí tài khoản
    public class RegisterDto
    {
        public string Fullname { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string MajorCode { get; set; }
    }

    // Xác thực code để kích hoạt tài khoản
    public class ActivateDto
    {
        public string Email { get; set; }
        public string Code { get; set; } 
    }

    // Thực hiện bước đăng nhập
    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    // Cập nhật tài khoản
    public class UpdateUserDto
    {
        public string Fullname { get; set; }
        public string? Gender { get; set; }
        public string? MajorCode { get; set; }
        public string? SocialLink { get; set; }
        public IFormFile? AvatarFile { get; set; }
    }

    // Xóa tài khoản — bắt nhập lại mật khẩu để xác nhận
    public class DeleteAccountDto
    {
        public string Password { get; set; }
    }
}