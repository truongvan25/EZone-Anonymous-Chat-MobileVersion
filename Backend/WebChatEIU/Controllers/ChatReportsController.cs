using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebChatEIU.Data;
using WebChatEIU.DTOs;
using WebChatEIU.Models;

namespace WebChatEIU.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] ChatReports report)
        {
            var room = await _context.ChatRooms.FindAsync(report.RoomId);

            if (room == null)
            {
                return NotFound("Room not found");
            }

            if (room.User1Id != report.ReporterId && room.User2Id != report.ReporterId)
            {
                return BadRequest("Reporter is not in this room");
            }

            int reportedUserId =
                room.User1Id == report.ReporterId
                ? room.User2Id
                : room.User1Id;

            report.ReportedUserId = reportedUserId;

            report.Status = "Pending";
            report.Type = "User"; // Ép cứng, không cho client tự gửi "Auto" giả mạo
            report.CreatedAt = DateTime.UtcNow;
            report.IsSeenByAdmin = false; // Ép cứng, không cho client tự đánh dấu "đã xem" để né badge

            _context.ChatReports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Report submitted successfully"
            });
        }

        [Authorize]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyReports()
        {
            int userId = int.Parse(User.FindFirst("userId").Value);

            var reports = await _context.ChatReports
                .Where(r => r.ReporterId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(reports);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{reportId}/ban")]
        public async Task<IActionResult> BanReportedUser(int reportId)
        {
            var report = await _context.ChatReports.FindAsync(reportId);

            if (report == null)
            {
                return NotFound("Report not found");
            }

            var user = await _context.Users.FindAsync(report.ReportedUserId);

            if (user == null)
            {
                return NotFound("Reported user not found");
            }

            user.IsBanned = true;
            report.Status = "Resolved";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Reported user has been banned."
            });
        }

        // Gỡ ban cho người bị report — không đụng tới report.Status (chỉ ảnh
        // hưởng tài khoản user, không tự mở lại report đã Resolved).
        [Authorize(Roles = "Admin")]
        [HttpPost("{reportId}/unban")]
        public async Task<IActionResult> UnbanReportedUser(int reportId)
        {
            var report = await _context.ChatReports.FindAsync(reportId);

            if (report == null)
            {
                return NotFound("Report not found");
            }

            var user = await _context.Users.FindAsync(report.ReportedUserId);

            if (user == null)
            {
                return NotFound("Reported user not found");
            }

            user.IsBanned = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Reported user has been unbanned."
            });
        }

        // Update data API còn thiếu (khác Update profile) — admin đổi trạng thái
        // xử lý report mà không cần ban user, dùng cho AdminReportDetailScreen.
        [Authorize(Roles = "Admin")]
        [HttpPut("{reportId}")]
        public async Task<IActionResult> UpdateReportStatus(int reportId, [FromBody] UpdateReportStatusDto dto)
        {
            var report = await _context.ChatReports.FindAsync(reportId);

            if (report == null)
            {
                return NotFound("Report not found");
            }

            var allowedStatuses = new[] { "Pending", "Resolved" };

            if (string.IsNullOrWhiteSpace(dto.Status) || !allowedStatuses.Contains(dto.Status))
            {
                return BadRequest("Status must be either 'Pending' or 'Resolved'");
            }

            report.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Report status updated.",
                reportId = report.ReportId,
                status = report.Status
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{reportId}")]
        public async Task<IActionResult> DeleteReport(int reportId)
        {
            var report = await _context.ChatReports.FindAsync(reportId);

            if (report == null)
            {
                return NotFound("Report not found");
            }

            _context.ChatReports.Remove(report);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Report deleted successfully."
            });
        }

        // Đếm số report Admin CHƯA xem — dùng cho badge kiểu Zalo trên nút
        // "ADMIN REPORTS" ở HomeScreen (số đỏ, mobile tự hiển thị "5+" nếu > 5).
        [Authorize(Roles = "Admin")]
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            int count = await _context.ChatReports.CountAsync(r => !r.IsSeenByAdmin);

            return Ok(new { count });
        }

        // Admin mở AdminReportListScreen -> gọi API này để đánh dấu toàn bộ
        // report hiện có là "đã xem", badge trên HomeScreen biến mất.
        [Authorize(Roles = "Admin")]
        [HttpPost("mark-seen")]
        public async Task<IActionResult> MarkReportsSeen()
        {
            var unseenReports = await _context.ChatReports
                .Where(r => !r.IsSeenByAdmin)
                .ToListAsync();

            foreach (var report in unseenReports)
            {
                report.IsSeenByAdmin = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Reports marked as seen.",
                updatedCount = unseenReports.Count
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetReports(
            int page = 1,
            int pageSize = 10,
            string? status = null,
            string? type = null,
            string sortBy = "createdAt",
            string sortOrder = "desc")
        {
            if (page <= 0)
            {
                page = 1;
            }

            if (pageSize <= 0 || pageSize > 100)
            {
                pageSize = 10;
            }

            var query = _context.ChatReports.AsQueryable();

            // Filtering
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(r => r.Type == type);
            }

            // Sorting
            query = sortBy.ToLower() switch
            {
                "status" => sortOrder.ToLower() == "asc"
                    ? query.OrderBy(r => r.Status)
                    : query.OrderByDescending(r => r.Status),

                "reason" => sortOrder.ToLower() == "asc"
                    ? query.OrderBy(r => r.Reason)
                    : query.OrderByDescending(r => r.Reason),

                _ => sortOrder.ToLower() == "asc"
                    ? query.OrderBy(r => r.CreatedAt)
                    : query.OrderByDescending(r => r.CreatedAt)
            };

            var totalItems = await query.CountAsync();

            var reports = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Đính kèm trạng thái ban hiện tại của người bị report — để mobile
            // biết hiện nút "Ban User" hay "Unban User" cho đúng, không cần
            // gọi thêm API riêng.
            var reportedUserIds = reports.Select(r => r.ReportedUserId).Distinct().ToList();

            var bannedUserIds = await _context.Users
                .Where(u => reportedUserIds.Contains(u.UserId) && u.IsBanned)
                .Select(u => u.UserId)
                .ToListAsync();

            var data = reports.Select(r => new
            {
                r.ReportId,
                r.RoomId,
                r.ReporterId,
                r.ReportedUserId,
                r.ViolatingMessage,
                r.Reason,
                r.Status,
                r.Type,
                r.CreatedAt,
                IsReportedUserBanned = bannedUserIds.Contains(r.ReportedUserId)
            });

            return Ok(new
            {
                page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                sortBy,
                sortOrder,
                status,
                type,
                data
            });
        }


    }
}