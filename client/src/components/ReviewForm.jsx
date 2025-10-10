import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { MdStar, MdPhoto, MdClose, MdSave, MdCancel } from "react-icons/md";
import { motion } from "framer-motion";
import { serverUrl } from "../../config";
import toast from "react-hot-toast";

const ReviewForm = ({
  productId,
  orderId,
  existingReview = null,
  onReviewSubmitted,
  onCancel,
  isEditing = false,
  productInfo = null, // Add product info prop
}) => {
  // Debug existingReview
  console.log("🔍 ReviewForm - existingReview prop:", existingReview);
  console.log("🖼️ ReviewForm - existingReview images:", {
    hasImages: !!existingReview?.images,
    imageCount: existingReview?.images?.length || 0,
    images: existingReview?.images,
  });

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [images, setImages] = useState(existingReview?.images || []);
  const [newImages, setNewImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const fileInputRef = useRef(null);

  // Debug images state after initialization
  console.log("🎨 ReviewForm - images state after init:", images);

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length + newImages.length > 5) {
      toast.error("Tối đa 5 ảnh cho mỗi đánh giá");
      return;
    }

    const imagePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve({
            file,
            preview: e.target.result,
            isNew: true,
          });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((newImageData) => {
      setNewImages((prev) => [...prev, ...newImageData]);
    });
  };

  // Remove existing image
  const removeExistingImage = (imageUrl) => {
    setImages((prev) => prev.filter((img) => img !== imageUrl));
    setRemovedImages((prev) => [...prev, imageUrl]);
  };

  // Remove new image
  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (!comment.trim()) {
      toast.error("Vui lòng nhập nhận xét");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("orderId", orderId);
      formData.append("rating", rating);
      formData.append("comment", comment.trim());

      // Debug form data
      console.log("🔍 FORM SUBMIT DEBUG:");
      console.log("- productId:", productId);
      console.log("- orderId:", orderId);
      console.log("- rating:", rating);
      console.log("- comment:", comment.trim());
      console.log("- newImages count:", newImages.length);
      console.log("- existing images count:", images.length);
      console.log("- isEditing:", isEditing);

      // Add new images
      newImages.forEach((imageData, index) => {
        console.log(
          `- Adding new image ${index + 1}:`,
          imageData.file.name,
          imageData.file.size
        );
        formData.append("reviewImages", imageData.file);
      });

      // Add removed images info for editing
      if (isEditing && removedImages.length > 0) {
        console.log("- Removed images:", removedImages);
        formData.append("removeImages", JSON.stringify(removedImages));
      }

      const token = localStorage.getItem("token");
      const url = isEditing
        ? `${serverUrl}/api/product/review/${existingReview._id}`
        : `${serverUrl}/api/product/review`;

      const method = isEditing ? "PUT" : "POST";

      console.log("📤 Sending request to:", url);
      console.log("📤 Method:", method);

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log("📥 Server response:", data);

      if (data.success) {
        console.log("✅ Review submitted successfully");
        if (data.review && data.review.images) {
          console.log(
            "✅ Review saved with images:",
            data.review.images.length
          );
        } else {
          console.log("⚠️ Review saved but no images in response");
        }
        toast.success(data.message);
        onReviewSubmitted(data.review);
        // Reset form if adding new review
        if (!isEditing) {
          setRating(0);
          setComment("");
          setImages([]);
          setNewImages([]);
          setRemovedImages([]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Có lỗi xảy ra khi gửi đánh giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white border border-gray-200 rounded-xl p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {isEditing ? "Chỉnh sửa đánh giá" : "Viết đánh giá"}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose size={24} />
          </button>
        )}
      </div>

      {/* Product Information */}
      {productInfo && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {productInfo.image && (
                <img
                  src={productInfo.image}
                  alt={productInfo.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">
                {productInfo.name}
              </h4>
              {productInfo.quantity && (
                <p className="text-sm text-gray-500">
                  Số lượng: {productInfo.quantity}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-blue-600 font-medium mt-1">
                  Đang chỉnh sửa đánh giá hiện tại
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đánh giá sao *
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-3xl transition-colors focus:outline-none"
              >
                <MdStar
                  className={
                    star <= (hoverRating || rating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {rating > 0 && `${rating} sao`}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nhận xét *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thêm ảnh (tối đa 5 ảnh)
          </label>

          {/* Existing Images */}
          {images.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mb-3">
              {images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Review ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(imageUrl)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MdClose size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New Images */}
          {newImages.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mb-3">
              {newImages.map((imageData, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageData.preview}
                    alt={`New ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MdClose size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {images.length + newImages.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <MdPhoto className="text-gray-400" />
              <span className="text-sm text-gray-600">Thêm ảnh</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isEditing ? (
              <MdSave size={20} />
            ) : null}
            {isSubmitting
              ? "Đang gửi..."
              : isEditing
              ? "Cập nhật"
              : "Gửi đánh giá"}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <MdCancel size={20} />
              Hủy
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

ReviewForm.propTypes = {
  productId: PropTypes.string.isRequired,
  orderId: PropTypes.string.isRequired,
  existingReview: PropTypes.object,
  onReviewSubmitted: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  isEditing: PropTypes.bool,
  productInfo: PropTypes.shape({
    name: PropTypes.string,
    image: PropTypes.string,
    quantity: PropTypes.number,
  }),
};

export default ReviewForm;
