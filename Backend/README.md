# EZone Backend — WebChatEIU

Backend API cho ứng dụng chat ẩn danh **EZone** (dành cho sinh viên EIU) — xây
bằng **ASP.NET Core 8 Web API** + **Entity Framework Core** (SQL Server) +
**SignalR** (real-time chat) + **JWT** (xác thực). Tài liệu này mô tả kiến
trúc, database và **từng API** để phục vụ viết report môn học.

---

## 1. Tech stack

| Thành phần | Công nghệ |
|---|---|
| Framework | ASP.NET Core 8 Web API |
| ORM | Entity Framework Core 8 (Code-First + Migrations) |
| Database | SQL Server |
| Real-time | SignalR (`/chatHub`) |
| Xác thực | JWT Bearer Token |
| Hash mật khẩu | BCrypt.Net |
| Gửi email | MailKit (SMTP) |
| API docs | Swagger / Swashbuckle |
| Testing | xUnit + EF Core InMemory provider |

## 2. Cấu trúc thư mục

```
Backend/
├── WebChatEIU/                  # Project chính (API)
│   ├── Controllers/             # REST API endpoints
│   ├── Hubs/ChatHub.cs          # SignalR — chat real-time
│   ├── Services/                # Business logic (matching, moderation, email)
│   ├── Models/                  # EF Core entity (map DB table)
│   ├── DTOs/                    # Request/Response shape cho API
│   ├── Data/ApplicationDbContext.cs  # DbContext, cấu hình quan hệ/FK
│   ├── Migrations/               # Lịch sử thay đổi schema DB
│   ├── wwwroot/                  # File tĩnh (login.html, admin-reports.html, avatar_images)
│   ├── Program.cs                # Khởi tạo app, DI, middleware pipeline
│   └── appsettings.json          # Cấu hình (connection string, JWT, SMTP)
└── WebChatEIU.Tests/             # Test project (xUnit)
```

## 3. Chạy project

```bash
cd Backend/WebChatEIU
dotnet ef database update      # Áp toàn bộ migration vào SQL Server
dotnet run                     # Chạy ở http://0.0.0.0:5044 (xem launchSettings.json)
```

Swagger UI: `http://localhost:5044/swagger`

### Cấu hình cần thiết (`appsettings.json` hoặc `dotnet user-secrets`)

```json
{
  "ConnectionStrings": { "DefaultConnection": "Server=...;Database=WebChatEIUDB;..." },
  "Jwt": { "Key": "...", "Issuer": "...", "Audience": "..." },
  "Email": { "Host": "", "Port": "587", "UseSsl": "false", "Username": "", "Password": "", "FromAddress": "", "FromName": "EZone" }
}
```
`Email:Host` để trống → hệ thống tự fallback **log activation code ra console** thay vì gửi mail thật (tiện dev/demo, xem mục 8).

---

## 4. Sơ đồ database (6 bảng)

```
Users ──┬──< UserRoles >──┬── Roles
        │
        ├──< ChatRooms (User1Id / User2Id) >──< Messages
        │
        └──< ChatReports (ReporterId / ReportedUserId)
                 │
                 └── RoomId → ChatRooms
```

### 4.1. `Users` — tài khoản người dùng

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `UserId` | int, PK, identity | |
| `Email` | string(100), unique theo logic | Bắt buộc đúng định dạng `@eiu.edu.vn` (validate bằng Regex) |
| `Fullname` | string(200) | |
| `Password` | string | Hash bằng **BCrypt**, không lưu plaintext |
| `Gender`, `MajorCode`, `AvatarUrl`, `SocialLink` | string, nullable | Thông tin hồ sơ |
| `IsActive` | bool, default `false` | `true` sau khi activate bằng code gửi qua email |
| `ActiveCode` | string, nullable | Mã 6 số, xoá (`null`) sau khi activate thành công |
| `IsSearching` | bool | Cờ đang tìm match (hiện chưa dùng ở API, dự phòng) |
| `IsBanned` | bool | Bị khoá do vi phạm (spam nội dung nhạy cảm hoặc bị Admin ban) |
| `IsDeleted` | bool, default `false` | **Soft delete** — xem mục 9.2 |
| `DeletedAt` | DateTime?, nullable | Thời điểm soft-delete |
| `CreatedDate` | DateTime | |

