import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PriceFormat from "../components/PriceFormat";
import Container from "../components/Container";
import { MdStar, MdFavoriteBorder, MdShare, MdFavorite } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { getData } from "../helpers/index";
import { serverUrl } from "../../config";
import { addToCart } from "../redux/orebiSlice";
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

  const [productInfo, setProductInfo] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redux state
  const favorites = useSelector(
    (state) => state.favoriteReducer?.favorites || []
  );
  const products = useSelector((state) => state.orebiReducer.products);
  const isLiked = favorites.some((fav) => fav._id === productInfo._id);

  useEffect(() => {
    const fetchProductData = async () => {
      // Lấy product ID từ URL
      const pathParts = location.pathname.split("/");
      const productId = pathParts[pathParts.length - 1];

      // Nếu có state được truyền từ trang khác (như ProductCard)
      if (location.state?.item) {
        setProductInfo(location.state.item);
        return;
      }

      // Nếu không có state, fetch từ API (như từ Cart hoặc direct URL)
      if (productId) {
        setLoading(true);
        try {
          const response = await getData(
            `${serverUrl}/api/product/${productId}`
          );
          if (response?.success && response?.product) {
            setProductInfo(response.product);
          } else {
            // Fallback: Tìm trong danh sách sản phẩm có sẵn
            console.log(
              "Không tìm thấy sản phẩm từ API, tìm trong danh sách local..."
            );
            toast.error("Không tìm thấy thông tin sản phẩm");
            navigate("/shop");
          }
        } catch (error) {
          console.error("Lỗi khi lấy thông tin sản phẩm:", error);
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
          // Fetch products from the same category
          const response = await getData(
            `${serverUrl}/api/products?category=${productInfo.category}&_perPage=8`
          );

          if (response?.success && response?.products) {
            // Filter out the current product and limit to 4 products
            const filtered = response.products
              .filter((product) => product._id !== productInfo._id)
              .slice(0, 4);
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
      // Error handling is done in thunks, but we can add fallback local updates here
      console.error("Wishlist error:", error);

      // Fallback to local-only updates if API fails
      if (isLiked) {
        dispatch(removeFromFavorites(productInfo._id));
        toast("Đã xoá khỏi yêu thích (chỉ cục bộ)", { icon: "💔" });
      } else {
        dispatch(addToFavorites(productInfo));
        toast.success("Đã thêm vào yêu thích (chỉ cục bộ)");
      }
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
              {productInfo?.oldPrice && (
                <span className="text-2xl text-gray-400 line-through">
                  <PriceFormat amount={productInfo.oldPrice} />
                </span>
              )}
              <span className="text-3xl font-light text-gray-900">
                <PriceFormat amount={productInfo?.price} />
              </span>
              {productInfo?.oldPrice && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  Tiết kiệm{" "}
                  <PriceFormat
                    amount={productInfo.oldPrice - productInfo.price}
                  />
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, index) => (
                  <MdStar
                    key={index}
                    className={`w-5 h-5 ${
                      index < Math.floor(productInfo?.ratings || 0)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                Được đánh giá {productInfo?.ratings?.toFixed(1) || "0.0"} trên 5
                dựa trên {productInfo?.reviews?.length || 0} đánh giá của khách
                hàng
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed text-lg">
              {productInfo?.description}
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
                  ? `Reviews (${productInfo?.reviews?.length || 0})`
                  : tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === "description" && (
              <div className="prose prose-lg max-w-none">
                <h3 className="text-2xl font-light mb-4">Mô tả</h3>
                <p className="text-gray-600 leading-relaxed">
                  {productInfo?.description || "No description available."}
                </p>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. In ut
                  ullamcorper leo, eget euismod orci. Cum sociis natoque
                  penatibus et magnis dis parturient montes nascetur ridiculus
                  mus. Vestibulum ultricies aliquam convallis. Maecenas ut
                  tellus mi. Proin tincidunt, lectus eu volutpat mattis, ante
                  metus lacinia tellus, vitae condimentum nulla enim bibendum
                  nibh.
                </p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-light mb-6">
                  Đánh giá khách hàng
                </h3>
                {productInfo?.reviews?.length > 0 ? (
                  <div className="space-y-6">
                    {productInfo.reviews.map((review, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-200 pb-6 last:border-b-0"
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={review.image}
                            alt={review.reviewerName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {review.reviewerName}
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
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Chưa có đánh giá. Hãy là người đầu tiên để đánh giá!
                  </p>
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
          <h2 className="text-2xl font-light text-center mb-12">
            Sản phẩm liên quan
          </h2>

          {loadingRelated ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((product) => (
                <div
                  key={product._id}
                  className="group cursor-pointer"
                  onClick={() =>
                    navigate(`/product/${product._id}`, {
                      state: { item: product },
                    })
                  }
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                    <img
                      src={
                        product.image ||
                        product.images?.[0] ||
                        "/placeholder-image.jpg"
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "/placeholder-image.jpg";
                      }}
                    />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 group-hover:text-gray-600 transition-colors truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <MdStar
                          key={starIndex}
                          className={`w-4 h-4 ${
                            starIndex < Math.floor(product.ratings || 4)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.ratings?.toFixed(1) || "4.0"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
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
                    <span className="text-lg font-light text-gray-900">
                      <PriceFormat amount={product.price} />
                    </span>
                    {product.discountedPercentage > 0 && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                        {product.discountedPercentage}% off
                      </span>
                    )}
                  </div>
                  <button
                    className="w-full mt-3 py-2 border border-gray-300 text-gray-700 hover:border-black hover:bg-black hover:text-white transition-all duration-300 text-sm font-medium uppercase tracking-wider transform hover:scale-[1.02]"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add to cart for related product
                      dispatch(addToCart({ ...product, quantity: 1 }));
                      toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
                    }}
                  >
                    Thêm vào giỏ hàng
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Không tìm thấy sản phẩm liên quan.
              </p>
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
      </Container>
    </div>
  );
};

export default SingleProduct;
