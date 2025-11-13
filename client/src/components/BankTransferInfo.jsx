import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaBuilding, FaCopy, FaCheckCircle, FaUpload } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { BANK_INFO } from "../constants/paymentConfig";
import { serverUrl } from "../../config";

const BankTransferInfo = ({ orderId, totalAmount, onPaymentComplete }) => {
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactionCode, setTransactionCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState({});

  useEffect(() => {
    const fetchBankInfo = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/payment/bank-info/${orderId}`
        );
        console.log("Bank Info API Response:", response.data);

        if (response.data.success) {
          // Backend trả về { success, bankInfo }
          setBankInfo(response.data.bankInfo);
        } else {
          console.error("Bank Info API Error:", response.data);
          // Nếu API lỗi, dùng thông tin cố định
          const transferContent = `OREBI ${orderId.slice(-8).toUpperCase()}`;
          setBankInfo({
            bankName: BANK_INFO.bankName,
            accountNumber: BANK_INFO.accountNumber,
            accountName: BANK_INFO.accountName,
            branch: BANK_INFO.branch,
            transferContent: transferContent,
            amount: totalAmount,
          });
          toast.error(response.data.message || "");
        }
      } catch (error) {
        console.error("Bank Info API Exception:", error);
        // Nếu exception, dùng thông tin cố định
        const transferContent = `OREBI ${orderId.slice(-8).toUpperCase()}`;
        setBankInfo({
          bankName: BANK_INFO.bankName,
          accountNumber: BANK_INFO.accountNumber,
          accountName: BANK_INFO.accountName,
          branch: BANK_INFO.branch,
          transferContent: transferContent,
          amount: totalAmount,
        });
        toast.error("");
      } finally {
        setLoading(false);
      }
    };

    fetchBankInfo();
  }, [orderId, totalAmount]);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [field]: true });
    toast.success("Đã sao chép!");
    setTimeout(() => {
      setCopied({ ...copied, [field]: false });
    }, 2000);
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();

    if (!transactionCode.trim()) {
      toast.error("Vui lòng nhập mã giao dịch");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      console.log(
        "🔍 Calling API:",
        `${serverUrl}/api/payment/confirm-manual-payment`
      );
      console.log("🔍 Transaction ID:", orderId);
      console.log("🔍 Payment Method: bank_transfer");
      console.log("🔍 Transaction Code:", transactionCode.trim());

      const response = await axios.post(
        `${serverUrl}/api/payment/confirm-manual-payment`,
        {
          transactionId: orderId, // Prop 'orderId' from modal actually holds the transactionId
          paymentMethod: "bank_transfer",
          transactionCode: transactionCode.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ API Response:", response.data);

      if (response.data.success) {
        toast.success(
          "Đã gửi thông tin chuyển khoản thành công! Đang chuyển đến trang chi tiết đơn hàng..."
        );
        setTransactionCode("");

        // Immediately redirect to order details
        if (onPaymentComplete) {
          // Pass the new orderId from the API response to the callback
          onPaymentComplete(response.data.orderId);
        }
      } else {
        toast.error(response.data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bankInfo) {
    return (
      <div className="text-center py-8 text-red-600">
        Không thể tải thông tin ngân hàng
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <FaBuilding className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Thông tin chuyển khoản
          </h3>
          <p className="text-sm text-gray-600">
            Vui lòng chuyển khoản theo thông tin bên dưới
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
        <div className="space-y-4">
          {/* Ngân hàng */}
          <div className="flex justify-between items-center py-3 border-b border-blue-200">
            <span className="text-gray-700 font-medium">Ngân hàng:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {bankInfo.bankName}
              </span>
              <button
                onClick={() => handleCopy(bankInfo.bankName, "bank")}
                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {copied.bank ? (
                  <FaCheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <FaCopy className="w-4 h-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Số tài khoản */}
          <div className="flex justify-between items-center py-3 border-b border-blue-200">
            <span className="text-gray-700 font-medium">Số tài khoản:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-blue-600">
                {bankInfo.accountNumber}
              </span>
              <button
                onClick={() => handleCopy(bankInfo.accountNumber, "account")}
                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {copied.account ? (
                  <FaCheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <FaCopy className="w-4 h-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Tên tài khoản */}
          <div className="flex justify-between items-center py-3 border-b border-blue-200">
            <span className="text-gray-700 font-medium">Chủ tài khoản:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {bankInfo.accountName}
              </span>
              <button
                onClick={() => handleCopy(bankInfo.accountName, "name")}
                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {copied.name ? (
                  <FaCheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <FaCopy className="w-4 h-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Số tiền */}
          <div className="flex justify-between items-center py-3 border-b border-blue-200">
            <span className="text-gray-700 font-medium">Số tiền:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-red-600">
                {totalAmount?.toLocaleString("vi-VN")} đ
              </span>
              <button
                onClick={() => handleCopy(totalAmount?.toString(), "amount")}
                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {copied.amount ? (
                  <FaCheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <FaCopy className="w-4 h-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Nội dung chuyển khoản */}
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-700 font-medium">Nội dung:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {bankInfo.transferContent}
              </span>
              <button
                onClick={() => handleCopy(bankInfo.transferContent, "content")}
                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {copied.content ? (
                  <FaCheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <FaCopy className="w-4 h-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form nhập mã giao dịch */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <FaUpload className="w-5 h-5 text-yellow-600 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Xác nhận đã chuyển khoản
            </h4>
            <p className="text-sm text-gray-600">
              Sau khi chuyển khoản thành công, vui lòng nhập mã giao dịch để
              chúng tôi xác nhận nhanh hơn
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitTransfer} className="space-y-3">
          <input
            type="text"
            value={transactionCode}
            onChange={(e) => setTransactionCode(e.target.value)}
            placeholder="Nhập mã giao dịch (VD: FT12345678)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang gửi..." : "Gửi mã giao dịch"}
          </button>
        </form>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong>Lưu ý:</strong> Sau khi nhập mã giao dịch, bạn sẽ được chuyển
          đến trang chi tiết đơn hàng. Đơn hàng sẽ được xử lý sau khi chúng tôi
          xác nhận thanh toán (5-15 phút).
        </p>
      </div>
    </div>
  );
};

BankTransferInfo.propTypes = {
  orderId: PropTypes.string.isRequired,
  totalAmount: PropTypes.number.isRequired,
  onPaymentComplete: PropTypes.func,
};

export default BankTransferInfo;
