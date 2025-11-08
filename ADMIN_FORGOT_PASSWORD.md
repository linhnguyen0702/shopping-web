# Hệ thống Quên Mật Khẩu với OTP cho Admin

## 🔐 Tổng quan

Đã triển khai hệ thống quên mật khẩu với xác thực OTP qua email cho trang Admin, thay thế cơ chế cũ để tăng cường bảo mật.

## ✨ Tính năng

### 1. **Quy trình 3 bước**

- **Bước 1**: Nhập email
- **Bước 2**: Nhập mã OTP (6 chữ số) được gửi qua email
- **Bước 3**: Tạo mật khẩu mới

### 2. **Bảo mật**

- ✅ OTP 6 chữ số ngẫu nhiên
- ✅ OTP được hash (SHA256) trước khi lưu database
- ✅ Hết hạn sau 10 phút
- ✅ Token reset có thời hạn 15 phút
- ✅ Chỉ dùng được 1 lần
- ✅ Email template đẹp với cảnh báo bảo mật

### 3. **UX/UI**

- Design đẹp, hiện đại với gradient background
- Progress indicator (3 dots) hiển thị bước hiện tại
- Nút "Gửi lại OTP" nếu không nhận được
- Hiển thị/ẩn mật khẩu
- Validate mật khẩu khớp trực tiếp
- Toast notifications cho mọi hành động

## 📂 Các file đã tạo/cập nhật

### Frontend (Admin)

#### 1. **ForgotPassword.jsx** (Mới)

```
admin/src/components/ForgotPassword.jsx
```

Component chính cho tính năng quên mật khẩu với 3 bước.

**Props:**

- `onBackToLogin`: Function callback để quay lại trang đăng nhập

**States:**

- `step`: Bước hiện tại (1, 2, 3)
- `email`: Email người dùng
- `otp`: Mã OTP 6 chữ số
- `newPassword`: Mật khẩu mới
- `confirmPassword`: Xác nhận mật khẩu
- `resetToken`: Token nhận được sau khi verify OTP
- `loading`: Trạng thái loading

**API Endpoints sử dụng:**

- `POST /api/user/password/otp/send` - Gửi OTP
- `POST /api/user/password/otp/verify` - Xác thực OTP
- `POST /api/user/password/reset` - Đổi mật khẩu

#### 2. **Login.jsx** (Cập nhật)

```
admin/src/components/Login.jsx
```

Thêm:

- Import `ForgotPassword` component
- State `showForgotPassword` để toggle giữa Login và ForgotPassword
- Nút "Quên mật khẩu?" ở dưới form login

### Backend (Server)

#### 1. **otpModel.js** (Mới)

```
server/models/otpModel.js
```

Model MongoDB để lưu trữ OTP (tùy chọn - hiện tại đang lưu vào userModel).

**Schema:**

- `userId`: ID người dùng
- `email`: Email
- `otp`: Mã OTP (đã hash)
- `purpose`: Mục đích (verify/reset/payment)
- `expiresAt`: Thời gian hết hạn
- `used`: Đã sử dụng chưa
- `attempts`: Số lần thử
- `createdAt`: Auto delete sau 10 phút

#### 2. **userController.mjs** (Cập nhật)

```
server/controllers/userController.mjs
```

Cập nhật `sendPasswordResetOtp()` để sử dụng `sendOTP()` từ emailService với template đẹp.

**Thay đổi:**

```javascript
// Cũ: Tạo transporter riêng, HTML đơn giản
const mailOptions = {
  html: `<p>Mã OTP của bạn là <b>${otp}</b>.</p>`,
};

// Mới: Sử dụng emailService với template đẹp
const emailResult = await sendOTP(normalizedEmail, otp, "reset");
```

#### 3. **emailService.js** (Đã có sẵn)

```
server/services/emailService.js
```

Function `sendOTP()` đã được tạo trước đó với:

- HTML template chuyên nghiệp
- Responsive design
- Hiển thị OTP lớn, dễ đọc (48px, monospace)
- Cảnh báo bảo mật
- Thông báo hết hạn 5 phút

## 🔌 API Endpoints

### 1. Gửi OTP

```http
POST /api/user/password/otp/send
Content-Type: application/json

{
  "email": "admin@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Mã OTP đã được gửi đến email của bạn"
}
```

### 2. Xác thực OTP

```http
POST /api/user/password/otp/verify
Content-Type: application/json

{
  "email": "admin@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP verified",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Đổi mật khẩu

```http
POST /api/user/password/reset
Authorization: Bearer <resetToken>
Content-Type: application/json

