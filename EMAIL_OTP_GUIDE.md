# Hướng dẫn Sử dụng Email Service & OTP

## 📧 Cấu hình Email (Đã hoàn thành)

File `.env` đã được cấu hình với thông tin Gmail:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=linhyang0702@gmail.com
SMTP_PASS=gpbbopkyjkvxpwnz  # App Password của Gmail
```

## 🔐 Các Chức năng Email Service

### 1. **Gửi OTP** (`sendOTP`)

#### Sử dụng:

```javascript
import { sendOTP } from "../services/emailService.js";

// Gửi OTP cho xác thực tài khoản
const result = await sendOTP(
  "user@example.com", // Email người nhận
  "123456", // Mã OTP (6 số)
  "verify" // Mục đích: verify | reset | payment
);

if (result.success) {
  console.log("OTP đã được gửi:", result.messageId);
}
```

#### Các loại mục đích (purpose):

- `verify`: Xác thực tài khoản
- `reset`: Đặt lại mật khẩu
- `payment`: Xác nhận thanh toán

#### Template Email OTP:

- Design đẹp với gradient header
- Mã OTP hiển thị rõ ràng (font size 48px)
- Cảnh báo hết hạn sau 5 phút
- Responsive cho mobile

---

### 2. **Gửi Email Xác nhận Thanh toán** (`sendPaymentConfirmationEmail`)

#### Sử dụng:

```javascript
import { sendPaymentConfirmationEmail } from "../services/emailService.js";

await sendPaymentConfirmationEmail("user@example.com", {
  orderId: "ABC12345",
  amount: 500000,
  bankInfo: {
    bankName: "MB Bank",
    accountNumber: "0368251814",
    accountName: "NGUYEN THI THUY LINH",
  },
  transactionCode: "FT12345678",
});
```

#### Đã tích hợp vào:

✅ **Payment Controller** - Hàm `confirmBankTransfer()`

- Tự động gửi email khi khách hàng xác nhận đã chuyển khoản
- Hiển thị mã đơn hàng, số tiền, mã giao dịch
- Thông báo trạng thái "đang chờ admin xác nhận"

---

### 3. **Gửi Thông báo Admin** (`sendNotificationEmail`)

Đã có sẵn trong hệ thống để gửi các thông báo từ admin panel.

---

## 🚀 Ví dụ Triển khai OTP

### Kịch bản 1: Xác thực Email khi Đăng ký

```javascript
// userController.js
import { sendOTP } from "../services/emailService.js";

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Tạo user mới (chưa verify)
    const user = await userModel.create({
      email,
      password: hashedPassword,
      name,
      isVerified: false,
    });

    // Tạo OTP (6 số ngẫu nhiên)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP vào database hoặc Redis với expiry 5 phút
    await otpModel.create({
      userId: user._id,
      otp: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 phút
      purpose: "verify",
    });

    // Gửi OTP qua email
    const emailResult = await sendOTP(email, otp, "verify");

    if (emailResult.success) {
      res.json({
        success: true,
        message:
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
        userId: user._id,
      });
    } else {
      res.json({
        success: false,
        message: "Không thể gửi email xác thực",
      });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
```

### Kịch bản 2: Xác nhận OTP

```javascript
export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Tìm OTP trong database
    const otpRecord = await otpModel.findOne({
      userId,
      otp,
      expiresAt: { $gt: new Date() }, // Chưa hết hạn
      used: false,
    });

    if (!otpRecord) {
      return res.json({
        success: false,
        message: "OTP không hợp lệ hoặc đã hết hạn",
      });
    }

    // Xác thực user
    await userModel.findByIdAndUpdate(userId, {
      isVerified: true,
    });

    // Đánh dấu OTP đã sử dụng
    otpRecord.used = true;
    await otpRecord.save();

    res.json({
      success: true,
      message: "Xác thực thành công!",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
```

---

## 📊 OTP Model (Cần tạo)

Tạo file `server/models/otpModel.js`:

```javascript
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["verify", "reset", "payment"],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Tự động xóa sau 10 phút
  },
});

export default mongoose.model("OTP", otpSchema);
```

---

## 🔒 Bảo mật OTP

### Best Practices:

1. **Giới hạn số lần gửi OTP:**

```javascript
// Chỉ cho phép gửi tối đa 3 OTP trong 1 giờ
const recentOTPs = await otpModel.countDocuments({
  userId,
  createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
});

if (recentOTPs >= 3) {
  return res.json({
    success: false,
    message: "Bạn đã gửi quá nhiều OTP. Vui lòng thử lại sau 1 giờ.",
  });
}
```

2. **Giới hạn số lần nhập sai:**

```javascript
// Khóa account sau 5 lần nhập sai
const failedAttempts = await otpModel.countDocuments({
  userId,
  used: false,
  attempts: { $gte: 5 },
});

if (failedAttempts > 0) {
  return res.json({
    success: false,
    message: "Tài khoản tạm khóa do nhập sai OTP quá nhiều lần.",
  });
}
```

3. **Hash OTP trong database:**

```javascript
import bcrypt from "bcrypt";

// Lưu OTP đã hash
const hashedOTP = await bcrypt.hash(otp, 10);
await otpModel.create({
  userId,
  otp: hashedOTP, // Lưu hash, không lưu plain text
  expiresAt: new Date(Date.now() + 5 * 60 * 1000),
});

// Verify OTP
const isValid = await bcrypt.compare(userInputOTP, savedHashedOTP);
```

---

## 🎨 Frontend Integration

### React Component để nhập OTP:

```jsx
import { useState } from "react";
import toast from "react-hot-toast";

const OTPVerification = ({ userId, onSuccess }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("OTP phải có 6 chữ số");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Xác thực thành công!");
        onSuccess();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Nhập mã OTP (6 chữ số)
        </label>
        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="w-full px-4 py-3 text-center text-2xl font-mono border rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? "Đang xác thực..." : "Xác nhận"}
      </button>
    </form>
  );
};
```

---

## ✅ Đã Triển khai

### 1. Email Service

- ✅ Cấu hình SMTP Gmail
- ✅ Function `sendOTP()` với 3 loại mục đích
- ✅ Function `sendPaymentConfirmationEmail()`
- ✅ Template email đẹp, responsive

### 2. Payment Integration

- ✅ Tự động gửi email khi khách xác nhận chuyển khoản
- ✅ Hiển thị thông tin đơn hàng, mã giao dịch
- ✅ Thông báo trạng thái chờ admin xác nhận

### 3. Environment Variables

- ✅ SMTP_USER, SMTP_PASS đã cấu hình
- ✅ App Password Gmail đã setup

---

## 📝 TODO (Tùy chọn)

- [ ] Tạo OTP Model (`otpModel.js`)
- [ ] Implement user registration với OTP verification
- [ ] Implement forgot password với OTP
- [ ] Thêm rate limiting cho OTP requests
- [ ] Thêm frontend component nhập OTP
- [ ] Implement resend OTP functionality
- [ ] Add analytics tracking cho email deliveries

---

## 🧪 Test Email Service

Sử dụng endpoint test có sẵn:

```bash
# Test gửi email thông báo
POST http://localhost:8000/api/notifications/test-email

# Test gửi OTP (cần implement endpoint)
POST http://localhost:8000/api/user/send-otp
Body: { "email": "test@example.com", "purpose": "verify" }
```

---

**Tác giả:** Orebi Shopping Team  
**Cập nhật:** November 8, 2025
