using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebChatEIU.Data;
using WebChatEIU.Models;

namespace WebChatEIU.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RevealController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RevealController(ApplicationDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpPost("{roomId}/{userId}")]
        public async Task<IActionResult> RequestReveal(int roomId, int userId)
        {
            int currentUserId = int.Parse(User.FindFirst("userId").Value);

            var room = await _context.ChatRooms.FindAsync(roomId);

            if (room == null)
            {
                return NotFound("Room not found");
            }

            // Khớp lại với ngưỡng "canReveal" ở GetRevealStatus (AffinityScore >= 10)
            // — trước đây chỗ này chặn ở < 1 nên gần như không có gờ chặn thật nào,
            // lệch hẳn với ý định thiết kế ban đầu.
            if (room.AffinityScore < 10)
            {
                return BadRequest("Affinity score is not enough to reveal identity");
            }

            if (room.User1Id == currentUserId)
            {
                room.User1Revealed = true;
            }
            else if (room.User2Id == currentUserId)
            {
                room.User2Revealed = true;
            }
            else
            {
                return BadRequest("User is not in this room");
            }

            if (room.User1Revealed && room.User2Revealed)
            {
                room.IsRevealed = true;
            }

            room.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(room);
        }

        [Authorize]
        [HttpGet("{roomId}")]
        public async Task<IActionResult> GetRevealStatus(int roomId)
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

            return Ok(new
            {
                roomId = room.RoomId,
                affinityScore = room.AffinityScore,
                canReveal = room.AffinityScore >= 10,
                user1Revealed = room.User1Revealed,
                user2Revealed = room.User2Revealed,
                isRevealed = room.IsRevealed
            });
        }

        [Authorize]
        [HttpGet("{roomId}/identity/{userId}")]
        public async Task<IActionResult> GetRevealedIdentity(int roomId, int userId)
        {
            int currentUserId = int.Parse(User.FindFirst("userId").Value);

            var room = await _context.ChatRooms.FindAsync(roomId);

            if (room == null)
            {
                return NotFound("Room not found");
            }

            if (room.User1Id != currentUserId && room.User2Id != currentUserId)
            {
                return BadRequest("User is not in this room");
            }

            if (!room.IsRevealed)
            {
                return BadRequest("Identity has not been revealed yet");
            }

            int targetUserId =
                room.User1Id == currentUserId ? room.User2Id : room.User1Id;

            var targetUser = await _context.Users.FindAsync(targetUserId);

            if (targetUser == null)
            {
                return NotFound("Target user not found");
            }

            return Ok(new
            {
                userId = targetUser.UserId,
                fullname = targetUser.Fullname,
                gender = targetUser.Gender,
                majorCode = targetUser.MajorCode,
                avatarUrl = targetUser.AvatarUrl,
                socialLink = targetUser.SocialLink
            });
        }
    }
}