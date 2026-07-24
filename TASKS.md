# DANH SÁCH CÔNG VIỆC TRIỂN KHAI

> Quy ước: chỉ đánh dấu `[x]` sau khi đã thực hiện và kiểm tra. Chi tiết yêu cầu nằm trong `workflow.md`; thứ tự và tiêu chí hoàn thành nằm trong `PLAN.md`.
>
> Cập nhật gần nhất: 20/07/2026. Những mục còn `[ ]` phụ thuộc dữ liệu thật, credentials, MySQL hoặc quyền truy cập VPS; xem `ISSUES.md`.

## Phase 0 — Xác minh dữ liệu

- [x] Xác nhận cách hiển thị tên/logo từ `cafe_name.png`
- [x] Xác nhận số điện thoại quán (0914780342)
- [x] Xác nhận địa chỉ quán (391 Giải Phóng, Xã Krông Pắc, Đắk Lắk)
- [x] Xác nhận email nhận thông báo đơn hàng (hoangvan050602@gmail.com)
- [x] Xác nhận phí giao hàng mặc định (0đ)
- [x] Xác nhận giờ/khoảng thời gian nhận đơn (06:00 - 16:00)
- [x] Lập danh sách món nhóm Cà phê
- [x] Lập danh sách món nhóm Ca cao
- [x] Lập danh sách món nhóm Sữa chua
- [x] Lập danh sách món nhóm Nước giải khát
- [x] Kiểm tra thủ công tên và giá từng món từ menu chuẩn
- [x] Xác nhận ảnh được phép sử dụng chính thức

## Phase 1 — Khởi tạo monorepo

- [x] Tạo thư mục `frontend/` bằng Vue 3 + TypeScript + Vite
- [x] Cài Vue Router, Pinia, Axios và Tailwind CSS
- [x] Tạo thư mục `backend/` bằng Express + TypeScript
- [x] Cài Sequelize, MySQL2, validation, auth, mailer và Cloudinary SDK
- [x] Cấu hình scripts dev, build, typecheck, lint và test
- [x] Tạo `.gitignore`
- [x] Tạo `frontend/.env.example`
- [x] Tạo `backend/.env.example`
- [x] Tạo `GET /api/health`
- [x] Viết README chạy local
- [x] Kiểm tra frontend và backend build thành công

## Phase 2 — Database

- [x] Cấu hình Sequelize CLI/migration runner
- [x] Tạo migration/model `categories`
- [x] Tạo migration/model `products`
- [x] Tạo migration/model `orders` với `customer_email` nullable
- [x] Tạo migration/model `order_items` với `notes` nullable
- [x] Tạo migration/model `quotes`
- [x] Tạo migration/model `settings`
- [x] Tạo migration/model `users`
- [x] Khai báo associations và chính sách foreign key
- [x] Thêm unique index cần thiết
- [x] Seed 4 danh mục menu
- [x] Seed sản phẩm đã được xác nhận
- [x] Seed settings mặc định
- [x] Seed quote mẫu
- [ ] Tạo admin đầu tiên từ biến môi trường, không hard-code mật khẩu
- [ ] Kiểm tra migrate, seed và rollback trong môi trường dev

## Phase 3 — API menu và đơn hàng

- [x] Tạo response/error format thống nhất
- [x] Thêm request validation và error handler
- [x] Tạo `GET /api/categories`
- [x] Tạo `GET /api/products`
- [x] Hỗ trợ lọc product theo category
- [x] Chỉ trả category/product đang hoạt động cho khách
- [x] Tạo `POST /api/orders`
- [x] Validate tên, SĐT, địa chỉ, email optional và ghi chú
- [x] Kiểm tra lại món còn bán tại checkout
- [x] Backend tự lấy giá và tính tổng tiền
- [x] Lưu order và order items bằng transaction
- [x] Thêm biện pháp chống submit đơn trùng
- [x] Tạo HTML email thông báo cho quán
- [x] Tạo HTML email xác nhận cho khách
- [x] Chỉ gửi email khách khi có email hợp lệ
- [x] Đảm bảo email lỗi không rollback đơn đã lưu
- [x] Thêm rate limit cho endpoint đặt hàng
- [ ] Viết test API đặt hàng và tính tiền

## Phase 4 — Vibe QR

- [x] Tạo `GET /api/vibe/random`
- [x] Chỉ chọn quote đang hoạt động
- [x] Tăng `scan_count` an toàn
- [x] Xử lý trường hợp không có quote
- [x] Thêm rate limit hợp lý
- [ ] Viết test API Vibe
- [x] Chưa tạo QR production khi chưa có domain thật

## Phase 5 — Frontend khách hàng

