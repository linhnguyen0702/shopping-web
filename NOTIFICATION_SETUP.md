# Cấu hình Email Notifications

## 📧 Cấu hình SMTP trong .env

Thêm các biến sau vào file `.env` của server:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=linhyang0702@gmail.com
SMTP_PASS=gpbb opky jkvx pwnz
```

## 🔑 Tạo App Password cho Gmail

1. Vào [Google Account Settings](https://myaccount.google.com/)
2. Chọn **Security** → **2-Step Verification** (bật nếu chưa có)
3. Chọn **App passwords**
4. Tạo password mới cho "Mail"
5. Copy password và paste vào `SMTP_PASS`

## 🧪 Test Email System

### Test API:

```bash
# Test email cơ bản
POST /api/notifications/test-email

# Hoặc test bằng cURL:
curl -X POST http://localhost:8000/api/notifications/test-email \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test thực tế:

1. **Đăng ký account mới** → Check email & admin panel notifications
2. **Login với account** → Check email & admin panel notifications
3. **Tạo đơn hàng** → Check email & admin panel notifications
4. **Kiểm tra** email tại linhyang0702@gmail.com

## 🔔 Notification Events

### Tự động tạo thông báo khi:

- ✅ **Đơn hàng mới**: Khách đặt hàng
- ✅ **User đăng ký**: Có tài khoản mới (Admin hoặc Khách hàng)
- ✅ **User login**: Tất cả account đăng nhập (Admin = priority cao, User = priority thấp)
- ⏳ **Hết hàng**: Sản phẩm sắp hết (cần implement)

### Email được gửi đến:

- **linhyang0702@gmail.com** (cố định trong code)
- Template HTML đẹp với thông tin chi tiết
- Priority levels:
  - **🔴 Urgent**: Lỗi hệ thống nghiêm trọng
  - **🟠 High**: Đơn hàng mới, Admin đăng ký, Hết hàng
  - **🟡 Medium**: Khách hàng đăng ký, Admin login
  - **🟢 Low**: Khách hàng login

## 📱 Frontend Integration

### API Endpoints:

- `GET /api/notifications` - Lấy danh sách thông báo
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc
- `PUT /api/notifications/mark-all-read` - Đánh dấu tất cả đã đọc

### Real-time Updates:

- Auto refresh mỗi 30 giây
- Badge hiển thị số thông báo chưa đọc
- Click để đánh dấu đã đọc

## 🛠️ Customize

### Thay đổi email nhận:

Sửa trong `server/services/emailService.js`:

```javascript
const adminEmail = "your-new-email@gmail.com";
```

### Thêm loại thông báo mới:

1. Update `notificationModel.js` enum types
2. Thêm function trong `notificationService.js`
3. Gọi function từ controller cần thiết

## 🐛 Troubleshooting

### Email không gửi được:

- Kiểm tra `SMTP_USER` và `SMTP_PASS`
- Đảm bảo 2-Step Verification đã bật
- Kiểm tra App Password chính xác
- Xem console logs để debug

### Thông báo không hiển thị:

- Check browser Console for errors
- Verify API endpoints respond
- Check admin auth token validity
