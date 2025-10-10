import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import Container from "../components/Container";
import { FaHeart, FaShoppingBag } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import ProductCard from "../components/ProductCard";
import { fetchWishlist } from "../redux/wishlistThunks";

const Wishlist = () => {
  const dispatch = useDispatch();
  const { favorites, loading } = useSelector(
    (state) => state.favoriteReducer || { favorites: [], loading: false }
  );

  // Fetch wishlist when component mounts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(fetchWishlist());
    }
  }, [dispatch]);
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-8 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <FaHeart className="text-2xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Danh sách yêu thích
                  </h1>
                  <p className="text-gray-600">
                    Lưu các sản phẩm yêu thích của bạn để mua sau
                  </p>
                </div>
              </div>
              {/* <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <FaArrowLeft />
                Quay lại trang Profile
              </Link> */}
            </div>
          </motion.div>

          {/* Danh sách sản phẩm yêu thích hoặc empty state */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm p-12 text-center"
            >
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
              <p className="text-gray-600">Đang tải danh sách yêu thích...</p>
            </motion.div>
          ) : favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm p-12 text-center"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaHeart className="text-4xl text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Danh sách yêu thích của bạn đang trống
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Bắt đầu tạo danh sách yêu thích của bạn bằng cách thêm các sản
                phẩm bạn yêu thích. Bạn có thể lưu các sản phẩm trong khi duyệt
                và quay lại sau.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <FaShoppingBag />
                Bắt đầu Mua Hàng
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
              {favorites.map((item) => (
                <ProductCard key={item._id} item={item} />
              ))}
            </motion.div>
          )}

          {/* Feature Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FaHeart className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Lưu Yêu Thích
              </h3>
              <p className="text-sm text-gray-600">
                Giữ theo dõi các sản phẩm bạn yêu thích và muốn mua sau
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FaShoppingBag className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Mua Nhanh</h3>
              <p className="text-sm text-gray-600">
                Dễ dàng chuyển các sản phẩm từ danh sách yêu thích sang giỏ hàng
                khi sẵn sàng mua
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FaHeart className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Không Bao Giờ Quên
              </h3>
              <p className="text-sm text-gray-600">
                Danh sách yêu thích của bạn được đồng bộ trên các thiết bị nên
                bạn không bao giờ mất các sản phẩm yêu thích của bạn
              </p>
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
};

export default Wishlist;
