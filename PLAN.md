# KẾ HOẠCH TRIỂN KHAI WEBSITE QUÁN CÀ PHÊ

## 1. Mục đích

Tài liệu này quy định thứ tự triển khai hệ thống được mô tả trong `workflow.md`. Dự án ưu tiên giao diện đẹp, dễ sử dụng và vận hành đơn giản cho quán nhỏ.

## 2. Nguyên tắc triển khai

* Sử dụng một repository dạng monorepo gồm `frontend/` và `backend/`.
* Frontend sử dụng Vue 3, TypeScript, Vite, Pinia và Tailwind CSS.
* Backend sử dụng Node.js, Express, TypeScript, Sequelize và MySQL.
* Frontend và backend cùng deploy lên VPS.
* Nginx phục vụ frontend đã build và proxy `/api` tới backend.
* Backend chạy bằng PM2 trên một cổng localhost riêng.
* Chỉ triển khai đúng phạm vi MVP trong `workflow.md`; không tự thêm option món, trạng thái đơn hoặc QR riêng.
* Backend là nguồn quyết định giá tiền và tổng đơn hàng; không tin dữ liệu giá do frontend gửi lên.
* Secret chỉ đặt trong biến môi trường, không commit vào Git hoặc lưu trong bảng settings.

## 3. Cấu trúc dự án dự kiến

```text
cafe_website/
├── backend/
│   ├── src/
│   ├── migrations/
│   ├── seeders/
│   ├── tests/
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── public/
│   └── .env.example
├── deploy/
│   ├── nginx/
│   └── ecosystem.config.example.js
├── workflow.md
├── PLAN.md
├── TASKS.md
└── README.md
```

## 4. Các phase triển khai

### Phase 0 — Xác minh dữ liệu đầu vào

#### Mục tiêu

Chuẩn hóa dữ liệu thật của quán trước khi tạo seed và giao diện.

#### Công việc

* Sử dụng đúng logo/tên quán từ `cafe_name.png`.
* Lập danh sách món thuộc 4 nhóm: Cà phê, Ca cao, Sữa chua, Nước giải khát.
* Kiểm tra thủ công tên và giá trong `menu_dexuat/MENU_CHUAN.png` vì một số nội dung bị ảnh che/chồng lên.
* Xác nhận số điện thoại, địa chỉ, email nhận đơn, phí giao hàng và giờ nhận đơn.
* Xác định ảnh nào được phép dùng chính thức; ảnh trong `giaodien/` chỉ dùng tham khảo phong cách.

#### Hoàn thành khi

Có danh sách menu và thông tin liên hệ đã được xác nhận, không cần suy đoán từ ảnh.

### Phase 1 — Khởi tạo monorepo

#### Mục tiêu

Tạo bộ khung chạy local ổn định cho frontend và backend.

#### Công việc

* Khởi tạo Vue 3 + TypeScript + Vite trong `frontend/`.
* Khởi tạo Express + TypeScript trong `backend/`.
* Cấu hình lint, format, script dev/build/test và `.gitignore`.
* Tạo `.env.example` riêng cho frontend và backend.
* Tạo endpoint `GET /api/health`.
* Viết README hướng dẫn chạy local.

#### Hoàn thành khi

Frontend mở được trang khởi đầu, backend trả health check và cả hai build thành công.

### Phase 2 — Database và nền tảng backend

#### Mục tiêu

Hoàn thiện migrations, models, associations và seed cơ bản.

#### Công việc

* Tạo các bảng: `categories`, `products`, `orders`, `order_items`, `quotes`, `settings`, `users`.
* Thiết lập foreign key, unique index và timestamps phù hợp.
* Tạo transaction khi lưu order và order items.
* Seed 4 danh mục, settings mặc định, quote mẫu và tài khoản admin theo biến môi trường.
* Không seed mật khẩu hoặc secret cố định trong source code.

#### Hoàn thành khi

Database có thể migrate/seed từ đầu và rollback trong môi trường phát triển.

### Phase 3 — API công khai và đặt hàng

#### Mục tiêu

Cho khách xem menu và đặt đơn đơn giản.

#### Công việc

* Xây dựng API đọc category và product đang hoạt động.
* Xây dựng `POST /api/orders` với validation.
* Kiểm tra lại món còn bán và giá hiện tại tại thời điểm đặt.
* Backend tự tính subtotal, shipping fee và total amount.
* Chống submit trùng trong thời gian ngắn.
* Gửi email thông báo đơn tới quán sau khi lưu DB.
* Chỉ gửi xác nhận cho khách khi có `customer_email` hợp lệ.
* Email lỗi không làm mất đơn hoặc khiến frontend tạo lại đơn.

#### Hoàn thành khi

Một đơn hợp lệ được lưu đúng tổng tiền, quán nhận thông báo và email khách hoạt động theo điều kiện optional.

### Phase 4 — Vibe QR và quote

#### Mục tiêu

Hoàn thiện trải nghiệm một QR tĩnh lấy thông điệp ngẫu nhiên.