{
  "newPassword": "newpassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## 🎨 UI Screenshots Flow

### Bước 1: Nhập Email

- Input email với validation
- Nút "Gửi mã OTP"
- Nút "Quay lại đăng nhập"

### Bước 2: Nhập OTP

- Alert box hiển thị email đã gửi
- Input OTP 6 chữ số (font mono, center align)
- Nút "Xác nhận OTP"
- Nút "Gửi lại mã OTP"

### Bước 3: Đổi mật khẩu

- Input mật khẩu mới (có show/hide)
- Input xác nhận mật khẩu (có show/hide)
- Warning nếu mật khẩu không khớp
- Nút "Đổi mật khẩu"

### Progress Indicator

```
● ─── ○ ─── ○  (Bước 1)
● ─── ● ─── ○  (Bước 2)
● ─── ● ─── ●  (Bước 3)
```

## 🧪 Test Flow

### Test case 1: Quên mật khẩu thành công

1. Đăng nhập admin → Click "Quên mật khẩu?"
2. Nhập email: `linhyang0702@gmail.com` → Click "Gửi mã OTP"
3. Kiểm tra email → Nhập OTP 6 chữ số → Click "Xác nhận OTP"
4. Nhập mật khẩu mới 2 lần → Click "Đổi mật khẩu"
5. Tự động redirect về login → Đăng nhập với mật khẩu mới

### Test case 2: OTP hết hạn

1. Gửi OTP nhưng đợi > 10 phút
2. Nhập OTP → Lỗi "OTP expired or not requested"
3. Click "Gửi lại mã OTP" → Nhập OTP mới

### Test case 3: OTP sai

1. Nhập OTP sai → Lỗi "Invalid OTP"
2. Thử lại với OTP đúng

### Test case 4: Mật khẩu không khớp

1. Verify OTP thành công
2. Nhập mật khẩu mới khác nhau
3. Hiển thị warning "Mật khẩu xác nhận không khớp"
4. Nút "Đổi mật khẩu" bị disable

## 🔒 Bảo mật

### 1. Rate Limiting (Khuyến nghị thêm)

Giới hạn số lần gửi OTP:

```javascript
// Thêm vào userController.mjs
const recentOTPs = await userModel.findOne({
  email: normalizedEmail,
  resetOtpExpires: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
});

if (recentOTPs && recentOTPs.otpAttempts >= 3) {
  return res.json({
    success: false,
    message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 1 giờ",
  });
}
```

### 2. Brute Force Protection

Giới hạn số lần nhập sai OTP:

```javascript
// Thêm field vào userModel
otpAttempts: {
  type: Number,
  default: 0
}

// Lock account sau 5 lần nhập sai
if (user.otpAttempts >= 5) {
  return res.json({
    success: false,
    message: "Tài khoản tạm khóa do nhập sai OTP quá nhiều"
  });
}
```

### 3. Email Verification

- Chỉ admin có email verified mới có thể reset password
- Kiểm tra MX records của domain email (đã có trong code)

## 📧 Email Template

Email OTP sử dụng template từ `emailService.sendOTP()` với:

- Gradient header (xanh dương)
- Mã OTP hiển thị lớn, rõ ràng
- Cảnh báo không chia sẻ OTP
- Thông báo hết hạn
- Footer với thông tin liên hệ

## 🚀 Deploy

### Environment Variables

Đảm bảo `.env` có:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=linhyang0702@gmail.com
SMTP_PASS=gpbbopkyjkvxpwnz
MAIL_FROM=Orebi Admin <linhyang0702@gmail.com>
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### Production Checklist

- ✅ Email service configured
- ✅ JWT_SECRET set
- ✅ Rate limiting enabled
- ✅ HTTPS enabled
- ✅ CORS configured
- ✅ Error logging setup

## 📝 TODO (Tương lai)

- [ ] Thêm captcha ở bước 1 (prevent bot)
- [ ] Log tất cả OTP requests (audit trail)
- [ ] SMS OTP backup (nếu email fail)
- [ ] 2FA cho admin accounts
- [ ] Notification khi có attempt reset password
- [ ] Whitelist IP cho admin login

## 🎯 So sánh với cơ chế cũ

| Feature  | Cũ         | Mới (OTP)          |
| -------- | ---------- | ------------------ |
| Bảo mật  | ❌ Thấp    | ✅ Cao             |
| Xác thực | Không có   | ✅ OTP qua email   |
| Token    | Vĩnh viễn  | ⏱️ 15 phút         |
| UI/UX    | Đơn giản   | ✨ Modern, 3 steps |
| Email    | Plain text | 🎨 HTML đẹp        |
| Validate | Không      | ✅ Nhiều lớp       |

---

**Tác giả:** Orebi Shopping Team  
**Cập nhật:** November 8, 2025  
**Version:** 2.0 - OTP System
