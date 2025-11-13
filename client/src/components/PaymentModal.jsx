import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaTimes, FaCheckCircle } from "react-icons/fa";
import BankTransferInfo from "./BankTransferInfo";
import QRCodePayment from "./QRCodePayment";
import toast from "react-hot-toast";

const PaymentModal = ({
  isOpen,
  onClose,
  orderId,
  orderAmount,
  paymentMethod,
  onPaymentSuccess,
}) => {
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handlePaymentComplete = (newOrderId) => {
    // Don't show completion state, close modal immediately
    if (onPaymentSuccess) {
      // Use newOrderId if provided, otherwise fallback to orderId
      onPaymentSuccess(newOrderId || orderId);
    }
    // Close modal after callback
    setTimeout(() => {
      setPaymentCompleted(false); // Reset state for next time
      onClose();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={paymentCompleted ? null : onClose}
      ></div>

      {/* Modal Container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {paymentMethod === "bank_transfer" ? (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {paymentMethod === "bank_transfer"
                    ? "Chuyển khoản ngân hàng"
                    : "Thanh toán QR Code"}
                </h2>
                <p className="text-blue-100 text-sm">
                  Mã đơn hàng: #{orderId?.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>

            {!paymentCompleted && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {paymentCompleted ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
                  <FaCheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Thanh toán thành công!
                </h3>
                <p className="text-gray-600 mb-4">
                  Đang chuyển đến trang chi tiết đơn hàng...
                </p>
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            ) : (
              <>
                {paymentMethod === "bank_transfer" && (
                  <BankTransferInfo
                    orderId={orderId}
                    totalAmount={orderAmount}
                    onPaymentComplete={handlePaymentComplete}
                  />
                )}

                {paymentMethod === "qr_code" && (
                  <QRCodePayment
                    orderId={orderId}
                    totalAmount={orderAmount}
                    onPaymentComplete={handlePaymentComplete}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer - Instructions */}
          {!paymentCompleted && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    Lưu ý quan trọng:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Vui lòng hoàn thành thanh toán trong vòng 15 phút</li>
                    <li>
                      Đơn hàng sẽ tự động hủy nếu không thanh toán đúng hạn
                    </li>
                    <li>
                      Sau khi chuyển khoản, vui lòng xác nhận để chúng tôi xử lý
                      nhanh hơn
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

PaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  orderId: PropTypes.string,
  orderAmount: PropTypes.number,
  paymentMethod: PropTypes.oneOf(["bank_transfer", "qr_code"]),
  onPaymentSuccess: PropTypes.func.isRequired,
};

export default PaymentModal;
