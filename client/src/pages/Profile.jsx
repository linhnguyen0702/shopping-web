import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import { addUser, removeUser, resetOrderCount } from "../redux/orebiSlice";
import Container from "../components/Container";
import { FaSignOutAlt, FaUserCircle, FaCog, FaHeart } from "react-icons/fa";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.orebiReducer.userInfo);

  useEffect(() => {
    if (!userInfo) {
      navigate("/signin");
      return;
    }

    // Fetch fresh user data from server
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${serverUrl}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          const userData = response.data.user;
          // cập nhật dữ liệu vào Redux store
          dispatch(addUser(userData));
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu profile:", error);
      }
    };

    fetchUserProfile();
  }, [userInfo, navigate, dispatch]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(removeUser());
    dispatch(resetOrderCount());
    toast.success("Đăng xuất thành công");
    navigate("/");
  };

  if (!userInfo) {
    return null;
  }

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
                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center">
                  <FaUserCircle className="text-4xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Chào mừng trở lại, {userInfo.name}!
                  </h1>
                  <p className="text-gray-600">
                    Quản lý tài khoản và cài đặt
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaSignOutAlt />
                Đăng Xuất
              </button>
            </div>
          </motion.div>

          {/* Tin nhắn */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center py-16"
          >
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-12">
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaCog className="text-3xl text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  🔒 Các Tính Năng Premium Của Tài Khoản
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Quyền truy cập vào việc chỉnh sửa tài khoản, lịch sử đơn hàng,
                  quản lý danh sách yêu thích và các tính năng tài khoản nâng cao
                  chỉ có trong phiên bản premium của mã nguồn này.
                </p>
              </div>

              {/* Danh sách các tính năng premium */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-8 border border-amber-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
                  💎 Các Tính Năng Được Bao Gồm Trong Premium
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Chỉnh sửa và quản lý tài khoản
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Lịch sử đơn hàng và theo dõi
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Chức năng danh sách yêu thích
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Thống kê tài khoản
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Các chức năng nhanh chóng
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Trải nghiệm người dùng nâng cao
                  </div>
                </div>
                <div className="text-xs text-amber-700 bg-amber-100 px-3 py-2 rounded-full inline-block mt-4">
                  ⚡ Thanh toán một lần • Quyền truy cập suốt đời • Mã nguồn hoàn chỉnh
                </div>
              </div>

              {/* Nút CTA */}
              <a
                href="https://buymeacoffee.com/reactbd/e/442025"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
              >
                <FaHeart className="text-xl" />
                Lấy Quyền Truy Cập Premium Ngay
              </a>

              <p className="text-sm text-gray-500 mt-6">
                Mở khóa tất cả các tính năng tài khoản và nhận đầy đủ mã nguồn
              </p>
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
};

export default Profile;