#### Công việc

* Xây dựng `GET /api/vibe/random`.
* Chỉ lấy quote `is_active = true` và tăng `scan_count` an toàn.
* Trả trạng thái phù hợp khi chưa có quote hoạt động.
* Tạo dữ liệu quote mẫu.
* Chưa tạo ảnh QR chính thức cho đến khi có domain production.

#### Hoàn thành khi

Mỗi request nhận được một quote đang hoạt động và lượt lấy được ghi nhận.

### Phase 5 — Frontend khách hàng

#### Mục tiêu

Tạo website mobile-first đẹp mắt theo nhận diện quán.

#### Công việc

* Xây dựng design tokens, typography và layout dùng `cafe_name.png`.
* Tạo trang chủ, menu, giỏ hàng, checkout, cảm ơn và `/vibe`.
* Menu lọc theo đúng 4 danh mục.
* Món chỉ có số lượng và ghi chú tự do.
* Checkout có tên, SĐT, địa chỉ bắt buộc; email và ghi chú không bắt buộc.
* Sau khi API lưu đơn thành công, hiển thị thông báo quán sẽ sớm liên hệ và giao món.
* `/vibe` hỗ trợ rút câu khác và chia sẻ/copy đường dẫn.
* Tối ưu ảnh, responsive, loading, empty state và error state.

#### Hoàn thành khi

Luồng xem menu đến đặt hàng và luồng `/vibe` hoạt động tốt trên điện thoại và desktop.

### Phase 6 — Admin tối giản

#### Mục tiêu

Cung cấp đúng các công cụ quán có khả năng sử dụng.

#### Công việc

* Đăng nhập admin an toàn.
* Dashboard thống kê cơ bản.
* CRUD category và product; toggle còn hàng/hết hàng.
* Upload ảnh qua Cloudinary.
* Chỉ xem danh sách và chi tiết đơn đã đặt, không cập nhật trạng thái.
* CRUD quote và bật/tắt quote.
* Sinh batch quote bằng Gemini; validate và loại nội dung trùng trước khi lưu.
* Quản lý thông tin quán, phí giao hàng và bật/tắt nhận đơn.

#### Hoàn thành khi

Admin quản lý được menu, xem đơn và quản lý quote mà không có chức năng ngoài phạm vi MVP.

### Phase 7 — Kiểm thử và hoàn thiện

#### Mục tiêu

Đảm bảo các luồng quan trọng an toàn trước khi deploy.

#### Công việc

* Test unit/integration cho tính tổng tiền, validation và tạo đơn transaction.
* Test checkout có và không có email.
* Test email lỗi sau khi đơn đã lưu.
* Test submit trùng, món hết hàng và dữ liệu giá giả từ frontend.
* Test đăng nhập, phân quyền admin, upload và rate limit.
* Test responsive, accessibility cơ bản và Vue Router refresh trực tiếp.
* Chạy typecheck, lint, test và production build.

#### Hoàn thành khi

Không còn lỗi nghiêm trọng trong các luồng đặt hàng, admin và Vibe QR; tất cả quality checks đều đạt.

### Phase 8 — Deploy VPS

#### Mục tiêu

Chạy frontend, backend và database ổn định cùng các hệ thống đã có trên VPS.

#### Công việc

* Kiểm tra RAM, CPU, disk, port và các PM2 process hiện có.
* Tạo database và MySQL user riêng, giới hạn quyền đúng database.
* Chọn cổng localhost chưa dùng cho backend café.
* Build backend và chạy bằng PM2 với tên process riêng.
* Build Vue và để Nginx phục vụ thư mục `dist`.
* Cấu hình Nginx: `/` phục vụ Vue, `/api` proxy tới backend, fallback về `index.html`.
* Cấp SSL bằng Certbot và kiểm tra auto-renew.
* Chỉ mở cổng 80/443; backend và MySQL không public nếu không cần.
* Cấu hình log rotation, backup database và quy trình rollback.
* Sau khi domain ổn định, tạo một ảnh QR chính thức dẫn tới `https://domain/vibe`.

#### Hoàn thành khi

Website chạy HTTPS trên domain thật, refresh route không lỗi, API/email hoạt động và các backend cũ trên VPS không bị ảnh hưởng.

## 5. Thứ tự ưu tiên

Không bỏ qua Phase 0. Các phase còn lại thực hiện tuần tự từ Phase 1 đến Phase 8; có thể làm giao diện mẫu song song sau khi contract API và dữ liệu menu đã ổn định.

## 6. Ngoài phạm vi MVP

* Đăng ký/đăng nhập khách hàng.
* Size, đường, đá, topping hoặc cấu hình option món.
* Thanh toán online.
* Trạng thái xử lý đơn và thông báo trạng thái.
* Theo dõi tài xế hoặc bản đồ giao hàng.
* QR riêng từng ly, quản lý nhiều QR hoặc in QR hàng loạt.
* Customers CRM, tích điểm, voucher hoặc khuyến mãi phức tạp.

