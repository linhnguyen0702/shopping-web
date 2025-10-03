import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import { addToCart } from "../redux/orebiSlice";
import toast from "react-hot-toast";
import {
  FaShoppingBag,
  FaCreditCard,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaTimes,
  FaShoppingCart,
} from "react-icons/fa";

const OrderDetail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orderId } = useParams();
  const userInfo = useSelector((state) => state.orebiReducer.userInfo);
  const cartProducts = useSelector((state) => state.orebiReducer.products);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    order: null,
  });

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) {
      setError("Không tìm thấy mã đơn hàng");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/order/user/${orderId}`,
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
        setError(data.message || "Không thể tải chi tiết đơn hàng");
        toast.error("Không thể tải chi tiết đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", error);
      setError("Không thể tải chi tiết đơn hàng");
      toast.error("Không thể tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!userInfo) {
      navigate("/signin");
      return;
    }
    fetchOrderDetail();
  }, [userInfo, navigate, fetchOrderDetail]);

  const handleAddOrderToCart = async (e) => {
    if (e) e.stopPropagation();
    if (!order) return;

    // Mở modal xác nhận
    setConfirmModal({
      isOpen: true,
      order: order,
    });
  };

  const confirmAddToCart = async () => {
    const order = confirmModal.order;

    try {
      let addedCount = 0;
      let updatedCount = 0;

      // Thêm từng sản phẩm vào giỏ hàng
      order.items.forEach((item) => {
        const existingCartItem = cartProducts.find(
          (cartItem) => cartItem._id === (item.productId || item._id)
        );

        const cartItem = {
          _id: item.productId || item._id, // Xử lý cả productId và _id
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          // Thêm các trường bổ sung cần thiết cho chức năng giỏ hàng
          description: item.description,
          category: item.category,
          brand: item.brand,
        };

        if (existingCartItem) {
          updatedCount++;
        } else {
          addedCount++;
        }

        dispatch(addToCart(cartItem));
      });

      // Tạo thông báo thành công mô tả hơn
      let message = "";
      if (addedCount > 0 && updatedCount > 0) {
        message = `${addedCount} sản phẩm mới${
          addedCount !== 1 ? "s" : ""
        } được thêm và ${updatedCount} sản phẩm hiện có${
          updatedCount !== 1 ? "s" : ""
        } được cập nhật trong giỏ hàng!`;
      } else if (addedCount > 0) {
        message = `${addedCount} sản phẩm${
          addedCount !== 1 ? "s" : ""
        } được thêm vào giỏ hàng!`;
      } else {
        message = `${updatedCount} sản phẩm${
          updatedCount !== 1 ? "s" : ""
        } được cập nhật trong giỏ hàng!`;
      }

      toast.success(message, {
        duration: 4000,
        icon: "🛒",
      });

      // Show additional toast with option to view cart
      setTimeout(() => {
        toast(
          (t) => (
            <div className="flex items-center gap-3">
              <span>Xem giỏ hàng của bạn?</span>
              <button
                onClick={() => {
                  navigate("/cart");
                  toast.dismiss(t.id);
                }}
                className="bg-gray-900 text-white px-3 py-1 rounded text-sm hover:bg-gray-800"
              >
                Xem Giỏ Hàng
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          ),
          {
            duration: 6000,
            icon: "👀",
          }
        );
      }, 1000);

      setConfirmModal({ isOpen: false, order: null });
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
      toast.error("Không thể thêm sản phẩm vào giỏ hàng");
      setConfirmModal({ isOpen: false, order: null });
    }
  };

  const cancelAddToCart = () => {
    setConfirmModal({ isOpen: false, order: null });
  };

  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "confirmed":
        return "Đã xác nhận";
      case "shipped":
        return "Đang giao";
      case "delivered":
        return "Đã giao";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const translatePaymentStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ thanh toán";
      case "paid":
        return "Đã thanh toán";
      case "failed":
        return "Thanh toán thất bại";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="w-4 h-4" />;
      case "confirmed":
        return <FaCheckCircle className="w-4 h-4" />;
      case "shipped":
        return <FaTruck className="w-4 h-4" />;
      case "delivered":
        return <FaBox className="w-4 h-4" />;
      case "cancelled":
        return <FaTimes className="w-4 h-4" />;
      default:
        return <FaClock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải đơn hàng của bạn...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FaTimes className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Lỗi Khi Tải Đơn Hàng
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchOrderDetail}
              className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Thử Lại
            </button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <Container className="py-8">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/orders")}
                className="text-gray-600 hover:text-gray-900 transition-colors"
                title="Quay lại danh sách đơn hàng"
              >
                <FaTimes className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaShoppingBag className="w-8 h-8" />
                Chi Tiết Đơn Hàng
              </h1>
            </div>
            <nav className="flex text-sm text-gray-500">
              <Link to="/" className="hover:text-gray-700 transition-colors">
                Trang Chủ
              </Link>
              <span className="mx-2">/</span>
              <Link
                to="/orders"
                className="hover:text-gray-700 transition-colors"
              >
                Đơn Hàng
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Chi Tiết</span>
            </nav>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {!order ? (
          <div className="text-center py-16">
            <FaShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Không Tìm Thấy Đơn Hàng
            </h2>
            <p className="text-gray-600 mb-8">
              Đơn hàng bạn tìm kiếm không tồn tại hoặc đã bị xóa.
            </p>
            <Link to="/orders">
              <button className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium">
                Quay Lại Danh Sách
              </button>
            </Link>
          </div>
        ) : (
          order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Order Header */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Đơn Hàng #{order._id.slice(-8).toUpperCase()}
                    </h2>
                    <p className="text-gray-600">
                      Đặt hàng vào {new Date(order.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      {translateStatus(order.status)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
                        order.paymentStatus
                      )}`}
                    >
                      {order.paymentMethod === "cod" ? (
                        <FaMoneyBillWave className="w-4 h-4" />
                      ) : (
                        <FaCreditCard className="w-4 h-4" />
                      )}
                      {translatePaymentStatus(order.paymentStatus)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Products */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FaShoppingBag className="text-purple-600" />
                        Sản Phẩm Đã Đặt ({order.items.length} sản phẩm)
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="p-6 flex items-center gap-4"
                        >
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FaBox className="text-gray-400 w-10 h-10" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 mb-2">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-500 mb-1">
                              Số lượng: {item.quantity}
                            </p>
                            <p className="text-sm font-medium text-green-600">
                              <PriceFormat amount={item.price} /> x{" "}
                              {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              <PriceFormat
                                amount={item.price * item.quantity}
                              />
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-6">
                  {/* Payment Summary */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaMoneyBillWave className="text-green-600" />
                      Tóm Tắt Đơn Hàng
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tổng tiền hàng:</span>
                        <span className="font-medium">
                          <PriceFormat amount={order.amount} />
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Phí vận chuyển:</span>
                        <span className="font-medium text-green-600">
                          Miễn phí
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold text-gray-900">
                            Tổng cộng:
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            <PriceFormat amount={order.amount} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaCreditCard className="text-blue-600" />
                      Phương Thức Thanh Toán
                    </h3>
                    <div className="flex items-center gap-3">
                      {order.paymentMethod === "cod" ? (
                        <>
                          <FaMoneyBillWave className="text-green-600 w-6 h-6" />
                          <span className="font-medium">
                            Thanh toán khi nhận hàng
                          </span>
                        </>
                      ) : (
                        <>
                          <FaCreditCard className="text-blue-600 w-6 h-6" />
                          <span className="font-medium">Thanh toán online</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleAddOrderToCart}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                    >
                      <FaShoppingCart className="w-5 h-5" />
                      Mua Lại
                    </button>
                    <Link
                      to="/orders"
                      className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center block"
                    >
                      Quay Lại Danh Sách
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        )}

        {/* Add to Cart Confirmation Modal */}
        <AnimatePresence>
          {confirmModal.isOpen && confirmModal.order && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={cancelAddToCart}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                    <FaShoppingCart className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Thêm Đơn Hàng Vào Giỏ Hàng
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Bạn có chắc chắn muốn chuyển tất cả sản phẩm từ đơn hàng{" "}
                    <span className="font-semibold">
                      #{confirmModal.order._id.slice(-8).toUpperCase()}
                    </span>{" "}
                    vào giỏ hàng của bạn? Điều này sẽ thêm{" "}
                    {confirmModal.order.items.length} sản phẩm vào giỏ hàng của
                    bạn.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={cancelAddToCart}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Hủy Bỏ
                    </button>
                    <button
                      onClick={confirmAddToCart}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaShoppingCart className="w-4 h-4" />
                      Thêm Vào Giỏ Hàng
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default OrderDetail;
