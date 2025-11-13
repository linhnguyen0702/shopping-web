import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import PaymentMethodSelector from "../components/PaymentMethodSelector";
import BankTransferInfo from "../components/BankTransferInfo";
import QRCodePayment from "../components/QRCodePayment";
import toast from "react-hot-toast";
import { serverUrl } from "../../config";
import {
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaArrowLeft,
} from "react-icons/fa";

const Checkout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStep, setPaymentStep] = useState("selection"); // 'selection', 'bank_transfer', 'qr_code', 'processing'

  const fetchOrderDetails = useCallback(
    async (retryCount = 0) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000; // 1 second

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${serverUrl}/api/order/user/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setOrder(data.order);

          // Set payment method từ order data
          const orderPaymentMethod = data.order.paymentMethod || "cod";
          setPaymentMethod(orderPaymentMethod);

          // Không tự động chuyển sang payment step nữa
          // User đã thanh toán qua modal, trang này chỉ hiển thị chi tiết đơn hàng
          setPaymentStep("selection");
        } else {
          // Retry if order not found and we haven't exceeded max retries
          if (retryCount < MAX_RETRIES) {
            console.log(
              `Order not found, retrying... (${retryCount + 1}/${MAX_RETRIES})`
            );
            setTimeout(() => {
              fetchOrderDetails(retryCount + 1);
            }, RETRY_DELAY);
          } else {
            toast.error("Không tìm thấy đơn hàng");
            navigate("/orders");
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải đơn hàng", error);

        // Retry on network errors too
        if (retryCount < MAX_RETRIES) {
          console.log(
            `Error fetching order, retrying... (${
              retryCount + 1
            }/${MAX_RETRIES})`
          );
          setTimeout(() => {
            fetchOrderDetails(retryCount + 1);
          }, RETRY_DELAY);
        } else {
          toast.error("Không thể tải chi tiết đơn hàng");
          navigate("/orders");
        }
      } finally {
        if (retryCount === 0) {
          setLoading(false);
        }
      }
    },
    [orderId, navigate]
  );

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  const handlePayment = async (selectedMethod) => {
    setPaymentMethod(selectedMethod);

    if (selectedMethod === "bank_transfer") {
      setPaymentStep("bank_transfer");
    } else if (selectedMethod === "qr_code") {
      setPaymentStep("qr_code");
    } else if (selectedMethod === "cod") {
      toast.success("Đơn hàng đã được xác nhận với thanh toán khi giao hàng");
      navigate(`/payment-success?order_id=${orderId}`);
    }
  };

  const handlePaymentCancel = () => {
    setPaymentStep("selection");
  };

  const handlePaymentComplete = (newOrderId) => {
    toast.success("Thanh toán hoàn tất!");
    const finalOrderId = newOrderId || orderId;
    // Navigate đến trang chi tiết đơn hàng
    setTimeout(() => {
      navigate(`/checkout/${finalOrderId}`);
    }, 500);
  };

  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "confirmed":
        return "Đã xác nhận";
      case "shipped":
        return "Đang giao hàng";
      case "delivered":
        return "Đã giao hàng";
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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy đơn hàng
          </h2>
          <p className="text-gray-600 mb-4">
            Đơn hàng được yêu cầu không thể được tìm thấy.
          </p>
          <button
            onClick={() => navigate("/orders")}
            className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Xem tất cả đơn hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <Container className="py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FaCheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Chi tiết đơn hàng
                </h1>
                <p className="text-gray-600">
                  Mã đơn hàng: #{order._id.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/orders")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </button>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Trạng thái đơn hàng
              </h2>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    Trạng thái đơn hàng:
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {translateStatus(order.status)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    Thanh toán:
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                      order.paymentStatus
                    )}`}
                  >
                    {translatePaymentStatus(order.paymentStatus)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaClock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Đặt hàng vào {new Date(order.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Sản phẩm trong đơn hàng
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="p-6 flex items-center space-x-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      // Xử lý trường hợp productId được populate hoặc chưa populate
                      const productId =
                        item.productId?._id || item.productId || item._id;

                      console.log("Debug click sản phẩm:", {
                        item,
                        productId,
                        "item.productId": item.productId,
                        "item.productId._id": item.productId?._id,
                        "item._id": item._id,
                      });

                      if (productId) {
                        navigate(`/product/${productId}`);
                      } else {
                        toast.error("Không thể tìm thấy thông tin sản phẩm");
                        console.error("Không tìm thấy product ID:", item);
                      }
                    }}
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
                      <h3 className="text-lg font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Số lượng: {item.quantity}
                      </p>
                      <p className="text-xs text-blue-600 hover:text-blue-800">
                        Nhấn để xem chi tiết sản phẩm
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        <PriceFormat amount={item.price} />
                      </div>
                      <div className="text-sm text-gray-600">
                        Tổng tiền:{" "}
                        <PriceFormat amount={item.price * item.quantity} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="w-5 h-5" />
                Địa chỉ giao hàng
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FaUser className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">
                    {order.address.firstName} {order.address.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaEnvelope className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{order.address.email}</span>
                </div>
                {order.address.phone && (
                  <div className="flex items-center gap-2">
                    <FaPhone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{order.address.phone}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="text-gray-600">
                    <p>{order.address.street}</p>
                    <p>
                      {order.address.city}, {order.address.state}{" "}
                      {order.address.zipcode}
                    </p>
                    <p>{order.address.country}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Method Info */}
              {order.shippingMethod && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Phương thức vận chuyển
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Đơn vị:</span>{" "}
                      {order.shippingMethod.provider?.toUpperCase() || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Dịch vụ:</span>{" "}
                      {order.shippingMethod.serviceName || "Standard"}
                    </p>
                    <p>
                      <span className="font-medium">Phí vận chuyển:</span>{" "}
                      {order.shippingMethod.totalFee > 0 ? (
                        <PriceFormat amount={order.shippingMethod.totalFee} />
                      ) : (
                        <span className="text-green-600">Miễn phí</span>
                      )}
                    </p>
                    {order.shippingMethod.estimatedDelivery && (
                      <p>
                        <span className="font-medium">Thời gian dự kiến:</span>{" "}
                        {order.shippingMethod.estimatedDelivery}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Thanh toán
              </h2>

              {/* Order Summary */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Tổng tiền ({order.items.length} sản phẩm)
                  </span>
                  <span className="font-medium">
                    <PriceFormat amount={order.amount} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vận chuyển</span>
                  <span className="font-medium text-green-600">
                    {order.shippingMethod?.totalFee > 0 ? (
                      <PriceFormat amount={order.shippingMethod.totalFee} />
                    ) : (
                      "Miễn phí"
                    )}
                    {order.shippingMethod?.provider &&
                      ` (${order.shippingMethod.provider.toUpperCase()})`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    <PriceFormat amount={order.amount} />
                  </span>
                </div>
              </div>

              {/* Payment Options */}
              {order.paymentStatus === "pending" && (
                <div className="space-y-4">
                  {paymentStep === "selection" && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Chọn phương thức thanh toán
                      </h3>

                      <PaymentMethodSelector
                        selectedMethod={paymentMethod}
                        onSelectMethod={handlePayment}
                      />
                    </>
                  )}

                  {paymentStep === "bank_transfer" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={handlePaymentCancel}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <FaArrowLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Chuyển khoản ngân hàng
                        </h3>
                      </div>

                      <BankTransferInfo
                        orderId={orderId}
                        totalAmount={order.amount}
                        onPaymentComplete={handlePaymentComplete}
                      />
                    </div>
                  )}

                  {paymentStep === "qr_code" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={handlePaymentCancel}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <FaArrowLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Thanh toán QR Code
                        </h3>
                      </div>

                      <QRCodePayment
                        orderId={orderId}
                        totalAmount={order.amount}
                        onPaymentComplete={handlePaymentComplete}
                      />
                    </div>
                  )}
                </div>
              )}

              {order.paymentStatus === "paid" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-800">
                        Thanh toán thành công
                      </h4>
                      <p className="text-sm text-green-700">
                        Thanh toán của bạn đã được xử lý thành công
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => navigate("/orders")}
                  className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Xem tất cả đơn hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Checkout;
