Đã hoàn tất toàn bộ phần có thể triển khai trong workspace: 105/145 task đã hoàn thành. 40 task còn lại phụ thuộc dữ liệu thật, tài khoản dịch vụ và quyền truy cập VPS nên tôi không tự suy diễn.
Phần đã hoàn thành
Monorepo Vue 3 + Node.js/Express + TypeScript + MySQL.
Giao diện khách hàng responsive, sử dụng logo “Cái Tiệm”.
Menu 4 nhóm: Cà phê, Ca cao, Sữa chua, Nước giải khát.
Không có size, topping, đường/đá; mỗi món chỉ có số lượng và ghi chú.
Giỏ hàng và checkout với tên, số điện thoại, địa chỉ, email không bắt buộc.
Đặt hàng thành công không phụ thuộc việc gửi email.
Email xác nhận chỉ gửi khi khách cung cấp email.
Một đường dẫn QR tĩnh /vibe, backend trả thông điệp ngẫu nhiên.
Admin đăng nhập, quản lý món, nhóm món, thông điệp và cài đặt.
Danh sách đơn hàng chỉ đọc, không có trạng thái xử lý.
API có xác thực, rate limit, validation, idempotency và transaction.
Cấu hình PM2, Nginx, HTTPS, logrotate, backup MySQL và rollback cho VPS.
Đã khởi tạo Git branch main, chưa tự tạo commit.
Tài liệu chính:
[README.md](D:/cafe_website/README.md)
[TASKS.md](D:/cafe_website/TASKS.md)
[ISSUES.md](D:/cafe_website/ISSUES.md)
[PLAN.md](D:/cafe_website/PLAN.md)
[workflow.md](D:/cafe_website/workflow.md)
[Cấu hình Nginx](D:/cafe_website/deploy/nginx/cai-tiem-cafe.conf)
Kết quả kiểm tra
Lint: đạt.
TypeScript typecheck: đạt.
11 automated tests: đạt.
Backend và frontend production build: đạt.
Visual smoke test trên desktop/mobile/tablet: đạt.
Luồng đặt hàng, Vibe và admin: đạt.
Không có tràn ngang trên mobile/tablet.
Axe accessibility: không có lỗi serious/critical.
npm audit --omit=dev: 0 lỗ hổng.
Các preview server đã được dừng.
Tôi cũng dùng tính năng tạo ảnh tích hợp để tạo bộ hình đồng nhất theo phong cách quán cà phê Việt Nam nhỏ, tông nâu–kem, không chữ và không watermark:
[Ảnh hero](D:/cafe_website/frontend/public/images/brand/hero-cafe.webp)
[Bộ ảnh menu](D:/cafe_website/frontend/public/images/menu)
Những điểm cần bạn xác nhận
Thông tin quán:
Số điện thoại có đúng là 0914.780.342 không?
Địa chỉ chính xác?
Email quán nhận thông báo đơn hàng?
Phí giao hàng có phải 0đ không?
Giờ nhận đơn?
Giá của món “Nước ngọt các loại”? Hiện món này chưa đưa vào seed vì ảnh menu không có giá rõ ràng.

Triển khai VPS:
Domain chính thức?
IP/hostname VPS?
Username SSH và cách xác thực?
Hệ điều hành VPS?
Hai backend đang chạy trên VPS hiện dùng port nào?

Dữ liệu bí mật cần được thiết lập trực tiếp trên VPS, không nên gửi trong tin nhắn:
MySQL
JWT secret
SMTP
Cloudinary
Gemini API key
Tài khoản admin đầu tiên

Local MySQL hiện từ chối tài khoản root không mật khẩu, nên tôi không đoán mật khẩu và chưa chạy migration/seed thật. Khi bạn cung cấp các thông tin trên, phần còn lại là chạy database, deploy lên VPS, cấp SSL, tạo QR production và smoke-test domain thật.