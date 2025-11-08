# Hướng dẫn Phương thức Thanh toán Mới

## Tổng quan

Hệ thống thanh toán đã được cập nhật để phù hợp với thị trường Việt Nam, loại bỏ các phương thức thanh toán quốc tế (Stripe, PayPal) và thay thế bằng các phương thức thanh toán phổ biến tại Việt Nam.

## Các Phương thức Thanh toán

### 1. COD (Thanh toán khi nhận hàng) ✅

- **Mô tả**: Khách hàng thanh toán bằng tiền mặt khi nhận được hàng
- **Quy trình**:
  1. Khách hàng chọn phương thức COD
  2. Đơn hàng được tạo với trạng thái "Chờ thanh toán"
  3. Shipper giao hàng và thu tiền
  4. Admin cập nhật trạng thái "Đã thanh toán" sau khi nhận được tiền

### 2. Chuyển khoản Ngân hàng 🏦

- **Mô tả**: Khách hàng chuyển khoản trực tiếp vào tài khoản ngân hàng
- **Thông tin ngân hàng** (được cấu hình trong backend):
  ```
  Ngân hàng: MB Bank
  Số tài khoản: 0368251814
  Chủ tài khoản: NGUYEN THI THUY LINH
  Chi nhánh: MB Bank
  ```
- **Quy trình**:
  1. Khách hàng chọn "Chuyển khoản ngân hàng"
  2. Hệ thống hiển thị thông tin tài khoản ngân hàng
  3. Khách hàng thực hiện chuyển khoản với nội dung: `DH{orderId}`
  4. Khách hàng nhập mã giao dịch (transaction code)
  5. Admin xác minh thanh toán trong panel quản trị
  6. Đơn hàng được cập nhật thành "Đã thanh toán"

### 3. Quét mã QR 📱

- **Mô tả**: Thanh toán bằng cách quét mã QR qua app ngân hàng
- **Công nghệ**: VietQR (chuẩn QR code thanh toán Việt Nam)
- **Quy trình**:
  1. Khách hàng chọn "Quét mã QR"
  2. Hệ thống tạo mã QR với thông tin:
     - Số tài khoản ngân hàng
     - Số tiền
     - Nội dung chuyển khoản
  3. Khách hàng quét mã QR bằng app ngân hàng
  4. Xác nhận thanh toán trong app
  5. Hệ thống tự động kiểm tra và cập nhật trạng thái (polling mỗi 10 giây)

## API Endpoints

### Backend Routes (`server/routes/paymentRoute.js`)

#### 1. Lấy thông tin ngân hàng

```
GET /api/payment/bank-info/:orderId
```

**Response**:

```json
{
  "bankName": "MB Bank",
  "accountNumber": "0368251814",
  "accountName": "NGUYEN THI THUY LINH",
  "branch": "MB Bank",
  "transferContent": "DH123456",
  "amount": 500000
}
```

#### 2. Tạo mã QR thanh toán

```
GET /api/payment/qr-code/:orderId
```

**Response**:

```json
{
  "qrCodeUrl": "https://img.vietqr.io/image/...",
  "bankName": "MB Bank",
  "accountNumber": "0368251814",
  "accountName": "NGUYEN THI THUY LINH",
  "transferContent": "DH123456",
  "amount": 500000
}
```

#### 3. Xác nhận đã chuyển khoản (Customer)

```
POST /api/payment/confirm-transfer
```

**Request Body**:

```json
{
  "orderId": "60d5ec49f1b2c72b8c8e4a1b",
  "transactionCode": "FT12345678"
}
```

#### 4. Xác minh thanh toán (Admin Only)

```
POST /api/payment/verify-transfer
```

**Request Body**:

```json
{
  "orderId": "60d5ec49f1b2c72b8c8e4a1b",
  "verified": true
}
```

## Components

### Frontend Components (`client/src/components/`)

#### 1. `PaymentMethodSelector.jsx`

Component để chọn phương thức thanh toán

**Props**:

- `selectedMethod`: string - Phương thức đã chọn
- `onSelectMethod`: function - Callback khi chọn phương thức

**Usage**:

```jsx
<PaymentMethodSelector
  selectedMethod={paymentMethod}
  onSelectMethod={handlePayment}
/>
```

#### 2. `BankTransferInfo.jsx`

Component hiển thị thông tin chuyển khoản và form nhập mã giao dịch

**Props**:

- `orderId`: string - ID đơn hàng
- `totalAmount`: number - Tổng tiền cần thanh toán

**Features**:

- Hiển thị thông tin ngân hàng
- Nút sao chép (copy) cho mỗi thông tin
- Form nhập mã giao dịch
- Xác nhận đã chuyển khoản

**Usage**:

```jsx
<BankTransferInfo orderId={orderId} totalAmount={order.amount} />
```

#### 3. `QRCodePayment.jsx`

Component hiển thị mã QR thanh toán

**Props**:

- `orderId`: string - ID đơn hàng
- `totalAmount`: number - Tổng tiền cần thanh toán

**Features**:

- Tạo và hiển thị mã QR
- Tự động polling kiểm tra trạng thái thanh toán (mỗi 10 giây)
- Hiển thị thông báo khi thanh toán thành công
- Hướng dẫn sử dụng

**Usage**:

```jsx
<QRCodePayment orderId={orderId} totalAmount={order.amount} />
```

## Database Schema

### Order Model Updates (`server/models/orderModel.js`)

