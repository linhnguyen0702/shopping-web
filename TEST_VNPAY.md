# 🎯 TEST VNPAY - HƯỚNG DẪN NHANH

## ✅ ĐÃ HOÀN THÀNH

### Backend

- ✅ VNPay controller với 3 functions
- ✅ Routes: `/api/payment/vnpay/create`, `/api/payment/vnpay_return`, `/api/payment/vnpay/status/:orderId`
- ✅ Order model updated (thêm field `vnpayInfo`)
- ✅ Package `qs` đã được cài đặt
- ✅ `.env` đã được cấu hình đúng

### Frontend

- ✅ OrderPage: Thêm VNPay vào payment methods
- ✅ OrderPage: Logic xử lý VNPay payment
- ✅ PaymentResult: Trang mới hiển thị kết quả thanh toán
- ✅ Routes: `/payment-result` đã được thêm
- ✅ Redux: Auto remove cart items khi thanh toán thành công

## 🚀 BẮT ĐẦU TEST

### 1. Khởi động servers

**Terminal 1 - Backend:**

```bash
cd d:\orebishopping-yt\server
npm run dev
```

Đợi: `Server running on http://localhost:8000`

**Terminal 2 - Frontend:**

```bash
cd d:\orebishopping-yt\client
npm run dev
```

Mở: `http://localhost:5173`

### 2. Tạo đơn hàng VNPay

1. **Đăng nhập** vào tài khoản
2. **Thêm sản phẩm** vào giỏ hàng
3. Click **"Thanh toán"**
4. **Chọn địa chỉ** giao hàng (hoặc thêm mới)
5. Chọn **"VNPay - Thanh toán online"**
6. Click **"Đặt hàng"**

→ Bạn sẽ được redirect đến trang VNPay Sandbox

### 3. Thanh toán trên VNPay

**Thông tin thẻ test:**

```
Ngân hàng:        NCB
Số thẻ:          9704198526191432198
Tên chủ thẻ:     NGUYEN VAN A
Ngày phát hành:  07/15
Mật khẩu OTP:    123456
```

**Các bước:**

1. Chọn ngân hàng **NCB**
2. Nhập số thẻ
3. Nhập tên chủ thẻ
4. Nhập ngày phát hành
5. Click "Thanh toán"
6. Nhập OTP: **123456**
7. Xác nhận

### 4. Kiểm tra kết quả

**✅ Thanh toán thành công:**

- URL: `http://localhost:5173/payment-result?success=true&orderId=xxx&transactionNo=xxx`
- Trang hiển thị:
  - ✅ Icon màu xanh
  - ✅ "Thanh toán thành công!"
  - ✅ Mã đơn hàng
  - ✅ Mã giao dịch VNPay
  - ✅ Tổng tiền
  - ✅ Chi tiết đơn hàng
- Cart đã được xóa các items đã mua
- Order count tăng lên

**❌ Thanh toán thất bại (test bằng cách hủy):**

- URL: `http://localhost:5173/payment-result?success=false&orderId=xxx&code=24`
- Trang hiển thị:
  - ❌ Icon màu đỏ
  - ❌ "Thanh toán thất bại"
  - ❌ Mã lỗi: 24
  - ❌ Lý do: Khách hàng hủy giao dịch
- Cart vẫn giữ nguyên items

## 🔍 DEBUG

### Kiểm tra Backend Logs

```bash
# Trong terminal backend, bạn sẽ thấy:
✅ VNPay payment URL created for order: 67584d5e9f8c3a4b2c1d0e9f
VNPay return callback: {
  orderId: '67584d5e9f8c3a4b2c1d0e9f',
  responseCode: '00',
  transactionNo: '14547304',
  signatureValid: true
}
✅ VNPay payment successful for order: 67584d5e9f8c3a4b2c1d0e9f
```

### Kiểm tra Database

```javascript
// Order document sẽ có:
{
  _id: "67584d5e9f8c3a4b2c1d0e9f",
  paymentMethod: "vnpay",
  paymentStatus: "paid",
  status: "confirmed",
  vnpayInfo: {
    transactionNo: "14547304",
    bankCode: "NCB",
    paidAt: "2025-11-13T10:30:00.000Z",
    responseCode: "00"
  }
}
```

