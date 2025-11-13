# ✅ VNPay Testing Checklist

## 📋 Pre-Test Checklist

### Backend Setup

- [ ] `server/package.json` có package `qs`
- [ ] File `server/.env` có đầy đủ VNPay config
- [ ] `VNP_RETURNURL=http://localhost:8000/api/payment/vnpay_return`
- [ ] `FRONTEND_URL=http://localhost:5173`
- [ ] Backend server chạy trên port 8000
- [ ] Kết nối MongoDB thành công

### Frontend Setup

- [ ] Frontend chạy trên port 5173
- [ ] Có tài khoản user để đăng nhập
- [ ] Browser không block popup/redirect

---

## 🧪 Test Scenarios

### Scenario 1: Thanh toán thành công ✅

#### Bước 1: Chuẩn bị

- [ ] Đăng nhập vào tài khoản
- [ ] Có ít nhất 1 sản phẩm trong giỏ hàng

#### Bước 2: Tạo đơn hàng

- [ ] Click "Thanh toán" từ giỏ hàng
- [ ] Chọn hoặc thêm địa chỉ giao hàng
- [ ] Chọn shipping method (nếu có)
- [ ] Chọn "VNPay - Thanh toán online"
- [ ] Click "Đặt hàng"

#### Bước 3: Verify Backend

- [ ] Backend log hiển thị: `✅ VNPay payment URL created`
- [ ] Order được tạo trong database với `paymentMethod: "vnpay"`
- [ ] Order status = "pending"
- [ ] Payment status = "pending"

#### Bước 4: Redirect đến VNPay

- [ ] Browser redirect đến `sandbox.vnpayment.vn`
- [ ] Trang VNPay hiển thị thông tin đơn hàng
- [ ] Số tiền hiển thị đúng
- [ ] Nội dung thanh toán có mã đơn hàng

#### Bước 5: Thanh toán

- [ ] Chọn ngân hàng: **NCB**
- [ ] Nhập số thẻ: `9704198526191432198`
- [ ] Nhập tên: `NGUYEN VAN A`
- [ ] Nhập ngày: `07/15`
- [ ] Click "Thanh toán"
- [ ] Nhập OTP: `123456`
- [ ] Click "Xác nhận"

#### Bước 6: Verify Backend Callback

- [ ] Backend log: `VNPay return callback`
- [ ] Signature valid: `true`
- [ ] Response code: `00`
- [ ] Order cập nhật: `paymentStatus = "paid"`
- [ ] Order cập nhật: `status = "confirmed"`
- [ ] `vnpayInfo` được lưu với transaction number
- [ ] Notification được gửi cho admin
- [ ] Email được gửi cho customer (nếu có config email)

#### Bước 7: Frontend Result

- [ ] Redirect về `http://localhost:5173/payment-result?success=true&orderId=xxx&transactionNo=xxx`
- [ ] Trang hiển thị ✅ "Thanh toán thành công!"
- [ ] Hiển thị đúng mã đơn hàng
- [ ] Hiển thị đúng mã giao dịch VNPay
- [ ] Hiển thị đúng tổng tiền
- [ ] Button "Xem chi tiết đơn hàng" hoạt động
- [ ] Button "Tiếp tục mua sắm" hoạt động

#### Bước 8: Verify Cart & State

- [ ] Cart items đã bị xóa
- [ ] Order count tăng lên 1
- [ ] LocalStorage không còn `pendingVNPayOrder`
- [ ] Toast notification "Thanh toán thành công!" xuất hiện

#### Bước 9: Check Order Details

- [ ] Vào trang "Đơn hàng của tôi"
- [ ] Order vừa tạo hiển thị
- [ ] Payment method: VNPay
- [ ] Status: Confirmed
- [ ] Payment status: Paid

---

### Scenario 2: Hủy thanh toán ❌

#### Bước 1-4: Giống Scenario 1

- [ ] Tạo đơn hàng và redirect đến VNPay

#### Bước 5: Hủy thanh toán

- [ ] Ở trang VNPay, click "Hủy bỏ" hoặc "Quay lại"

#### Bước 6: Verify Backend Callback

- [ ] Backend log: `VNPay return callback`
- [ ] Response code: `24` (hoặc code khác)
- [ ] Order cập nhật: `paymentStatus = "failed"`
- [ ] `vnpayInfo` được lưu với fail info

#### Bước 7: Frontend Result

- [ ] Redirect về `http://localhost:5173/payment-result?success=false&orderId=xxx&code=24`
- [ ] Trang hiển thị ❌ "Thanh toán thất bại"
- [ ] Hiển thị mã lỗi: 24
- [ ] Hiển thị lý do: "Khách hàng hủy giao dịch"
- [ ] Button "Quay lại giỏ hàng" hoạt động
- [ ] Button "Về trang chủ" hoạt động

#### Bước 8: Verify Cart & State

- [ ] Cart items **VẪN CÒN** (không bị xóa)
- [ ] Order count **KHÔNG TĂNG**
- [ ] LocalStorage vẫn có `pendingVNPayOrder`
- [ ] Toast notification "Thanh toán thất bại!" xuất hiện

#### Bước 9: Check Order Details

- [ ] Order vẫn tồn tại trong database
- [ ] Payment status: Failed
- [ ] Có thể thử thanh toán lại (nếu implement)

---

### Scenario 3: Multiple Orders 🔄

