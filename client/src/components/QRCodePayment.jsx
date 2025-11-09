import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaQrcode, FaCheckCircle, FaSpinner } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { BANK_INFO, generateQRCodeUrl } from "../constants/paymentConfig";
import { serverUrl } from "../../config";

const QRCodePayment = ({ orderId, totalAmount, onPaymentComplete }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/payment/qr-code/${orderId}`
        );
        console.log("QR API Response:", response.data);

        if (response.data.success) {
          // Backend trả về { success, qrCode, bankInfo }
          setQrData({
            qrCodeUrl: response.data.qrCode,
            bankName: response.data.bankInfo.bankName,
            accountNumber: response.data.bankInfo.accountNumber,
            accountName: response.data.bankInfo.accountName,
            transferContent: response.data.bankInfo.transferContent,
            amount: response.data.bankInfo.amount,
          });
        } else {
          console.error("QR API Error:", response.data);
          // Nếu API lỗi, dùng QR code cố định
          const transferContent = `OREBI ${orderId.slice(-8).toUpperCase()}`;
          setQrData({
            qrCodeUrl: generateQRCodeUrl(totalAmount, transferContent),
            bankName: BANK_INFO.bankName,
            accountNumber: BANK_INFO.accountNumber,
            accountName: BANK_INFO.accountName,
            transferContent: transferContent,
            amount: totalAmount,
          });
        }
      } catch (error) {
        console.error("QR API Exception:", error);
        // Nếu exception, dùng QR code cố định
        const transferContent = `OREBI ${orderId.slice(-8).toUpperCase()}`;
        setQrData({
          qrCodeUrl: generateQRCodeUrl(totalAmount, transferContent),
          bankName: BANK_INFO.bankName,
          accountNumber: BANK_INFO.accountNumber,
          accountName: BANK_INFO.accountName,
          transferContent: transferContent,
          amount: totalAmount,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [orderId, totalAmount]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <FaSpinner className="animate-spin w-8 h-8 text-blue-600 mb-3" />
        <p className="text-gray-600">Đang tạo mã QR...</p>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="text-center py-8 text-red-600">
        Không thể tạo mã QR thanh toán
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
          <FaQrcode className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Quét mã QR để thanh toán
        </h3>
        <p className="text-gray-600">
          Sử dụng ứng dụng ngân hàng để quét mã QR
        </p>
      </div>

      {/* QR Code Image */}
      <div className="bg-white border-4 border-purple-100 rounded-2xl p-4 mb-6">
        <img
          src={qrData.qrCodeUrl}
          alt="QR Code thanh toán"
          className="w-full h-auto"
        />
      </div>

      {/* Payment Info */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-purple-200">
            <span className="text-gray-700 font-medium">Ngân hàng:</span>
            <span className="font-semibold text-gray-900">
              {qrData.bankName}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-purple-200">
            <span className="text-gray-700 font-medium">Số tài khoản:</span>
            <span className="font-bold text-purple-600">
              {qrData.accountNumber}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-purple-200">
            <span className="text-gray-700 font-medium">Chủ tài khoản:</span>
            <span className="font-semibold text-gray-900">
              {qrData.accountName}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-purple-200">
            <span className="text-gray-700 font-medium">Số tiền:</span>
            <span className="font-bold text-xl text-red-600">
              {totalAmount?.toLocaleString("vi-VN")} đ
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Nội dung:</span>
            <span className="font-semibold text-gray-900 text-right">
              {qrData.transferContent}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm">
            i
          </span>
          Hướng dẫn thanh toán
        </h4>
        <ol className="text-sm text-blue-800 space-y-2 ml-8 list-decimal">
          <li>Mở ứng dụng ngân hàng trên điện thoại</li>
          <li>Chọn chức năng quét mã QR</li>
          <li>Quét mã QR phía trên</li>
          <li>Kiểm tra thông tin và xác nhận thanh toán</li>
        </ol>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800 flex items-start gap-2">
          <span className="text-xl">⚠️</span>
          <span>
            <strong>Lưu ý:</strong> Sau khi chuyển khoản thành công, vui lòng
            nhấn nút bên dưới để xem chi tiết đơn hàng.
          </span>
        </p>
      </div>

      {/* Confirmation Button */}
      <button
        onClick={async () => {
          try {
            // Send notification to admin
            const token = localStorage.getItem("token");
            console.log(
              "Calling API:",
              `${serverUrl}/api/payment/notify/${orderId}`
            );

            const response = await axios.post(
              `${serverUrl}/api/payment/notify/${orderId}`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            console.log("API Response:", response.data);

            if (response.data.success) {
              toast.success(
                "Đã xác nhận thanh toán! Đang chuyển đến trang chi tiết đơn hàng..."
              );
              console.log("✅ Payment confirmation notification sent");

              // Wait a moment for user to see the message
              setTimeout(() => {
                if (onPaymentComplete) {
                  onPaymentComplete();
                }
              }, 1500);
            } else {
              console.error("API returned error:", response.data);
              toast.error(
                response.data.message || "Có lỗi xảy ra. Vui lòng thử lại!"
              );
            }
          } catch (error) {
            console.error(
              "Error details:",
              error.response?.data || error.message
            );
            toast.error("Không thể xác nhận thanh toán. Vui lòng thử lại!");
          }
        }}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg"
      >
        <FaCheckCircle className="w-5 h-5" />
        Tôi đã chuyển khoản - Xem chi tiết đơn hàng
      </button>

      {/* Auto-check indicator */}
      <div className="text-center mt-4">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Hệ thống sẽ tự động kiểm tra thanh toán</span>
        </div>
      </div>
    </div>
  );
};

QRCodePayment.propTypes = {
  orderId: PropTypes.string.isRequired,
  totalAmount: PropTypes.number.isRequired,
  onPaymentComplete: PropTypes.func,
};

export default QRCodePayment;
