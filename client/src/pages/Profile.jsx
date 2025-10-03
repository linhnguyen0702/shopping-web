import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import { addUser, removeUser, resetCart } from "../redux/orebiSlice";
import { fetchWishlist } from "../redux/wishlistThunks";
import Container from "../components/Container";
import {
  FaSignOutAlt,
  FaUserCircle,
  FaHeart,
  FaTimes,
  FaCamera,
  FaSave,
} from "react-icons/fa";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, products, orderCount } = useSelector(
    (state) => state.orebiReducer
  );
  const favorites = useSelector(
    (state) => state.favoriteReducer?.favorites || []
  );

  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!userInfo) {
      navigate("/signin");
      return;
    }

    let isActive = true;
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${serverUrl}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (
          response.data.success &&
          isActive &&
          localStorage.getItem("token")
        ) {
          const userData = response.data.user;
          dispatch(addUser(userData));
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu profile:", error);
      }
    };

    fetchUserProfile();
    return () => {
      isActive = false;
    };
  }, [navigate, dispatch, userInfo]);

  // Khởi tạo biểu mẫu chỉnh sửa với dữ liệu người dùng hiện tại
  useEffect(() => {
    if (userInfo) {
      setEditForm({
        name: userInfo.name || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
        address: userInfo.address || "",
      });

      // Fetch wishlist when user info is available (silent to avoid loading state)
      const token = localStorage.getItem("token");
      if (token) {
        dispatch(fetchWishlist({ silent: true }));
      }
      setAvatarPreview(userInfo.avatar || null);
    }
  }, [userInfo, dispatch]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      // Reset Redux để Header cập nhật ngay
      dispatch(removeUser());
      dispatch(resetCart());
      // Không purge nữa để tránh trạng thái persist rỗng tạm thời

      toast.success("Đăng xuất thành công");
      navigate("/signin", { replace: true });
    } catch {
      navigate("/signin", { replace: true });
    }
  };

  // Xử lý chỉnh sửa phương thức mở
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  // Xử lý chỉnh sửa phương thức đóng
  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setAvatarFile(null);
    setAvatarPreview(userInfo?.avatar || null);
  };

  // Xử lý thay đổi đầu vào biểu mẫu
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý thay đổi tệp avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý gửi biểu mẫu
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Cập nhật thông tin hồ sơ
      const profileResponse = await axios.put(
        `${serverUrl}/api/user/profile/info`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (profileResponse.data.success) {
        // Cập nhật avatar nếu tệp được chọn
        if (avatarFile) {
          const formData = new FormData();
          formData.append("avatar", avatarFile);

          const avatarResponse = await axios.post(
            `${serverUrl}/api/user/profile/avatar`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (avatarResponse.data.success) {
            // Cập nhật thông tin người dùng trong Redux với Avatar mới
            dispatch(
              addUser({
                ...userInfo,
                ...profileResponse.data.user,
                avatar: avatarResponse.data.avatarUrl,
              })
            );
          }
        } else {
          // Cập nhật thông tin người dùng trong Redux mà không thay đổi avatar
          dispatch(
            addUser({
              ...userInfo,
              ...profileResponse.data.user,
            })
          );
        }

        toast.success("Cập nhật thông tin thành công!");
        setIsEditModalOpen(false);
        setAvatarFile(null);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin"
      );
    } finally {
      setIsLoading(false);
    }
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
                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                  {userInfo?.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="text-4xl text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Chào mừng trở lại, {userInfo.name}!
                  </h1>
                  <p className="text-gray-600">Quản lý tài khoản và cài đặt</p>
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

          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Thông tin cá nhân
              </h2>
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chỉnh sửa
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  {userInfo?.name || "Chưa cập nhật"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  {userInfo?.email || "Chưa cập nhật"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  {userInfo?.phone || "Chưa cập nhật"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  {userInfo?.address || "Chưa cập nhật"}
                </div>
              </div>
            </div>
          </motion.div>

          {/*Thông tin tài khoản */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Thông tin tài khoản
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày tham gia
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  {userInfo?.createdAt
                    ? new Date(userInfo.createdAt).toLocaleDateString("vi-VN")
                    : "Chưa xác định"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại tài khoản
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      userInfo?.role === "admin"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {userInfo?.role === "admin"
                      ? "Quản trị viên"
                      : "Người dùng"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hành động nhanh  */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Chức năng nhanh
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/cart"
                className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Giỏ hàng
                </span>
              </Link>
              <Link
                to="/orders"
                className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Đơn hàng
                </span>
              </Link>
              <Link
                to="/wishlist"
                className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <FaHeart className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Yêu thích
                </span>
              </Link>
              <Link
                to="/shop"
                className="flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Mua sắm
                </span>
              </Link>
            </div>
          </motion.div>

          {/* Số liệu thống kê tài khoản */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Thống kê tài khoản
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {products?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Sản phẩm trong giỏ</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {orderCount || 0}
                </div>
                <div className="text-sm text-gray-600">Tổng đơn hàng</div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-xl">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {favorites.length}
                </div>
                <div className="text-sm text-gray-600">Sản phẩm yêu thích</div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>

      {/* Chỉnh sửa phương thức hồ sơ*/}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Chỉnh sửa thông tin cá nhân
                </h3>
                <button
                  onClick={handleEditClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Phần Avatar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ảnh đại diện
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaUserCircle className="text-4xl text-gray-400" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <FaCamera className="w-3 h-3" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Nhấn vào biểu tượng camera để thay đổi ảnh đại diện
                    </p>
                    <p className="text-xs text-gray-500">
                      Định dạng: JPG, PNG. Kích thước tối đa: 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields chỉ còn 4 trường */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    placeholder="Email"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleEditClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
