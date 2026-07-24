# Hướng Dẫn Deploy Dự Án Cái Tiệm KÀFE Lên VPS (Docker Compose + Nginx + SSL)

Tài liệu này giải thích chi tiết quy trình triển khai ứng dụng lần đầu tiên lên VPS Ubuntu bằng **Docker Compose**, bao gồm:
1. **Khởi chạy ứng dụng bằng Docker Compose** 🐳
2. **Khởi tạo Database & Dữ liệu ban đầu (Migration & Seed)** 🗄️
3. **Cấu hình Nginx & SSL HTTPS cho Tên Miền (Domain)** 🔒

---

## 🐳 BƯỚC 1: Cài Đặt Docker & Khởi Chạy Ứng Dụng

### 1. Cài đặt Docker trên VPS Ubuntu:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
```

### 2. Clone mã nguồn & Cấu hình File `.env`:
```bash
cd /var/www
git clone <URL_GIT_REPO_CUAN_BAN> caitiemcafe
cd caitiemcafe

# Tạo file .env cho Backend và Frontend
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

* Chỉnh sửa thông số file `backend/.env` (DB Host, DB User, DB Password, JWT Secret, Gemini API Key...).

### 3. Khởi chạy Docker Containers:
```bash
docker compose up -d --build
```
> Lúc này: Frontend Nuxt 3 chạy ở cổng `3000`, Backend API chạy ở cổng `3003` nội bộ trên VPS.

---

## 🗄️ BƯỚC 2: Khởi Tạo Database Ban Đầu (Migration & Seed)

**Trả lời câu hỏi: Có cần setting DB trước không?**
* **CÓ** (chỉ làm 1 lần duy nhất khi mới deploy lần đầu).
* Sau khi `docker compose up -d` chạy xong, bạn gõ 2 lệnh sau để Docker tự tạo bảng và nạp thực đơn/tài khoản admin mặc định vào Database:

```bash
# 1. Chạy Migration tạo các bảng trong Database (Categories, Products, Orders, Quotes...)
docker compose exec backend npm run db:migrate

# 2. Nạp dữ liệu thực đơn & tài khoản mẫu ban đầu (nếu cần)
docker compose exec backend npm run db:seed
```

---

## 🔒 BƯỚC 3: Cấu Hình Nginx & SSL HTTPS (Cho Tên Miền/Domain)

**Trả lời câu hỏi: Có cần Nginx & SSL không?**
* **CÓ**. Docker chạy App ở `localhost:3000`. Khi khách gõ `https://caitiemcafe.com` trên điện thoại, Nginx trên VPS sẽ hứng cổng `80/443` và chuyển tiếp (Proxy) vào cổng `3000` của Docker.

### 1. Cài đặt Nginx & Certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Tạo file cấu hình Nginx cho Domain:
```bash
sudo nano /etc/nginx/sites-available/caitiemcafe
```

Dán nội dung sau (thay `your-domain.com` bằng tên miền của bạn):
```nginx
server {
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_nuxt/ {
        proxy_pass http://127.0.0.1:3000/_nuxt/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 3. Kích hoạt Nginx & Cấp SSL miễn phí:
```bash
sudo ln -s /etc/nginx/sites-available/caitiemcafe /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Cấp chứng chỉ HTTPS bảo mật
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🔄 QUY TRÌNH CẬP NHẬT CODE (REDEPLOY KHI CÓ TÍNH NĂNG MỚI)

Mỗi khi bạn sửa code và push lên Git:

```bash
cd /var/www/caitiemcafe
git pull origin main
docker compose up -d --build
```
*(Không cần chạy lại Migrate hay SSL nữa).*