> **EF Core Global Query Filter**: `HasQueryFilter(u => !u.IsDeleted)` áp lên
> toàn bộ `DbSet<Users>` — mọi query (Login, GetMe, check email trùng khi
> Register...) tự động ẩn user đã bị xoá mà không cần lọc thủ công.

### 4.2. `Roles` + `UserRoles` — phân quyền

| Bảng | Cột |
|---|---|
| `Roles` | `RoleId` (PK), `Name` (vd `"Admin"`) |
| `UserRoles` | `UserId` + `RoleId` (composite PK, many-to-many với `Users`↔`Roles`) |

Không có UI/API tự cấp quyền Admin — phải insert trực tiếp bằng SQL (xem
`DEMO_SCRIPT.md` mục 0.3). JWT của user sẽ có `Claim(ClaimTypes.Role, "Admin")`
sau khi login, dùng cho `[Authorize(Roles = "Admin")]`.

### 4.3. `ChatRooms` — phiên chat giữa 2 người

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `RoomId` | int, PK | |
| `User1Id` / `User2Id` | int, FK → `Users` | `DeleteBehavior.Restrict` (không cho xoá cứng User nếu còn Room) |
| `User1Nickname` / `User2Nickname` | string | Nickname ẩn danh random lúc match (vd "Anonymous Fox") |
| `AffinityScore` | int, default 0 | +1 mỗi tin nhắn gửi thành công — dùng làm ngưỡng mở khoá Reveal |
| `IsRevealed` | bool | `true` khi cả 2 bên đã đồng ý lộ danh tính |
| `User1Revealed` / `User2Revealed` | bool | Từng bên đã bấm Reveal chưa (double opt-in) |
| `Status` | enum: `Waiting, Active, Disconnected, Closed, Expired` | Vòng đời phòng chat |
| `CreatedAt` / `UpdatedAt` | DateTime | |

### 4.4. `Messages` — tin nhắn trong phòng

| Cột | Ghi chú |
|---|---|
| `MessId`, `RoomId` (FK, cascade khi Room bị xoá), `SenderId` (FK), `Content`, `IsRead`, `CreatedAt` | |

> Tin nhắn bị **xoá vĩnh viễn** khi phòng đóng (Leave/disconnect) — thiết kế
> ẩn danh, không lưu vết hội thoại lâu dài (xem mục 9.3).

### 4.5. `ChatReports` — báo cáo vi phạm

| Cột | Ghi chú |
|---|---|
| `ReportId`, `RoomId` (FK, cascade), `ReporterId`/`ReportedUserId` (FK → `Users`, `Restrict`), `ViolatingMessage`, `Reason`, `Status` (`"Pending"`/`"Resolved"`, string tự do không phải enum), `CreatedAt` | |

### 4.6. Quan hệ xoá (Delete Behavior) — quan trọng khi giải thích logic xoá dữ liệu

| Quan hệ | Behavior | Ý nghĩa |
|---|---|---|
| `ChatRooms → Users` | `Restrict` | Không cho xoá cứng User nếu còn Room tham chiếu |
| `ChatReports → Users` | `Restrict` | Tương tự |
| `Messages → ChatRooms` | `Cascade` | Xoá Room thì Messages tự xoá theo |
| `ChatReports → ChatRooms` | `Cascade` | Xoá Room thì Report tự xoá theo |
| `UserRoles → Users` | `Cascade` | Xoá User thì UserRoles tự xoá theo |

---

## 5. Xác thực (Authentication & Authorization)

- **JWT Bearer Token** — sinh ở `AuthController.Login`, ký bằng `HmacSha256`, hết hạn sau **3 giờ**.
- Claims trong token: `Email`, `userId`, `IsActive`, `IsBanned`, và 1 `Role` claim cho mỗi role user có (vd `"Admin"`).
- Middleware pipeline (`Program.cs`): `UseAuthentication()` → `UseAuthorization()` → `MapControllers()`.
- 3 mức bảo vệ endpoint dùng trong project:
  - Không gắn gì → public (vd Register, Login, CreateReport)
  - `[Authorize]` → cần Bearer token hợp lệ, đọc `userId` từ claim
  - `[Authorize(Roles = "Admin")]` → cần thêm role Admin trong token

---

## 6. REST API — chi tiết từng endpoint

