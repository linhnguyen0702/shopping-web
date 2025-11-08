# Quick Start - Admin Forgot Password

## 🎯 Sử dụng

### Từ trang đăng nhập Admin:

1. Click **"Quên mật khẩu?"**
2. Nhập email → Nhận OTP qua email
3. Nhập mã OTP 6 chữ số
4. Tạo mật khẩu mới → Hoàn tất!

## 📁 Files mới

- `admin/src/components/ForgotPassword.jsx` - Component quên mật khẩu
- `server/models/otpModel.js` - Model OTP (optional)
- `ADMIN_FORGOT_PASSWORD.md` - Tài liệu chi tiết

## 🔧 Files cập nhật

- `admin/src/components/Login.jsx` - Thêm nút "Quên mật khẩu"
- `server/controllers/userController.mjs` - Dùng emailService.sendOTP()

## ✅ Test ngay

```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start admin
cd admin
npm run dev
```

Truy cập: http://localhost:5174

## 🔐 Security Features

- ✅ OTP 6 chữ số qua email
- ✅ Hash SHA256 trong database
- ✅ Hết hạn sau 10 phút
- ✅ Token reset 15 phút
- ✅ Email template chuyên nghiệp

## 📧 Email đã cấu hình

```
SMTP_USER=linhyang0702@gmail.com
SMTP_PASS=gpbbopkyjkvxpwnz
```

Email OTP sẽ tự động được gửi với template đẹp!
