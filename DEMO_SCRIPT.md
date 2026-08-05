# EZone — Kịch bản Demo (CSW430 Mobile Project)

Kịch bản demo trực tiếp trên 2 emulator, thiết kế để đi qua **toàn bộ tính năng
core** và khớp với từng gạch đầu dòng trong `Project Requirements_v2.pdf`.
Thời lượng tổng ước tính: **12–15 phút** (có thể cắt bớt Phase 6–7 nếu thiếu giờ).

---

## 0. Chuẩn bị trước buổi demo (làm trước, không làm live)

### 0.1. Hạ tầng
- [ ] SQL Server đang chạy, DB đã migrate: `dotnet ef database update` (chạy trong `Backend/WebChatEIU`)
- [ ] Backend đang chạy: `dotnet run` trong `Backend/WebChatEIU` → nghe ở `http://0.0.0.0:5044`
- [ ] Metro bundler đang chạy (`npx react-native start` trong `Mobile/`)
- [ ] 2 emulator Android đã boot, cả 2 đều đã `adb reverse tcp:8081 tcp:8081` (nếu dùng USB reverse) hoặc dùng địa chỉ mặc định `10.0.2.2` (emulator tự route được, không cần reverse)
- [ ] Build & cài app lên cả 2 emulator: `npx react-native run-android --device=<id>` cho từng máy (kiểm tra id bằng `adb devices`)

### 0.2. Cấu hình Email (để activation code không phải mò trong Alert)
- Nếu **chưa** điền `Email:Host` trong `appsettings.json` → activation code sẽ in ra **console log của backend** (dòng `[DEV EMAIL] ... Activation code cho ...`). Mở sẵn cửa sổ terminal chạy `dotnet run` cạnh bên để lúc demo register chỉ cần liếc qua là có code, khỏi cuống.
- Nếu đã điền SMTP thật → mở sẵn hộp mail test.

### 0.3. Tạo sẵn 1 tài khoản Admin (không có cách nào làm qua UI — phải chạy SQL tay 1 lần)
```sql
-- 1) Đảm bảo role Admin tồn tại
IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'Admin')
    INSERT INTO Roles (Name) VALUES ('Admin');

-- 2) Gán role Admin cho 1 user đã đăng ký + activate sẵn (thay UserId cho đúng)
INSERT INTO UserRoles (UserId, RoleId)
SELECT <UserId_của_tài_khoản_admin>, RoleId FROM Roles WHERE Name = 'Admin';
```
> Đăng ký account này bình thường qua app trước, activate xong rồi mới chạy SQL trên.

### 0.4. Tài khoản dùng trong demo
| Vai trò | Cách chuẩn bị |
|---|---|
| **Account A** (Device 1) | Đăng ký **live** lúc demo — để show luôn màn Register/Activate |
| **Account B** (Device 2) | Đăng ký + activate sẵn từ trước, chỉ login live cho nhanh |
| **Account Admin** | Chuẩn bị sẵn theo mục 0.3 |
| **Account "để xoá"** | 1 account rác thứ 4, đăng ký sẵn, dùng cho Phase 6 (Delete Account) — không dùng account A/B để tránh phải đăng ký lại giữa demo |

---

## 1. Bảng đối chiếu nhanh với đề bài (để mở đầu hoặc đưa giảng viên xem)

| Yêu cầu đề bài | Đáp ứng |
|---|---|
| Tối thiểu 20 screens | **21 screens** — xem danh sách mục 3 |
| Login API | ✅ `POST /api/auth/login` |
| Register API | ✅ `POST /api/users/register` |
| Get user profile API | ✅ `GET /api/users/me` |
| Update profile API | ✅ `PUT /api/users/{id}` |
| Get list data API | ✅ `GET /api/chatrooms/history/{userId}`, `GET /api/chatreports` |
| Get detail data API | ✅ `GET /api/chatrooms/{roomId}` |
| Create data API | ✅ `POST /api/chatreports` |
| Update data API | ✅ `PUT /api/chatreports/{reportId}` |
| Delete data API | ✅ `DELETE /api/chatreports/{reportId}`, `DELETE /api/users/{id}` |
| Database | ✅ SQL Server, EF Core Migrations |
| API trả JSON | ✅ mặc định ASP.NET Core Web API |
| Testing (Member 2 & 3) | ✅ 61 automated test (xUnit, gọi thật controller, không phải test giả) |

---

## 2. Kịch bản demo chi tiết

### Phase 1 — Đăng ký & Kích hoạt (Device A) — ~2 phút
1. Mở app Device A → **Splash** → tự động chuyển **Login** (chưa có session).
2. Bấm "Create account" → màn **Register**: nhập Fullname, Email `@eiu.edu.vn`, Major, Password → **REGISTER**.
   - 💬 Nói: *"Password được hash bằng BCrypt trước khi lưu DB, không lưu plaintext."*