### 6.1. `AuthController` — `/api/auth`

| Method & Route | Auth | Chức năng |
|---|---|---|
| `POST /login` | Public | Đăng nhập bằng Email + Password. Verify password bằng BCrypt, check `IsActive`/`IsBanned`, trả về JWT + thông tin cơ bản (`userId`, `fullname`, `roles`). |
| `POST /logout` | `[Authorize]` | Endpoint hình thức (JWT không lưu trạng thái phía server nên không có gì để "huỷ" — client tự xoá token cục bộ). |

### 6.2. `UsersController` — `/api/users`

| Method & Route | Auth | Chức năng |
|---|---|---|
| `POST /register` | Public | Tạo tài khoản mới: check email trùng (email dạng `@eiu.edu.vn`), hash password bằng BCrypt, sinh mã kích hoạt 6 số random, lưu user với `IsActive=false`. Gửi mã qua **email thật (MailKit/SMTP)** — **không trả code trong response** (đã vá lỗ hổng bảo mật trước đó). |
| `GET /activate?code=` | Public | Kích hoạt qua query string (dùng cho link trong email dạng click-to-activate). |
| `POST /activate` | Public | Kích hoạt qua JSON body `{ email, code }` — cách Mobile app đang dùng. Set `IsActive=true`, xoá `ActiveCode`. |
| `GET /me` | `[Authorize]` | Lấy hồ sơ của chính mình (đọc `userId` từ JWT claim). |
| `PUT /{id}` | `[Authorize]`, `multipart/form-data` | Cập nhật hồ sơ (Fullname/Gender/MajorCode/SocialLink) + upload avatar (lưu file vào `wwwroot/avatar_images`, sinh tên file bằng GUID). Chỉ tự sửa được chính mình (`id` phải khớp `userId` trong token, khác thì `403 Forbid`). |
| `GET /{id}` | `[Authorize(Roles="Admin")]` | Admin xem thông tin 1 user theo ID. |
| `DELETE /{id}` | `[Authorize]` | **Xoá tài khoản (soft delete)** — bắt nhập lại password để xác nhận (verify bằng BCrypt), chỉ set `IsDeleted=true` + `DeletedAt`, **không đụng** `ChatRooms`/`Messages`/`ChatReports` liên quan (giữ nguyên lịch sử cho phía đối phương). Tiện thể đóng các room đang Active/Waiting của user để không ai bị treo chờ vô thời hạn. Xem mục 9.2. |

### 6.3. `ChatRoomsController` — `/api/chatrooms`

| Method & Route | Auth | Chức năng |
|---|---|---|
| `GET /active/{userId}` | Public | Lấy phòng đang `Active` của 1 user (nếu có) — **không được client nào gọi**, và có chủ đích không dùng: nếu app tắt/mất kết nối giữa chừng, quyết định thiết kế là đưa thẳng về Home chứ không tự động nối lại phòng cũ (khả năng cao đối phương cũng đã rời, xem mục 9.5). |
| `GET /history/{userId}` | Public | Danh sách các phòng **đã kết thúc** (`Status=Closed`) của user — dùng cho màn "Chat History". |
| `GET /{roomId}` | `[Authorize]` | Chi tiết 1 phòng (chỉ 2 người trong phòng mới xem được). |

> Endpoint `POST {roomId}/leave/{userId}` từng tồn tại ở đây đã bị **xoá** vì
> là code chết — hành động Leave thật sự chạy qua `ChatHub.LeaveRoom()`
> (SignalR), không phải REST.

### 6.4. `MessagesController` — `/api/messages`

| Method & Route | Auth | Chức năng |
|---|---|---|
| `GET /{roomId}` | Public | Lấy toàn bộ tin nhắn của 1 phòng (sắp theo `CreatedAt`) — dùng để nạp lại lịch sử tin nhắn khi mở lại màn chat (tránh mất tin nhắn nếu app bị tắt/mở lại giữa phiên chat còn Active). |

### 6.5. `ChatReportsController` — `/api/chatreports`

