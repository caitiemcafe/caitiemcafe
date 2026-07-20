# QUY TRÌNH THIẾT KẾ VÀ PHÁT TRIỂN WEBSITE QUÁN CÀ PHÊ (WORKFLOW & SPECIFICATION)

> **Tên dự án**: Website quán cà phê (nhận diện theo `cafe_name.png`) + Guest Ordering + Positive QR Message  
> **Chủ đề thiết kế**: Modern Premium Coffee Shop (Phong cách hiện đại, ấm áp, cao cấp)  
> **Tài liệu tham khảo gốc**: `de_xuat_website.md`, `menu_dexuat/MENU_CHUAN.png`, `giaodien/`  
> **Kế hoạch triển khai**: `PLAN.md`  
> **Checklist thực hiện**: `TASKS.md`

---

## I. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

### 1. Mục tiêu dự án
* **Dành cho Khách hàng**: Tra cứu menu của quán, chọn số lượng, thêm ghi chú nếu cần và đặt giao tận nơi mà không cần đăng nhập. Email là thông tin tùy chọn; chỉ gửi email xác nhận khi khách có nhập email.
* **Tính năng Vibe QR đặc trưng**: Dán 1 mã QR tĩnh cố định duy nhất lên ly nước (`domain.com/vibe`). Khách quét mã sẽ nhận được 1 thông điệp tích cực/yêu đời ngẫu nhiên với giao diện animation chill, tạo trải nghiệm độc đáo và khuyến khích chia sẻ.
* **Dành cho Quán (Admin)**: Quản lý menu đồ uống, nút **bật/tắt trạng thái hết hàng nhanh 1-click**, xem danh sách đơn đã nhận và gọi AI sinh hàng loạt câu quote tích cực lưu trước vào database. Không xây dựng quy trình xác nhận hay cập nhật trạng thái đơn trong MVP.

### 1.1. Phạm vi MVP đã chốt
* Dùng đúng nhận diện/tên quán trong file `cafe_name.png`; không dùng tên thương hiệu mẫu từ các ảnh giao diện tham khảo.
* Menu gồm 4 nhóm theo `menu_dexuat/MENU_CHUAN.png`: **Cà phê, Ca cao, Sữa chua, Nước giải khát**.
* Món không có size, mức đường, mức đá hoặc topping. Khách chỉ chọn món, số lượng và có thể nhập ghi chú tự do cho món/đơn.
* Đơn hàng chỉ cần được ghi nhận là **đã đặt**. Quán nhận thông tin và chủ động liên hệ khách qua số điện thoại để giao hàng.
* Chỉ có **một QR tĩnh** trỏ tới `/vibe`; mỗi lần mở trang sẽ gọi API lấy một thông điệp ngẫu nhiên.
* Không có module tạo nhiều QR, mã QR riêng từng ly, download/print danh sách QR, Customers CRM hoặc quy trình xử lý trạng thái đơn.

### 2. Định hình Phong cách Design & Màu sắc
* **Nâu cà phê đậm (Primary)**: `#3B2417`
* **Kem sữa (Background/Card)**: `#F5EBDD`
* **Beige nhẹ (Border/Neutral)**: `#D6BFA7`
* **Đen than (Text/Heading)**: `#181614`
* **Caramel (Accent/Highlight)**: `#C58B55`
* **Typography**: Google Fonts (*Inter* hoặc *Outfit* / *Playfair Display* cho tiêu đề chill).

---

## II. KIẾN TRÚC CÔNG NGHIỆP & CÔNG NGHỆ (TECH STACK)

```
[ FRONTEND ] (Vue 3 + TS + Vite + Pinia + TailwindCSS)
     │
     │ Deploy: Vercel
     ▼
[ BACKEND API ] (Node.js + Express + TypeScript + Sequelize ORM)
     │
     ├─► [ DATABASE ] MySQL (Deploy VPS)
     ├─► [ MAILER ] Nodemailer (Gmail App Password)
     ├─► [ MEDIA ] Cloudinary (Lưu ảnh món & danh mục)
     └─► [ AI API ] Google Gemini API (Sinh AI Quotes hàng loạt)
```

---

## III. CẤU TRÚC DATABASE (DATABASE SCHEMA)