### Kiểm tra LocalStorage (Frontend)

```javascript
// Trước khi thanh toán:
localStorage.getItem("pendingVNPayOrder");
// → {"orderId":"xxx","cartItemIds":["id1","id2"]}

// Sau khi thanh toán thành công:
localStorage.getItem("pendingVNPayOrder");
// → null (đã được xóa)
```

## 📸 Screenshots Expected

### 1. Payment Method Selection

```
┌────────────────────────────────────────┐
│ Phương thức thanh toán                 │
├────────────────────────────────────────┤
│ ⚪ Thanh toán khi nhận hàng (COD)      │
│ 🔵 VNPay - Thanh toán online          │ ← Select this
│ ⚪ Chuyển khoản ngân hàng              │
│ ⚪ Quét mã QR                          │
└────────────────────────────────────────┘
```

### 2. VNPay Payment Page

```
┌────────────────────────────────────────┐
│         VNPAY SANDBOX                  │
├────────────────────────────────────────┤
│ Số tiền: 1.500.000 VND                │
│ Nội dung: Thanh toan don hang XXXXX   │
│                                        │
│ Chọn ngân hàng: [NCB ▼]               │
│ Số thẻ: [9704198526191432198]         │
│ Tên: [NGUYEN VAN A]                   │
│ Ngày: [07/15]                         │
│                                        │
│ [Thanh toán]                          │
└────────────────────────────────────────┘
```

### 3. Success Result

```
┌────────────────────────────────────────┐
│            ✅                          │
│     THANH TOÁN THÀNH CÔNG!            │
│  Đơn hàng của bạn đã được xác nhận    │
├────────────────────────────────────────┤
│ Mã đơn hàng: #ABC12345                │
│ Mã GD VNPay: 14547304                 │
│ Phương thức: 💳 VNPay                 │
│ Tổng tiền: 1.500.000₫                │
├────────────────────────────────────────┤
│ [📋 Xem chi tiết]  [🛍️ Tiếp tục]     │
└────────────────────────────────────────┘
```

## ⚠️ Các lỗi thường gặp

### 1. "Không thể tạo thanh toán VNPay"

**Nguyên nhân:** Server chưa chạy hoặc token hết hạn
**Fix:**

- Kiểm tra server đang chạy
- Đăng xuất và đăng nhập lại

### 2. "Invalid signature"

**Nguyên nhân:** `VNP_HASHSECRET` trong .env không đúng
**Fix:** Kiểm tra file `server/.env` có đúng giá trị

### 3. Không redirect về frontend

**Nguyên nhân:** `FRONTEND_URL` trong .env không đúng
**Fix:** Đảm bảo `FRONTEND_URL=http://localhost:5173`

### 4. Cart items không bị xóa

**Nguyên nhân:** localStorage bị mất hoặc Redux không cập nhật
**Fix:**

- Clear browser cache
- Đăng xuất và đăng nhập lại

## 🎯 Test Cases

### Test Case 1: Thanh toán thành công

- [x] Chọn VNPay
- [x] Redirect đến VNPay
- [x] Thanh toán thành công
- [x] Redirect về /payment-result?success=true
- [x] Hiển thị trang thành công
- [x] Cart items đã bị xóa
- [x] Order count tăng

### Test Case 2: Hủy thanh toán

- [x] Chọn VNPay
- [x] Redirect đến VNPay
- [x] Click "Hủy bỏ"
- [x] Redirect về /payment-result?success=false&code=24
- [x] Hiển thị trang lỗi
- [x] Cart items vẫn còn

### Test Case 3: Không đủ tiền (mô phỏng)

- Không test được vì test card luôn có tiền
- Nhưng UI đã hỗ trợ hiển thị lỗi code 51

## 📞 Support

Nếu gặp vấn đề:

1. Check server logs
2. Check browser console
3. Check network tab
4. Xem file `VNPAY_INTEGRATION.md` để biết chi tiết

---

**Ready to test! 🚀**

Chỉ cần start 2 servers và test thôi!