3. Alert hiện "Please check your email for the activation code" → **KHÔNG còn lộ code trong response** (điểm nhấn bảo mật đã vá).
4. Chuyển sang console backend, đọc dòng `[DEV EMAIL] ... Activation code cho <email>: XXXXXX`.
5. Nhập code vào màn **ActivateAccount** → **ACTIVATE ACCOUNT** → thành công → về **Login**.
6. Login bằng account A vừa tạo → vào **Home**.

### Phase 2 — Profile (Device A) — ~2 phút
7. Từ Home → **MY PROFILE** → xem thông tin (read-only).
8. Bấm **Edit Profile** → sửa Fullname/Major/Social Link → **Save changes** → quay lại Profile thấy dữ liệu mới (chứng minh `GetMe`/`UpdateUsers` hoạt động đúng, tự refetch khi quay lại).
9. Bấm **Change Photo** → chọn ảnh từ thư viện → upload → avatar cập nhật ngay (demo API `multipart/form-data`).

### Phase 3 — Settings (Device A) — ~30 giây
10. Home → **SETTINGS** → gạt thử toggle Notifications/Sound (lưu AsyncStorage thật) → **BACK**.
   - *(Không bấm Delete Account ở đây — để dành Phase 6 với account rác riêng.)*

### Phase 4 — Match & Chat (Device A + B) — ~5 phút, phần trọng tâm
11. Device B: **Login** bằng account B đã activate sẵn → **Home**.
12. Cả 2 máy cùng bấm **FIND A MATCH** → màn **Waiting** (đếm giờ chờ, đếm online).
13. Match thành công → **MatchSuccess** (hiệu ứng 🎉) → tự chuyển vào **ChatRoom**.
14. Gõ qua lại **ít nhất 10 tin nhắn** giữa 2 máy (đếm affinity score tăng dần) — vừa gõ vừa demo:
    - **Typing indicator** hiện ở máy còn lại khi đang gõ.
15. Thử bấm **REVEAL** khi *chưa đủ 10 tin* (nếu canh được lúc đầu) → bị chặn: *"Too soon to unmask!"*
    - 💬 Nói: *"Ngưỡng 10 tin nhắn tránh 2 người lộ danh tính ngay lập tức, ép phải trò chuyện thật trước."*
16. Sau khi đủ 10 tin → cả 2 máy cùng bấm **REVEAL** → máy nào bấm trước chỉ ghi nhận phía mình (`User1Revealed`/`User2Revealed`), phải **cả 2 cùng bấm** mới lộ danh tính thật (double opt-in) → modal **Identity Unlocked** (component `IdentityRevealedScreen.jsx`, hiện đè lên `ChatRoom` chứ không phải 1 screen/route riêng) hiện tên/major/avatar thật của đối phương.
17. Device A: bấm **REPORT** → chọn lý do (vd "Toxic / Rude talk") → **REPORT NOW** → Alert xác nhận.
18. Device A: bấm **LEAVE** → quay về **Waiting** (room chuyển `Closed`, tin nhắn bị xoá theo đúng thiết kế "ẩn danh không lưu vết").
19. Device A: Home → **CHAT HISTORY** → thấy room vừa kết thúc trong list → bấm vào → **ChatRoomDetail** (Status, thời gian, Affinity Score, đã Reveal chưa).
20. Device A: Home → **MY REPORTS** → thấy report vừa gửi ở bước 17, status "Pending".

### Phase 5 — Admin (Device A hoặc B, logout rồi login lại bằng Admin) — ~3 phút
21. **LOG OUT** (qua màn **LogoutConfirm** — bấm Log Out để xác nhận) → **Login** bằng account Admin (mục 0.3).
22. Home hiện thêm nút **ADMIN REPORTS** (role-gated, chỉ Admin mới thấy).
23. Vào **AdminReportList** → thấy report ở bước 17 → thử **Filter** theo status/sort.
24. Bấm **View / Update Status** trên report đó → **AdminReportDetail** → đổi chip status `Pending → Resolved` → **Save Status** → quay lại list thấy status đã đổi.
   - 💬 Nói: *"Đây chính là Update data API — PUT /api/chatreports/{id}, tách riêng khỏi Update profile."*
25. (Nếu còn giờ) Demo **Ban User** trên report và **Delete** report → xoá khỏi list ngay.