### 1. Bảng `categories` (Danh mục món)
* `id` (INT, PK, Auto Increment)
* `name` (VARCHAR): Cà phê, Ca cao, Sữa chua, Nước giải khát
* `slug` (VARCHAR, Unique): `ca-phe`, `ca-cao`, `sua-chua`, `nuoc-giai-khat`
* `image_url` (VARCHAR, Nullable)
* `sort_order` (INT, Default 0)
* `is_active` (BOOLEAN, Default true)

### 2. Bảng `products` (Món ăn / Đồ uống)
* `id` (INT, PK, Auto Increment)
* `category_id` (INT, FK -> categories.id)
* `name` (VARCHAR): Cà phê sữa đá, Ca cao nóng...
* `slug` (VARCHAR, Unique)
* `description` (TEXT, Nullable)
* `price` (DECIMAL 10,2): Giá gốc (VD: 29000)
* `image_url` (VARCHAR)
* `is_out_of_stock` (BOOLEAN, Default false) *(Nút Bật/Tắt Hết Hàng Nhanh)*
* `is_active` (BOOLEAN, Default true)

### 3. Bảng `orders` (Đơn hàng)
* `id` (INT, PK)
* `order_code` (VARCHAR, Unique): `#CF00125`
* `customer_name` (VARCHAR)
* `customer_phone` (VARCHAR)
* `customer_email` (VARCHAR, Nullable): Chỉ gửi email xác nhận khi khách có nhập
* `customer_address` (TEXT)
* `notes` (TEXT, Nullable)
* `shipping_fee` (DECIMAL 10,2, Default 0)
* `total_amount` (DECIMAL 10,2)
* `payment_method` (VARCHAR, Default `'COD'`)
* `created_at` (DATETIME)

### 4. Bảng `order_items` (Chi tiết món trong đơn)
* `id` (INT, PK)
* `order_id` (INT, FK -> orders.id)
* `product_id` (INT, FK -> products.id, Nullable): Dùng truy vết; tên và giá bên dưới là snapshot tại lúc đặt
* `product_name` (VARCHAR)
* `quantity` (INT)
* `unit_price` (DECIMAL 10,2)
* `subtotal` (DECIMAL 10,2)
* `notes` (TEXT, Nullable): Ghi chú tự do cho món

### 5. Bảng `quotes` (Thông điệp tích cực)
* `id` (INT, PK)
* `content` (TEXT): Nội dung câu nói tích cực/yêu đời
* `topic` (VARCHAR): Năng lượng ngày mới, Chữa lành, Yêu bản thân, Cà phê...
* `scan_count` (INT, Default 0)
* `is_active` (BOOLEAN, Default true)
* `created_at` (DATETIME)

### 6. Bảng `settings` (Cài đặt hệ thống)
* `key` (VARCHAR, PK): `shipping_fee`, `shop_name`, `shop_phone`, `shop_address`, `shop_email`, `is_accepting_orders`
* `value` (TEXT): Giữ giá trị (Mặc định `shipping_fee = 0`)
* Gemini API Key và các secret khác phải đặt trong biến môi trường backend, không lưu trong bảng này.

### 7. Bảng `users` (Tài khoản Admin)
* `id` (INT, PK)
* `username` (VARCHAR, Unique)
* `password_hash` (VARCHAR)
* `role` (VARCHAR, Default `'admin'`)

---

## IV. LUỒNG HOẠT ĐỘNG CHI TIẾT (DETAILED WORKFLOWS)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. LUỒNG ĐẶT HÀNG (CUSTOMER)                     │
└────────────────────────────────────────────────────────────────────────┘
Khách truy cập Website
    │
    ├──► Xem Menu (Lọc theo: Cà phê, Ca cao, Sữa chua, Nước giải khát)
    │
    ├──► Click vào Món ──► Chọn số lượng và nhập ghi chú tự do nếu cần
    │                           │
    │                           └──► Click "Thêm vào giỏ hàng"
    │
    ├──► Vào Giỏ hàng (Xem danh sách, sửa số lượng, tính tổng tiền)
    │
    ├──► Điền Form giao hàng (Họ tên, SĐT, Email không bắt buộc, Địa chỉ, Ghi chú)
    │
    └──► Click "Xác nhận đặt hàng"
            │
            ├──► System lưu Order & OrderItems vào Database
            │
            ├──► Nodemailer gửi Email thông báo tới Quán (Chi tiết đơn + Khách hàng)
            │
            ├──► Nếu khách có nhập email: Nodemailer gửi Email xác nhận tới Khách
            │
            └──► Màn hình: "Đặt hàng thành công! Quán sẽ sớm liên hệ và giao món cho bạn."
