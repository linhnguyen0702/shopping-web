import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Container from "../components/Container";
import PriceFormat from "../components/PriceFormat";
import ReviewForm from "../components/ReviewForm";
import { addToCart, setOrderCount } from "../redux/orebiSlice";
import toast from "react-hot-toast";
import { config, serverUrl } from "../../config";
import {
  FaShoppingBag,
  FaEye,
  FaCreditCard,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaShoppingCart,
  FaListAlt,
  FaBan,
  FaStar,
} from "react-icons/fa";

const Order = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const userInfo = useSelector((state) => state.orebiReducer.userInfo);
  const cartProducts = useSelector((state) => state.orebiReducer.products);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userReviews, setUserReviews] = useState([]);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    order: null,
  });
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    productId: null,
    orderId: null,
    existingReview: null,
    isEditing: false,
    productInfo: null, // Add product info to modal state
  });
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [activeTab, setActiveTab] = useState("all");

  // Helper function to get items that are not yet in any delivery
  const getUndeliveredItems = (order) => {
    if (!order.deliveries || order.deliveries.length === 0) {
      return order.items;
    }
    // Sử dụng field isDelivered để lọc items chưa giao (giống logic admin)
    return order.items.filter((item) => !item.isDelivered);
  };

  // Tách đơn hàng thành các dòng riêng cho mỗi lần giao hàng (logic từ admin)
  const expandOrdersWithDeliveries = (ordersToExpand) => {
    const expandedOrders = [];

    ordersToExpand.forEach((order) => {
      if (order.deliveries && order.deliveries.length > 0) {
        // Tạo một dòng cho mỗi lần giao hàng
        order.deliveries.forEach((delivery, index) => {
          const deliveryItemsWithDetails = delivery.items.map(
            (deliveryItem) => {
              const originalItem = order.items.find((orderItem) => {
                const orderProductId =
                  typeof orderItem.productId === "object" &&
                  orderItem.productId !== null
                    ? orderItem.productId._id
                    : orderItem.productId;
                const deliveryProductId =
                  typeof deliveryItem.productId === "object" &&
                  deliveryItem.productId !== null
                    ? deliveryItem.productId._id
                    : deliveryItem.productId;
                return orderProductId === deliveryProductId;
              });

              if (originalItem) {
                return {
                  ...originalItem,
                  _id: deliveryItem._id,
                  quantity: deliveryItem.quantity,
                };
              }
              return { ...deliveryItem, price: 0 }; // Fallback
            }
          );

          expandedOrders.push({
            ...order, // Giữ lại thông tin gốc của đơn hàng
            isDeliveryRow: true,
            deliveryIndex: index,
            currentDelivery: delivery,
            displayId: `${order._id}-D${index + 1}`,
            displayStatus: delivery.status,
            displayItems: deliveryItemsWithDetails,
            displayAmount: deliveryItemsWithDetails.reduce(
              (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
              0
            ),
          });
        });

        // Tạo một dòng cho các sản phẩm chưa được giao (nếu có)
        const undeliveredItems = getUndeliveredItems(order);
        if (undeliveredItems.length > 0) {
          expandedOrders.push({
            ...order,
            isUndeliveredRow: true,
            displayId: order._id,
            displayStatus: order.status, // Trạng thái chung của đơn hàng
            displayItems: undeliveredItems,
            displayAmount: undeliveredItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ),
          });
        }
      } else {
        // Nếu không có lần giao nào, hiển thị đơn hàng như bình thường
        expandedOrders.push({
          ...order,
          displayId: order._id,
          displayStatus: order.status,
          displayItems: order.items,
          displayAmount: order.amount,
        });
      }
    });

    return expandedOrders;
  };

  const fetchUserOrders = useCallback(async () => {
    try {
      console.log("=== FETCHING USER ORDERS ===");
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${config.baseUrl}/api/order/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const orderCount = data.orders?.length || 0;
        console.log(`✅ Successfully fetched ${orderCount} orders`);

        setOrders(data.orders);
        // Update order count in Redux
        dispatch(setOrderCount(data.orders.length));
        console.log("✅ Orders state and Redux updated");
      } else {
        console.error("❌ Failed to fetch orders:", data.message);
        setError(data.message || "Không thể tải đơn hàng");
        toast.error("Không thể tải danh sách đơn hàng");
      }
    } catch (error) {
      console.error("❌ Error in fetchUserOrders:", error);
      setError("Không thể tải danh sách đơn hàng");
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const fetchUserReviews = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("=== FETCHING USER REVIEWS ===");
      console.log("API URL:", `${serverUrl}/api/user/reviews`);

      const response = await fetch(`${serverUrl}/api/user/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("User reviews response:", data);

      if (data.success) {
        const reviewCount = data.reviews?.length || 0;
        console.log(`✅ Successfully fetched ${reviewCount} user reviews`);

        if (reviewCount > 0) {
          console.log("Sample reviews:", data.reviews.slice(0, 2));

          // Debug review images specifically
          data.reviews.forEach((review, index) => {
            console.log(`🖼️ Review ${index + 1} images debug:`, {
              reviewId: review._id,
              productId: review.productId,
              hasImages: !!review.images,
              imageCount: review.images?.length || 0,
              images: review.images,
              comment: review.comment?.substring(0, 50) + "...",
            });
          });

          // Log productIds in reviews for debugging
          const productIds = data.reviews.map((r) => ({
            reviewId: r._id,
            productId: r.productId,
            orderId: r.orderId,
            rating: r.rating,
          }));
          console.log("Review-Product mapping:", productIds);
        }

        setUserReviews(data.reviews || []);
        console.log("✅ User reviews state updated");
      } else {
        console.error("❌ Failed to fetch user reviews:", data.message);
        setUserReviews([]);
      }
    } catch (error) {
      console.error("❌ Error in fetchUserReviews:", error);
      setUserReviews([]);
    }
  }, []);

  // Helper function to count items that can be reviewed but haven't been reviewed yet
  const getNotReviewedItemsCount = useCallback(() => {
    let count = 0;
    const allExpanded = expandOrdersWithDeliveries(orders);
    allExpanded.forEach((order) => {
      if (order.displayStatus === "delivered") {
        order.displayItems.forEach((item) => {
          const productId = item.productId?._id || item.productId;
          const productIdStr = productId?.toString();
          const orderIdStr = order._id?.toString();

          const hasReview = userReviews.some((review) => {
            const reviewProductId = review.productId?.toString();
            const reviewOrderId = review.orderId?.toString();
            return (
              reviewProductId === productIdStr && reviewOrderId === orderIdStr
            );
          });

          if (!hasReview) {
            count++;
          }
        });
      }
    });
    console.log("Not reviewed items count:", count);
    return count;
  }, [orders, userReviews]);

  // Helper function to count reviewed items
  const getReviewedItemsCount = useCallback(() => {
    const allExpanded = expandOrdersWithDeliveries(orders);
    const reviewedOrders = allExpanded.filter((order) => {
      // Consider only delivered orders for review counts
      if (order.displayStatus !== "delivered") return false;

      // Check if at least one item in the order has a review
      return order.displayItems.some((item) => {
        const productId = item.productId?._id || item.productId;
        const productIdStr = productId?.toString();
        const orderIdStr = order._id?.toString();

        return userReviews.some((review) => {
          const reviewProductId = review.productId?.toString();
          const reviewOrderId = review.orderId?.toString();
          return (
            reviewProductId === productIdStr && reviewOrderId === orderIdStr
          );
        });
      });
    });

    const count = reviewedOrders.length;
    console.log("Reviewed orders count:", count);
    return count;
  }, [orders, userReviews]);

  // Helper function to check if an item has been reviewed
  const isItemReviewed = useCallback(
    (item, orderId) => {
      const productId = item.productId?._id || item.productId;
      const productIdStr = productId?.toString();
      const orderIdStr = orderId?.toString();

      return userReviews.some((review) => {
        const reviewProductId = review.productId?.toString();
        const reviewOrderId = review.orderId?.toString();
        return reviewProductId === productIdStr && reviewOrderId === orderIdStr;
      });
    },
    [userReviews]
  );

  // Helper function to get review for an item
  const getItemReview = useCallback(
    (item, orderId) => {
      const productId = item.productId?._id || item.productId;
      const productIdStr = productId?.toString();
      const orderIdStr = orderId?.toString();

      return userReviews.find((review) => {
        const reviewProductId = review.productId?.toString();
        const reviewOrderId = review.orderId?.toString();
        return reviewProductId === productIdStr && reviewOrderId === orderIdStr;
      });
    },
    [userReviews]
  );

  // Helper function to handle edit review
  const handleEditReview = (item, orderId, existingReview) => {
    console.log("=== EDIT REVIEW DEBUG ===");
    console.log("Item:", item);
    console.log("Order ID:", orderId);
    console.log("Existing Review:", existingReview);
    console.log("🖼️ Existing Review Images:", {
      hasImages: !!existingReview?.images,
      imageCount: existingReview?.images?.length || 0,
      images: existingReview?.images,
    });

    // Extract productId from item
    let productId;
    if (item.productId && typeof item.productId === "object") {
      productId = item.productId._id;
    } else if (item.productId) {
      productId = item.productId;
    } else {
      productId = item._id;
    }

    // Extract product info for display
    const productInfo = {
      name: item.name || item.productId?.name || "Sản phẩm",
      image: item.image || item.productId?.image,
      quantity: item.quantity,
    };

    setReviewModal({
      isOpen: true,
      productId,
      orderId,
      existingReview,
      isEditing: true,
      productInfo,
    });
  };

  // Handle image upload for reviews

  useEffect(() => {
    if (!userInfo) {
      navigate("/signin");
      return;
    }
    fetchUserOrders();
    fetchUserReviews();

    // Set active tab from URL query parameter
    const tabFromUrl = searchParams.get("tab");
    if (
      tabFromUrl &&
      [
        "all",
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "not-reviewed",
        "reviewed",
        "cancelled",
      ].includes(tabFromUrl)
    ) {
      setActiveTab(tabFromUrl);
    }
  }, [userInfo, navigate, fetchUserOrders, fetchUserReviews, searchParams]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Define order status tabs
  const orderTabs = [
    {
      key: "all",
      label: "Tất cả đơn hàng",
      icon: FaListAlt,
      count: orders.length,
    },
    {
      key: "pending",
      label: "Chờ xử lý",
      icon: FaClock,
      count: orders.filter((order) => order.status === "pending").length,
    },
    {
      key: "confirmed",
      label: "Đã xác nhận",
      icon: FaCheckCircle,
      count: orders.filter(
        (order) =>
          order.status === "confirmed" || order.status === "partially-shipped"
      ).length,
    },
    {
      key: "shipped",
      label: "Đang giao hàng",
      icon: FaTruck,
      count: (() => {
        const allExpanded = expandOrdersWithDeliveries(orders);
        return allExpanded.filter(
          (order) =>
            (order.isDeliveryRow &&
              order.currentDelivery.status === "shipped") ||
            (!order.isDeliveryRow &&
              !order.isUndeliveredRow &&
              order.status === "shipped")
        ).length;
      })(),
    },
    {
      key: "delivered",
      label: "Đã giao hàng",
      icon: FaBox,
      count: (() => {
        const allExpanded = expandOrdersWithDeliveries(orders);
        return allExpanded.filter(
          (order) => order.displayStatus === "delivered"
        ).length;
      })(),
    },
    {
      key: "not-reviewed",
      label: "Chưa đánh giá",
      icon: FaStar,
      count: getNotReviewedItemsCount(),
    },
    {
      key: "reviewed",
      label: "Đã đánh giá",
      icon: FaCheckCircle,
      count: getReviewedItemsCount(),
    },
    {
      key: "cancelled",
      label: "Đã hủy",
      icon: FaBan,
      count: orders.filter((order) => order.status === "cancelled").length,
    },
  ];

  const filteredOrders = React.useMemo(() => {
    if (activeTab === "all") {
      return orders;
    }
    if (activeTab === "not-reviewed") {
      // Tab chưa đánh giá: chỉ hiển thị đơn hàng đã giao và có sản phẩm chưa đánh giá
      console.log("=== FILTERING NOT-REVIEWED ===");
      console.log("Total orders:", orders.length);
      console.log("User reviews:", userReviews.length);

      const filtered = orders.filter((order) => {
        // Chỉ những đơn hàng đã giao mới có thể được đánh giá
        if (order.status !== "delivered") return false;

        const hasUnreviewedItems = order.items.some((item) => {
          const productId = item.productId?._id || item.productId;
          const productIdStr = productId?.toString();
          const orderIdStr = order._id?.toString();

          const hasReview = userReviews.some((review) => {
            const reviewProductId = review.productId?.toString();
            const reviewOrderId = review.orderId?.toString();

            const match =
              reviewProductId === productIdStr && reviewOrderId === orderIdStr;

            if (match) {
              console.log("Found review match:", {
                productId: productIdStr,
                orderId: orderIdStr,
                reviewId: review._id,
              });
            }

            return match;
          });

          return !hasReview;
        });

        return hasUnreviewedItems;
      });

      console.log("Filtered not-reviewed orders:", filtered.length);
      return filtered;
    }
    if (activeTab === "reviewed") {
      // Tab đã đánh giá: chỉ hiển thị đơn hàng có sản phẩm đã đánh giá
      console.log("=== FILTERING REVIEWED ===");

      const filtered = orders.filter((order) => {
        // Chỉ những đơn hàng đã giao mới có thể được đánh giá
        if (order.status !== "delivered") return false;

        return order.items.some((item) => {
          const productId = item.productId?._id || item.productId;
          const productIdStr = productId?.toString();
          const orderIdStr = order._id?.toString();

          const hasReview = userReviews.some((review) => {
            const reviewProductId = review.productId?.toString();
            const reviewOrderId = review.orderId?.toString();

            return (
              reviewProductId === productIdStr && reviewOrderId === orderIdStr
            );
          });

          return hasReview;
        });
      });

      console.log("Filtered reviewed orders:", filtered.length);
      return filtered;
    }
    if (activeTab === "shipped") {
      return orders.filter(
        (order) =>
          order.status === "shipped" || order.status === "partially-shipped"
      );
    }
    return orders.filter((order) => order.status === activeTab);
  }, [orders, activeTab, userReviews]);

  const sortedOrders = React.useMemo(() => {
    const allExpanded = expandOrdersWithDeliveries(orders);

    const tabFiltered = allExpanded.filter((order) => {
      if (activeTab === "all") return true;
      if (activeTab === "pending") return order.displayStatus === "pending";
      if (activeTab === "confirmed") {
        return (
          order.displayStatus === "confirmed" ||
          (order.isUndeliveredRow && order.status === "partially-shipped")
        );
      }
      if (activeTab === "shipped") {
        return (
          (order.isDeliveryRow && order.currentDelivery.status === "shipped") ||
          (!order.isDeliveryRow &&
            !order.isUndeliveredRow &&
            order.status === "shipped")
        );
      }
      if (activeTab === "delivered") {
        return order.displayStatus === "delivered";
      }
      if (activeTab === "cancelled") {
        return order.displayStatus === "cancelled";
      }
      if (activeTab === "reviewed") {
        // Đơn hàng đã giao và có ít nhất một đánh giá
        if (order.displayStatus !== "delivered") return false;
        return order.displayItems.some((item) =>
          isItemReviewed(item, order._id)
        );
      }
      if (activeTab === "not-reviewed") {
        // Đơn hàng đã giao và có ít nhất một sản phẩm chưa được đánh giá
        if (order.displayStatus !== "delivered") return false;
        return order.displayItems.some(
          (item) => !isItemReviewed(item, order._id)
        );
      }
      // Fallback for other tabs if any
      return false;
    });

    // Sắp xếp danh sách đã lọc
    if (sortConfig !== null) {
      tabFiltered.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case "date":
            aValue = new Date(a.date);
            bValue = new Date(b.date);
            break;
          case "amount":
            aValue = a.displayAmount;
            bValue = b.displayAmount;
            break;
          case "status":
            aValue = a.displayStatus;
            bValue = b.displayStatus;
            break;
          default: // Sắp xếp theo ID
            aValue = a.displayId;
            bValue = b.displayId;
            break;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return tabFiltered;
  }, [orders, activeTab, sortConfig, userReviews]);

  const viewOrderDetail = (order) => {
    navigate(`/checkout/${order._id}`);
  };

  const handleAddOrderToCart = async (order, e) => {
    e.stopPropagation(); // ngăn chặn modal mở ra

    // mở modal xác nhận
    setConfirmModal({
      isOpen: true,
      order: order,
    });
  };

  const handleOpenReviewModal = (product, orderId) => {
    console.log("=== DEBUG NEW REVIEW MODAL ===");
    console.log("Product data:", product);
    console.log("Product ID:", product.productId);
    console.log("Order ID:", orderId);

    // Extract productId from product
    let productId;
    if (product.productId && typeof product.productId === "object") {
      productId = product.productId._id;
    } else if (product.productId) {
      productId = product.productId;
    } else {
      productId = product._id;
    }

    // Extract product info for display
    const productInfo = {
      name: product.name || product.productId?.name || "Sản phẩm",
      image: product.image || product.productId?.image,
      quantity: product.quantity,
    };

    setReviewModal({
      isOpen: true,
      productId,
      orderId,
      existingReview: null,
      isEditing: false,
      productInfo,
    });
  };

  // Handle review submission callback from ReviewForm
  const handleReviewSubmitted = async (newReview) => {
    console.log("=== REVIEW SUBMITTED SUCCESSFULLY ===");
    console.log("New review data:", newReview);

    const isEditing = reviewModal.isEditing;
    const productId = reviewModal.productId;

    const successMessage = isEditing
      ? "Đánh giá đã được cập nhật thành công!"
      : "Đánh giá đã được gửi thành công!";

    toast.success(successMessage, {
      duration: 4000,
      icon: "🎉",
    });

    // Signal that reviews have been updated for this product
    // This will help product detail pages know to refresh
    if (productId) {
      const reviewUpdateSignal = {
        productId: productId,
        timestamp: Date.now(),
        action: isEditing ? "updated" : "created",
      };
      localStorage.setItem(
        "reviewUpdateSignal",
        JSON.stringify(reviewUpdateSignal)
      );
      console.log("📡 Review update signal sent:", reviewUpdateSignal);

      // Auto-clear signal after 30 seconds to prevent stale signals
      setTimeout(() => {
        const currentSignal = localStorage.getItem("reviewUpdateSignal");
        if (currentSignal) {
          try {
            const parsedSignal = JSON.parse(currentSignal);
            if (parsedSignal.timestamp === reviewUpdateSignal.timestamp) {
              localStorage.removeItem("reviewUpdateSignal");
              console.log("🧹 Review update signal auto-cleared");
            }
          } catch (error) {
            console.error("Error clearing review signal:", error);
          }
        }
      }, 30000);
    }

    handleCloseReviewModal();

    // Refresh data immediately and properly
    console.log("=== REFRESHING DATA AFTER REVIEW SUBMIT ===");
    try {
      setLoading(true);

      // Fetch reviews first, then orders
      await fetchUserReviews();
      console.log("✅ User reviews refreshed");

      await fetchUserOrders();
      console.log("✅ User orders refreshed");

      // Force a brief re-render to ensure UI updates
      setTimeout(() => {
        setLoading(false);
        console.log("✅ Data refresh completed");
      }, 200);
    } catch (error) {
      console.error("❌ Error refreshing data after review submit:", error);
      setLoading(false);
      toast.error("Có lỗi khi cập nhật dữ liệu. Vui lòng refresh trang.");
    }
  };

  const handleCloseReviewModal = () => {
    setReviewModal({
      isOpen: false,
      productId: null,
      orderId: null,
      existingReview: null,
      isEditing: false,
      productInfo: null,
    });
  };

  const confirmAddToCart = async () => {
    const order = confirmModal.order;

    try {
      let addedCount = 0;
      let updatedCount = 0;

      // thêm từng sản phẩm vào giỏ hàng (sử dụng displayItems để chỉ thêm các sản phẩm hiển thị)
      order.displayItems.forEach((item) => {
        const existingCartItem = cartProducts.find(
          (cartItem) => cartItem._id === (item.productId || item._id)
        );

        const cartItem = {
          _id: item.productId || item._id, // xử lý cả productId và _id
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          // thêm các trường bổ sung cần thiết cho chức năng giỏ hàng
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

      // tạo thông báo thành công mô tả hơn
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

      // hiển thị thông báo thêm với tùy chọn xem giỏ hàng
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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
      case "Chờ xử lý":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
      case "Đã xác nhận":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "partially-shipped":
      case "Giao một phần":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
      case "Đang giao":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
      case "Đã giao hàng":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
      case "Đã hủy":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
      case "Chờ xử lý":
        return <FaClock className="w-4 h-4" />;
      case "confirmed":
      case "Đã xác nhận":
        return <FaCheckCircle className="w-4 h-4" />;
      case "partially-shipped":
      case "Giao một phần":
        return <FaTruck className="w-4 h-4" />;
      case "shipped":
      case "Đang giao":
        return <FaTruck className="w-4 h-4" />;
      case "delivered":
      case "Đã giao hàng":
        return <FaBox className="w-4 h-4" />;
      case "cancelled":
      case "Đã hủy":
        return <FaTimes className="w-4 h-4" />;
      default:
        return <FaClock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
      case "Chờ thanh toán":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paid":
      case "Đã thanh toán":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
      case "Thanh toán thất bại":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "confirmed":
        return "Đã xác nhận";
      case "partially-shipped":
        return "Giao một phần";
      case "shipped":
        return "Đang giao";
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
              onClick={fetchUserOrders}
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
    <div className="min-h-[60vh] bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <Container className="py-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaShoppingBag className="w-8 h-8" />
              Đơn Hàng Của Tôi
            </h1>
            <nav className="flex text-sm text-gray-500">
              <Link to="/" className="hover:text-gray-700 transition-colors">
                Trang Chủ
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Đơn Hàng</span>
            </nav>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {/* Order Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            {/* Desktop Tabs */}
            <nav className="-mb-px hidden md:flex space-x-4">
              {orderTabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                          isActive
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Tabs - Scrollable */}
            <nav className="-mb-px flex md:hidden space-x-4 overflow-x-auto">
              {orderTabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`whitespace-nowrap flex flex-col items-center gap-1 py-3 px-3 border-b-2 font-medium text-xs transition-colors min-w-0 ${
                      isActive
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <IconComponent className="w-4 h-4" />
                      {tab.count > 0 && (
                        <span
                          className={`py-0.5 px-1.5 rounded-full text-xs font-medium ${
                            isActive
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs truncate max-w-16">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <FaShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Không Có Đơn Hàng
              </h2>
              <p className="text-gray-600 mb-8">
                Bạn chưa đặt bất kỳ đơn hàng nào. Bắt đầu mua hàng để xem đơn
                hàng của bạn ở đây!
              </p>
              <Link to="/shop">
                <button className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium">
                  Bắt Đầu Mua Hàng
                </button>
              </Link>
            </div>
          </motion.div>
        ) : sortedOrders.length === 0 ? (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              {activeTab === "all" ? (
                <FaShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              ) : (
                (() => {
                  const TabIcon =
                    orderTabs.find((tab) => tab.key === activeTab)?.icon ||
                    FaShoppingBag;
                  return (
                    <TabIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                  );
                })()
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {activeTab === "all"
                  ? "Không Có Đơn Hàng"
                  : `Không Có Đơn Hàng ${
                      orderTabs.find((tab) => tab.key === activeTab)?.label
                    }`}
              </h2>
              <p className="text-gray-600 mb-8">
                {activeTab === "all"
                  ? "Bạn chưa đặt bất kỳ đơn hàng nào. Bắt đầu mua hàng để xem đơn hàng của bạn ở đây!"
                  : `Hiện tại bạn không có đơn hàng nào ở trạng thái "${
                      orderTabs.find((tab) => tab.key === activeTab)?.label
                    }".`}
              </p>
              {activeTab === "all" && (
                <Link to="/shop">
                  <button className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors font-medium">
                    Bắt Đầu Mua Hàng
                  </button>
                </Link>
              )}
            </div>
          </motion.div>
        ) : activeTab === "review" ? (
          // Giao diện đánh giá riêng
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {sortedOrders.length} đơn hàng đã giao hàng có thể đánh giá
              </p>
              <button
                onClick={fetchUserOrders}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Làm mới
              </button>
            </div>

            {/* Review Cards */}
            <div className="grid gap-6">
              {sortedOrders.map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {/* Fix lỗi trong phần hiển thị Order ID */}
                      <h3 className="font-semibold text-gray-900">
                        Đơn hàng #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Giao thành công:{" "}
                        {new Date(order.date).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        <PriceFormat amount={order.amount} />
                      </div>
                    </div>
                  </div>

                  {/* Danh sách sản phẩm để đánh giá */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">
                      Sản phẩm trong đơn hàng:
                    </h4>
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Số lượng: {item.quantity}
                            </p>
                          </div>
                        </div>
                        {order.status === "delivered" &&
                          (isItemReviewed(item, order._id) ? (
                            <div className="flex items-center gap-2">
                              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                                <FaCheckCircle className="w-4 h-4" />
                                Đã đánh giá (
                                {getItemReview(item, order._id)?.rating}/5 sao)
                              </div>
                              {/* Edit Review Button */}
                              <button
                                onClick={() =>
                                  handleEditReview(
                                    item,
                                    order._id,
                                    getItemReview(item, order._id)
                                  )
                                }
                                className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium flex items-center gap-2"
                                title="Chỉnh sửa đánh giá"
                              >
                                <FaStar className="w-4 h-4" />
                                Sửa
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                handleOpenReviewModal(item, order._id)
                              }
                              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              <FaStar className="w-4 h-4" />
                              Đánh giá
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {sortedOrders.length} đơn hàng
                {sortedOrders.length !== 1 ? "" : ""} được tìm thấy{" "}
                {activeTab !== "all" &&
                  `trong "${
                    orderTabs.find((tab) => tab.key === activeTab)?.label
                  }"`}
              </p>
              <button
                onClick={fetchUserOrders}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Làm Mới
              </button>
            </div>

            {/* Table View - Desktop */}
            <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Enable horizontal scroll if columns overflow, so long labels like "Đã hủy" remain visible */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        <button
                          onClick={() => handleSort("_id")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          ID Đơn
                          {sortConfig.key === "_id" ? (
                            sortConfig.direction === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        <button
                          onClick={() => handleSort("date")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          Ngày Đặt
                          {sortConfig.key === "date" ? (
                            sortConfig.direction === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Sản Phẩm
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        <button
                          onClick={() => handleSort("amount")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          Tổng Tiền
                          {sortConfig.key === "amount" ? (
                            sortConfig.direction === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        <button
                          onClick={() => handleSort("status")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          Trạng Thái
                          {sortConfig.key === "status" ? (
                            sortConfig.direction === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Thanh Toán
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Hành Động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedOrders.map((order) => (
                      <motion.tr
                        key={order.displayId} // Sử dụng displayId duy nhất
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => viewOrderDetail(order)}
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">
                            #
                            {order.isDeliveryRow
                              ? `${order._id.slice(-8).toUpperCase()}-D${
                                  order.deliveryIndex + 1
                                }`
                              : order._id.slice(-8).toUpperCase()}
                          </div>
                          {order.isUndeliveredRow &&
                            order.status !== "delivered" && (
                              <span className="text-xs text-yellow-600 font-semibold">
                                Chờ giao
                              </span>
                            )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {new Date(order.date).toLocaleDateString("vi-VN")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.date).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="flex -space-x-2 mr-2">
                              {order.displayItems
                                .slice(0, 3)
                                .map((item, idx) => (
                                  <img
                                    key={item._id || idx}
                                    src={item.image}
                                    alt={item.name}
                                    className="w-6 h-6 object-cover rounded-full border-2 border-white"
                                    title={item.name}
                                  />
                                ))}
                            </div>
                            <span className="text-xs text-gray-600">
                              {order.displayItems.length} sản phẩm
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-900">
                            <PriceFormat amount={order.displayAmount} />
                          </div>
                        </td>
                        {/* Trạng thái của dòng (lần giao hoặc đơn hàng) */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                              order.displayStatus
                            )}`}
                          >
                            {getStatusIcon(order.displayStatus)}
                            <span className="hidden sm:inline">
                              {translateStatus(order.displayStatus)}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                              order.paymentStatus
                            )}`}
                          >
                            {order.paymentMethod === "cod" ? (
                              <FaMoneyBillWave className="w-3 h-3" />
                            ) : (
                              <FaCreditCard className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">
                              {translatePaymentStatus(order.paymentStatus)}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs font-medium">
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewOrderDetail(order);
                              }}
                              className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                              title="Xem Chi Tiết"
                            >
                              <FaEye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleAddOrderToCart(order, e)}
                              className="text-green-600 hover:text-green-900 transition-colors p-1"
                              title="Thêm Vào Giỏ Hàng"
                            >
                              <FaShoppingCart className="w-3 h-3" />
                            </button>
                            <Link
                              to={`/checkout/${order._id}`}
                              className="text-gray-600 hover:text-gray-900 transition-colors p-1 inline-block"
                              title="Chi Tiết Đơn Hàng"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaShoppingBag className="w-3 h-3" />
                            </Link>
                            {/* Payment Button */}
                            {order.paymentStatus === "pending" &&
                              !order.isDeliveryRow &&
                              !order.isUndeliveredRow && (
                                <Link
                                  to={`/checkout/${order._id}`}
                                  className="text-orange-600 hover:text-orange-900 transition-colors p-1 inline-block"
                                  title="Thanh Toán Ngay"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FaCreditCard className="w-3 h-3" />
                                </Link>
                              )}
                            {/* Review Button */}
                            {order.displayStatus === "delivered" &&
                              order.displayItems.some(
                                (item) => !isItemReviewed(item, order._id)
                              ) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const unreviewedItem =
                                      order.displayItems.find(
                                        (item) =>
                                          !isItemReviewed(item, order._id)
                                      );
                                    if (unreviewedItem) {
                                      handleOpenReviewModal(
                                        unreviewedItem,
                                        order._id
                                      );
                                    }
                                  }}
                                  className="text-yellow-600 hover:text-yellow-900 transition-colors p-1"
                                  title="Đánh giá sản phẩm"
                                >
                                  <FaStar className="w-3 h-3" />
                                </button>
                              )}
                            {/* Edit Review Button */}
                            {order.displayStatus === "delivered" &&
                              order.displayItems.some((item) =>
                                isItemReviewed(item, order._id)
                              ) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const reviewedItem =
                                      order.displayItems.find((item) =>
                                        isItemReviewed(item, order._id)
                                      );
                                    if (reviewedItem) {
                                      handleEditReview(
                                        reviewedItem,
                                        order._id,
                                        getItemReview(reviewedItem, order._id)
                                      );
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                  title="Chỉnh sửa đánh giá"
                                >
                                  <FaStar className="w-3 h-3" />
                                </button>
                              )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card View - Mobile */}
            <div className="md:hidden space-y-4">
              {sortedOrders.map((order) => (
                <motion.div
                  key={order.displayId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer"
                  onClick={() => viewOrderDetail(order)}
                >
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        #
                        {order.isDeliveryRow
                          ? `${order._id.slice(-8).toUpperCase()}-D${
                              order.deliveryIndex + 1
                            }`
                          : order._id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        <PriceFormat amount={order.displayAmount} />
                      </div>
                    </div>
                  </div>

                  {/* Order Status */}
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        order.displayStatus
                      )}`}
                    >
                      {getStatusIcon(order.displayStatus)}
                      {translateStatus(order.displayStatus)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                        order.paymentStatus
                      )}`}
                    >
                      {order.paymentMethod === "cod" ? (
                        <FaMoneyBillWave className="w-3 h-3" />
                      ) : (
                        <FaCreditCard className="w-3 h-3" />
                      )}
                      {translatePaymentStatus(order.paymentStatus)}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex items-center">
                      <div className="flex -space-x-2 mr-2">
                        {order.displayItems.slice(0, 3).map((item, idx) => (
                          <img
                            key={item._id || idx}
                            src={item.image}
                            alt={item.name}
                            className="w-8 h-8 object-cover rounded-full border-2 border-white"
                            title={item.name}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {order.displayItems.length} sản phẩm
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewOrderDetail(order);
                        }}
                        className="text-blue-600 hover:text-blue-900 transition-colors text-xs font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={(e) => handleAddOrderToCart(order, e)}
                        className="text-green-600 hover:text-green-900 transition-colors text-xs font-medium px-2 py-1 rounded border border-green-200 hover:bg-green-50"
                      >
                        Thêm giỏ
                      </button>
                      {/* Nút Đánh giá cho Mobile */}
                      {order.displayStatus === "delivered" &&
                        order.displayItems.some(
                          (item) => !isItemReviewed(item, order._id)
                        ) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const unreviewedItem = order.displayItems.find(
                                (item) => !isItemReviewed(item, order._id)
                              );
                              if (unreviewedItem) {
                                handleOpenReviewModal(
                                  unreviewedItem,
                                  order._id
                                );
                              }
                            }}
                            className="text-yellow-600 hover:text-yellow-900 transition-colors text-xs font-medium px-2 py-1 rounded border border-yellow-200 hover:bg-yellow-50 flex items-center gap-1"
                          >
                            <FaStar className="w-3 h-3" />
                            Đánh giá
                          </button>
                        )}
                      {/* Nút Sửa Đánh giá cho Mobile */}
                      {order.displayStatus === "delivered" &&
                        order.displayItems.some((item) =>
                          isItemReviewed(item, order._id)
                        ) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const reviewedItem = order.displayItems.find(
                                (item) => isItemReviewed(item, order._id)
                              );
                              if (reviewedItem) {
                                handleEditReview(
                                  reviewedItem,
                                  order._id,
                                  getItemReview(reviewedItem, order._id)
                                );
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors text-xs font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 flex items-center gap-1"
                          >
                            <FaStar className="w-3 h-3" />
                            Sửa đánh giá
                          </button>
                        )}
                    </div>
                    {order.paymentStatus === "pending" &&
                      !order.isDeliveryRow &&
                      !order.isUndeliveredRow && (
                        <Link
                          to={`/checkout/${order._id}`}
                          className="text-orange-600 hover:text-orange-900 transition-colors text-xs font-medium px-2 py-1 rounded border border-orange-200 hover:bg-orange-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Thanh toán
                        </Link>
                      )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
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
                    {confirmModal.order.displayItems.length} item
                    {confirmModal.order.displayItems.length !== 1
                      ? "s"
                      : ""}{" "}
                    vào giỏ hàng của bạn.
                  </p>

                  {/* Order Items Preview */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-6 max-h-40 overflow-y-auto">
                    <div className="text-xs text-gray-500 mb-2 flex justify-between font-medium">
                      <span>Sản Phẩm Để Thêm:</span>
                      <span>Số Lượng × Đơn Giá</span>
                    </div>
                    {confirmModal.order.displayItems.map((item, index) => {
                      const isInCart = cartProducts.find(
                        (cartItem) =>
                          cartItem._id === (item.productId || item._id)
                      );
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm py-1 border-b border-gray-200 last:border-b-0"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-8 h-8 object-cover rounded mr-2 flex-shrink-0"
                              />
                            )}
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-gray-700 truncate">
                                {item.name}
                              </span>
                              {isInCart && (
                                <span className="text-xs text-blue-600">
                                  Đã có trong giỏ hàng (số lượng:{" "}
                                  {isInCart.quantity}) - sẽ được cập nhật
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-gray-500 ml-2 flex items-center gap-2">
                            <span className="text-xs">x{item.quantity}</span>
                            <span className="text-xs">×</span>
                            <PriceFormat amount={item.price} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-2 mt-2 border-t border-gray-300">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Tổng Tiền:</span>
                        <PriceFormat amount={confirmModal.order.amount} />
                      </div>
                    </div>
                  </div>

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

        {/* Review Form Modal */}
        <AnimatePresence>
          {reviewModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <ReviewForm
                    productId={reviewModal.productId}
                    orderId={reviewModal.orderId}
                    existingReview={reviewModal.existingReview}
                    onReviewSubmitted={handleReviewSubmitted}
                    onCancel={handleCloseReviewModal}
                    isEditing={reviewModal.isEditing}
                    productInfo={reviewModal.productInfo}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
};

export default Order;
