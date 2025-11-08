import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  FaMapMarkerAlt,
  FaCreditCard,
  FaQrcode,
  FaMoneyBillWave,
  FaShieldAlt,
  FaArrowLeft,
  FaCheckCircle,
  FaTimes,
  FaEdit,
  FaTruck,
  FaUser,
} from "react-icons/fa";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import { removeSelectedItems, setOrderCount } from "../redux/orebiSlice";

const OrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.orebiReducer.userInfo);
  const orderCount = useSelector((state) => state.orebiReducer.orderCount);

  // Get data from location state (passed from Cart.jsx)
  const {
    selectedItems,
    selectedAddress,
    totalAmount,
    discountAmount,
    shippingMethod,
    shippingFee,
  } = location.state || {};

  const [processing, setProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [currentAddress, setCurrentAddress] = useState(selectedAddress);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isAddressesExpanded, setIsAddressesExpanded] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [currentShipping, setCurrentShipping] = useState(shippingMethod);
  const [currentShippingFee, setCurrentShippingFee] = useState(shippingFee);
  const [addressForm, setAddressForm] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    isDefault: false,
  });
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Shipping providers data (memoized to prevent re-render issues)
  const shippingProviders = useMemo(
    () => [
      {
        id: "ghtk",
        name: "Giao Hàng Tiết Kiệm (GHTK)",
        logo: "🚚",
        services: [
          {
            id: "standard",
            name: "Tiêu chuẩn",
            estimatedDelivery: "2-3 ngày",
            fee: 0, // Free shipping
          },
          {
            id: "express",
            name: "Nhanh",
            estimatedDelivery: "1-2 ngày",
            fee: 25000,
          },
        ],
      },
      {
        id: "viettel",
        name: "Viettel Post",
        logo: "📦",
        services: [
          {
            id: "standard",
            name: "Tiêu chuẩn",
            estimatedDelivery: "3-4 ngày",
            fee: 0, // Free shipping
          },
          {
            id: "express",
            name: "Hỏa tốc",
            estimatedDelivery: "1 ngày",
            fee: 35000,
          },
        ],
      },
      {
        id: "ghn",
        name: "Giao Hàng Nhanh (GHN)",
        logo: "⚡",
        services: [
          {
            id: "standard",
            name: "Tiêu chuẩn",
            estimatedDelivery: "2-3 ngày",
            fee: 20000,
          },
          {
            id: "express",
            name: "Nhanh",
            estimatedDelivery: "1 ngày",
            fee: 30000,
          },
        ],
      },
      {
        id: "jnt",
        name: "J&T Express",
        logo: "🎯",
        services: [
          {
            id: "standard",
            name: "Tiêu chuẩn",
            estimatedDelivery: "3-5 ngày",
            fee: 18000,
          },
        ],
      },
      {
        id: "grab",
        name: "Grab Express",
        logo: "🛵",
        services: [
          {
            id: "instant",
            name: "Giao ngay",
            estimatedDelivery: "1-2 giờ",
            fee: 45000,
          },
        ],
      },
    ],
    []
  );

  // Redirect if no order data
  useEffect(() => {
    if (!selectedItems || selectedItems.length === 0) {
      toast.error("Không có sản phẩm để đặt hàng");
      navigate("/cart");
    }
  }, [selectedItems, navigate]);

  // Set default shipping if not provided
  useEffect(() => {
    if (!currentShipping && shippingProviders.length > 0) {
      // Set GHTK Standard as default (free shipping)
      const defaultProvider = shippingProviders[0]; // GHTK
      const defaultService = defaultProvider.services[0]; // Standard

      setCurrentShipping({
        provider: defaultProvider.id,
        providerName: defaultProvider.name,
        providerLogo: defaultProvider.logo,
        service: defaultService.id,
        serviceName: defaultService.name,
        estimatedDelivery: defaultService.estimatedDelivery,
        fee: defaultService.fee,
      });
      setCurrentShippingFee(defaultService.fee);
    }
  }, [currentShipping, shippingProviders]);

  const fetchAddresses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/user/addresses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAddresses(data.addresses);
        // Set default address if none selected
        if (!currentAddress) {
          const defaultAddr = data.addresses.find((addr) => addr.isDefault);
          if (defaultAddr) {
            setCurrentAddress(defaultAddr);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  }, [currentAddress]);

  // Fetch user addresses
  useEffect(() => {
    if (userInfo) {
      fetchAddresses();
    }
  }, [userInfo, fetchAddresses]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setIsAddingAddress(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/user/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Thêm địa chỉ thành công!");
        fetchAddresses();
        setShowAddressModal(false);
        setAddressForm({
          label: "",
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
          phone: "",
          isDefault: false,
        });
      } else {
        toast.error(data.message || "Thêm địa chỉ thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi thêm địa chỉ:", error);
      toast.error("Thêm địa chỉ thất bại");
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handlePlaceOrder = async () => {
    if (!userInfo) {
      toast.error("Vui lòng đăng nhập để đặt hàng");
      return;
    }

    if (!currentAddress) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Vui lòng chọn phương thức thanh toán");
      return;
    }

    setProcessing(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/order/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: selectedItems,
          amount: discountAmount || totalAmount,
          address: {
            ...currentAddress,
            email: userInfo.email,
            name: userInfo.name,
          },
          paymentMethod: selectedPaymentMethod,
          shippingMethod: currentShipping,
          shippingFee: currentShippingFee || 0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Remove items from cart
        const selectedItemIds = selectedItems.map((item) => item._id);
        dispatch(removeSelectedItems(selectedItemIds));

        // Update order count
        dispatch(setOrderCount(orderCount + 1));

        // Redirect to checkout page for all payment methods
        toast.success("Đặt hàng thành công!");
        navigate(`/checkout/${data.order._id}`);
      } else {
        toast.error(data.message || "Đặt hàng thất bại");
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      toast.error("Đặt hàng thất bại");
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: "cod",
      name: "Thanh toán khi nhận hàng (COD)",
      description: "Thanh toán bằng tiền mặt khi nhận hàng",
      icon: FaMoneyBillWave,
      color: "green",
    },
    {
      id: "bank_transfer",
      name: "Chuyển khoản ngân hàng",
      description: "Chuyển khoản qua tài khoản ngân hàng",
      icon: FaCreditCard,
      color: "blue",
    },
    {
      id: "qr_code",
      name: "Quét mã QR",
      description: "Thanh toán bằng cách quét mã QR",
      icon: FaQrcode,
      color: "purple",
    },
  ];

  if (!selectedItems || selectedItems.length === 0) {
    return null; // Component will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <Container className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/cart")}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Quay lại giỏ hàng
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Đặt hàng</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FaShieldAlt className="w-4 h-4 text-green-600" />
              <span>Thanh toán an toàn</span>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="w-5 h-5 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Địa chỉ giao hàng
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Thêm mới
                  </button>
                  {addresses.length > 1 && (
                    <button
                      onClick={() =>
                        setIsAddressesExpanded(!isAddressesExpanded)
                      }
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                      <FaEdit className="w-3 h-3 mr-1" />
                      Thay đổi
                    </button>
                  )}
                </div>
              </div>

              {currentAddress ? (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-gray-900">
                          {currentAddress.label}
                        </span>
                        {currentAddress.isDefault && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                            Mặc định
                          </span>
                        )}
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                          Đã chọn
                        </span>
                      </div>

                      {/* Tên người nhận */}
                      <div className="mb-2 flex items-center gap-2">
                        <FaUser className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">
                          {userInfo?.name || currentAddress.name || ""}
                        </span>
                      </div>

                      {/* Địa chỉ */}
                      <p className="text-gray-600 mb-1">
                        {currentAddress.street}, {currentAddress.city}
                      </p>
                      {currentAddress.state &&
                        currentAddress.state !== currentAddress.country && (
                          <p className="text-gray-600 mb-1">
                            {currentAddress.state}
                          </p>
                        )}
                      {currentAddress.zipCode && (
                        <p className="text-gray-600 mb-1">
                          Mã bưu điện: {currentAddress.zipCode}
                        </p>
                      )}
                      {currentAddress.country && (
                        <p className="text-gray-600 mb-1">
                          {currentAddress.country}
                        </p>
                      )}

                      {/* Số điện thoại */}
                      {currentAddress.phone && (
                        <p className="text-gray-600 font-medium">
                          SĐT: {currentAddress.phone}
                        </p>
                      )}
                    </div>
                    <FaCheckCircle className="w-5 h-5 text-blue-600 mt-1" />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <FaMapMarkerAlt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm mb-2">
                    Chưa có địa chỉ giao hàng
                  </p>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Thêm địa chỉ giao hàng
                  </button>
                </div>
              )}

              {/* Other addresses */}
              {isAddressesExpanded && addresses.length > 1 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Chọn địa chỉ khác:
                  </h4>
                  {addresses
                    .filter((address) => address._id !== currentAddress?._id)
                    .map((address) => (
                      <div
                        key={address._id}
                        className="border border-gray-200 rounded-lg p-3 cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => {
                          setCurrentAddress(address);
                          setIsAddressesExpanded(false);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {address.label}
                              </span>
                              {address.isDefault && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.street}, {address.city}, {address.state}{" "}
                              {address.zipCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Shipping Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaTruck className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Phương thức vận chuyển
                  </h3>
                </div>
                <button
                  onClick={() => setShowShippingModal(!showShippingModal)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  <FaEdit className="w-3 h-3 mr-1" />
                  Thay đổi
                </button>
              </div>

              {currentShipping ? (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {currentShipping.providerName ||
                            currentShipping.provider}
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                          Đã chọn
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">
                        {currentShipping.serviceName || currentShipping.service}
                      </p>
                      {currentShipping.estimatedDelivery && (
                        <p className="text-gray-500 text-xs">
                          Dự kiến giao hàng: {currentShipping.estimatedDelivery}
                        </p>
                      )}
                      <p className="text-green-600 font-semibold mt-2">
                        {currentShippingFee > 0
                          ? `Phí vận chuyển: ${currentShippingFee.toLocaleString(
                              "vi-VN"
                            )} đ`
                          : "Miễn phí vận chuyển"}
                      </p>
                    </div>
                    <FaCheckCircle className="w-5 h-5 text-blue-600 mt-1" />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <FaTruck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm mb-3">
                    Chưa chọn phương thức vận chuyển
                  </p>
                  <button
                    onClick={() => setShowShippingModal(true)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Chọn phương thức vận chuyển
                  </button>
                </div>
              )}

              {/* Shipping Modal/Selector */}
              {showShippingModal && (
                <div className="mt-4 border border-gray-200 rounded-lg bg-white">
                  <div className="p-4 bg-blue-50 border-b border-blue-200">
                    <p className="text-sm text-gray-700">
                      <strong>Chọn đơn vị vận chuyển:</strong> Vui lòng chọn nhà
                      vận chuyển và loại dịch vụ phù hợp
                    </p>
                  </div>

                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {shippingProviders.map((provider) => (
                      <div
                        key={provider.id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                          <span className="text-2xl">{provider.logo}</span>
                          <h4 className="font-semibold text-gray-900">
                            {provider.name}
                          </h4>
                        </div>

                        <div className="space-y-2">
                          {provider.services.map((service) => {
                            const isSelected =
                              currentShipping?.provider === provider.id &&
                              currentShipping?.service === service.id;

                            return (
                              <div
                                key={service.id}
                                onClick={() => {
                                  setCurrentShipping({
                                    provider: provider.id,
                                    providerName: provider.name,
                                    providerLogo: provider.logo,
                                    service: service.id,
                                    serviceName: service.name,
                                    estimatedDelivery:
                                      service.estimatedDelivery,
                                    fee: service.fee,
                                  });
                                  setCurrentShippingFee(service.fee);
                                  setShowShippingModal(false);
                                  toast.success(
                                    `Đã chọn ${provider.name} - ${service.name}`
                                  );
                                }}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">
                                        {service.name}
                                      </span>
                                      {isSelected && (
                                        <FaCheckCircle className="w-4 h-4 text-blue-600" />
                                      )}
                                      {service.fee === 0 && (
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                          Miễn phí
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                      Thời gian: {service.estimatedDelivery}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className={`font-semibold ${
                                        service.fee === 0
                                          ? "text-green-600"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {service.fee === 0
                                        ? "Miễn phí"
                                        : `${service.fee.toLocaleString(
                                            "vi-VN"
                                          )} đ`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={() => setShowShippingModal(false)}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sản phẩm đặt hàng ({selectedItems?.length || 0} sản phẩm)
              </h3>
              <div className="space-y-4">
                {selectedItems?.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.images?.[0] || item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-2">
                        {item.name}
                      </h4>
                      {item.brand && (
                        <p className="text-sm text-gray-600">
                          Thương hiệu: {item.brand}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            Số lượng: {item.quantity}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            <PriceFormat amount={item.price} />
                          </span>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          <PriceFormat amount={item.price * item.quantity} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Phương thức thanh toán
              </h3>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPaymentMethod === method.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handlePaymentMethodChange(method.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={method.id}
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={() => handlePaymentMethodChange(method.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={method.id}
                          className="ml-3 flex items-center cursor-pointer flex-1"
                        >
                          <IconComponent
                            className={`w-5 h-5 mr-3 ${
                              method.color === "green"
                                ? "text-green-600"
                                : method.color === "blue"
                                ? "text-blue-600"
                                : "text-yellow-500"
                            }`}
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {method.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {method.description}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Tóm tắt đơn hàng
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Tổng tiền ({selectedItems?.length || 0} sản phẩm)
                  </span>
                  <span className="font-medium">
                    <PriceFormat amount={totalAmount || 0} />
                  </span>
                </div>

                {totalAmount !== discountAmount && discountAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="font-medium text-green-600">
                      -<PriceFormat amount={totalAmount - discountAmount} />
                    </span>
                  </div>
                )}

                {/* Thông tin vận chuyển */}
                {currentShipping && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <FaTruck className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          Phương thức vận chuyển
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm ml-6">
                        <span className="text-gray-900 font-medium">
                          {currentShipping.providerName ||
                            currentShipping.provider}
                        </span>
                        <span className="text-gray-600">-</span>
                        <span className="text-gray-600">
                          {currentShipping.serviceName ||
                            currentShipping.service}
                        </span>
                      </div>
                      {currentShipping.estimatedDelivery && (
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          Dự kiến: {currentShipping.estimatedDelivery}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  {currentShippingFee > 0 ? (
                    <span className="font-medium">
                      <PriceFormat amount={currentShippingFee} />
                    </span>
                  ) : (
                    <span className="font-medium text-green-600">Miễn phí</span>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Tổng thanh toán
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      <PriceFormat
                        amount={
                          (discountAmount || totalAmount || 0) +
                          (currentShippingFee || 0)
                        }
                      />
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={
                  !userInfo ||
                  !currentAddress ||
                  !selectedPaymentMethod ||
                  processing
                }
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang xử lý...
                  </div>
                ) : !userInfo ? (
                  "Đăng nhập để đặt hàng"
                ) : !currentAddress ? (
                  "Chọn địa chỉ để tiếp tục"
                ) : !selectedPaymentMethod ? (
                  "Chọn phương thức thanh toán"
                ) : selectedPaymentMethod === "cod" ? (
                  "Xác nhận đặt hàng (Thanh toán khi nhận hàng)"
                ) : selectedPaymentMethod === "bank_transfer" ? (
                  "Xác nhận đặt hàng (Chuyển khoản ngân hàng)"
                ) : selectedPaymentMethod === "qr_code" ? (
                  "Xác nhận đặt hàng (Quét mã QR)"
                ) : (
                  "Xác nhận đặt hàng"
                )}
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Bằng cách đặt hàng, bạn đồng ý với{" "}
                  <Link to="#" className="text-blue-600 hover:text-blue-700">
                    Điều khoản dịch vụ
                  </Link>{" "}
                  và{" "}
                  <Link to="#" className="text-blue-600 hover:text-blue-700">
                    Chính sách bảo mật
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Thêm địa chỉ mới
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhãn địa chỉ *
                </label>
                <select
                  value={addressForm.label}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, label: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn loại địa chỉ</option>
                  <option value="Home">Nhà riêng</option>
                  <option value="Work">Công ty</option>
                  <option value="Hometown">Quê quán</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, street: e.target.value })
                  }
                  placeholder="Số nhà và tên đường"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thành phố *
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tỉnh/Thành phố *
                  </label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, state: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã bưu điện *
                  </label>
                  <input
                    type="text"
                    value={addressForm.zipCode}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        zipCode: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quốc gia *
                  </label>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        country: e.target.value,
                      })
                    }
                    placeholder="Ví dụ: Việt Nam"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, phone: e.target.value })
                  }
                  placeholder="Tùy chọn"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      isDefault: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isDefault"
                  className="ml-2 text-sm text-gray-700"
                >
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isAddingAddress}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isAddingAddress ? "Thêm..." : "Thêm địa chỉ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