```

Nếu gửi email lỗi sau khi đơn đã lưu thành công, không báo đặt hàng thất bại và không tạo lại đơn. Hệ thống ghi log lỗi để quản trị kiểm tra.

```
┌────────────────────────────────────────────────────────────────────────┐
│                    2. LUỒNG QUÉT MÃ QR TÍCH CỰC (VIBE QR)              │
└────────────────────────────────────────────────────────────────────────┘
Khách quét mã QR duy nhất trên ly ──► Truy cập domain.com/vibe
    │
    ├──► Frontend gửi API request: GET /api/vibe/random
    │
    ├──► Backend query DB: SELECT * FROM quotes WHERE is_active = 1 ORDER BY RAND() LIMIT 1
    │     (Tự động tăng scan_count + 1)
    │
    └──► Frontend hiển thị giao diện Chill + Card thông điệp + Animation nhẹ
          ├──► Nút "Rút câu khác ✨" (Gọi lại API lấy random quote khác)
          └──► Nút "Chia sẻ 💌" (Dùng Web Share API hoặc copy đường dẫn `/vibe`)
```

MVP chỉ dùng một QR tĩnh dẫn tới `/vibe`. Không có mã riêng, bảng `qr_codes`, chức năng tạo nhiều QR hoặc download/print QR trong Admin.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      3. LUỒNG QUẢN TRỊ (ADMIN PANEL)                   │
└────────────────────────────────────────────────────────────────────────┘
Admin đăng nhập tại /admin/login (JWT Token)
    │
    ├──► Dashboard: Thống kê đơn đã đặt trong ngày, tổng giá trị đơn và tổng lượt lấy thông điệp
    │
    ├──► Đơn Hàng (/admin/orders):
    │     └──► Chỉ xem danh sách và chi tiết các đơn đã đặt; không đổi trạng thái trong MVP
    │
    ├──► Quản lý Món (/admin/products):
    │     ├──► Nút Toggle "Còn hàng / Hết hàng" 1-click cho từng món
    │     └──► Thêm / Sửa / Xóa món, upload ảnh qua Cloudinary
    │
    ├──► Quản lý QR Quotes (/admin/quotes):
    │     ├──► Xem danh sách các câu quote, lượt quét của từng câu
    │     └──► NÚT "TẠO AI QUOTE HÀNG LOẠAT" ──► Gọi Gemini API ──► Tự động tạo 10-20 câu quote tích cực lưu thẳng vào DB
    │
    └──► Cài đặt (/admin/settings):
          └──► Chỉnh sửa giá ship, thông tin liên hệ và bật/tắt nhận đơn. Không hiển thị Gemini API Key.
```

---

## V. LỘ TRÌNH THỰC THI CHUYÊN SÂU (STEP-BY-STEP IMPLEMENTATION PLAN)

### PHASE 1: Khởi Tạo Dự Án & Database (Setup & Base Infrastructure)
1. **Khởi tạo Repo & Thư mục**:
   * Thư mục `backend/`: Node.js, Express, TypeScript, Sequelize, Dotenv, Cors, Nodemailer, Cloudinary, Mysql2.
   * Thư mục `frontend/`: Vue 3 (Vite), TypeScript, Vue Router, Pinia, Axios.
2. **Cấu hình Database & Migrations**:
   * Tạo các file Migration & Model Sequelize cho: `Category`, `Product`, `Order`, `OrderItem`, `Quote`, `Setting`, `User`.
3. **Seeding Dữ Liệu Mẫu (Seed Data)**:
   * Nhập 4 danh mục từ `menu_dexuat/MENU_CHUAN.png`. Tên món và giá phải được kiểm tra thủ công trước khi tạo Seeder vì một số chữ/giá trong ảnh bị chồng lên hình.
   * Seed dữ liệu khởi tạo cho `Settings` (`shipping_fee = 0`), `User` (tài khoản admin mặc định), `Quotes` (20 câu quote mẫu).

