using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebChatEIU.Models
{
    [Table("ChatReports")]
    public class ChatReports
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ReportId { get; set; }

        [Required]
        public int RoomId { get; set; }

        [ForeignKey("RoomId")]
        public virtual ChatRooms? ChatRoom { get; set; }

        [Required]
        public int ReporterId { get; set; }
        [ForeignKey("ReporterId")]
        public virtual Users? ReportUser { get; set; }


        public int ReportedUserId { get; set; }
        [ForeignKey("ReportedUserId")]
        public virtual Users? XUser { get; set; }

        [Required]
        [StringLength(4000)]
        public string ViolatingMessage { get; set; }

        [Required(ErrorMessage = "Reason cannot be empty")]
        [StringLength(255)]
        public string Reason { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        // Phân biệt report do chính user gửi ("User") với report hệ thống tự
        // tạo khi ModerationService phát hiện từ cấm ("Auto") — hiện dạng thẻ
        // trên AdminReportListScreen/AdminReportDetailScreen, filter được theo
        // loại này.
        [StringLength(10)]
        public string Type { get; set; } = "User";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Cho badge kiểu Zalo trên HomeScreen (nút "ADMIN REPORTS") — report
        // mới tạo mặc định chưa xem; Admin mở AdminReportListScreen sẽ gọi
        // POST /ChatReports/mark-seen để đánh dấu đã xem, badge biến mất.
        public bool IsSeenByAdmin { get; set; } = false;

    }
}