| Method & Route | Auth | Chức năng |
|---|---|---|
| `POST /` | Public | Tạo report — verify người report có thực sự nằm trong room không, tự suy ra `ReportedUserId` = người còn lại trong phòng, set `Status="Pending"`. |
| `GET /my` | `[Authorize]` | Danh sách report **do chính mình** đã gửi. |
| `GET /` | `[Authorize(Roles="Admin")]` | Admin xem toàn bộ report, hỗ trợ **filter** theo status, **sort** theo `status`/`reason`/`createdAt`, **phân trang** (`page`, `pageSize`). |
| `PUT /{reportId}` | `[Authorize(Roles="Admin")]` | Admin đổi trạng thái xử lý report (`Pending` ↔ `Resolved`) mà **không** ban user luôn — validate status hợp lệ. |
| `POST /{reportId}/ban` | `[Authorize(Roles="Admin")]` | Admin ban thẳng người bị report (`IsBanned=true`) + set report `Resolved`. |
| `DELETE /{reportId}` | `[Authorize(Roles="Admin")]` | Xoá report khỏi hệ thống. |

### 6.6. `RevealController` — `/api/reveal`

| Method & Route | Auth | Chức năng |
|---|---|---|
| `POST /{roomId}/{userId}` | `[Authorize]` | Yêu cầu lộ danh tính. **Điều kiện**: `AffinityScore >= 10` (đã chat đủ 10 tin nhắn), set cờ `UserXRevealed=true` cho bên đang gọi. Chỉ khi **cả 2 bên** đều gọi (double opt-in) thì `IsRevealed` mới thành `true`. |
| `GET /{roomId}` | `[Authorize]` | Xem trạng thái Reveal hiện tại (điểm affinity, đã đủ ngưỡng chưa, ai đã bấm reveal). |
| `GET /{roomId}/identity/{userId}` | `[Authorize]` | Lấy thông tin thật (fullname, gender, avatar...) của đối phương — chỉ trả về sau khi `IsRevealed=true`. |

### 6.7. `WeatherForecastController`

Controller mặc định của template ASP.NET Core khi tạo project (`dotnet new webapi`) — không thuộc nghiệp vụ EZone, để nguyên không dùng tới.

---

## 7. Real-time — `ChatHub` (SignalR, endpoint `/chatHub`)

Kết nối bằng query string `?userId=<id>` (không qua JWT — hub tự tra `Users`
theo `userId`, chặn nếu banned).

| Method (client gọi) | Chức năng |
|---|---|
| `FindMatch()` | Ghép cặp với 1 user khác đang chờ (hàng đợi trong `MatchmakingService`, in-memory). Tạo `ChatRooms` mới khi ghép được, gửi event `Matched(roomId)` cho cả 2 bên. |
| `JoinRoom(roomId)` | Tham gia SignalR Group của phòng (để nhận broadcast tin nhắn) sau khi đã match. |
| `SendMessage(message)` | Kiểm duyệt nội dung (`ModerationService.IsSensitive` — chặn SĐT/email/link/từ nhạy cảm, tự ban nếu vi phạm), lưu `Messages`, tăng `AffinityScore` +1, broadcast `ReceiveMessage` cho cả phòng. |
| `Typing()` | Broadcast `UserTyping` cho người còn lại (hiệu ứng "đang gõ..."). |
| `LeaveRoom()` | User chủ động rời phòng — đóng room (`CloseRoomAsync`: xoá `Messages`, `Status=Closed`), báo `PartnerDisconnected` cho đối phương. |
| `GetPartnerUserId()` | Lấy `userId` của người đang match cùng (dùng trong lúc Waiting, trước khi vào phòng). |

| Event (server bắn về client) | Khi nào |
|---|---|
| `WaitingForMatch` | Chưa tìm được ai để ghép |
| `Matched(roomId)` | Ghép cặp thành công |
| `MatchError(message)` | Lỗi trong lúc match |
| `ReceiveMessage({senderId, message})` | Có tin nhắn mới trong phòng |
| `UserTyping(senderId)` | Đối phương đang gõ |
| `PartnerDisconnected` | Đối phương rời/rớt kết nối |
| `ViolationDetected(message)` | Tài khoản bị khoá do gửi nội dung nhạy cảm/banned, hoặc phòng đã đóng mà vẫn cố gửi tin |

**`OnDisconnectedAsync`**: mỗi khi 1 kết nối SignalR rớt (tắt app, mất mạng,
logout giữa chừng...) mà **chưa từng gọi `LeaveRoom()`** tường minh, hub tự
đóng room luôn (dùng chung `CloseRoomAsync` với `LeaveRoom()`) — tránh room
kẹt vĩnh viễn ở `Active`, giúp danh sách "Chat History" đầy đủ, không sót
những cuộc chat kết thúc đột ngột.

