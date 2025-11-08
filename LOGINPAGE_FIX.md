# Fix cho LoginPage.jsx - Modal Quên Mật Khẩu OTP

## ⚠️ LoginPage.jsx đang bị lỗi cấu trúc JSX

File `admin/src/pages/LoginPage.jsx` có modal quên mật khẩu bị lỗi cấu trúc.

## 🔧 Solution: Sử dụng Component ForgotPassword.jsx

Thay vì sửa modal phức tạp trong LoginPage.jsx, hãy import và sử dụng component `ForgotPassword.jsx` đã được tạo.

### Cách sử dụng:

1. **Mở file**: `admin/src/pages/LoginPage.jsx`

2. **Thêm import ở đầu file** (sau các import khác):

```javascript
import ForgotPassword from "../components/ForgotPassword";
```

3. **Thay thế toàn bộ modal** (từ dòng `{showForgotModal && (` đến `)}` của modal):

**XÓA phần này:**

```jsx
{
  showForgotModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        {/* ... toàn bộ nội dung modal cũ ... */}
      </div>
    </div>
  );
}
```

**THAY BẰNG:**

```jsx
{
  showForgotModal && (
    <div className="fixed inset-0 z-50">
      <ForgotPassword onBackToLogin={() => setShowForgotModal(false)} />
    </div>
  );
}
```

### Hoặc đơn giản hơn:

Chỉ cần thay đổi nút "Quên mật khẩu?" để mở URL riêng thay vì modal:

```jsx
<Link
  to="/forgot-password"
  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
>
  Quên mật khẩu?
</Link>
```

Và tạo route mới trong App.jsx (nếu chưa có).

## 🎯 Lợi ích:

- ✅ Không cần sửa LoginPage.jsx phức tạp
- ✅ Sử dụng component ForgotPassword hoàn chỉnh đã tạo
- ✅ Code clean hơn, dễ maintain
- ✅ Full OTP flow 3 bước đã test

## 📝 Alternative: Nếu muốn giữ nguyên modal

Bạn cần sửa lại toàn bộ phần Step 3 trong modal để có cấu trúc JSX đúng:

1. Wrap input password đầu tiên trong `<div className="relative">`
2. Đảm bảo đóng tất cả các `<div>` đúng cách
3. Thêm progress indicator
4. Thêm validation UI

Hoặc đơn giản: **Xóa toàn bộ modal cũ và dùng ForgotPassword component**!

---

**Khuyến nghị:** Sử dụng component `ForgotPassword.jsx` đã tạo - đã test và hoạt động tốt!
