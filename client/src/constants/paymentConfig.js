// Thông tin ngân hàng và QR code dự phòng
export const BANK_INFO = {
  bankName: "MB Bank",
  bankCode: "MB",
  accountNumber: "0368251814",
  accountName: "NGUYEN THI THUY LINH",
  branch: "MB Bank",
};

// Tạo URL QR code VietQR
export const generateQRCodeUrl = (amount, content) => {
  const encodedContent = encodeURIComponent(content);
  const encodedAccountName = encodeURIComponent(BANK_INFO.accountName);

  return `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.accountNumber}-compact2.jpg?amount=${amount}&addInfo=${encodedContent}&accountName=${encodedAccountName}`;
};

// QR code mặc định (static) cho trường hợp không có số tiền cụ thể
export const DEFAULT_QR_URL = generateQRCodeUrl(0, "OREBI PAYMENT");