```javascript
{
  // Payment method enum updated
  paymentMethod: {
    type: String,
    enum: ["cod", "bank_transfer", "qr_code"],
    default: "cod"
  },

  // New field for bank transfer tracking
  bankTransferInfo: {
    transactionCode: String,      // Mã giao dịch khách nhập
    submittedAt: Date,            // Thời gian khách gửi
    verified: Boolean,             // Admin đã xác minh chưa
    verifiedAt: Date,             // Thời gian admin xác minh
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    rejectedAt: Date,             // Nếu admin từ chối
    rejectionReason: String       // Lý do từ chối
  },

  // Removed old fields
  // stripeSessionId: REMOVED
  // paypalOrderId: REMOVED
}
```

## Admin Panel

### Xác minh Thanh toán Chuyển khoản

Admin cần thêm interface để:

1. **Xem danh sách đơn hàng chờ xác minh**

   - Filter: `paymentMethod = "bank_transfer" AND paymentStatus = "pending"`
   - Hiển thị mã giao dịch khách hàng đã nhập

2. **Xác minh/Từ chối thanh toán**
   - Button "Xác nhận" → Gọi API verify với `verified: true`
   - Button "Từ chối" → Gọi API verify với `verified: false` + lý do

**Suggested UI Component** (cần implement):

```jsx
// admin/src/pages/PendingPayments.jsx
<PaymentVerificationList
  orders={pendingOrders}
  onVerify={handleVerify}
  onReject={handleReject}
/>
```

## Migration Notes

### Đã xóa

1. **Dependencies cũ**:

   - `stripe` (server)
   - `@stripe/stripe-js` (client)
   - `@stripe/react-stripe-js` (client)
   - `@paypal/checkout-server-sdk` (server)

2. **Components cũ**:

   - `client/src/components/StripePayment.jsx`

3. **API Endpoints cũ**:

   - `POST /api/payment/stripe/create-session`
   - `POST /api/payment/stripe/webhook`
   - `POST /api/payment/stripe/confirm-payment`
   - `POST /api/payment/paypal/create-order`
   - `POST /api/payment/paypal/capture-order`

4. **Environment Variables cũ**:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`

### Đã thêm mới

1. **Components**:

   - `PaymentMethodSelector.jsx`
   - `BankTransferInfo.jsx`
   - `QRCodePayment.jsx`

2. **API Endpoints**:

   - `GET /api/payment/bank-info/:orderId`
   - `GET /api/payment/qr-code/:orderId`
   - `POST /api/payment/confirm-transfer`
   - `POST /api/payment/verify-transfer` (admin)

3. **Database Fields**:
   - `order.bankTransferInfo` (object)

## Testing

### Test Cases

#### 1. COD Flow

```
1. Tạo đơn hàng với COD
2. Kiểm tra status = "pending"
3. Admin cập nhật status = "paid" khi nhận tiền từ shipper
```

#### 2. Bank Transfer Flow

```
1. Tạo đơn hàng với bank_transfer
2. GET /api/payment/bank-info/:orderId → Verify thông tin ngân hàng
3. POST /api/payment/confirm-transfer với transactionCode
4. Admin POST /api/payment/verify-transfer với verified: true
5. Kiểm tra order.paymentStatus = "paid"
```

#### 3. QR Code Flow

```
1. Tạo đơn hàng với qr_code
2. GET /api/payment/qr-code/:orderId → Verify URL mã QR hợp lệ
3. Simulate thanh toán (trong production sẽ tự động)
4. Polling GET /api/orders/:orderId → Kiểm tra status update
```

## Troubleshooting

### Issue 1: Mã QR không hiển thị

**Nguyên nhân**: VietQR API có thể bị lỗi hoặc thông tin ngân hàng sai
**Giải pháp**:

- Kiểm tra bank info trong `paymentController.js`
- Test VietQR URL manually: `https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NUMBER}-{TEMPLATE}.jpg`

### Issue 2: Auto-verify không hoạt động cho QR code

**Nguyên nhân**: Cần tích hợp webhook từ ngân hàng (chưa implement)
**Giải pháp hiện tại**: Admin verify thủ công
**Giải pháp tương lai**: Tích hợp Banking API có webhook

### Issue 3: Khách hàng nhập sai mã giao dịch

**Giải pháp**:

- Admin có thể reject và yêu cầu khách gửi lại
- Thêm field "notes" để admin ghi chú

## Security Considerations

1. **Bank Info**: Thông tin ngân hàng nên được lưu trong environment variables, không hardcode
2. **Transaction Verification**: Cần xác minh giao dịch thực sự từ ngân hàng (hiện tại chỉ dựa vào mã do khách nhập)
3. **Admin Auth**: Endpoint `/api/payment/verify-transfer` chỉ admin được truy cập
4. **Rate Limiting**: Thêm rate limit cho API tạo QR code

## Future Enhancements

1. **Banking API Integration**

   - Tích hợp API ngân hàng để tự động verify giao dịch
   - Webhook từ ngân hàng khi có giao dịch mới

2. **Payment Gateway Integration**

   - VNPay
   - MoMo
   - ZaloPay

3. **OCR for Transaction Receipt**

   - Cho phép khách upload ảnh chụp màn hình giao dịch
   - Tự động extract mã giao dịch bằng OCR

4. **Notification System**
   - Email/SMS khi nhận được thanh toán
   - Thông báo cho admin khi có giao dịch mới cần verify

## Support

Nếu có vấn đề, vui lòng liên hệ:

- Email: support@decorashopping.com
- Documentation: Xem README.md trong root folder
