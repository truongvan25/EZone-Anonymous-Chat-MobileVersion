// Dùng IP LAN thật của máy chạy backend (Laptop A) thay vì 10.0.2.2, để cả
// emulator cùng máy lẫn emulator ở laptop khác (cùng mạng LAN/Wi-Fi) đều gọi
// được — dùng chung 1 giá trị BASE_URL, khỏi phải sửa riêng từng máy.
// IP này đổi mỗi khi Laptop A reconnect Wi-Fi — kiểm tra lại bằng `ipconfig`
// (dòng IPv4 Address của adapter Wi-Fi) nếu app không gọi được API nữa.
export const BASE_URL = 'http://10.30.221.111:5044';
export const API_BASE_URL = `${BASE_URL}/api`;
export const HUB_URL = `${BASE_URL}/chatHub`;