### PHASE 2: Phát Triển Backend APIs (RESTful API & Integrations)
1. **Auth & Admin API**:
   * `POST /api/admin/login`: Đăng nhập lấy JWT.
2. **Products & Categories API**:
   * `GET /api/categories`, `GET /api/products` (Cho khách xem).
   * `PATCH /api/admin/products/:id/toggle-stock`: API bật/tắt hết hàng nhanh.
   * CRUD endpoints cho Admin quản lý món & danh mục + Cloudinary Upload.
3. **Orders & Email Dispatch API**:
   * `POST /api/orders`: Tạo đơn mới + Tính toán tổng tiền.
   * Tích hợp `Nodemailer`: Luôn gửi thông báo về mail quán; chỉ gửi xác nhận cho khách khi có `customer_email`.
   * `GET /api/admin/orders`, `GET /api/admin/orders/:id`: Xem đơn hàng; không có API cập nhật trạng thái trong MVP.
4. **Vibe Quote & AI Generator API**:
   * `GET /api/vibe/random`: Lấy ngẫu nhiên 1 quote + tăng `scan_count`.
   * `POST /api/admin/quotes/generate-ai`: Gọi Gemini API sinh batch 10-20 quote tích cực chủ đề Cafe/Chill và lưu DB.
5. **Settings API**:
   * API đọc/ghi giá ship & thông tin quán.

### PHASE 3: Phát Triển Frontend (Client Web & Admin Dashboard)
1. **Design System & Base Layout**:
   * Tạo bảng màu CSS/Tailwind theo thiết kế: Nâu `#3B2417`, Kem `#F5EBDD`, Caramel `#C58B55`.
   * Component Header, Footer, Hero Banner với ảnh background quán hiện đại.
2. **Trang Menu & Luồng Đặt Hàng (Client)**:
   * **Category Filter**: Lọc theo danh mục.
   * **Product Card & Modal**: Chọn số lượng và nhập ghi chú tự do nếu cần.
   * **Cart Drawer / Cart Page**: Quản lý giỏ hàng với Pinia Store.
   * **Checkout Modal/Page**: Form nhập thông tin khách + nút Xác Nhận.
   * **Thank You View**: Trang cảm ơn sau khi đặt đơn thành công.
3. **Trang QR Vibe (`/vibe`)**:
   * Giao diện Mobile-first chill, hiệu ứng xuất hiện câu chữ mượt mà.
   * Nút "Rút câu mới" & "Chia sẻ".
4. **Trang Admin Dashboard (`/admin`)**:
   * Màn hình xem danh sách và chi tiết đơn hàng ngăn nắp.
   * Màn hình Quản lý Món với công tắc **Toggle Hết hàng 1-click**.
   * Màn hình Quản lý Quote + Button "Tạo AI Quote ngẫu nhiên bằng Gemini".
   * Màn hình Cài đặt Giá Ship & Thông tin quán.

### PHASE 4: Kiểm Thử, Tối Ưu & Triển Khai (Testing & Deployment)
1. **Kiểm thử E2E (End-to-End Test)**:
   * Test luồng chọn món ➔ Đặt hàng ➔ Kiểm tra mail gửi về quán & khách ➔ Kiểm tra DB.
   * Test Admin toggle hết hàng ➔ Kiểm tra màn hình khách cập nhật.
   * Test checkout có/không có email; chỉ trường hợp có email mới gửi xác nhận cho khách.
   * Test email lỗi sau khi lưu DB; giao diện vẫn báo đặt hàng thành công và không tạo đơn trùng.
   * Test quét QR `/vibe` ➔ Kiểm tra tăng lượt quét & hiển thị câu quote.
   * Test chức năng sinh AI Quote.
2. **Deployment**:
   * Frontend: Build & Deploy Vercel (Cấu hình Domain/Environment Variables).
   * Backend & DB: Setup Node.js PM2, MySQL trên VPS Linux, Nginx Reverse Proxy & Certbot SSL.

---
*File quy trình này là kim chỉ nam duy nhất để thực hiện từng bước dự án.*