### Phase 6 — Vòng đời tài khoản: Soft Delete (dùng account rác riêng) — ~2 phút
26. Logout khỏi Admin → Login bằng **account "để xoá"** (mục 0.4).
27. Home → **SETTINGS** → **DELETE ACCOUNT** → màn cảnh báo liệt kê rõ hệ quả → nhập password → xác nhận 2 lớp (Alert "Delete your account?" → bấm nút "Delete Account").
28. Bị đá về **Login** ngay. Thử login lại bằng account đó → **"Invalid email or password"** (không lộ thông tin là do soft-delete hay do sai mật khẩu — tránh dò tài khoản).
   - 💬 Nói: *"Đây là soft delete — DB vẫn giữ nguyên row (IsDeleted=true), không đụng tới ChatRooms/Messages/ChatReports liên quan, để không ảnh hưởng lịch sử của người từng chat/report chung với tài khoản này."* (Nếu có SSMS mở sẵn, query nhanh `SELECT * FROM Users WHERE Email = '...'` cho thấy row vẫn còn, chỉ `IsDeleted = 1`.)

### Phase 7 — Automated Testing (nếu giảng viên hỏi về testing) — ~1 phút
29. Mở terminal, `cd Backend/WebChatEIU.Tests`, chạy `dotnet test`.
30. Chỉ ra: **61/61 test pass**, cover đủ 9 API tối thiểu (Login, Register, Get/Update profile, Get list/detail, Create/Update/Delete), test gọi thẳng controller thật + DB in-memory, không phải test giả kiểu `Assert.NotNull("abc")`.

---

## 3. Danh sách 21 screens (để đối chiếu khi giảng viên đếm)

Splash · Login · Register · ActivateAccount · Home · RulesAbout · About · Waiting
· MatchSuccess · ChatRoom · ReportUser · Profile · EditProfile · LogoutConfirm ·
ChatHistory · ChatRoomDetail · MyReports · Settings · DeleteAccount ·
AdminReportList · AdminReportDetail

---

## 4. Q&A dự phòng — câu hỏi giảng viên hay hỏi vặn

| Câu hỏi | Trả lời gợi ý |
|---|---|
| Sao không gửi email thật lúc demo? | Có `EmailService` dùng MailKit gửi SMTP thật, chỉ cần điền `appsettings.json → Email:Host/Username/Password`. Lúc demo để trống cho nhanh, tự động fallback log ra console — không cần mất công cấu hình mail lúc dev. |
| Sao xoá tài khoản không xoá hẳn dữ liệu? | Cố ý — hard delete từng thử nhưng phá luôn lịch sử chat/report của **người khác** đã từng tương tác với tài khoản đó. Soft delete: khoá đăng nhập + ẩn khỏi mọi API (qua EF Core global query filter), giữ nguyên dữ liệu liên quan cho người còn lại. |
| 9 API CRUD tối thiểu nằm ở đâu? | Xem bảng mục 1 — rải trên `AuthController` (Login), `UsersController` (Register/Profile), `ChatReportsController` (Create/Update/Delete) và `ChatRoomsController` (List/Detail). |
| Tại sao phải nhắn đủ 10 tin mới Reveal được? | Chống lộ danh tính ngay lập tức, ép có hội thoại thật trước — dùng `AffinityScore` (mỗi tin nhắn +1 điểm) làm ngưỡng, cộng thêm cơ chế double opt-in (cả 2 bên đều phải tự bấm). |
| Vì sao tắt app giữa chừng không tự vào lại phòng chat cũ? | Cố ý — nếu app bị tắt/mất kết nối, khả năng cao đối phương cũng không còn ở đó, tự động kéo vào lại phòng "chết" gây trải nghiệm tệ hơn. Backend tự đóng room khi phát hiện mất kết nối (`OnDisconnectedAsync`) để room không kẹt mãi ở `Active`, giúp Chat History đầy đủ. |
| Test có bao nhiêu, test gì? | 61 test tự động (xUnit), cover đủ 9 API tối thiểu + luồng Reveal + soft delete, gọi trực tiếp controller thật với DB in-memory, không phải test hình thức. |

---

## 5. Nếu demo bị lỗi giữa chừng (fallback)

- **App hiện "Unable to load script"**: Metro chưa start xong / `adb reverse` chưa set — reload lại (R, R) sau khi Metro sẵn sàng.
- **Không match được nhau**: kiểm tra cả 2 máy cùng gọi được `http://10.0.2.2:5044` (hoặc IP LAN nếu chạy trên máy thật) — thử `curl` từ máy host tới backend trước.
- **Quên activation code**: xem lại console log backend (`[DEV EMAIL] ...`), hoặc gán `IsActive = 1` thẳng qua SQL cho account demo nếu bí quá.
- **Admin không thấy nút ADMIN REPORTS**: kiểm tra `UserRoles` đã insert đúng `UserId` + role `Name = 'Admin'` (phân biệt hoa thường) chưa, và phải **logout/login lại** để JWT có claim role mới (JWT cũ cấp trước khi gán role sẽ không có claim này).
