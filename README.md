# EZone — Anonymous Chat (Mobile)

Ứng dụng chat ẩn danh dành riêng cho sinh viên EIU (bắt buộc email `@eiu.edu.vn`). Người dùng được ghép ngẫu nhiên với một người lạ để trò chuyện dưới nickname ẩn danh, có thể dần "mở khoá" danh tính cho nhau khi đủ mức độ tương tác, hoặc report nếu gặp hành vi vi phạm.

## Tính năng chính

- **Đăng ký / kích hoạt tài khoản** bằng email trường, mã kích hoạt gửi qua email thật (MailKit).
- **Ghép cặp ẩn danh ngẫu nhiên** (matchmaking hàng đợi) — không ai biết mình đang chat với ai.
- **Chat real-time** qua SignalR: gửi/nhận tin nhắn, typing indicator, thông báo khi đối phương rời phòng.
- **Kiểm duyệt nội dung tự động**: chặn số điện thoại, email, link, từ nhạy cảm... gửi lên sẽ tự khoá tài khoản, báo ngay cho cả người vi phạm lẫn đối phương, và tự tạo report (loại "Auto") cho Admin xem lại.
- **Reveal danh tính theo affinity score**: cả 2 người cùng đồng ý mới lộ diện (fullname, avatar, ngành học, social link).
- **Report / kiểm duyệt**: người dùng tự report đối phương (loại "User") hoặc hệ thống tự tạo report khi phát hiện vi phạm (loại "Auto") — Admin phân biệt được 2 loại, lọc riêng theo Status/Type.
- **Quản trị (Admin)**: xem/lọc/phân trang danh sách report, ban hoặc unban tài khoản vi phạm, badge thông báo số report chưa xem (kiểu Zalo) trên Home Screen.
- **Xoá tài khoản (soft delete)**: bắt xác thực lại mật khẩu, không xoá cứng dữ liệu — giữ nguyên lịch sử chat/report cho phía đối phương.

## Tech stack

**Backend** — `Backend/`
- ASP.NET Core 8 Web API
- Entity Framework Core (Code-First + Migrations) + SQL Server
- SignalR (real-time chat)
- JWT Authentication + BCrypt (hash mật khẩu)
- Swagger (API docs)
- xUnit + EF Core InMemory (test thật, không phải test hình thức)

**Frontend (Web)** — `Frontend/Chat/`
- React (Vite) + Tailwind/Radix UI
- `@microsoft/signalr` (client kết nối ChatHub)
- Bản thử nghiệm nhanh, không phải phần được chấm chính (xem `Backend/README.md` mục 11)

**Mobile** — `Mobile/`
- React Native (khởi tạo bằng **React Native CLI thuần**, không dùng Expo Go)
- React Navigation (điều hướng)
- `@microsoft/signalr` (client kết nối ChatHub)
- AsyncStorage (lưu token/session)

## Cấu trúc thư mục

```
EZone/
├── Backend/
│   ├── WebChatEIU/           # ASP.NET Core Web API + SignalR Hub
│   ├── WebChatEIU.Tests/     # test thật (xUnit + EF Core InMemory)
│   ├── README.md             # tài liệu kỹ thuật backend chi tiết (kiến trúc, DB, từng API)
│   └── API_REPORT.md         # báo cáo API dạng bảng, tiếng Anh, dùng cho report môn học
├── Frontend/
│   └── Chat/                 # source code web thử nghiệm (React), không phải phần chấm chính
├── Mobile/                   # source code React Native
├── DEMO_SCRIPT.md            # kịch bản demo cho buổi báo cáo
├── README_Mobile.md          # tài liệu kỹ thuật mobile as-built (đúng những gì đã code, không phải kế hoạch)
└── README.md                 # file này
```

## Hướng dẫn chạy dự án

### Backend
```bash
cd Backend/WebChatEIU
dotnet restore
dotnet ef database update
dotnet run
```
Kiểm tra `appsettings.json` để cấu hình connection string SQL Server. Sau khi chạy, xem API docs tại `/swagger`. Chi tiết đầy đủ (schema DB, từng API, quyết định thiết kế) xem `Backend/README.md`.

### Frontend (Web)
```bash
cd Frontend/Chat
npm install
npm run dev
```

### Mobile
```bash
cd Mobile
npm install
npx react-native run-android
```
Cần cài Android SDK + máy ảo (hoặc thiết bị thật) chạy sẵn. Sửa `Mobile/src/constants/config.js` để trỏ `BASE_URL` tới IP LAN của máy chạy backend (không dùng `localhost` — mobile không chạy chung máy với backend; IP này đổi mỗi khi laptop reconnect Wi-Fi, kiểm tra lại bằng `ipconfig`). Chi tiết đầy đủ xem `README_Mobile.md`.

### Chạy test backend
```bash
cd Backend/WebChatEIU.Tests
dotnet test
```