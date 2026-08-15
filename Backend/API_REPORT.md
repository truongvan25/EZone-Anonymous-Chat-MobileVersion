# EZone Backend — API Specification (Report Version)

Compact reference for the project report. For full implementation detail see
`Backend/README.md`. **22 REST endpoints** across 6 controllers + **5
SignalR methods** (`ChatHub`), covering all 9 minimum API types required by
the assignment (Login, Register, Get profile, Update profile, Get list, Get
detail, Create, Update, Delete).

---

## 1. AuthController — `/api/auth`

| Method & URL | Header | Body | Function | Technical Flow | Called At (Mobile) |
|---|---|---|---|---|---|
| `POST /login` | — (public) | `{ email, password }` | User login, returns JWT | Verify password with `BCrypt.Verify` → check `IsActive`/`IsBanned` → build claims (`userId`, `Email`, `IsActive`, `IsBanned`, one `Role` claim per role) → sign JWT with `HmacSha256`, 3h expiry | `LoginScreen.jsx` → `handleLogin()` |
| `POST /logout` | `Bearer <token>` | — | Logout | JWT is stateless (no server-side session) → returns `200 OK` only; client discards the token from AsyncStorage | `LogoutConfirmScreen.jsx` → `handleConfirm()` |

## 2. UsersController — `/api/users`

| Method & URL | Header | Body | Function | Technical Flow | Called At (Mobile) |
|---|---|---|---|---|---|
| `POST /register` | — | `{ Fullname, Email, Password, MajorCode }` | Create account, send activation code by email | Check duplicate email → hash password (`BCrypt`) → generate random 6-digit code → save user with `IsActive=false` → `IEmailService.SendActivationEmailAsync` (MailKit SMTP, falls back to console log if unconfigured) → code is **never** returned in the response | `RegisterScreen.jsx` → `handleRegister()` |
| `POST /activate` | — | `{ email, code }` | Activate account via code | Find user by matching `ActiveCode` → set `IsActive=true`, clear `ActiveCode` | `ActivateAccountScreen.jsx` → `handleActivate()` |
| `GET /activate?code=` | — | — (query) | Activate account via link | Same logic as the POST version, code passed as query string | *Not used by Mobile* — reserved for a "click-to-activate" email link |
| `GET /me` | `Bearer <token>` | — | Get own profile | Reads `userId` from the JWT claim (no id needed in the URL) | `ProfileScreen.jsx` (fetched via `useFocusEffect`) |
| `PUT /{id}` | `Bearer <token>`, `multipart/form-data` | `Fullname, Gender, MajorCode, SocialLink, AvatarFile?` | Update profile + avatar | Compares `id` to the token's `userId` (`403 Forbid` if different); if `AvatarFile` present, saves it to `wwwroot/avatar_images` with a `Guid`-based filename | `EditProfileScreen.jsx` → `handleSave()`; `ProfileScreen.jsx` → `handleChangePhoto()` (avatar only) |
| `DELETE /{id}` | `Bearer <token>` | `{ password }` | Delete account (soft delete) | Re-verifies password via BCrypt → sets `IsDeleted=true`, `DeletedAt` (does **not** touch related `ChatRooms`/`Messages`/`ChatReports`) → closes the user's Active/Waiting rooms. An EF Core Global Query Filter (`!IsDeleted`) then hides the user from every query | `DeleteAccountScreen.jsx` → `runDelete()` |
| `GET /{id}` | `Bearer <token>` (Admin role) | — | Admin views 1 user by ID | `[Authorize(Roles="Admin")]` | *Not used by Mobile* |

## 3. ChatRoomsController — `/api/chatrooms`

| Method & URL | Header | Body | Function | Technical Flow | Called At (Mobile) |
|---|---|---|---|---|---|
| `GET /history/{userId}` | — | — | List past chat rooms — **List data API** | Filters `Status == Closed`, ordered by `UpdatedAt` descending | `ChatHistoryScreen.jsx` (fetched via `useFocusEffect`) |
| `GET /{roomId}` | `Bearer <token>` | — | Room detail — **Detail data API** | Verifies the caller is `User1Id`/`User2Id` of that room | `ChatRoomDetailScreen.jsx` (fetched in `useEffect`) |
| `GET /active/{userId}` | — | — | Get the user's currently Active room | Filters `Status == Active` | *Not used* — deliberate design choice not to auto-resume an old chat room |