#### Test 1: Tạo 3 đơn hàng liên tiếp

- [ ] Order 1: VNPay - Thành công
- [ ] Order 2: COD - Thành công
- [ ] Order 3: VNPay - Thất bại
- [ ] Verify order count = 2 (chỉ 2 đơn thành công)
- [ ] Verify cart chỉ xóa items của order 1 và 2

#### Test 2: Concurrent orders (optional)

- [ ] Mở 2 tabs
- [ ] Tạo đơn VNPay ở cả 2 tabs
- [ ] Thanh toán cả 2
- [ ] Verify cả 2 đều success
- [ ] Verify không có conflict

---

## 🐛 Error Testing

### Test Invalid Scenarios

#### Test 1: Không có token

- [ ] Xóa token khỏi localStorage
- [ ] Thử tạo order VNPay
- [ ] Expected: Redirect đến login page

#### Test 2: Order không tồn tại

- [ ] Tạo URL thủ công: `/payment-result?success=true&orderId=invalid123`
- [ ] Expected: Error toast + redirect

#### Test 3: Backend down

- [ ] Stop backend server
- [ ] Thử tạo order VNPay
- [ ] Expected: Error toast "Không thể kết nối đến VNPay"

#### Test 4: Invalid signature (manual test)

- [ ] Sửa `VNP_HASHSECRET` trong .env
- [ ] Restart backend
- [ ] Tạo order và thanh toán
- [ ] Expected: Backend log "Invalid signature"
- [ ] Frontend redirect với error

---

## 📊 Data Verification

### Database Check (MongoDB)

#### Order Document

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  items: [...],
  amount: 1500000,
  paymentMethod: "vnpay", // ✓
  paymentStatus: "paid",  // ✓
  status: "confirmed",    // ✓
  vnpayInfo: {           // ✓
    transactionNo: "14547304",
    bankCode: "NCB",
    paidAt: ISODate("2025-11-13T10:30:00Z"),
    responseCode: "00"
  },
  notificationSent: true // ✓
}
```

#### User Document

```javascript
{
  _id: ObjectId("..."),
  orders: [
    ObjectId("..."), // ✓ Order ID đã được thêm
    ...
  ]
}
```

### LocalStorage Check (Browser)

#### Before Payment

```javascript
localStorage.getItem("pendingVNPayOrder");
// → '{"orderId":"xxx","cartItemIds":["id1","id2"]}'
```

#### After Success

```javascript
localStorage.getItem("pendingVNPayOrder");
// → null
```

#### After Failure

```javascript
localStorage.getItem("pendingVNPayOrder");
// → '{"orderId":"xxx","cartItemIds":["id1","id2"]}' (vẫn còn)
```

---

## 🎨 UI/UX Check

### OrderPage

- [ ] VNPay option hiển thị đúng vị trí (thứ 2)
- [ ] Icon credit card màu xanh
- [ ] Description rõ ràng
- [ ] Selected state có border xanh

### PaymentResult - Success

- [ ] Header gradient màu xanh
- [ ] Check icon animation
- [ ] Transaction info đầy đủ
- [ ] Order details hiển thị
- [ ] Buttons responsive
- [ ] Mobile friendly

### PaymentResult - Error

- [ ] Header gradient màu đỏ
- [ ] X icon animation
- [ ] Error code hiển thị
- [ ] Error message tiếng Việt
- [ ] Suggestions hiển thị
- [ ] Buttons responsive

### Loading States

- [ ] "Đang chuyển đến trang thanh toán..." hiển thị
- [ ] "Đang xử lý kết quả thanh toán..." hiển thị
- [ ] Spinner animation smooth

### Toast Notifications

- [ ] "Đặt hàng thành công!" (COD)
- [ ] "Đang chuyển đến trang thanh toán VNPay..."
- [ ] "Thanh toán thành công!"
- [ ] "Thanh toán thất bại!"
- [ ] "Không thể tạo thanh toán VNPay"

---

## 🚀 Performance Check

- [ ] Order creation < 1s
- [ ] Payment URL generation < 1s
- [ ] VNPay redirect immediate
- [ ] Callback processing < 2s
- [ ] Frontend result rendering < 500ms
- [ ] No memory leaks
- [ ] No console errors

---

## 📱 Browser Compatibility

### Desktop

- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if available)

### Mobile

- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Test responsive design

---

## 🔐 Security Check

- [ ] `VNP_HASHSECRET` không exposed trong frontend
- [ ] Token required cho tất cả protected routes
- [ ] Order ownership verified
- [ ] Signature verification working
- [ ] No sensitive data trong URL
- [ ] CORS config đúng

---

## 📈 Final Verification

### Success Metrics

- [ ] Order creation success rate: 100%
- [ ] Payment success rate: 100% (với thẻ test)
- [ ] Callback success rate: 100%
- [ ] Cart sync success rate: 100%
- [ ] No errors in console
- [ ] No errors in server logs

### Completion

- [ ] Tất cả test cases pass
- [ ] Documentation đã đọc
- [ ] Ready for production (after config change)

---

## ✅ Sign Off

**Tested by:** ******\_\_\_\_******  
**Date:** ******\_\_\_\_******  
**Status:** ⬜ Pass | ⬜ Fail | ⬜ Need Fixes

**Notes:**

---

---

---

---

**Checklist complete! 🎉**
