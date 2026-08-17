using System.Collections.Concurrent;
using WebChatEIU.Data;
using WebChatEIU.Models;

namespace WebChatEIU.Services
{
    public class MatchmakingService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        private static ConcurrentQueue<string> waitingUsers = new();

        private static Dictionary<string, string> matchedUsers = new();

        private static Dictionary<string, int> connectionRooms = new();

        private static Dictionary<string, int> connectionUsers = new();

        // Đánh dấu connection vừa bị Context.Abort() do vi phạm (ban) — dùng
        // để OnDisconnectedAsync biết mà (1) không gửi "PartnerDisconnected"
        // đè lên "PartnerBanned" đã gửi trước đó, và (2) không xóa Messages
        // của room khi đóng, để Admin/nạn nhân vẫn xem lại được hội thoại.
        private static readonly ConcurrentDictionary<string, bool> bannedConnections = new();

        public MatchmakingService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        private string GenerateNickname()
        {
            string[] nicknames =
            {
                "Anonymous Fox",
                "Anonymous Panda",
                "Anonymous Tiger",
                "Anonymous Rabbit",
                "Anonymous Eagle",
                "Anonymous Wolf",
                "Anonymous Cat",
                "Anonymous Falcon",
                "Anonymous Dolphin",
                "Anonymous Owl"
            };

            return nicknames[new Random().Next(nicknames.Length)];
        }

        public void RegisterUser(string connectionId, int userId)
        {
            connectionUsers[connectionId] = userId;
        }


        public (string? partnerConnectionId, int roomId) FindMatch(string connectionId)
        {
            RemoveFromWaitingQueue(connectionId);

            if (!connectionUsers.ContainsKey(connectionId))
            {
                return (null, 0);
            }

            int currentUserId = connectionUsers[connectionId];

            while (waitingUsers.TryDequeue(out string waitingUser))
            {
                if (waitingUser == connectionId)
                {
                    continue;
                }

                if (!connectionUsers.ContainsKey(waitingUser))
                {
                    continue;
                }

                int waitingUserId = connectionUsers[waitingUser];

                // Không cho cùng 1 tài khoản tự ghép với chính nó
                if (currentUserId == waitingUserId)
                {
                    continue;
                }

                matchedUsers[connectionId] = waitingUser;
                matchedUsers[waitingUser] = connectionId;

                ChatRooms room = new ChatRooms
                {
                    User1Id = currentUserId,
                    User2Id = waitingUserId,
                    Status = ChatRooms.RoomStatus.Active,
                    User1Nickname = GenerateNickname(),
                    User2Nickname = GenerateNickname()
                };

                using var scope = _scopeFactory.CreateScope();

                var context =
                    scope.ServiceProvider
                        .GetRequiredService<ApplicationDbContext>();

                context.ChatRooms.Add(room);
                context.SaveChanges();

                // Do NOT register connectionRooms here — these connections belong
                // to the WaitingScreen and will disconnect when the user navigates
                // to ChatRoomScreen. If we register them, OnDisconnectedAsync will
                // find the roomId and close the room before the new ChatRoom
                // connection can call JoinRoom(). Room registration is handled
                // exclusively by JoinRoom() on the ChatRoomScreen's connection.

                return (waitingUser, room.RoomId);
            }

            waitingUsers.Enqueue(connectionId);

            return (null, 0);
        }

        public string? GetPartner(string connectionId)
        {
            if (matchedUsers.ContainsKey(connectionId))
            {
                return matchedUsers[connectionId];
            }

            return null;
        }

        public int GetUserId(string connectionId)
        {
            if (connectionUsers.ContainsKey(connectionId))
            {
                return connectionUsers[connectionId];
            }

            return 0;
        }

        public int GetPartnerUserId(string connectionId)
        {
            string? partnerConnectionId =
                GetPartner(connectionId);

            if (partnerConnectionId == null)
            {
                return 0;
            }

            return GetUserId(partnerConnectionId);
        }

        public int GetRoomId(string connectionId)
        {
            if (connectionRooms.ContainsKey(connectionId))
            {
                return connectionRooms[connectionId];
            }

            return 0;
        }

        public int GetRoomIdOrDefault(string connectionId)
        {
            if (connectionRooms.ContainsKey(connectionId))
            {
                return connectionRooms[connectionId];
            }

            return 0;
        }

        public void RegisterRoom(string connectionId, int roomId)
        {
            connectionRooms[connectionId] = roomId;
        }

        public void MarkBanned(string connectionId)
        {
            bannedConnections[connectionId] = true;
        }

        // Kiểm tra + xóa cờ trong 1 bước, tránh rò rỉ entry nếu OnDisconnectedAsync
        // không chạy tới (không nên xảy ra, nhưng an toàn hơn là để leak).
        public bool ConsumeBanned(string connectionId)
        {
            return bannedConnections.TryRemove(connectionId, out _);
        }

        public void RemoveFromWaitingQueue(string connectionId)
        {
            var filtered =
                waitingUsers.Where(x => x != connectionId);

            waitingUsers =
                new ConcurrentQueue<string>(filtered);
        }

        public void Disconnect(string connectionId)
        {
            RemoveFromWaitingQueue(connectionId);

            if (matchedUsers.ContainsKey(connectionId))
            {
                string partner =
                    matchedUsers[connectionId];

                matchedUsers.Remove(connectionId);
                matchedUsers.Remove(partner);
            }

            if (connectionRooms.ContainsKey(connectionId))
            {
                connectionRooms.Remove(connectionId);
            }

            if (connectionUsers.ContainsKey(connectionId))
            {
                connectionUsers.Remove(connectionId);
            }
        }
    }
}