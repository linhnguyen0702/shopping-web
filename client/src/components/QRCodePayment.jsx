import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaQrcode, FaCheckCircle, FaSpinner } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

const QRCodePayment = ({ orderId, totalAmount }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("pending");

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const response = await axios.get(`/api/payment/qr-code/${orderId}`);
        setQrData(response.data);
      } catch (error) {
        toast.error("Không thể tải mã QR");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [orderId]);

  // Polling để kiểm tra trạng thái thanh toán
  useEffect(() => {
    if (!orderId || paymentStatus === "completed") return;

    const checkPaymentStatus = async () => {
      try {
        const response = await axios.get(`/api/orders/${orderId}`);
        if (response.data.order.paymentStatus === "completed") {
          setPaymentStatus("completed");
          toast.success("Thanh toán thành công!");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };

    const interval = setInterval(checkPaymentStatus, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [orderId, paymentStatus]);

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

  if (paymentStatus === "completed") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <FaCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-green-900 mb-2">
          Thanh toán thành công!
        </h3>
        <p className="text-green-700">
          Đơn hàng của bạn đã được xác nhận và đang được xử lý
        </p>
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

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800 flex items-start gap-2">
          <span className="text-xl">⚠️</span>
          <span>
            <strong>Lưu ý:</strong> Đơn hàng sẽ tự động được xác nhận sau khi
            thanh toán thành công. Vui lòng không tắt trang này cho đến khi nhận
            được xác nhận.
          </span>
        </p>
      </div>

      {/* Auto-check indicator */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Đang tự động kiểm tra thanh toán...</span>
        </div>
      </div>
    </div>
  );
};

QRCodePayment.propTypes = {
  orderId: PropTypes.string.isRequired,
  totalAmount: PropTypes.number.isRequired,
};

export default QRCodePayment;
