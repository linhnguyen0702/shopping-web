import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  FaMoneyBillWave,
} from "react-icons/fa";
import toast from "react-hot-toast";

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        toast.error("Order ID không hợp lệ");
        navigate("/orders");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8000/api/order/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          setOrder(data.order);
        } else {
          toast.error("Không thể tải thông tin đơn hàng");
          navigate("/orders");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Có lỗi xảy ra khi tải đơn hàng");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Đơn hàng #${orderId}`,
          text: `Đơn hàng của tôi đã được đặt thành công!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết vào clipboard!");
    }
  };

  const getEstimatedDelivery = () => {
    const orderDate = new Date(order.date);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(orderDate.getDate() + 3); // Estimate 3 days for delivery
    return deliveryDate.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Không tìm thấy thông tin đơn hàng
          </p>
          <Link
            to="/orders"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Xem tất cả đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Success Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <FaCheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Đặt hàng thành công!
            </h1>
            <p className="text-gray-600 text-lg">
              Cảm ơn bạn đã tin tưởng và đặt hàng tại Orebi Shopping
            </p>
          </div>

          {/* Order Summary Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    Đơn hàng #{orderId}
                  </h2>
                  <p className="text-green-100">
                    Đặt hàng vào {new Date(order.date).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <div className="text-2xl font-bold">
                    <PriceFormat amount={order.amount} />
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <FaMoneyBillWave className="w-4 h-4 mr-2" />
                    <span className="text-sm">Thanh toán khi nhận hàng</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Order Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaCheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Đơn hàng đã được xác nhận
                  </h3>
                  <p className="text-sm text-gray-600">
                    Đơn hàng của bạn đã được ghi nhận
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaTruck className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Đang chuẩn bị hàng
                  </h3>
                  <p className="text-sm text-gray-600">
                    Chúng tôi đang đóng gói sản phẩm
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaCalendarAlt className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Dự kiến giao hàng
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getEstimatedDelivery()}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sản phẩm đã đặt ({order.items.length}{" "}
                  {order.items.length > 1 ? "sản phẩm" : "sản phẩm"})
                </h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">
                            Số lượng: {item.quantity}
                          </span>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              <PriceFormat amount={item.price} />
                            </div>
                            <div className="text-sm text-gray-600">
                              Tổng:{" "}
                              <PriceFormat
                                amount={item.price * item.quantity}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Địa chỉ giao hàng
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-900">
                    <p className="font-medium">
                      {order.address.firstName} {order.address.lastName}
                    </p>
                    <p className="text-gray-600 mt-1">{order.address.email}</p>
                    {order.address.phone && (
                      <p className="text-gray-600">{order.address.phone}</p>
                    )}
                    <div className="text-gray-600 mt-2">
                      <p>{order.address.street}</p>
                      <p>
                        {order.address.city}, {order.address.state}{" "}
                        {order.address.zipcode}
                      </p>
                      <p>{order.address.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Link
              to="/orders"
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <FaListAlt className="w-4 h-4 mr-2" />
              Xem đơn hàng
            </Link>
            <Link
              to="/shop"
              className="flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <FaShoppingBag className="w-4 h-4 mr-2" />
              Mua thêm
            </Link>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <FaPrint className="w-4 h-4 mr-2" />
              In đơn hàng
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <FaShare className="w-4 h-4 mr-2" />
              Chia sẻ
            </button>
          </div>

          {/* Information Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="w-6 h-6 text-blue-600 mr-3 mt-0.5">
                <svg
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Thông tin quan trọng
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Đơn hàng sẽ được giao trong vòng 3-5 ngày làm việc</li>
                  <li>• Bạn sẽ thanh toán khi nhận hàng (COD) như đã chọn</li>
                  <li>• Chúng tôi sẽ gọi điện xác nhận trước khi giao hàng</li>
                  <li>
                    • Bạn có thể theo dõi trạng thái đơn hàng trong mục
                    &quot;Đơn hàng của tôi&quot;
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link
              to="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaHome className="w-4 h-4 mr-2" />
              Quay lại trang chủ
            </Link>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default OrderSuccess;