- [x] Tạo design tokens theo màu thương hiệu
- [x] Tích hợp logo/tên từ `cafe_name.png`
- [x] Tạo header và navigation responsive
- [x] Tạo hero section hiện đại
- [x] Tạo section giới thiệu/thông tin quán
- [x] Tạo trang/section menu với 4 bộ lọc danh mục
- [x] Tạo product card
- [x] Tạo modal thêm món: số lượng + ghi chú
- [x] Tạo Pinia cart store
- [x] Tạo cart drawer/page
- [x] Tạo checkout form
- [x] Đánh dấu email là không bắt buộc
- [x] Tạo loading state và chống bấm đặt nhiều lần
- [x] Tạo trang/thông báo đặt hàng thành công
- [x] Tạo trang `/vibe`
- [x] Tạo hiệu ứng hiển thị quote nhẹ
- [x] Tạo nút rút câu khác
- [x] Tạo nút share hoặc copy `/vibe`
- [ ] Tạo footer với thông tin thật của quán
- [x] Tối ưu ảnh WebP/AVIF và lazy loading
- [x] Kiểm tra responsive mobile/tablet/desktop
- [x] Kiểm tra empty state và error state

## Phase 6 — Admin tối giản

- [x] Tạo `POST /api/admin/login`
- [x] Hash mật khẩu an toàn
- [x] Thêm middleware auth/admin
- [x] Thêm rate limit login
- [x] Tạo admin layout và route guard
- [x] Tạo dashboard thống kê cơ bản
- [x] Tạo CRUD categories
- [x] Tạo CRUD products
- [x] Tạo toggle còn hàng/hết hàng
- [x] Tích hợp upload ảnh Cloudinary
- [x] Tạo API danh sách và chi tiết đơn
- [x] Tạo màn hình chỉ xem đơn, không cập nhật trạng thái
- [x] Tạo CRUD quotes và toggle hoạt động
- [x] Tạo API sinh batch quote bằng Gemini
- [x] Validate, loại trùng và xử lý lỗi Gemini
- [x] Tạo màn hình settings không chứa secret
- [x] Tạo bật/tắt nhận đơn

## Phase 7 — Kiểm thử và hoàn thiện

- [x] Test checkout không nhập email
- [ ] Test checkout có email hợp lệ
- [x] Test email khách không hợp lệ
- [ ] Test email gửi lỗi sau khi DB đã lưu đơn
- [ ] Test submit trùng
- [ ] Test món hết hàng tại thời điểm checkout
- [ ] Test frontend gửi giá/tổng tiền giả
- [x] Test input chứa HTML/script
- [ ] Test đăng nhập sai nhiều lần
- [x] Test API admin khi thiếu/hết hạn token
- [x] Test upload sai loại hoặc quá kích thước
- [x] Test Vue Router khi refresh trực tiếp
- [x] Test accessibility cơ bản
- [x] Chạy lint
- [x] Chạy typecheck
- [x] Chạy test suite
- [x] Chạy production build frontend
- [x] Chạy production build backend

## Phase 8 — Deploy VPS

- [ ] Kiểm tra CPU, RAM, disk và swap của VPS
- [ ] Liệt kê PM2 process và port đang sử dụng
- [ ] Chọn port localhost riêng cho backend café
- [ ] Tạo thư mục deploy riêng, không ghi đè hệ thống cũ
- [ ] Tạo MySQL database riêng
- [ ] Tạo MySQL user giới hạn quyền đúng database
- [ ] Thiết lập environment variables production
- [ ] Chạy migration production
- [ ] Build backend
- [ ] Cấu hình và chạy backend bằng PM2
- [ ] Build frontend
- [ ] Cấu hình Nginx phục vụ Vue `dist`
- [ ] Cấu hình Nginx proxy `/api` tới backend
- [ ] Cấu hình fallback Vue Router về `index.html`
- [ ] Kiểm tra Nginx config trước khi reload
- [ ] Cấp SSL bằng Certbot
- [ ] Kiểm tra firewall chỉ mở cổng cần thiết
- [ ] Cấu hình PM2 startup và save
- [ ] Cấu hình log rotation
- [ ] Cấu hình backup MySQL
- [ ] Kiểm tra hai backend cũ không bị ảnh hưởng
- [ ] Smoke test website production
- [ ] Tạo một QR chính thức dẫn tới `https://domain/vibe`
- [x] Lưu quy trình deploy và rollback vào README

## Không triển khai trong MVP

* Không thêm size, đường, đá hoặc topping.
* Không thêm đăng nhập khách hàng.
* Không thêm thanh toán online.
* Không thêm trạng thái xử lý đơn.
* Không thêm QR riêng từng ly hoặc QR hàng loạt.
* Không thêm Customers CRM, tích điểm hoặc voucher.
