import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { FaHeart, FaPlus } from "react-icons/fa";
import PriceContainer from "./PriceContainer";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/orebiSlice";
import { updateUserCart } from "../services/cartService";
import { addToFavorites, removeFromFavorites } from "../redux/favoriteSlice";
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

  const handleLike = (e) => {
    e.stopPropagation();
    if (isLiked) {
      dispatch(removeFromFavorites(item._id));
      toast("Đã xoá khỏi yêu thích", { icon: "💔" });
    } else {
      dispatch(addToFavorites(item));
      toast.success("Đã thêm vào yêu thích");
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    dispatch(addToCart({ ...item, quantity: 1 }));
    toast.success("Đã thêm vào giỏ hàng");
    // Đồng bộ backend nếu đã đăng nhập
    const token = localStorage.getItem("token");
    if (token) {
      await updateUserCart(token, products.concat([{ ...item, quantity: 1 }]));
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
