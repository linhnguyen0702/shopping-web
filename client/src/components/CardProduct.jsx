import PropTypes from "prop-types";
import { FaStar, FaHeart } from "react-icons/fa";
import { useState } from "react";
import AddToCartButton from "./AddToCartButton";
import PriceFormat from "./PriceFormat";

const CardProduct = ({ item, onLike, liked }) => {
  const [isLiked, setIsLiked] = useState(liked || false);

  const handleLike = () => {
    setIsLiked((prev) => !prev);
    if (onLike) onLike(item._id);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-2 w-44">
      <div className="relative">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-28 object-cover rounded-xl"
        />
        <div className="absolute top-2 left-2 flex items-center bg-black bg-opacity-70 rounded-full px-2 py-0.5">
          <FaStar className="text-yellow-400 text-xs mr-1" />
          <span className="text-xs text-white font-semibold">
            {item.rating || "4.5"}
          </span>
        </div>
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
          <span className="text-[#c89b6a] font-bold text-base">
            <PriceFormat amount={item.price} /> VNĐ
          </span>
          <AddToCartButton
            item={item}
            className="bg-[#c89b6a] text-white rounded-full w-7 h-7 flex items-center justify-center"
          />
        </div>
      </div>
    </div>
  );
};

CardProduct.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string,
    price: PropTypes.number,
    rating: PropTypes.number,
    description: PropTypes.string,
  }).isRequired,
  onLike: PropTypes.func,
  liked: PropTypes.bool,
};

export default CardProduct;
