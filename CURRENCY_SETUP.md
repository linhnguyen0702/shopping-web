# Thiết lập đơn vị tiền tệ VND (Việt Nam Đồng)

## Tổng quan
Dự án đã được cấu hình để sử dụng **VND (Việt Nam Đồng)** làm đơn vị tiền tệ mặc định thay vì USD.

## Những thay đổi đã thực hiện

### 1. **Component PriceFormat**
- **Admin**: `admin/src/components/PriceFormat.jsx`
- **Client**: `client/src/components/PriceFormat.jsx`

### 2. **Hàm formatCurrency trong Home.jsx**
- **File**: `admin/src/pages/Home.jsx`

### 3. **ServicesTag.jsx**
- **File**: `client/src/components/ServicesTag.jsx`

### 4. **Currency Helper Files**
- **Admin**: `admin/src/helpers/currencyHelper.js`
- **Client**: `client/src/helpers/currencyHelper.js**

### 5. **Analytics.jsx**
- **File**: `admin/src/pages/Analytics.jsx`

**Trước:**
```jsx
const formattedAmount = new Number(amount).toLocaleString("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
```

**Sau:**
```jsx
const formattedAmount = new Number(amount).toLocaleString("vi-VN", {
  style: "currency",
  currency: "VND",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
```

### 2. **Hàm formatCurrency trong Home.jsx**
- **File**: `admin/src/pages/Home.jsx`

**Trước:**
```jsx
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};
```

**Sau:**
```jsx
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
```

### 3. **ServicesTag.jsx**
- **File**: `client/src/components/ServicesTag.jsx`

**Trước:**
```jsx
subtitle: "Free shipping on all orders over $50"
```

**Sau:**
```jsx
subtitle: "Free shipping on all orders over 500.000đ"
```

### 4. **Currency Helper Files**
- **Admin**: `admin/src/helpers/currencyHelper.js`
- **Client**: `client/src/helpers/currencyHelper.js`

Cung cấp các hàm tiện ích để định dạng tiền tệ VND một cách nhất quán.

### 5. **Analytics.jsx**
- **File**: `admin/src/pages/Analytics.jsx`

**Trước:**
```jsx
value: "$45,230",
```

**Sau:**
```jsx
value: formatVND(analyticsData.totalRevenue),
```

**Thay đổi chính:**
- ✅ **Dữ liệu thực tế**: Lấy từ API `/api/order/list` và `/api/user/list`
- ✅ **Doanh thu thực**: Tính từ tổng `totalAmount` của đơn hàng
- ✅ **Định dạng VND**: Sử dụng `formatVND()` và `formatCompactVND()`
- ✅ **Tính toán động**: Doanh thu trung bình, tỷ lệ chuyển đổi
- ✅ **Cập nhật real-time**: Nút làm mới dữ liệu
- ✅ **Loading states**: Skeleton loading và error handling

Trang Analytics giờ đây hiển thị dữ liệu thực tế từ hệ thống theo định dạng VND thay vì dữ liệu mặc định.

## Cách sử dụng

### Sử dụng component PriceFormat
```jsx
import PriceFormat from "../components/PriceFormat";

// Mặc định sẽ hiển thị VND
<PriceFormat amount={1000000} />
// Kết quả: ₫1,000,000

// Nếu muốn sử dụng tiền tệ khác
<PriceFormat amount={1000000} currency="USD" />
// Kết quả: $1,000,000.00
```

### Sử dụng helper functions
```jsx
import { formatVND, formatCompactVND } from "../helpers/currencyHelper";

// Định dạng VND đầy đủ
formatVND(1000000)        // "₫1,000,000"
formatVND(1000000, false) // "1,000,000 VND"

// Định dạng VND rút gọn
formatCompactVND(1000000) // "1M VND"
formatCompactVND(500000)  // "500K VND"
```

## Định dạng VND

### Đặc điểm
- **Ký hiệu**: ₫ (Unicode: U+20AB)
- **Locale**: `vi-VN`
- **Không có phần thập phân** (minimumFractionDigits: 0)
- **Phân cách hàng nghìn**: dấu phẩy (,)
- **Ví dụ**: ₫1,000,000

### So sánh với USD
| Tiền tệ | Ví dụ | Định dạng |
|----------|-------|-----------|
| USD | $1,000.00 | Có phần thập phân |
| VND | ₫1,000,000 | Không có phần thập phân |

## Lợi ích

### 1. **Nhất quán**
- Tất cả giá tiền trong ứng dụng đều hiển thị theo định dạng VND
- Không còn lẫn lộn giữa USD và VND

### 2. **Phù hợp với thị trường Việt Nam**
- Người dùng Việt Nam quen thuộc với định dạng VND
- Không cần chuyển đổi từ USD

### 3. **Dễ bảo trì**
- Có helper functions để quản lý định dạng tiền tệ
- Dễ dàng thay đổi định dạng trong tương lai

## Lưu ý khi phát triển

### 1. **Luôn sử dụng PriceFormat component**
```jsx
// ✅ Đúng
<PriceFormat amount={product.price} />

// ❌ Sai - hiển thị trực tiếp
<span>{product.price} VND</span>
```

### 2. **Sử dụng helper functions cho logic**
```jsx
// ✅ Đúng
import { formatVND, isValidVND } from "../helpers/currencyHelper";

if (isValidVND(amount)) {
  const formatted = formatVND(amount);
  // xử lý...
}
```

### 3. **Kiểm tra tính hợp lệ**
```jsx
// ✅ Đúng
if (typeof amount === 'number' && !isNaN(amount)) {
  // xử lý...
}

// ❌ Sai
if (amount) {
  // có thể gây lỗi nếu amount = 0
}
```

## Tương lai

Nếu cần hỗ trợ nhiều loại tiền tệ trong tương lai:
1. Cập nhật component PriceFormat để hỗ trợ currency prop
2. Thêm các helper functions cho tiền tệ khác
3. Tạo context để quản lý tiền tệ toàn cục
4. Thêm chức năng chuyển đổi tiền tệ real-time

## Kết luận

Dự án đã được cấu hình hoàn toàn để sử dụng VND làm đơn vị tiền tệ mặc định. Tất cả các component và helper functions đều hỗ trợ định dạng VND một cách nhất quán và chuyên nghiệp.

### **Trạng thái hoàn thành:**

1. ✅ **PriceFormat** - Component hiển thị giá (Admin + Client)
2. ✅ **Home.jsx** - Dashboard chính với dữ liệu thực
3. ✅ **List.jsx** - Danh sách sản phẩm (đã dịch tiếng Việt)
4. ✅ **Inventory.jsx** - Quản lý tồn kho với dữ liệu thực
5. ✅ **Analytics.jsx** - Phân tích doanh thu với dữ liệu thực từ đơn hàng
6. ✅ **ServicesTag.jsx** - Dịch vụ (Client)
7. ✅ **Currency Helper Files** - Hỗ trợ định dạng VND

### **Đặc điểm nổi bật:**
- 🎯 **Dữ liệu thực tế**: Không còn dữ liệu mặc định
- 💰 **Định dạng VND**: Nhất quán toàn bộ hệ thống
- 🔄 **Real-time**: Cập nhật theo đơn hàng mới
- 📊 **Tính toán động**: Doanh thu, tỷ lệ chuyển đổi
- 🚀 **Performance**: Loading states và error handling
