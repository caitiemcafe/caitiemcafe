# Cái Tiệm — Website đặt món & Vibe QR

Monorepo gồm website Vue 3 và API Node.js/Express cho quán cà phê nhỏ. Phạm vi nghiệp vụ chính nằm trong `workflow.md`; kế hoạch và tiến độ nằm trong `PLAN.md` và `TASKS.md`.

## Thành phần

* `frontend/`: Vue 3, TypeScript, Vite, Pinia, Vue Router.
* `backend/`: Node.js, Express, TypeScript, Sequelize, MySQL.
* `deploy/`: cấu hình mẫu PM2 và Nginx cho VPS.
* `docker-compose.dev.yml`: MySQL local tùy chọn.

## Yêu cầu

* Node.js 22 LTS trở lên.
* npm 10 trở lên.
* MySQL 8.x hoặc Docker Desktop.

## Chạy local

1. Cài dependency tại thư mục gốc:

   ```bash
   npm install
   ```

2. Sao chép `backend/.env.example` thành `backend/.env` và điền database/JWT.

3. Nếu dùng Docker cho MySQL:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

   Khi đó dùng `DB_PORT=3307`, `DB_USER=cafe_app`, `DB_PASSWORD=cafe_local_password`.

4. Chạy migration và seed:

   ```bash
   npm run db:migrate -w backend
   npm run db:seed -w backend
   ```

   Muốn seed tài khoản admin, cần đặt `ADMIN_USERNAME` và `ADMIN_PASSWORD` trong `backend/.env` trước khi seed.

5. Chạy frontend và backend:

   ```bash
   npm run dev
   ```

   Frontend mặc định ở `http://localhost:5173`; API ở `http://127.0.0.1:3003/api`.

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```

## Biến môi trường production

Không commit file `.env`. Các nhóm biến cần thiết:

* Database: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
* Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`.
* Email: `SHOP_ORDER_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`.
* Media: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
* AI: `GEMINI_API_KEY`, `GEMINI_MODEL`.
* Web: `FRONTEND_URL`, `PORT`.

Nếu SMTP, Cloudinary hoặc Gemini chưa được cấu hình, API liên quan sẽ trả thông báo rõ ràng; đơn hàng vẫn được lưu nếu SMTP lỗi sau khi tạo đơn.

## Deploy VPS

Các lệnh dưới đây cần thay domain, đường dẫn và thông tin database theo VPS thật.

1. Clone/copy dự án vào `/var/www/cai-tiem-cafe` và chạy `npm ci`.
2. Tạo `backend/.env` production, database và MySQL user riêng.
3. Chạy migration/seed rồi build:

   ```bash
   npm run db:migrate -w backend
   npm run db:seed -w backend
   npm run build
   ```

4. Tạo `/var/log/pm2` với quyền phù hợp, kiểm tra cổng `3003` chưa được dùng và chạy:

   ```bash
   pm2 start deploy/ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

5. Sao chép `deploy/nginx/cai-tiem-cafe.conf` vào `/etc/nginx/sites-available/`, thay `YOUR_DOMAIN`, bật site rồi kiểm tra trước khi reload:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. Cấp HTTPS:

   ```bash
   sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
   sudo certbot renew --dry-run
   ```

7. Smoke test `/`, `/vibe`, `/admin/login`, `/api/health`, đặt đơn thử và email.

8. Sau khi HTTPS hoạt động, tạo QR chính thức:

   ```bash
   npm run generate:qr -- https://YOUR_DOMAIN/vibe
   npm run build -w frontend
   ```

9. Cài mẫu logrotate `deploy/logrotate-cai-tiem-cafe` và cấu hình cron chạy `deploy/backup-mysql.sh`. File `/etc/cai-tiem-cafe/mysql-backup.cnf` cần quyền `600` và chỉ chứa tài khoản MySQL có đủ quyền backup database của dự án.

## Cập nhật phiên bản

```bash
git pull
npm ci
npm run build
npm run db:migrate -w backend
pm2 restart cai-tiem-cafe-api --update-env
sudo nginx -t
```

Nếu build hoặc migration lỗi, không restart process đang chạy. Luôn backup database trước migration production. Frontend cũ có thể rollback bằng cách giữ lại bản `dist` trước đó; backend rollback về commit trước và chỉ undo migration sau khi đã kiểm tra ảnh hưởng dữ liệu.

## Dữ liệu thông tin quán (Đã xác nhận & Cấu hình Admin Settings)

* **Địa chỉ quán**: 391 Giải Phóng, Xã Krông Pắc, Đắk Lắk
* **SĐT**: 0914780342 (0914.780.342)
* **Email nhận đơn hàng**: hoangvan050602@gmail.com
* **Giờ nhận đơn**: 06:00 - 16:00 (6h sáng đến 4h chiều)
* **Giá sản phẩm trong DB**: Đã đồng bộ đầy đủ các món menu.
* **Cần xác nhận còn lại**: Domain production và cổng backend thực tế còn trống trên VPS.

