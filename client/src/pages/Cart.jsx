import { updateUserCart } from "../services/cartService";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  resetCart,
  deleteItem,
  increaseQuantity,
  decreaseQuantity,
} from "../redux/orebiSlice";
import { emptyCart } from "../assets/images";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import toast from "react-hot-toast";
import {
  FaMinus,
  FaPlus,
  FaTrash,
  FaMapMarkerAlt,
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const products = useSelector((state) => state.orebiReducer.products);
  const userInfo = useSelector((state) => state.orebiReducer.userInfo);
  const [totalAmt, setTotalAmt] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isAddressesExpanded, setIsAddressesExpanded] = useState(false);
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
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const prevProductsLength = useRef(0);
  // Shipping states
  const [shippingProviders, setShippingProviders] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  // Lưu trạng thái đã thay đổi của từng sản phẩm
  const [itemSelectionHistory, setItemSelectionHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("cartItemSelectionHistory");
      return saved ? new Map(JSON.parse(saved)) : new Map();
    } catch {
      return new Map();
    }
  });

  useEffect(() => {
    let price = 0;
    let discountedPrice = 0;
    products.forEach((item) => {
      // Chỉ tính toán cho các sản phẩm được chọn
      if (selectedItems.has(item.cartKey || item._id)) {
        const itemPrice = item?.price || 0;
        const itemQuantity = item?.quantity || 1;
        const itemDiscountPercentage = item?.discountedPercentage || 0;

        price +=
          (itemPrice + (itemDiscountPercentage * itemPrice) / 100) *
          itemQuantity;
        discountedPrice += itemPrice * itemQuantity;
      }
    });
    setTotalAmt(price);
    setDiscount(discountedPrice);
  }, [products, selectedItems]);

  // Fetch user addresses
  useEffect(() => {
    if (userInfo) {
      fetchAddresses();
      fetchShippingProviders();
    }
  }, [userInfo]);

  const calculateShippingFee = async () => {
    if (!selectedShipping || selectedItems.size === 0) {
      setShippingFee(0);
      return;
    }

    setLoadingShipping(true);
    try {
      const selectedProducts = products.filter((item) =>
        selectedItems.has(item.cartKey || item._id)
      );

      const response = await fetch(
        "http://localhost:8000/api/shipping/calculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cartItems: selectedProducts,
            provider: selectedShipping.provider,
            serviceType: selectedShipping.service,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setShippingFee(data.shipping.totalShippingFee);
      }
    } catch (error) {
      console.error("Error calculating shipping:", error);
      toast.error("Không thể tính phí vận chuyển");
    } finally {
      setLoadingShipping(false);
    }
  };

  // Calculate shipping fee when selected items or shipping method changes
  useEffect(() => {
    const calculateFee = async () => {
      if (selectedItems.size > 0 && selectedShipping) {
        await calculateShippingFee();
      } else {
        setShippingFee(0);
      }
    };
    calculateFee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItems, selectedShipping, products]);

  // Lưu itemSelectionHistory vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(
        "cartItemSelectionHistory",
        JSON.stringify(Array.from(itemSelectionHistory))
      );
    } catch (error) {
      console.error("Error saving selection history:", error);
    }
  }, [itemSelectionHistory]);

  // Tự động chọn sản phẩm mới được thêm vào giỏ hàng
  useEffect(() => {
    if (prevProductsLength.current < products.length) {
      // Có sản phẩm mới được thêm vào (thêm sản phẩm từ trang khác)
      const currentProductIds = new Set(
        products.map((item) => item.cartKey || item._id)
      );

      // Lấy ID của các sản phẩm đã có trước đó (từ selectedItems và itemSelectionHistory)
      const previousProductIds = new Set([
        ...selectedItems,
        ...Array.from(itemSelectionHistory.keys()),
      ]);

      // Tìm sản phẩm thực sự mới (chưa từng xuất hiện trong giỏ hàng)
      const newItems = Array.from(currentProductIds).filter((id) => {
        return !previousProductIds.has(id);
      });

      if (newItems.length > 0) {
        // Chỉ tự động chọn các sản phẩm thực sự mới được thêm
        newItems.forEach((itemId) => {
          // Xóa lịch sử cũ để sản phẩm này được coi là "mới"
          setItemSelectionHistory((prevHistory) => {
            const newHistory = new Map(prevHistory);
            newHistory.delete(itemId);
            return newHistory;
          });
        });

        // Chỉ thêm sản phẩm mới vào danh sách đã chọn, giữ nguyên trạng thái các sản phẩm cũ
        setSelectedItems((prevSelected) => {
          const newSelectedItems = new Set([...prevSelected, ...newItems]);
          setSelectAll(newSelectedItems.size === products.length);
          return newSelectedItems;
        });
      }
    } else if (prevProductsLength.current > products.length) {
      // Có sản phẩm bị xóa - dọn dẹp lịch sử và cập nhật selectedItems
      const currentProductIds = new Set(
        products.map((item) => item.cartKey || item._id)
      );

      setItemSelectionHistory((prevHistory) => {
        const newHistory = new Map(prevHistory);
        for (const id of prevHistory.keys()) {
          if (!currentProductIds.has(id)) {
            newHistory.delete(id);
          }
        }
        return newHistory;
      });

      // Remove deleted items from selectedItems
      setSelectedItems((prevSelected) => {
        const newSelected = new Set(
          [...prevSelected].filter((id) => currentProductIds.has(id))
        );
        setSelectAll(
          newSelected.size === products.length && products.length > 0
        );
        return newSelected;
      });
    }

    prevProductsLength.current = products.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]); // Only depend on products, not selectedItems or itemSelectionHistory

  // Khôi phục trạng thái chọn khi component mount lần đầu
  useEffect(() => {
    if (products.length > 0 && selectedItems.size === 0) {
      const autoSelectedItems = new Set();

      products.forEach((product) => {
        const itemId = product.cartKey || product._id;
        if (!itemSelectionHistory.has(itemId)) {
          // Sản phẩm mới chưa từng có thay đổi -> tự động chọn
          autoSelectedItems.add(itemId);
        } else if (itemSelectionHistory.get(itemId) === true) {
          // Sản phẩm đã từng được chọn trước đó -> tự động chọn lại
          autoSelectedItems.add(itemId);
        }
      });

      if (autoSelectedItems.size > 0) {
        setSelectedItems(autoSelectedItems);
        setSelectAll(autoSelectedItems.size === products.length);
      }
    }
    // Only run once on mount when products are loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  // Lưu itemSelectionHistory vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (itemSelectionHistory.size > 0) {
      try {
        localStorage.setItem(
          "cartItemSelectionHistory",
          JSON.stringify(Array.from(itemSelectionHistory.entries()))
        );
      } catch (error) {
        console.error("Failed to save selection history:", error);
      }
    }
  }, [itemSelectionHistory]);

  const fetchAddresses = async () => {
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
        // Set default address as selected
        const defaultAddr = data.addresses.find((addr) => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const fetchShippingProviders = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/shipping/providers"
      );
      const data = await response.json();
      if (data.success) {
        setShippingProviders(data.providers);
        // Set default shipping method (GHTK - Standard - 2-3 ngày)
        if (data.providers.length > 0) {
          const defaultProvider = data.providers.find((p) => p.id === "ghtk");
          if (defaultProvider && defaultProvider.services.length > 0) {
            setSelectedShipping({
              provider: defaultProvider.id,
              providerName: defaultProvider.name,
              providerLogo: defaultProvider.logo,
              service: defaultProvider.services[0].id,
              serviceName: defaultProvider.services[0].name,
              estimatedDelivery: defaultProvider.services[0].estimatedDelivery,
              freeShipping: defaultProvider.freeShipping || false,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching shipping providers:", error);
    }
  };

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

  const handlePlaceOrder = () => {
    if (!userInfo) {
      toast.error("Vui lòng đăng nhập để đặt hàng");
      return;
    }

    if (!selectedAddress) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    if (selectedItems.size === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để đặt hàng");
      return;
    }

    if (!selectedShipping) {
      toast.error("Vui lòng chọn phương thức vận chuyển");
      return;
    }

    // Chỉ lấy các sản phẩm được chọn
    const selectedProducts = products.filter((item) =>
      selectedItems.has(item.cartKey || item._id)
    );

    if (selectedProducts.length === 0) {
      toast.error("Không tìm thấy sản phẩm đã chọn");
      return;
    }

    // Navigate to order page with selected items, address, and shipping info
    navigate("/order", {
      state: {
        selectedItems: selectedProducts,
        selectedAddress: selectedAddress,
        totalAmount: totalAmt,
        discountAmount: discount,
        shippingMethod: selectedShipping,
        shippingFee: shippingFee,
      },
    });
  };

  const syncCartToBackend = async (newProducts) => {
    const token = localStorage.getItem("token");
    if (token) {
      await updateUserCart(token, newProducts);
    }
  };

  const handleQuantityChange = async (id, action) => {
    if (action === "increase") {
      dispatch(increaseQuantity(id));
    } else {
      dispatch(decreaseQuantity(id));
    }
    // Wait for Redux to update, then sync
    const updatedProducts = products.map((item) =>
      (item.cartKey || item._id) === id
        ? {
            ...item,
            quantity:
              action === "increase"
                ? (item.quantity || 1) + 1
                : Math.max((item.quantity || 1) - 1, 1),
          }
        : item
    );
    await syncCartToBackend(updatedProducts);
  };

  const handleRemoveItem = async (id, name) => {
    dispatch(deleteItem(id));
    toast.success(`${name} đã được xóa khỏi giỏ hàng!`);

    // Xóa sản phẩm khỏi selectedItems
    const newSelectedItems = new Set(selectedItems);
    newSelectedItems.delete(id);
    setSelectedItems(newSelectedItems);

    // Xóa lịch sử của sản phẩm này
    setItemSelectionHistory((prevHistory) => {
      const newHistory = new Map(prevHistory);
      newHistory.delete(id);
      return newHistory;
    });

    // Cập nhật trạng thái "chọn tất cả"
    const remainingProducts = products.filter(
      (item) => (item.cartKey || item._id) !== id
    );
    setSelectAll(
      newSelectedItems.size === remainingProducts.length &&
        remainingProducts.length > 0
    );

    const updatedProducts = products.filter(
      (item) => (item.cartKey || item._id) !== id
    );
    await syncCartToBackend(updatedProducts);
  };

  // Hàm xử lý checkbox cho từng sản phẩm
  const handleItemSelect = (itemId, checked) => {
    const newSelectedItems = new Set(selectedItems);
    if (checked) {
      newSelectedItems.add(itemId);
    } else {
      newSelectedItems.delete(itemId);
    }
    setSelectedItems(newSelectedItems);

    // Lưu lại lịch sử thay đổi của sản phẩm này
    setItemSelectionHistory((prevHistory) => {
      const newHistory = new Map(prevHistory);
      newHistory.set(itemId, checked);
      return newHistory;
    });

    // Cập nhật trạng thái "chọn tất cả"
    setSelectAll(newSelectedItems.size === products.length);
  };

  // Hàm xử lý checkbox "chọn tất cả"
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allItemIds = new Set(
        products.map((item) => item.cartKey || item._id)
      );
      setSelectedItems(allItemIds);
    } else {
      setSelectedItems(new Set());
    }

    // Lưu lại lịch sử thay đổi cho tất cả sản phẩm
    setItemSelectionHistory((prevHistory) => {
      const newHistory = new Map(prevHistory);
      products.forEach((item) => {
        newHistory.set(item.cartKey || item._id, checked);
      });
      return newHistory;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <Container className="py-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
            <nav className="flex text-sm text-gray-500">
              <Link to="/" className="hover:text-gray-700 transition-colors">
                Trang chủ
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Giỏ hàng</span>
            </nav>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items - Takes 2/3 of the width on large screens */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Mobile Header */}
                <div className="lg:hidden px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Chọn tất cả
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {selectedItems.size}/{products.length} sản phẩm
                  </span>
                </div>

                {/* Desktop Header */}
                <div className="hidden lg:grid grid-cols-12 gap-6 px-8 py-6 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700 uppercase">
                  <div className="col-span-1 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <div className="col-span-4">Sản phẩm</div>
                  <div className="col-span-2 text-center">Giá</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-2 text-center">Tổng</div>
                  <div className="col-span-1 text-center whitespace-nowrap">
                    Thao tác
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-gray-200">
                  {products.map((item) => (
                    <div
                      key={item.cartKey || item._id}
                      className="p-4 lg:px-8 lg:py-6"
                    >
                      {/* Mobile Layout */}
                      <div className="lg:hidden">
                        <div className="flex space-x-4">
                          {/* Checkbox for Mobile */}
                          <div className="flex items-start pt-2">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(
                                item.cartKey || item._id
                              )}
                              onChange={(e) =>
                                handleItemSelect(
                                  item.cartKey || item._id,
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>

                          {/* Product Image - Clickable */}
                          <Link
                            to={`/product/${item._id}`}
                            state={{ item }}
                            className="flex-shrink-0 group"
                          >
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={item?.images?.[0] || item?.image}
                                alt={item?.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                          </Link>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${item._id}`}
                              state={{ item }}
                              className="block hover:text-gray-700"
                            >
                              <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                                {item?.name}
                              </h3>
                            </Link>
                            {item.selectedLabel ? (
                              <p className="text-xs text-gray-500 mb-2">{item.selectedLabel}</p>
                            ) : item.purchaseType && (
                              <p className="text-xs text-gray-500 mb-2">
                                Loại: {item.purchaseType === "combo" ? "Combo" : "Mua lẻ"}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {item?.brand && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {item.brand}
                                </span>
                              )}
                              {item?.category && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {item.category}
                                </span>
                              )}
                            </div>

                            {/* Price */}
                            <div className="mb-3">
                              <div className="text-lg font-bold text-gray-900">
                                <PriceFormat amount={item?.price || 0} />
                              </div>
                              {item?.offer &&
                                item?.discountedPercentage > 0 && (
                                  <div className="text-sm text-gray-500 line-through">
                                    <PriceFormat
                                      amount={
                                        (item?.price || 0) +
                                        ((item?.discountedPercentage || 0) *
                                          (item?.price || 0)) /
                                          100
                                      }
                                    />
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* Mobile Controls */}
                        <div className="mt-4 space-y-3">
                          {/* Quantity Controls Row */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Số lượng:
                            </span>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.cartKey || item._id,
                                    "decrease"
                                  )
                                }
                                disabled={(item?.quantity || 1) <= 1}
                                className="p-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                              >
                                <FaMinus className="w-3 h-3" />
                              </button>
                              <span className="px-3 py-1.5 font-semibold min-w-[2.5rem] text-center border-x border-gray-300">
                                {item?.quantity || 1}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.cartKey || item._id,
                                    "increase"
                                  )
                                }
                                className="p-1.5 hover:bg-gray-50 transition-colors rounded-r-lg"
                              >
                                <FaPlus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Total Price and Delete Button Row */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Tổng tiền sản phẩm
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                <PriceFormat
                                  amount={
                                    (item?.price || 0) * (item?.quantity || 1)
                                  }
                                />
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveItem(
                                  item.cartKey || item._id,
                                  item.name
                                )
                              }
                              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                              title="Xóa sản phẩm"
                            >
                              <FaTrash className="w-4 h-4" />
                              <span className="text-sm font-medium">Xóa</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-center">
                        {/* Checkbox */}
                        <div className="lg:col-span-1 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(
                              item.cartKey || item._id
                            )}
                            onChange={(e) =>
                              handleItemSelect(
                                item.cartKey || item._id,
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="lg:col-span-4">
                          <div className="flex items-start space-x-4">
                            <Link
                              to={`/product/${item._id}`}
                              state={{ item }}
                              className="flex-shrink-0 group"
                            >
                              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={item?.images?.[0] || item?.image}
                                  alt={item?.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/product/${item._id}`}
                                state={{ item }}
                                className="block hover:text-gray-700"
                              >
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                  {item?.name}
                                </h3>
                              </Link>
                              {item.selectedLabel ? (
                                <p className="text-sm text-gray-500">{item.selectedLabel}</p>
                              ) : item.purchaseType && (
                                <p className="text-sm text-gray-500">
                                  Loại: {item.purchaseType === "combo" ? "Combo" : "Mua lẻ"}
                                </p>
                              )}
                              {item?.brand && (
                                <p className="text-sm text-gray-600 mb-1">
                                  Thương hiệu: {item.brand}
                                </p>
                              )}
                              {item?.category && (
                                <p className="text-sm text-gray-600">
                                  Danh mục: {item.category}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="lg:col-span-2">
                          <div className="flex lg:justify-center">
                            <div className="lg:text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                <PriceFormat amount={item?.price || 0} />
                              </div>
                              {item?.offer &&
                                item?.discountedPercentage > 0 && (
                                  <div className="text-sm text-gray-500 line-through">
                                    <PriceFormat
                                      amount={
                                        (item?.price || 0) +
                                        ((item?.discountedPercentage || 0) *
                                          (item?.price || 0)) /
                                          100
                                      }
                                    />
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="lg:col-span-2">
                          <div className="flex lg:justify-center">
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.cartKey || item._id,
                                    "decrease"
                                  )
                                }
                                disabled={(item?.quantity || 1) <= 1}
                                className="p-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <FaMinus className="w-3 h-3" />
                              </button>
                              <span className="px-3 py-1.5 font-medium min-w-[2.5rem] text-center">
                                {item?.quantity || 1}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.cartKey || item._id,
                                    "increase"
                                  )
                                }
                                className="p-1.5 hover:bg-gray-50 transition-colors"
                              >
                                <FaPlus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="lg:col-span-2">
                          <div className="flex lg:justify-center">
                            <div className="lg:text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                <PriceFormat
                                  amount={
                                    (item?.price || 0) * (item?.quantity || 1)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div className="lg:col-span-1">
                          <div className="flex lg:justify-center">
                            <button
                              onClick={() =>
                                handleRemoveItem(
                                  item.cartKey || item._id,
                                  item.name
                                )
                              }
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors border border-red-200 hover:border-red-300"
                              title="Xóa sản phẩm"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Actions - Below cart items on large screens */}
              <div className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Hành động giỏ hàng
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        dispatch(resetCart());
                        setSelectedItems(new Set());
                        setSelectAll(false);
                        setItemSelectionHistory(new Map());
                        localStorage.removeItem("cartItemSelectionHistory");
                      }}
                      className="flex-1 px-4 py-3 border border-red-300 text-red-700 rounded-md hover:bg-red-50 hover:border-red-400 transition-colors font-medium"
                    >
                      Xóa giỏ hàng
                    </button>
                    <Link to="/shop" className="flex-1">
                      <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium">
                        Tiếp tục mua sắm
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary - Takes 1/3 of the width on large screens */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
                {/* Address Selection Section */}
                {userInfo && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Địa chỉ giao hàng
                      </h3>
                      <button
                        onClick={() => setShowAddressModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Thêm mới
                      </button>
                    </div>

                    {addresses.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <FaMapMarkerAlt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm mb-2">
                          Không tìm thấy địa chỉ giao hàng
                        </p>
                        <button
                          onClick={() => setShowAddressModal(true)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Thêm địa chỉ giao hàng
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Selected Address Display */}
                        {selectedAddress && (
                          <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-gray-900">
                                    {selectedAddress.label}
                                  </span>
                                  {selectedAddress.isDefault && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                      Mặc định
                                    </span>
                                  )}
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                                    Đã chọn
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {selectedAddress.street},{" "}
                                  {selectedAddress.city},{" "}
                                  {selectedAddress.state}{" "}
                                  {selectedAddress.zipCode}
                                  {selectedAddress.phone && (
                                    <span className="block">
                                      Số điện thoại: {selectedAddress.phone}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <FaCheck className="w-4 h-4 text-blue-600 mt-1" />
                            </div>
                          </div>
                        )}

                        {/* Collapsible Address List */}
                        {addresses.length > 1 && (
                          <div className="border border-gray-200 rounded-lg">
                            <button
                              onClick={() =>
                                setIsAddressesExpanded(!isAddressesExpanded)
                              }
                              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <span className="text-sm font-medium text-gray-700">
                                {isAddressesExpanded ? "Ẩn" : "Hiện"} other
                                addresses ({addresses.length - 1})
                              </span>
                              {isAddressesExpanded ? (
                                <FaChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <FaChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </button>

                            {isAddressesExpanded && (
                              <div className="border-t border-gray-200 p-2 space-y-2">
                                {addresses
                                  .filter(
                                    (address) =>
                                      address._id !== selectedAddress?._id
                                  )
                                  .map((address) => (
                                    <div
                                      key={address._id}
                                      className="border border-gray-200 rounded-lg p-3 cursor-pointer transition-colors hover:border-gray-300 hover:bg-gray-50"
                                      onClick={() =>
                                        setSelectedAddress(address)
                                      }
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
                                          <p className="text-sm text-gray-600 leading-relaxed">
                                            {address.street}, {address.city},{" "}
                                            {address.state} {address.zipCode}
                                            {address.phone && (
                                              <span className="block">
                                                Số điện thoại: {address.phone}
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Single Address Display (when only one address exists) */}
                        {addresses.length === 1 && !selectedAddress && (
                          <div
                            className="border border-gray-200 rounded-lg p-3 cursor-pointer transition-colors hover:border-gray-300"
                            onClick={() => setSelectedAddress(addresses[0])}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-gray-900">
                                    {addresses[0].label}
                                  </span>
                                  {addresses[0].isDefault && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                      Mặc định
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {addresses[0].street}, {addresses[0].city},{" "}
                                  {addresses[0].state} {addresses[0].zipCode}
                                  {addresses[0].phone && (
                                    <span className="block">
                                      Số điện thoại: {addresses[0].phone}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Tóm tắt đơn hàng
                </h3>

                {selectedItems.size === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <div className="text-amber-600">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-amber-800">
                          Vui lòng chọn ít nhất một sản phẩm để xem tổng tiền
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">
                      Tổng tiền ({selectedItems.size} sản phẩm được chọn)
                    </span>
                    <span className="font-medium">
                      <PriceFormat amount={totalAmt} />
                    </span>
                  </div>

                  {totalAmt !== discount && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Giảm giá</span>
                      <span className="font-medium text-green-600">
                        -<PriceFormat amount={totalAmt - discount} />
                      </span>
                    </div>
                  )}

                  {/* Shipping Method Display - Collapsed */}
                  <div className="py-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Phương thức vận chuyển
                      </span>
                      <button
                        onClick={() => setShowShippingModal(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        {selectedShipping ? (
                          <span className="flex items-center gap-2">
                            <span>{selectedShipping.providerLogo}</span>
                            <span>
                              {selectedShipping.providerName} -{" "}
                              {selectedShipping.serviceName}
                            </span>
                          </span>
                        ) : (
                          "Chọn"
                        )}
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                    {selectedShipping && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-500">
                          Giao hàng dự kiến:{" "}
                          {selectedShipping.estimatedDelivery}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Phí vận chuyển</span>
                    <span className="font-medium text-gray-900">
                      {loadingShipping ? (
                        <span className="text-sm">Đang tính...</span>
                      ) : shippingFee > 0 ? (
                        <PriceFormat amount={shippingFee} />
                      ) : (
                        <span className="text-green-600 font-semibold">
                          Miễn phí
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">
                        Tổng tiền
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        <PriceFormat amount={discount + shippingFee} />
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    !userInfo || !selectedAddress || selectedItems.size === 0
                  }
                  className="w-full bg-gray-900 text-white py-4 px-6 rounded-md hover:bg-gray-800 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!userInfo
                    ? "Đăng nhập để đặt hàng"
                    : !selectedAddress
                    ? "Chọn địa chỉ để tiếp tục"
                    : selectedItems.size === 0
                    ? "Chọn sản phẩm để đặt hàng"
                    : "Tiến hành đặt hàng"}
                </button>

                {selectedShipping && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-blue-800">
                        Giao hàng dự kiến:{" "}
                        <span className="font-semibold">
                          {selectedShipping.estimatedDelivery}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <img
                className="w-32 h-32 mx-auto mb-6 object-cover"
                src={emptyCart}
                alt="Empty Cart"
              />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Giỏ hàng của bạn trống
              </h2>
              <p className="text-gray-600 mb-8">
                Có vẻ như bạn chưa thêm bất kỳ sản phẩm nào vào giỏ hàng của
                bạn. Bắt đầu mua sắm để đầy đủ giỏ hàng của bạn!
              </p>
              <Link to="/shop">
                <button className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium">
                  Bắt đầu mua sắm
                </button>
              </Link>
            </div>
          </motion.div>
        )}
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
                <div className="relative">
                  <select
                    value={addressForm.label}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, label: e.target.value })
                    }
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                    required
                  >
                    <option value="">Chọn loại địa chỉ</option>
                    <option value="Home">Nhà riêng</option>
                    <option value="Work">Công ty</option>
                    <option value="Hometown">Quê quán</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
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
                    Thành phố
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
                    Tỉnh/Thành phố
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
                    Mã bưu điện
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
                    Quốc gia
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

      {/* Shipping Method Selection Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🚚</span>
                <span>Chọn phương thức vận chuyển</span>
              </h3>
              <button
                onClick={() => setShowShippingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {shippingProviders.length > 0 ? (
              <div className="space-y-3">
                {shippingProviders.map((provider) =>
                  provider.services.map((service) => {
                    const isSelected =
                      selectedShipping?.provider === provider.id &&
                      selectedShipping?.service === service.id;
                    return (
                      <div
                        key={`${provider.id}-${service.id}`}
                        onClick={() => {
                          setSelectedShipping({
                            provider: provider.id,
                            providerName: provider.name,
                            providerLogo: provider.logo,
                            service: service.id,
                            serviceName: service.name,
                            estimatedDelivery: service.estimatedDelivery,
                            freeShipping: provider.freeShipping || false,
                          });
                          setShowShippingModal(false);
                        }}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{provider.logo}</span>
                            <div>
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                {provider.name}
                                {provider.freeShipping && (
                                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                    Miễn phí
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-0.5">
                                {service.name} - {service.estimatedDelivery}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <FaCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">
                  Đang tải phương thức vận chuyển...
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowShippingModal(false)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
