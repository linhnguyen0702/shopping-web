import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { FaHeart, FaPlus } from "react-icons/fa";
import PriceContainer from "./PriceContainer";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/orebiSlice";
import { updateUserCart } from "../services/cartService";
import { addToFavorites, removeFromFavorites } from "../redux/favoriteSlice";
import {
  addToWishlistAsync,
  removeFromWishlistAsync,
} from "../redux/wishlistThunks";
import toast from "react-hot-toast";

const ProductCard = ({ item, className = "" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const favorites = useSelector(
    (state) => state.favoriteReducer?.favorites || []
  );
  const products = useSelector((state) => state.orebiReducer.products);
  const isLiked = favorites.some((fav) => fav._id === item._id);

  const handleProductDetails = () => {
    navigate(`/product/${item?._id}`, {
      state: { item },
    });
  };

  const handleLike = async (e) => {
    e.stopPropagation();

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng yêu thích");
      return;
    }

    try {
      if (isLiked) {
        // Remove from wishlist (database + local state)
        await dispatch(removeFromWishlistAsync(item._id)).unwrap();
      } else {
        // Add to wishlist (database + local state)
        await dispatch(addToWishlistAsync(item)).unwrap();
      }
    } catch (error) {
      // Error handling is done in thunks, but we can add fallback local updates here
      console.error("Wishlist error:", error);

      // Fallback to local-only updates if API fails
      if (isLiked) {
        dispatch(removeFromFavorites(item._id));
        toast("Đã xoá khỏi yêu thích (chỉ cục bộ)", { icon: "💔" });
      } else {
        dispatch(addToFavorites(item));
        toast.success("Đã thêm vào yêu thích (chỉ cục bộ)");
      }
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();

    // Thêm vào Redux ngay lập tức để UX mượt mà
    dispatch(addToCart({ ...item, quantity: 1 }));
    toast.success("Đã thêm vào giỏ hàng");

    // Đồng bộ backend nếu đã đăng nhập (chạy background)
    const token = localStorage.getItem("token");
    if (token) {
      try {
        console.log("🛒 Đang đồng bộ giỏ hàng với server...");

        // Tính toán products mới dựa trên state hiện tại
        const existingItem = products.find((p) => p._id === item._id);
        let updatedProducts;

        if (existingItem) {
          // Nếu sản phẩm đã tồn tại, tăng quantity
          updatedProducts = products.map((p) =>
            p._id === item._id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
          );
        } else {
          // Nếu sản phẩm mới, thêm vào danh sách
          updatedProducts = [...products, { ...item, quantity: 1 }];
        }

        const result = await updateUserCart(token, updatedProducts);

        if (!result.success) {
          console.error("❌ Lỗi đồng bộ server:", result.message);
          toast.error("Không thể đồng bộ với server");
        } else {
          console.log("✅ Đã đồng bộ giỏ hàng thành công");
        }
      } catch (error) {
        console.error("❌ Lỗi khi đồng bộ giỏ hàng:", error);
        toast.error("Lỗi kết nối server");
      }
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md p-2 w-56 ${className} transition hover:shadow-lg`}
      style={{ minWidth: 228 }}
    >
      <div className="relative">
        <img
          src={item?.images?.[0] || item?.image}
          alt={item?.name}
          className="w-full h-56 object-cover rounded-xl cursor-pointer"
          onClick={handleProductDetails}
        />
        {/* Tag sản phẩm nếu có */}
        {item.tag && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold rounded-full px-3 py-1 shadow">
            {item.tag}
          </div>
        )}
        {/* Like button */}
        <button
          className="absolute top-2 right-2"
          onClick={handleLike}
          aria-label="Yêu thích"
        >
          <FaHeart
            className={`text-xl ${
              isLiked ? "text-red-500" : "text-gray-300"
            } drop-shadow`}
          />
        </button>
      </div>
      <div className="mt-2">
        <div className="font-semibold text-base truncate">{item.name}</div>
        <div className="text-xs text-gray-500 mb-1 truncate">
          {item.description || "Mô tả sản phẩm"}
        </div>
        <div className="flex items-center justify-between mt-2">
          {/* Giá và VNĐ */}
          <span className="flex items-baseline text-[#000000] font-bold text-base">
            <PriceContainer item={item} />
            <span className="ml-1 text-xs font-semibold">VNĐ</span>
          </span>

          {/* Nút thêm vào giỏ */}
          <button
            onClick={handleAddToCart}
            className="bg-[#000000] text-white rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-[#a67c52] transition ml-2"
            aria-label="Thêm vào giỏ"
          >
            <FaPlus />
          </button>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    image: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    tag: PropTypes.string, // Thêm prop tag
    description: PropTypes.string,
  }).isRequired,
  className: PropTypes.string,
};

export default ProductCard;
