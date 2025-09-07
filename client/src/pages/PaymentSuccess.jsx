import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaShoppingBag,
  FaHome,
  FaListAlt,
  FaPrint,
  FaShare,
  FaTruck,
  FaCalendarAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get("order_id");
  const paymentIntentId = searchParams.get("payment_intent");

  useEffect(() => {
    const confirmPaymentAndFetchOrder = async () => {
      if (!orderId || !paymentIntentId) {
        toast.error("Xác nhận thanh toán không hợp lệ");
        navigate("/orders");
        return;
      }

      try {
        const token = localStorage.getItem("token");

        // xác nhận thanh toán với backend
        const confirmResponse = await fetch(
          "http://localhost:8000/api/payment/stripe/confirm-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              paymentIntentId,
              orderId,
            }),
          }
        );

        const confirmData = await confirmResponse.json();
        if (confirmData.success) {
          setOrder(confirmData.order);
          toast.success("Thanh toán đã được xác nhận thành công!");
        } else {
          toast.error(confirmData.message || "Xác nhận thanh toán thất bại");
          navigate("/orders");
        }
      } catch (error) {
        console.error("Lỗi xác nhận thanh toán:", error);
        toast.error("Không thể xác nhận thanh toán");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };

    confirmPaymentAndFetchOrder();
  }, [orderId, paymentIntentId, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Xác Nhận Đơn Hàng - ${order._id}`,
          text: `Đơn hàng của tôi cho $${order.amount} đã được xác nhận!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Chia sẻ thất bại:", error);
      }
    } else {
      // fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link đã được copy vào clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xác nhận thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Đơn Hàng Không Tìm Thấy
          </h2>
          <p className="text-gray-600 mb-4">
            Không thể xác nhận thanh toán của bạn. Vui lòng liên hệ hỗ trợ.
          </p>
          <Link
            to="/orders"
            className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Xem Đơn Hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <Container className="py-12">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FaCheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>
            <h1 className="text-4xl font-bold mb-4">Thanh Toán Thành Công!</h1>
            <p className="text-xl opacity-90 mb-2">Cảm ơn bạn đã mua hàng</p>
            <p className="text-lg opacity-80">
              Order #{order._id.slice(-8).toUpperCase()}
            </p>
          </motion.div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="max-w-4xl mx-auto">
          {/* Quick Actions */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Link
              to="/"
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group"
            >
              <div className="text-center">
                <FaHome className="w-6 h-6 text-gray-600 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
                <span className="text-sm font-medium text-gray-900">
                  Trang Chủ
                </span>
              </div>
            </Link>

            <Link
              to="/shop"
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group"
            >
              <div className="text-center">
                <FaShoppingBag className="w-6 h-6 text-gray-600 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
                <span className="text-sm font-medium text-gray-900">
                  Mua Thêm
                </span>
              </div>
            </Link>

            <Link
              to="/orders"
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group"
            >
              <div className="text-center">
                <FaListAlt className="w-6 h-6 text-gray-600 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
                <span className="text-sm font-medium text-gray-900">
                  Đơn Hàng Của Tôi
                </span>
              </div>
            </Link>

            <button
              onClick={handlePrint}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group"
            >
              <div className="text-center">
                <FaPrint className="w-6 h-6 text-gray-600 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
                <span className="text-sm font-medium text-gray-900">In</span>
              </div>
            </button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Confirmation */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Chi Tiết Thanh Toán
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FaCheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-sm font-medium text-green-800">
                          Trạng Thái Thanh Toán
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          Đã Thanh Toán
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FaTruck className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-blue-800">
                          Trạng Thái Đơn Hàng
                        </div>
                        <div className="text-lg font-bold text-blue-900">
                          Đã Xác Nhận
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaCalendarAlt className="w-4 h-4" />
                    <span>
                      Thanh Toán Vào {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Order Items */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Sản Phẩm Đơn Hàng
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-6 flex items-center space-x-4"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Số Lượng: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          <PriceFormat amount={item.price * item.quantity} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Next Steps */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="bg-blue-50 rounded-lg border border-blue-200 p-6"
              >
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  Còn Gì Tiếp Theo?
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">
                        Xác Nhận Đơn Hàng
                      </p>
                      <p className="text-sm text-blue-700">
                        Bạn sẽ nhận được email xác nhận đơn hàng ngay sau đó với
                        chi tiết đơn hàng của bạn.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">
                        Xử Lý Đơn Hàng
                      </p>
                      <p className="text-sm text-blue-700">
                        Chúng tôi sẽ bắt đầu xử lý đơn hàng của bạn trong vòng
                        24 giờ.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Vận Chuyển</p>
                      <p className="text-sm text-blue-700">
                        Theo dõi trạng thái đơn hàng trong phần &quot;Đơn Hàng
                        Của Tôi&quot;.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Tóm Tắt Đơn Hàng
                </h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Tổng Tiền ({order.items.length} sản phẩm)
                    </span>
                    <span className="font-medium">
                      <PriceFormat amount={order.amount} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vận Chuyển</span>
                    <span className="font-medium text-green-600">
                      Miễn phí vận chuyển (đơn từ 150.000đ)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thuế</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Tổng Tiền Thanh Toán</span>
                    <span className="text-green-600">
                      <PriceFormat amount={order.amount} />
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <FaShare className="w-4 h-4" />
                    Chia Sẻ Đơn Hàng
                  </button>

                  <Link
                    to="/shop"
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <FaShoppingBag className="w-4 h-4" />
                    Tiếp Tục Mua Hàng
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PaymentSuccess;