## 4. MessagesController — `/api/messages`

| Method & URL | Header | Body | Function | Technical Flow | Called At (Mobile) |
|---|---|---|---|---|---|
| `GET /{roomId}` | — | — | Get all messages in a room | Ordered by `CreatedAt` ascending | `ChatRoomScreen.jsx` (loads message history on entering the room, before connecting to SignalR) |

## 5. ChatReportsController — `/api/chatreports`

| Method & URL | Header | Body | Function | Technical Flow | Called At (Mobile) |
|---|---|---|---|---|---|
| `POST /` | — | `{ RoomId, ReporterId, ViolatingMessage, Reason }` | File a report — **Create data API** | Verifies `ReporterId` actually belongs to `RoomId` → infers `ReportedUserId` as the other participant → sets `Status="Pending"` | `ReportUserScreen.jsx` → `handleSubmit()` |
| `GET /my` | `Bearer <token>` | — | List reports filed by the current user | Reads `userId` from JWT, filters `ReporterId == userId` | `MyReportsScreen.jsx` (fetched via `useFocusEffect`) |
| `GET /` | `Bearer <token>` (Admin role) | — (query: `page, pageSize, status, sortBy, sortOrder`) | Admin lists all reports with filter/sort/pagination | Builds an `IQueryable` dynamically by `status` and `sortBy` (`status`/`reason`/`createdAt`), `Skip/Take` for paging | `AdminReportListScreen.jsx` → `loadReports()` |
| `PUT /{reportId}` | `Bearer <token>` (Admin role) | `{ Status }` (`"Pending"`/`"Resolved"`) | Update report status — **Update data API** | Validates `Status` against an allow-list before saving | `AdminReportDetailScreen.jsx` → `handleSave()` |
| `POST /{reportId}/ban` | `Bearer <token>` (Admin role) | — | Ban the reported user | Sets `Users.IsBanned=true` + `ChatReports.Status="Resolved"` | `AdminReportListScreen.jsx` (Ban User button); `AdminReportDetailScreen.jsx` → `handleBan()` |
| `DELETE /{reportId}` | `Bearer <token>` (Admin role) | — | Delete a report — **Delete data API** | `_context.Remove` + `SaveChanges` | `AdminReportListScreen.jsx` (Delete button) |

## 6. RevealController — `/api/reveal`

| Method & URL | Header | Body | Function | Technical Flow | Called At (Mobile) |
|---|---|---|---|---|---|
| `POST /{roomId}/{userId}` | `Bearer <token>` | — | Request identity reveal | Requires `AffinityScore >= 10` → sets `User1Revealed`/`User2Revealed` for the caller's side → `IsRevealed=true` only once **both** flags are true (double opt-in) | `ChatRoomScreen.jsx` → `handleRequestReveal()` |
| `GET /{roomId}` | `Bearer <token>` | — | Get current reveal status | Returns `affinityScore`, `canReveal` (`>=10`), `user1Revealed`, `user2Revealed`, `isRevealed` | `ChatRoomScreen.jsx` → `handleRequestReveal()` (status check before requesting) |
| `GET /{roomId}/identity/{userId}` | `Bearer <token>` | — | Get the partner's real identity after reveal | Blocked if `IsRevealed=false`; resolves the other participant, returns `fullname/gender/majorCode/avatarUrl/socialLink` | `ChatRoomScreen.jsx` → `handleRequestReveal()` (after `requestReveal` confirms the reveal) |

## 7. SignalR — `ChatHub` (`/chatHub`, real-time, not counted in the 9 REST API types)

| Method | Function | Called At (Mobile) |
|---|---|---|
| `FindMatch()` | Randomly pairs two waiting users, creates a new `ChatRooms` row | `WaitingScreen.jsx` |
| `JoinRoom(roomId)` | Joins the room's SignalR group | `ChatRoomScreen.jsx` |
| `SendMessage(message)` | Sends a message, runs content moderation, +1 `AffinityScore` | `ChatRoomScreen.jsx` → `handleSend()` |
| `Typing()` | Notifies the partner that the user is typing | `ChatRoomScreen.jsx` → `handleChangeText()` |
| `LeaveRoom()` | Leaves the room, closes it, deletes its messages | `ChatRoomScreen.jsx` → `handleLeave()` |
