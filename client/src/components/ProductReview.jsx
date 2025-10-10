import { useState } from "react";
import { motion } from "framer-motion";
import { FaStar, FaRegStar, FaTimes, FaCheck, FaUser } from "react-icons/fa";
import PropTypes from "prop-types";

const ProductReview = ({ product, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        productId: product.id,
        rating,
        reviewText,
      });

      // Reset form
      setRating(0);
      setReviewText("");
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => (
      <button
        key={index}
        type="button"
        onClick={() => setRating(index + 1)}
        className={`text-2xl ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        } hover:text-yellow-400 transition-colors`}
      >
        {index < rating ? <FaStar /> : <FaRegStar />}
      </button>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Đánh giá sản phẩm
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Product Info */}
          <div className="flex items-center space-x-3 mb-6">
            <img
              src={product?.image || "/api/placeholder/60/60"}
              alt={product?.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h4 className="font-medium text-gray-900">{product?.name}</h4>
              <p className="text-sm text-gray-600">
                {product?.price &&
                  new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(product.price)}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Đánh giá của bạn *
            </label>
            <div className="flex space-x-1 mb-2">{renderStars()}</div>
            <p className="text-xs text-gray-500">
              {rating === 0 && "Vui lòng chọn số sao"}
              {rating === 1 && "Rất không hài lòng"}
              {rating === 2 && "Không hài lòng"}
              {rating === 3 && "Bình thường"}
              {rating === 4 && "Hài lòng"}
              {rating === 5 && "Rất hài lòng"}
            </p>
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhận xét (tùy chọn)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reviewText.length}/500 ký tự
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang gửi...
                </>
              ) : (
                <>
                  <FaCheck />
                  Gửi đánh giá
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Component hiển thị danh sách đánh giá
export const ReviewsList = ({ reviews, loading }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span
        key={index}
        className={`text-sm ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        {index < rating ? <FaStar /> : <FaRegStar />}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <FaUser className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review, index) => (
        <motion.div
          key={review.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="border-b border-gray-200 pb-6 last:border-b-0"
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              {review.user?.avatar ? (
                <img
                  src={review.user.avatar}
                  alt={review.user.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <FaUser className="text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-gray-900">
                  {review.user?.name || "Người dùng ẩn danh"}
                </h4>
                <div className="flex space-x-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
              </p>
              {review.comment && (
                <p className="text-gray-800">{review.comment}</p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

ProductReview.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    image: PropTypes.string,
    price: PropTypes.number,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

ReviewsList.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      user: PropTypes.shape({
        name: PropTypes.string,
      }),
      rating: PropTypes.number,
      comment: PropTypes.string,
      createdAt: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
};

export default ProductReview;