---

## 8. Services (business logic tách riêng)

| Service | Vai trò |
|---|---|
| `MatchmakingService` | Quản lý hàng đợi ghép cặp **in-memory** (`ConcurrentQueue`/`Dictionary`, không lưu DB) — map connectionId ↔ userId ↔ roomId, sinh nickname ẩn danh ngẫu nhiên lúc tạo room. |
| `ModerationService` | Kiểm duyệt nội dung tin nhắn bằng regex + danh sách từ cấm (chặn số điện thoại, email, link, tên MXH, từ nhạy cảm) — tự động ban nếu vi phạm. |
| `EmailService` (`IEmailService`) | Gửi email kích hoạt qua SMTP (MailKit). Nếu `Email:Host` chưa cấu hình → tự fallback log code ra console server (`ILogger`), không throw lỗi chặn luồng đăng ký. |

---

## 9. Quyết định thiết kế quan trọng (để giải thích trong report)

### 9.1. Ngưỡng Reveal = 10 tin nhắn + double opt-in
`AffinityScore` tăng dần theo số tin nhắn trao đổi; phải đạt ≥10 mới được
phép bấm Reveal, và **cả 2 bên đều phải tự bấm** thì mới thực sự lộ danh
tính — tránh lộ danh tính ngay lập tức, ép có hội thoại thật trước.

### 9.2. Soft delete tài khoản (không hard delete)
Hard delete từng được cân nhắc nhưng bị loại vì sẽ cascade xoá luôn lịch sử
chat/report của **người khác** đã từng tương tác với tài khoản đó. Soft
delete (`IsDeleted` + global query filter) khoá đăng nhập/ẩn khỏi mọi API mà
không đụng dữ liệu liên quan.

### 9.3. Tin nhắn bị xoá khi phòng đóng
Đúng tinh thần "chat ẩn danh" — không lưu vết hội thoại vĩnh viễn. Khi phòng
chuyển `Closed` (Leave hoặc disconnect), `Messages` bị xoá hẳn; chỉ metadata
của phòng (thời gian, affinity score, đã reveal chưa) được giữ lại cho màn
Chat History.

### 9.4. Activation code qua email, không trả trong response
Ban đầu code kích hoạt bị trả thẳng trong response `/register` (lỗ hổng bảo
mật — ai gọi API cũng tự kích hoạt được). Đã sửa: gửi qua email thật
(MailKit), fallback log console nếu chưa cấu hình SMTP cho môi trường dev.

### 9.5. Không tự động "vào lại phòng chat" sau khi mất kết nối
Cân nhắc rồi **quyết định không làm** — nếu app bị tắt/mất kết nối giữa
chừng (không qua `LeaveRoom()` tường minh), khả năng cao đối phương cũng đã
rời đi tương tự; tự động kéo user vào lại 1 phòng nhiều khả năng đã "chết"
gây trải nghiệm tệ hơn là về thẳng Home. `GetActiveRoom` vẫn tồn tại trong
code nhưng không có client nào gọi tới (mục 6.3).

---

## 10. Testing

Project `WebChatEIU.Tests` (xUnit) — **61 test**, gọi thẳng controller thật
với EF Core InMemory database (không phải test hình thức/giả). Cover đủ 9 API
tối thiểu theo yêu cầu đề bài (Login, Register, Get/Update profile, Get
list/detail, Create/Update/Delete) + luồng Reveal + soft delete.

```bash
cd Backend/WebChatEIU.Tests
dotnet test
```

## 11. Hạn chế đã biết / hướng phát triển tiếp

- `GetActiveRoom` (`/api/chatrooms/active/{userId}`) chưa được client nào gọi
  — có chủ đích không dùng, xem mục 9.5 (quyết định không làm resume chat).
- Web frontend thử nghiệm (`Frontend/Chat`) không dùng JWT cho SignalR/Reveal
  — chỉ hợp để test nhanh luồng match/chat, không thay được test bằng Mobile
  app thật.
- Chưa có endpoint refresh token — JWT hết hạn sau 3 giờ thì phải login lại.
