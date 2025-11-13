import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaShoppingBag,
  FaHome,
  FaListAlt,
  FaSpinner,
  FaTruck,
  FaCalendarAlt,
  FaCreditCard,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { removeSelectedItems, setOrderCount } from "../redux/orebiSlice";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orderCount = useSelector((state) => state.orebiReducer.orderCount);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(true);

  const success = searchParams.get("success") === "true";
  const orderId = searchParams.get("orderId");
  const transactionNo = searchParams.get("transactionNo");
  const errorCode = searchParams.get("code");

  useEffect(() => {
    const processPaymentResult = async () => {
      // Lấy thông tin pending order từ localStorage
      const pendingOrder = localStorage.getItem("pendingVNPayOrder");

      if (!orderId && !success) {
        toast.error("Không tìm thấy thông tin giao dịch");
        setTimeout(() => navigate("/cart"), 2000);
        return;
      }

      try {
        const token = localStorage.getItem("token");

        if (success && orderId) {
          // Thanh toán thành công - Fetch order details
          const response = await fetch(
            `http://localhost:8000/api/order/detail/${orderId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();

          if (data.success) {
            setOrder(data.order);
            toast.success("Thanh toán thành công!");

            // Remove items from cart
            if (pendingOrder) {
              const { cartItemIds } = JSON.parse(pendingOrder);
              dispatch(removeSelectedItems(cartItemIds));
              dispatch(setOrderCount(orderCount + 1));
              localStorage.removeItem("pendingVNPayOrder");
            }
          } else {
            toast.error("Không thể tải thông tin đơn hàng");
          }
        } else {
          // Thanh toán thất bại - Không có order được tạo
          toast.error("Thanh toán thất bại!");
          
          // Clean up pending order info
          if (pendingOrder) {
            localStorage.removeItem("pendingVNPayOrder");
          }
        }
      } catch (error) {
        console.error("Lỗi khi xử lý kết quả thanh toán:", error);
        toast.error("Có lỗi xảy ra khi xử lý thanh toán");
      } finally {
        setLoading(false);
        setProcessingPayment(false);
      }
    };

    processPaymentResult();
  }, [orderId, success, navigate, dispatch, orderCount]);

  // Loading state
  if (loading || processingPayment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Container>
          <div className="text-center py-12">
            <FaSpinner className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Đang xử lý kết quả thanh toán...
            </h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </div>
        </Container>
      </div>
    );
  }

  // Error codes mapping
  const getErrorMessage = (code) => {
    const errorMessages = {
      "07": "Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)",
      "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking",
      10: "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
      11: "Đã hết hạn chờ thanh toán",
      12: "Thẻ/Tài khoản bị khóa",
      13: "Mật khẩu xác thực giao dịch (OTP) không đúng",
      24: "Khách hàng hủy giao dịch",
      51: "Tài khoản không đủ số dư",
      65: "Tài khoản đã vượt quá hạn mức giao dịch trong ngày",
      75: "Ngân hàng thanh toán đang bảo trì",
      79: "Nhập sai mật khẩu thanh toán quá số lần quy định",
    };

    return errorMessages[code] || "Giao dịch không thành công";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Success/Error Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            {success ? (
              // Success State
              <>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <FaCheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Thanh toán thành công!
                  </h1>
                  <p className="text-green-50 text-lg">
                    Đơn hàng của bạn đã được xác nhận
                  </p>
                </div>

                <div className="p-8">
                  {/* Transaction Info */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Thông tin giao dịch
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Mã đơn hàng</span>
                        <span className="font-semibold text-gray-900">
                          #{orderId?.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">
                          Mã giao dịch VNPay
                        </span>
                        <span className="font-semibold text-gray-900">
                          {transactionNo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Phương thức</span>
                        <span className="font-semibold text-gray-900 flex items-center">
                          <FaCreditCard className="mr-2 text-blue-600" />
                          VNPay
                        </span>
                      </div>
                      {order && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-gray-600">Tổng tiền</span>
                          <span className="font-bold text-green-600 text-xl">
                            <PriceFormat amount={order.amount} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  {order && (
                    <div className="bg-blue-50 rounded-xl p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Chi tiết đơn hàng
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-700">
                          <FaTruck className="w-5 h-5 mr-3 text-blue-600" />
                          <span>Trạng thái: </span>
                          <span className="ml-2 font-semibold text-green-600">
                            {order.status === "confirmed"
                              ? "Đã xác nhận"
                              : order.status}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <FaCalendarAlt className="w-5 h-5 mr-3 text-blue-600" />
                          <span>Ngày đặt: </span>
                          <span className="ml-2 font-medium">
                            {new Date(order.date).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to={`/checkout/${orderId}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      <FaListAlt />
                      Xem chi tiết đơn hàng
                    </Link>
                    <Link
                      to="/shop"
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                    >
                      <FaShoppingBag />
                      Tiếp tục mua sắm
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              // Error State
              <>
                <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <FaTimesCircle className="w-20 h-20 text-white mx-auto mb-4" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Thanh toán thất bại
                  </h1>
                  <p className="text-red-50 text-lg">
                    Rất tiếc, giao dịch của bạn không thành công
                  </p>
                </div>

                <div className="p-8">
                  {/* Error Info */}
                  <div className="bg-red-50 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Thông tin lỗi
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-red-200">
                        <span className="text-gray-600">Mã đơn hàng</span>
                        <span className="font-semibold text-gray-900">
                          #{orderId?.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      {errorCode && (
                        <>
                          <div className="flex items-center justify-between py-2 border-b border-red-200">
                            <span className="text-gray-600">Mã lỗi</span>
                            <span className="font-semibold text-red-600">
                              {errorCode}
                            </span>
                          </div>
                          <div className="py-2">
                            <p className="text-red-700 font-medium">
                              {getErrorMessage(errorCode)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* What Next */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Bạn có thể làm gì?
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>Thử lại thanh toán với phương thức khác</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>Kiểm tra thông tin thẻ/tài khoản của bạn</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>Liên hệ ngân hàng nếu cần hỗ trợ</span>
                      </li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/cart"
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      <FaShoppingBag />
                      Quay lại giỏ hàng
                    </Link>
                    <Link
                      to="/"
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                    >
                      <FaHome />
                      Về trang chủ
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Support Info */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-600 mb-2">
              Cần hỗ trợ? Liên hệ với chúng tôi
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <a
                href="tel:1900xxxx"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Hotline: 1900 xxxx
              </a>
              <span className="text-gray-400">|</span>
              <a
                href="mailto:support@example.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Email: support@example.com
              </a>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default PaymentResult;
