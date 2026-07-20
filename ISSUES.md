# THÔNG TIN CÒN THIẾU / BLOCKER PRODUCTION

Mã nguồn, test và cấu hình mẫu được hoàn thiện mà không tự điền dữ liệu production. Các mục dưới đây cần chủ dự án cung cấp hoặc xác nhận trước khi migrate/deploy thật.

## Thông tin quán

- [ ] Xác nhận số điện thoại `0914.780.342` đọc từ `cafe_name.png`/menu có phải số dùng trên website hay không.
- [ ] Cung cấp địa chỉ giao dịch của quán.
- [ ] Cung cấp email nhận thông báo đơn hàng.
- [ ] Xác nhận phí giao hàng mặc định hiện là `0đ`.
- [ ] Cung cấp giờ hoặc khoảng thời gian quán nhận đơn.
- [ ] Cung cấp giá của món “Nước ngọt các loại”; món này chưa được seed vì ảnh menu không ghi giá rõ.

## Tài khoản tích hợp

- [ ] SMTP/Gmail App Password dùng gửi đơn.
- [ ] Cloudinary cloud name, API key và API secret.
- [ ] Gemini API key và model production muốn sử dụng.
- [ ] Username/password admin production.
- [ ] JWT secret ngẫu nhiên tối thiểu 32 ký tự.

Các secret không gửi qua chat và không commit vào Git; đặt trực tiếp trong `backend/.env` trên VPS.

## Hạ tầng deploy

- [ ] Domain/subdomain chính thức để cấu hình Nginx, SSL và tạo QR `/vibe`.
- [ ] Quyền truy cập VPS hoặc người thực hiện các lệnh trong `README.md`.
- [ ] Xác nhận hệ điều hành, đường dẫn deploy và cổng localhost còn trống (mẫu đang dùng `3003`).
- [ ] Thông tin MySQL production để tạo database/user và chạy migration.

## Kiểm thử chưa thể chạy nếu thiếu cấu hình

- Migration/seed/rollback trên MySQL thật (MySQL local đang chạy nhưng không có thông tin đăng nhập).
- Gửi email thật tới quán và email khách.
- Upload thật lên Cloudinary.
- Sinh quote thật bằng Gemini.
- Nginx, PM2, firewall, Certbot, backup/restore và kiểm tra hai backend đang có trên VPS.
- Smoke test trên domain production và tạo QR chính thức.
