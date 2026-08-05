using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebChatEIU.Data;
using WebChatEIU.Models;

namespace WebChatEIU.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatRoomsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatRoomsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("active/{userId}")]
        public async Task<IActionResult> GetActiveRoom(int userId)
        {
            var room = await _context.ChatRooms
                .FirstOrDefaultAsync(r =>
                    (r.User1Id == userId || r.User2Id == userId)
                    && r.Status == ChatRooms.RoomStatus.Active);

            if (room == null)
            {
                return NotFound();
            }

            return Ok(room);
        }

        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetHistory(int userId)
        {
            var rooms = await _context.ChatRooms
                .Where(r =>
                    (r.User1Id == userId || r.User2Id == userId)
                    && r.Status == ChatRooms.RoomStatus.Closed)
                .OrderByDescending(r => r.UpdatedAt)
                .ToListAsync();

            return Ok(rooms);
        }

        [Authorize]
        [HttpGet("{roomId}")]
        public async Task<IActionResult> GetRoomDetail(int roomId)
        {
            int userId = int.Parse(User.FindFirst("userId").Value);

            var room = await _context.ChatRooms.FindAsync(roomId);

            if (room == null)
            {
                return NotFound("Room not found");
            }

            if (room.User1Id != userId && room.User2Id != userId)
            {
                return BadRequest("User is not in this room");
            }

            return Ok(room);
        }

        // Đã xóa endpoint REST "POST {roomId}/leave/{userId}" từng nằm ở đây —
        // đây là code chết, chưa từng được mobile/web gọi. Hành động Leave thật
        // sự chạy qua ChatHub.LeaveRoom() (SignalR invoke), có logic tương tự
        // (xóa Messages, đóng room). Giữ cả 2 bản dễ lệch nhau khi sửa 1 bên mà
        // quên bên kia, nên gộp về đúng 1 nguồn duy nhất.
    }
}