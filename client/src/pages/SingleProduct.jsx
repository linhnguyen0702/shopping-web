import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PriceFormat from "../components/PriceFormat";
import Container from "../components/Container";
import {
  MdStar,
  MdFavoriteBorder,
  MdShare,
  MdFavorite,
  MdEdit,
  MdAdd,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { getData } from "../helpers/index";
import { serverUrl } from "../../config";
import { addToCart } from "../redux/orebiSlice";
import ReviewForm from "../components/ReviewForm";
import { addToFavorites, removeFromFavorites } from "../redux/favoriteSlice";
import {
  addToWishlistAsync,
  removeFromWishlistAsync,
} from "../redux/wishlistThunks";
import { updateUserCart } from "../services/cartService";
import toast from "react-hot-toast";

const SingleProduct = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scrollContainerRef = useRef(null);

  // Redux state - consolidated at top
  const favorites = useSelector(
    (state) => state.favoriteReducer?.favorites || []
  );
  const products = useSelector((state) => state.orebiReducer.products);
  const user = useSelector((state) => state.orebiReducer.userInfo);

  // Component state
  const [productInfo, setProductInfo] = useState({});
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  // Review form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [userCanReview, setUserCanReview] = useState(false);
  const [userReviewData, setUserReviewData] = useState(null);
  const [modalGallery, setModalGallery] = useState({ open: false, images: [], index: 0 });
  
  // Computed values - moved after state declarations
  const isLiked = favorites.some((fav) => fav._id === productInfo._id);

  // Fetch product reviews
  const fetchProductReviews = useCallback(async (productId) => {
    if (!productId) {
      console.log("❌ fetchProductReviews: No productId provided");
      return;
    }

    try {
      console.log("=== 🔍 FETCHING REVIEWS START ===");
      console.log("Product ID:", productId);
      console.log("Product ID type:", typeof productId);
      console.log("Product ID length:", productId.length);

      setReviewsLoading(true);
      const url = `${serverUrl}/api/product/${productId}/reviews`;
      console.log("Fetching from URL:", url);
      console.log("Server URL:", serverUrl);

      const response = await fetch(url);
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();
      console.log("Response data structure:", {
        success: data.success,
        reviewsCount: data.reviews?.length || 0,
        message: data.message,
        error: data.error,
      });
      console.log("Full response data:", data);

      if (data.success && data.reviews) {
        console.log("✅ Reviews found:", data.reviews.length);
        console.log("Sample reviews:", data.reviews.slice(0, 2));

        // Debug review images specifically
        data.reviews.forEach((review, index) => {
          console.log(`Review ${index + 1} images:`, {
            hasImages: !!review.images,
            imageCount: review.images?.length || 0,
            images: review.images,
          });
        });

        setProductReviews(data.reviews);

        // Calculate average rating
        if (data.reviews.length > 0) {
          const totalRating = data.reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          const avgRating = totalRating / data.reviews.length;
          console.log("✅ Average rating calculated:", avgRating);
          setAverageRating(avgRating);
        } else {
          console.log("ℹ️ No reviews to calculate average");
          setAverageRating(0);
        }
      } else {
        console.log("❌ No reviews found or API error:", {
          success: data.success,
          hasReviews: !!data.reviews,
          message: data.message,
        });
        setProductReviews([]);
        setAverageRating(0);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setProductReviews([]);
      setAverageRating(0);
    } finally {
      setReviewsLoading(false);
      console.log("=== END FETCHING REVIEWS ===");
    }
  }, []);

  // Check if user can review this product
  const checkUserCanReview = useCallback(
    async (productId) => {
      if (!user?._id || !productId) {
        setUserCanReview(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUserCanReview(false);
          return;
        }

        // Check user's orders to see if they can review this product
        const response = await fetch(`${serverUrl}/api/user/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const deliveredOrders = data.orders?.filter(
            (order) =>
              order.status === "delivered" &&
              order.items.some((item) => item.productId === productId)
          );

          if (deliveredOrders?.length > 0) {
            // Check if user already reviewed this product
            const userReview = productReviews.find(
              (review) => review.userId?._id === user._id
            );

            if (userReview) {
              setUserReviewData({
                orderId: deliveredOrders[0]._id,
                existingReview: userReview,
              });
              setUserCanReview(false); // Already reviewed
            } else {
              setUserReviewData({
                orderId: deliveredOrders[0]._id,
                existingReview: null,
              });
              setUserCanReview(true); // Can review
            }
          } else {
            setUserCanReview(false);
          }
        }
      } catch (error) {
        console.error("Error checking review status:", error);
        setUserCanReview(false);
      }
    },
    [user, productReviews]
  );

  // Handle review submission
  const handleReviewSubmitted = useCallback(
    (newReview) => {
      // Add new review to list or update existing
      if (editingReview) {
        setProductReviews((prev) =>
          prev.map((review) =>
            review._id === editingReview._id ? newReview : review
          )
        );
        setEditingReview(null);
      } else {
        setProductReviews((prev) => [newReview, ...prev]);
        setUserCanReview(false);
        setUserReviewData((prev) => ({
          ...prev,
          existingReview: newReview,
        }));
      }

      setShowReviewForm(false);

      // Recalculate average rating
      const allReviews = editingReview
        ? productReviews.map((r) =>
            r._id === editingReview._id ? newReview : r
          )
        : [newReview, ...productReviews];

      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const avgRating = totalRating / allReviews.length;
        setAverageRating(avgRating);
      }
    },
    [editingReview, productReviews]
  );

  // Check scroll buttons
  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const fetchProductData = async () => {
      console.log("=== 🚀 FETCHING PRODUCT DATA ===");
      // Lấy product ID từ URL
      const pathParts = location.pathname.split("/");
      const productId = pathParts[pathParts.length - 1];
      console.log("URL pathname:", location.pathname);
      console.log("Extracted productId from URL:", productId);
      console.log("Location state:", location.state);

      // Nếu có state được truyền từ trang khác (như ProductCard)
      if (location.state?.item) {
        console.log("✅ Using product from location.state");
        console.log("Product from state:", location.state.item);
        setProductInfo(location.state.item);
        return;
      }

      // Nếu không có state, fetch từ API (như từ Cart hoặc direct URL)
      if (productId) {
        console.log("🌐 Fetching product from API with ID:", productId);
        setLoading(true);
        try {
          const apiUrl = `${serverUrl}/api/product/${productId}`;
          console.log("API URL:", apiUrl);

          const response = await getData(apiUrl);
          console.log("API response:", response);

          if (response?.success && response?.product) {
            console.log("✅ Product loaded from API:", response.product);
            setProductInfo(response.product);
          } else {
            console.log("❌ API response unsuccessful:", response);
            // Fallback: Tìm trong danh sách sản phẩm có sẵn
            console.log(
              "Không tìm thấy sản phẩm từ API, tìm trong danh sách local..."
            );
            toast.error("Không tìm thấy thông tin sản phẩm");
            navigate("/shop");
          }
        } catch (error) {
          console.error("❌ Lỗi khi lấy thông tin sản phẩm:", error);
          toast.error("Có lỗi xảy ra khi tải sản phẩm");
          navigate("/shop");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProductData();
  }, [location, navigate]);

  // Fetch related products based on category
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (productInfo?.category) {
        setLoadingRelated(true);
        try {
          // Fetch ALL products from the same category (remove limit)
          const response = await getData(
            `${serverUrl}/api/products?category=${productInfo.category}`
          );

          if (response?.success && response?.products) {
            // Filter out the current product
            const filtered = response.products.filter(
              (product) => product._id !== productInfo._id
            );
            setRelatedProducts(filtered);
          }
        } catch (error) {
          console.error("Lỗi khi lấy sản phẩm liên quan:", error);
        } finally {
          setLoadingRelated(false);
        }
      }
    };

    fetchRelatedProducts();
  }, [productInfo]);

  // Fetch product reviews when productInfo changes
  useEffect(() => {
    console.log("=== 📦 PRODUCT INFO CHANGED ===");
    console.log("Product Info exists:", !!productInfo);
    console.log("Product Info keys:", Object.keys(productInfo || {}));
    console.log("Product ID:", productInfo?._id);
    console.log("Product name:", productInfo?.name);
    console.log("Product status:", productInfo?.status);

    if (productInfo?._id) {
      console.log("✅ Calling fetchProductReviews with ID:", productInfo._id);

      // Also test the API endpoint directly
      console.log("🧪 Testing API endpoint directly...");

      // Test both approved and all reviews
      Promise.all([
        fetch(`${serverUrl}/api/product/${productInfo._id}/reviews`).then(
          (res) => res.json()
        ),
        // You can also test without isApproved filter by creating a custom endpoint
      ])
        .then(([approvedData]) => {
          console.log("🧪 Approved reviews result:", approvedData);

          if (!approvedData.success) {
            console.log(
              "🧪 API returned success=false, message:",
              approvedData.message
            );
          } else if (approvedData.reviews) {
            console.log(
              "🧪 Approved reviews found:",
              approvedData.reviews.length
            );
            if (approvedData.reviews.length === 0) {
              console.log(
                "🧪 No approved reviews in database for this product"
              );
              console.log(
                "💡 Suggestion: Check if reviews exist but are not approved"
              );
            } else {
              console.log(
                "🧪 Sample approved review:",
                approvedData.reviews[0]
              );
            }
          }
        })
        .catch((err) => {
          console.log("🧪 Direct API test error:", err);
        });
      fetchProductReviews(productInfo._id);
    } else {
      console.log("❌ No product ID, skipping review fetch");
      console.log("ProductInfo structure:", productInfo);
    }
  }, [productInfo, fetchProductReviews]);

  // Check user review status when reviews are loaded
  useEffect(() => {
    if (productInfo?._id && productReviews.length >= 0) {
      checkUserCanReview(productInfo._id);
    }
  }, [productReviews, checkUserCanReview, productInfo?._id]);

  // Check scroll buttons when related products change
  useEffect(() => {
    if (relatedProducts.length > 0) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(checkScrollButtons, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [relatedProducts, checkScrollButtons]);

  // Listen for review updates from Order page
  useEffect(() => {
    let lastProcessedTimestamp = 0;

    const handleReviewUpdate = () => {
      const signalData = localStorage.getItem("reviewUpdateSignal");
      if (signalData) {
        try {
          const signal = JSON.parse(signalData);

          // Skip if we've already processed this signal or it's too old (>30 seconds)
          const now = Date.now();
          if (
            signal.timestamp <= lastProcessedTimestamp ||
            now - signal.timestamp > 30000
          ) {
            return;
          }

          console.log("📡 Received review update signal:", signal);

          // Check if this product is affected
          if (signal.productId === productInfo?._id) {
            console.log("🔄 Refreshing reviews for current product");
            lastProcessedTimestamp = signal.timestamp;
            fetchProductReviews(productInfo._id);
            // Clear the signal after processing
            localStorage.removeItem("reviewUpdateSignal");
          }
        } catch (error) {
          console.error("❌ Error processing review update signal:", error);
        }
      }
    };

    // Check for existing signal when component mounts
    handleReviewUpdate();

    // Listen for storage events (when localStorage changes)
    window.addEventListener("storage", handleReviewUpdate);

    // Also check periodically for same-tab updates (less frequent)
    const interval = setInterval(handleReviewUpdate, 2000);

    return () => {
      window.removeEventListener("storage", handleReviewUpdate);
      clearInterval(interval);
    };
  }, [productInfo?._id, fetchProductReviews]);

  // Use product images from database if available, otherwise use mock images
  const productImages =
    productInfo?.images && productInfo.images.length > 0
      ? productInfo.images
      : [
          productInfo?.image,
          productInfo?.image,
          productInfo?.image,
          productInfo?.image,
        ].filter((img) => img); // Filter out undefined images

  const handleQuantityChange = (type) => {
    if (type === "increment") {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Handle add to favorites
  const handleLike = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng yêu thích");
      return;
    }

    try {
      if (isLiked) {
        // Remove from wishlist (database + local state)
        await dispatch(removeFromWishlistAsync(productInfo._id)).unwrap();
      } else {
        // Add to wishlist (database + local state)
        await dispatch(addToWishlistAsync(productInfo)).unwrap();
      }
    } catch (error) {
      console.error("Wishlist error:", error);

      // Check if error is related to authentication
      if (
        error?.message?.includes("token") ||
        error?.message?.includes("authentication")
      ) {
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        return;
      }

      // Fallback to local-only updates if API fails
      if (isLiked) {
        dispatch(removeFromFavorites(productInfo._id));
        toast("Đã bỏ khỏi yêu thích (chỉ cục bộ)", { icon: "💔" });
      } else {
        dispatch(addToFavorites(productInfo));
        toast.success("Đã thêm vào yêu thích (chỉ cục bộ)");
      }
    }
  };

  // Handle like for products in related products section
  const handleProductLike = async (product) => {
    const isProductLiked = favorites.some((fav) => fav._id === product._id);

    try {
      if (isProductLiked) {
        // Remove from wishlist (database + local state)
        await dispatch(removeFromWishlistAsync(product._id)).unwrap();
        toast.success("Đã bỏ khỏi yêu thích");
      } else {
        // Add to wishlist (database + local state)
        await dispatch(addToWishlistAsync(product)).unwrap();
        toast.success("Đã thêm vào yêu thích");
      }
    } catch (error) {
      console.error("Wishlist error:", error);

      // Check if error is related to authentication
      if (
        error?.message?.includes("token") ||
        error?.message?.includes("authentication")
      ) {
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        return;
      }

      // Fallback to local-only updates if API fails
      if (isProductLiked) {
        dispatch(removeFromFavorites(product._id));
        toast("Đã bỏ khỏi yêu thích ", { icon: "💔" });
      } else {
        dispatch(addToFavorites(product));
        toast.success("Đã thêm vào yêu thích ");
      }
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320, // Width of card (256px) + gap (24px) + padding
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: "smooth",
      });
    }
  };

  // Handle add to cart
  const handleAddToCart = async (e) => {
    e.preventDefault();

    // Thêm vào Redux ngay lập tức để UX mượt mà
    dispatch(addToCart({ ...productInfo, quantity }));
    toast.success("Đã thêm vào giỏ hàng");

    // Đồng bộ backend nếu đã đăng nhập (chạy background)
    const token = localStorage.getItem("token");
    if (token) {
      try {
        console.log("🛒 Đang đồng bộ giỏ hàng với server...");

        // Tính toán products mới dựa trên state hiện tại
        const existingItem = products.find((p) => p._id === productInfo._id);
        const newQuantity = existingItem
          ? existingItem.quantity + quantity
          : quantity;

        const updatedProducts = existingItem
          ? products.map((p) =>
              p._id === productInfo._id ? { ...p, quantity: newQuantity } : p
            )
          : [...products, { ...productInfo, quantity }];

        await updateUserCart(updatedProducts);
        console.log("✅ Giỏ hàng đã được đồng bộ thành công!");
      } catch (error) {
        console.error("❌ Lỗi khi đồng bộ giỏ hàng:", error);
        // Không làm gì vì UX đã được update, chỉ log lỗi để debug
      }
    }
  };

  // Handle share functionality
  const handleShare = async (e) => {
    e.preventDefault();

    const shareData = {
      title: productInfo?.name || "Sản phẩm tuyệt vời",
      text: `Xem sản phẩm "${
        productInfo?.name
      }" với giá ${productInfo?.price?.toLocaleString("vi-VN")} VNĐ`,
      url: window.location.href,
    };

    // Sử dụng Web Share API nếu hỗ trợ (mobile browsers)
    if (navigator.share && window.innerWidth <= 768) {
      try {
        await navigator.share(shareData);
        toast.success("Đã chia sẻ thành công!");
        return;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.log("Web Share API không khả dụng, fallback sang clipboard");
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Đã copy link vào clipboard!");
      setShowShareModal(true);
    } catch (error) {
      console.error("Lỗi khi copy:", error);
      toast.error("Không thể copy link");
      // Fallback cho trình duyệt cũ
      setShowShareModal(true);
    }
  };

  // Close share modal
  const closeShareModal = () => {
    setShowShareModal(false);
  };

  // Share to social platforms
  const shareToSocial = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(
      `Xem sản phẩm "${
        productInfo?.name
      }" với giá ${productInfo?.price?.toLocaleString("vi-VN")} VNĐ`
    );

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
    setShowShareModal(false);
    toast.success(`Đã mở ${platform} để chia sẻ!`);
  };

  // Show loading spinner while fetching product data
  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  // Show error if no product info found
  if (!productInfo || Object.keys(productInfo).length === 0) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-gray-600 mb-6">
            Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <button
            onClick={() => navigate("/shop")}
            className="bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            Quay lại cửa hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Container className="py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <span className="hover:text-gray-700 cursor-pointer">Home</span>
          <span>/</span>
          <span className="hover:text-gray-700 cursor-pointer capitalize">
            {productInfo?.category}
          </span>
          <span>/</span>
          <span className="text-gray-900 font-medium">{productInfo?.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div
              className="aspect-square overflow-hidden bg-gray-50 rounded-lg cursor-zoom-in relative group"
              onClick={() => setIsImageZoomed(!isImageZoomed)}
            >
              <img
                src={productImages[selectedImage] || "/placeholder-image.jpg"}
                alt={productInfo?.name}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isImageZoomed
                    ? "scale-150 cursor-zoom-out"
                    : "hover:scale-105 group-hover:scale-105"
                }`}
                onError={(e) => {
                  e.target.src = "/placeholder-image.jpg";
                }}
              />
              {!isImageZoomed && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    Click to zoom
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-3">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden bg-gray-50 rounded-lg border-2 transition-all duration-200 ${
                    selectedImage === index
                      ? "border-black"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={image || "/placeholder-image.jpg"}
                    alt={`${productInfo?.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder-image.jpg";
                    }}
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Product Title */}
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 leading-tight">
              {productInfo?.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4">
              {productInfo?.discountedPercentage > 0 && (
                <span className="text-2xl text-gray-400 line-through">
                  <PriceFormat
                    amount={
                      productInfo.price /
                      (1 - productInfo.discountedPercentage / 100)
                    }
                  />
                </span>
              )}
              <span className="text-3xl font-light text-gray-900">
                <PriceFormat amount={productInfo?.price} />
              </span>
              {productInfo?.discountedPercentage > 0 && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  Giảm {productInfo.discountedPercentage}%
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, index) => {
                  console.log(
                    `Star ${index}: ${
                      index < Math.floor(averageRating) ? "yellow" : "gray"
                    }, averageRating: ${averageRating}`
                  );
                  return (
                    <MdStar
                      key={index}
                      className={`w-5 h-5 ${
                        index < Math.floor(averageRating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-sm text-gray-600">
                {reviewsLoading ? (
                  "Đang tải..."
                ) : (
                  <>
                    Được đánh giá {averageRating.toFixed(1)} trên 5 dựa trên{" "}
                    {productReviews.length} đánh giá của khách hàng
                  </>
                )}
              </span>
            </div>

            {/* Short Description */}
            <p className="text-gray-600 leading-relaxed text-lg">
              {productInfo?.description
                ? productInfo.description.length > 150
                  ? productInfo.description.substring(0, 150) + "..."
                  : productInfo.description
                : "Sản phẩm chất lượng cao với thiết kế hiện đại và tính năng ưu việt, mang đến trải nghiệm tuyệt vời cho người sử dụng."}
            </p>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-900">
                  Số lượng:
                </label>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => handleQuantityChange("decrement")}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange("increment")}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-black text-white py-4 px-8 rounded-md hover:bg-gray-800 transition-all duration-300 font-medium uppercase tracking-wider transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Thêm vào giỏ hàng
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${
                  isLiked
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {isLiked ? (
                  <MdFavorite className="w-5 h-5" />
                ) : (
                  <MdFavoriteBorder className="w-5 h-5" />
                )}
                {isLiked
                  ? "Đã thêm vào yêu thích"
                  : "Thêm vào danh sách yêu thích"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <MdShare className="w-5 h-5" />
                Chia sẻ
              </button>
            </div>

            {/* Product Meta */}
            <div className="space-y-2 pt-4 border-t border-gray-200 text-sm">
              <p>
                <span className="font-medium">SKU:</span>{" "}
                <span className="text-gray-600">
                  {productInfo?._id?.slice(-6) || "N/A"}
                </span>
              </p>
              <p>
                <span className="font-medium">Danh mục:</span>{" "}
                <span className="text-gray-600 capitalize">
                  {productInfo?.category}
                </span>
              </p>
              {productInfo?.tags && (
                <p>
                  <span className="font-medium">Tags:</span>
                  <span className="text-gray-600">{productInfo.tags}</span>
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Product Details Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-gray-200 pt-12"
        >
          {/* Tab Navigation */}
          <div className="flex space-x-8 mb-8 border-b border-gray-200">
            {["description", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-medium uppercase tracking-wider transition-colors relative ${
                  activeTab === tab
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "reviews"
                  ? `Reviews (${
                      reviewsLoading ? "..." : productReviews.length
                    })`
                  : tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === "description" && (
              <div className="prose prose-lg max-w-none">
                <h3 className="text-2xl font-light mb-6">Mô tả chi tiết</h3>
                <div className="text-gray-600 leading-relaxed space-y-4">
                  {productInfo?.description ? (
                    productInfo.description
                      .split("\n")
                      .map((paragraph, index) =>
                        paragraph.trim() ? (
                          <p key={index} className="mb-4 last:mb-0">
                            {paragraph.trim()}
                          </p>
                        ) : (
                          <div key={index} className="h-2"></div>
                        )
                      )
                  ) : (
                    <p>Không có mô tả chi tiết.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-light">Đánh giá khách hàng</h3>
                  {userCanReview && !showReviewForm && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <MdAdd size={20} />
                      Viết đánh giá
                    </button>
                  )}
                </div>

                {/* Review Form */}
                <AnimatePresence>
                  {(showReviewForm || editingReview) && userReviewData && (
                    <ReviewForm
                      productId={productInfo._id}
                      orderId={userReviewData.orderId}
                      existingReview={editingReview}
                      onReviewSubmitted={handleReviewSubmitted}
                      onCancel={() => {
                        setShowReviewForm(false);
                        setEditingReview(null);
                      }}
                      isEditing={!!editingReview}
                    />
                  )}
                </AnimatePresence>

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="animate-pulse">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : productReviews.length > 0 ? (
                  <div className="space-y-6">
                    {productReviews.map((review) => (
                      <div
                        key={review._id}
                        className={`border border-gray-200 rounded-lg p-4 ${
                          review.userId?._id === user?._id
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={
                              review.userId?.avatar || "/api/placeholder/48/48"
                            }
                            alt={review.userId?.name || "Anonymous"}
                            className="w-12 h-12 rounded-full object-cover bg-gray-200"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium text-gray-900">
                                  {review.userId?.name || "Khách hàng ẩn danh"}
                                  {review.userId?._id === user?._id && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                      Đánh giá của bạn
                                    </span>
                                  )}
                                </h4>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map(
                                    (_, starIndex) => (
                                      <MdStar
                                        key={starIndex}
                                        className={`w-4 h-4 ${
                                          starIndex < review.rating
                                            ? "text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    )
                                  )}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    review.createdAt
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                              </div>

                              {/* Edit button for user's own review */}
                              {review.userId?._id === user?._id &&
                                !editingReview && (
                                  <button
                                    onClick={() => setEditingReview(review)}
                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    <MdEdit size={16} />
                                    Chỉnh sửa
                                  </button>
                                )}
                            </div>

                            <p className="text-gray-600 leading-relaxed mb-3">
                              {review.comment}
                            </p>

                            {/* Review Images */}
                            {review.images && review.images.length > 0 && (
                              <div className="grid grid-cols-4 gap-2 mt-3">
                                {review.images.map((imageUrl, index) => (
                                  <img
                                    key={index}
                                    src={imageUrl}
                                    alt={`Review ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                                    onClick={() => {
                                      setModalGallery({
                                        open: true,
                                        images: review.images,
                                        index,
                                      });
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      Chưa có đánh giá. Hãy là người đầu tiên để đánh giá!
                    </p>
                    {userCanReview && !showReviewForm && (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Viết đánh giá đầu tiên
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Related Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="border-t border-gray-200 pt-16 mt-16"
        >
          <div className="flex items-center justify-center mb-8">
            <h2 className="text-2xl md:text-3xl font-light text-gray-900">
              Sản phẩm liên quan
            </h2>
          </div>

          {loadingRelated ? (
            // Loading skeleton với horizontal scroll
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 w-max">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <div key={item} className="flex-shrink-0 w-64 animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-xl mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="relative">
              {/* Left Arrow */}
              <button
                onClick={scrollLeft}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center transition-all duration-300 border border-gray-100 hover:scale-110 ${
                  canScrollLeft
                    ? "hover:bg-gray-50 text-gray-800 hover:shadow-2xl"
                    : "text-gray-400 cursor-not-allowed opacity-50"
                }`}
                disabled={!canScrollLeft}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                onClick={scrollRight}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center transition-all duration-300 border border-gray-100 hover:scale-110 ${
                  canScrollRight
                    ? "hover:bg-gray-50 text-gray-800 hover:shadow-2xl"
                    : "text-gray-400 cursor-not-allowed opacity-50"
                }`}
                disabled={!canScrollRight}
              >
                <svg
                  className="w-6 h-6"
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

              <div
                ref={scrollContainerRef}
                className="overflow-x-auto pb-4 scrollbar-hide mx-16"
                onScroll={checkScrollButtons}
                onWheel={(e) => {
                  e.currentTarget.scrollLeft += e.deltaY;
                  checkScrollButtons();
                }}
              >
                <div className="flex gap-6 w-max">
                  {relatedProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex-shrink-0 w-64 h-96 group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
                      onClick={() =>
                        navigate(`/product/${product._id}`, {
                          state: { item: product },
                        })
                      }
                    >
                      {/* Product Image */}
                      <div className="relative aspect-square bg-gray-50 overflow-hidden rounded-t-xl">
                        <img
                          src={
                            product.image ||
                            product.images?.[0] ||
                            "/placeholder-image.jpg"
                          }
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.jpg";
                          }}
                        />

                        {/* Discount Badge */}
                        {product?.discountedPercentage > 0 && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                            Mới
                          </div>
                        )}

                        {/* Favorite Button - Top Right */}
                        <button
                          className={`absolute top-3 right-3 w-8 h-8 backdrop-blur-sm hover:scale-110 rounded-full flex items-center justify-center transition-all duration-300 ${
                            favorites.some((fav) => fav._id === product._id)
                              ? "bg-red-100 text-red-500"
                              : "bg-white/80 hover:bg-white text-gray-600"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductLike(product);
                          }}
                          title={
                            favorites.some((fav) => fav._id === product._id)
                              ? "Bỏ yêu thích"
                              : "Thêm vào yêu thích"
                          }
                        >
                          {favorites.some((fav) => fav._id === product._id) ? (
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          ) : (
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
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Product Name */}
                        <h3 className="font-medium text-gray-900 mb-2 group-hover:text-gray-700 transition-colors line-clamp-2 text-sm leading-tight h-10 flex items-center">
                          {product.name}
                        </h3>

                        {/* Rating Stars - Chỉ hiển thị khi có đánh giá */}
                        <div className="mb-2 h-5 flex items-center">
                          {product.ratings && product.ratings > 0 ? (
                            <div className="flex items-center gap-1">
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map(
                                  (_, starIndex) => (
                                    <MdStar
                                      key={starIndex}
                                      className={`w-3 h-3 ${
                                        starIndex < Math.floor(product.ratings)
                                          ? "text-yellow-400"
                                          : "text-gray-200"
                                      }`}
                                    />
                                  )
                                )}
                              </div>
                              <span className="text-xs text-gray-500 ml-1">
                                ({product.ratings.toFixed(1)})
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Price Section */}
                        <div className="mb-3">
                          <div className="flex items-end justify-between">
                            <div className="flex flex-col gap-1">
                              {product.discountedPercentage > 0 && (
                                <span className="text-sm text-gray-400 line-through">
                                  <PriceFormat
                                    amount={
                                      product.price /
                                      (1 - product.discountedPercentage / 100)
                                    }
                                  />
                                </span>
                              )}
                              <span className="text-lg font-bold text-black">
                                <PriceFormat amount={product.price} />
                              </span>
                            </div>

                            {/* Add to Cart Button - aligned with price */}
                            <button
                              className="w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(
                                  addToCart({ ...product, quantity: 1 })
                                );
                                toast.success(
                                  `Đã thêm ${product.name} vào giỏ hàng`
                                );
                              }}
                              title="Thêm vào giỏ hàng"
                            >
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
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Spacer to push category to bottom */}
                        <div className="flex-1"></div>

                        {/* Category Tag */}
                        <div className="mt-auto">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">
                            {product.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 4H3c-.55 0-1 .45-1 1s.45 1 1 1h4c.55 0 1-.45 1-1s-.45-1-1-1zM7 8H3c-.55 0-1 .45-1 1s.45 1 1 1h4c.55 0 1-.45 1-1s-.45-1-1-1zM3 14h4c.55 0 1-.45 1-1s-.45-1-1-1H3c-.55 0-1 .45-1 1s.45 1 1 1zM11 4h10c.55 0 1-.45 1-1s-.45-1-1-1H11c-.55 0-1 .45-1 1s.45 1 1 1zM11 8h10c.55 0 1-.45 1-1s-.45-1-1-1H11c-.55 0-1 .45-1 1s.45 1 1 1zM11 12h10c.55 0 1-.45 1-1s-.45-1-1-1H11c-.55 0-1 .45-1 1s.45 1 1 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy sản phẩm liên quan
              </h3>
              <p className="text-gray-500">
                Hiện tại chưa có sản phẩm nào cùng danh mục với sản phẩm này.
              </p>
              <button
                onClick={() => navigate("/shop")}
                className="mt-4 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          )}
        </motion.div>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={closeShareModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chia sẻ sản phẩm
                  </h3>
                  <button
                    onClick={closeShareModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Copy Link */}
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          window.location.href
                        );
                        toast.success("Đã copy link vào clipboard!");
                        closeShareModal();
                      } catch {
                        toast.error("Không thể copy link");
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Copy Link</p>
                      <p className="text-sm text-gray-500">
                        Sao chép đường dẫn
                      </p>
                    </div>
                  </button>

                  {/* Facebook */}
                  <button
                    onClick={() => shareToSocial("facebook")}
                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Facebook</p>
                      <p className="text-sm text-gray-500">
                        Chia sẻ lên Facebook
                      </p>
                    </div>
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={() => shareToSocial("whatsapp")}
                    className="w-full flex items-center gap-3 p-3 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">WhatsApp</p>
                      <p className="text-sm text-gray-500">Gửi qua WhatsApp</p>
                    </div>
                  </button>

                  {/* Twitter */}
                  <button
                    onClick={() => shareToSocial("twitter")}
                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Twitter</p>
                      <p className="text-sm text-gray-500">Tweet sản phẩm</p>
                    </div>
                  </button>

                  {/* Telegram */}
                  <button
                    onClick={() => shareToSocial("telegram")}
                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Telegram</p>
                      <p className="text-sm text-gray-500">Gửi qua Telegram</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Modal gallery ảnh của review */}
        {modalGallery.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div onClick={() => setModalGallery({ ...modalGallery, open: false })} className="absolute inset-0"></div>
            <div className="relative z-10 max-w-xl w-full">
              <button onClick={() => setModalGallery({ ...modalGallery, open: false })} className="absolute top-0 right-0 m-4 text-white text-3xl">×</button>
              <img
                src={modalGallery.images[modalGallery.index]}
                alt="Review Large"
                className="w-full h-[400px] object-contain bg-white rounded-lg"
              />
              <div className="flex justify-center space-x-2 mt-4">
                {modalGallery.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="Thumb"
                    className={`w-16 h-16 object-cover rounded border-2 cursor-pointer ${idx === modalGallery.index ? "border-blue-500" : "border-gray-300"}`}
                    onClick={() => setModalGallery({ ...modalGallery, index: idx })}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default SingleProduct;
