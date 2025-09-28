import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { logo } from "../assets/images";
import {
  FaUser,
  FaChevronDown,
  FaUserShield,
  FaSignOutAlt,
} from "react-icons/fa";
import { MdNotifications, MdDashboard } from "react-icons/md";
import NewUserForm from "./NewUserForm";
import axios from "axios";
import { serverUrl } from "../../config";
import { logout } from "../redux/authSlice"; // Đảm bảo bạn có action này

const Navbar = () => {
  const { user, token, loginTimestamp } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  // Sử dụng custom hook cho notifications
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    fetchNotifications,
    markAllAsRead,
    forceRefresh,
  } = useNotifications(token);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Trigger force refresh khi user login thành công (sử dụng loginTimestamp)
  useEffect(() => {
    if (user && token && loginTimestamp) {
      // Delay để backend kịp tạo notification
      const timer = setTimeout(() => {
        forceRefresh();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loginTimestamp, user, token, forceRefresh]); // Trigger khi có login mới

  const getUserInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTypeIcon = (type) => {
    const typeConfig = {
      order: { icon: "🛒", color: "text-green-500" },
      warning: { icon: "⚠️", color: "text-yellow-500" },
      user: { icon: "👤", color: "text-blue-500" },
      product: { icon: "📦", color: "text-purple-500" },
      system: { icon: "⚙️", color: "text-gray-500" },
    };
    return typeConfig[type] || { icon: "📢", color: "text-gray-400" };
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  };

  const openProfileEditor = async () => {
    setIsUserMenuOpen(false);
    try {
      const res = await axios.get(`${serverUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.user) {
        setSelectedProfile(res.data.user);
      } else {
        setSelectedProfile(user);
      }
    } catch {
      setSelectedProfile(user);
    }
    setIsProfileOpen(true);
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    dispatch(logout());
    // Có thể thêm điều hướng hoặc xóa token nếu cần
  };

  const userMenuItems = [
    { icon: FaUser, label: "Profile", onClick: openProfileEditor },
    { icon: MdDashboard, label: "Dashboard", path: "/" },
    { icon: FaSignOutAlt, label: "Đăng xuất", onClick: handleLogout },
  ];

  return (
    <header className="border-b border-gray-200 w-full sticky top-0 left-0 z-40 bg-white shadow-sm">
      <div className="py-2.5 flex items-center justify-between px-4">
        {/* Logo Section */}
        <Link to={"/"} className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="logo"
            className="w-10 sm:w-20 transition-transform duration-200 group-hover:scale-105"
          />
          <div className="hidden sm:block">
            <p className="text-xs uppercase font-bold tracking-wide text-blue-600">
              Admin Panel
            </p>
            <p className="text-xs text-gray-500">Dashboard </p>
          </div>
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Admin Badge */}
          <div className="hidden md:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
            <FaUserShield className="text-blue-600 text-sm" />
            <span className="text-sm font-medium text-blue-700">Admin</span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                if (!isNotificationOpen) {
                  fetchNotifications(); // Refresh khi mở dropdown
                }
              }}
              className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
            >
              <MdNotifications
                className={`text-xl ${
                  notificationsLoading ? "animate-pulse text-blue-500" : ""
                }`}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Thông báo</h3>
                    <button
                      onClick={fetchNotifications}
                      disabled={notificationsLoading}
                      className="text-gray-500 hover:text-blue-600 p-1 rounded transition-colors"
                      title="Refresh ngay"
                    >
                      <svg
                        className={`w-4 h-4 ${
                          notificationsLoading ? "animate-spin" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                    <p className="text-sm text-gray-500">
                      {unreadCount > 0
                        ? `${unreadCount} chưa đọc`
                        : "Đã xem tất cả"}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Đánh dấu tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-2 text-sm">Đang tải...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <MdNotifications className="text-3xl mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chưa có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => {
                          // Đóng dropdown
                          setIsNotificationOpen(false);
                          // Navigate đến trang chi tiết
                          navigate(`/notifications/${notification._id}`);
                        }}
                        className={`px-4 py-3 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 cursor-pointer ${
                          !notification.isRead
                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`text-lg ${
                              getTypeIcon(notification.type)?.color ||
                              "text-gray-400"
                            }`}
                          >
                            {getTypeIcon(notification.type)?.icon || "📢"}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${
                                !notification.isRead
                                  ? "text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center">
                  <button
                    onClick={() => fetchNotifications()}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Làm mới
                  </button>
                  <Link
                    to="/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Xem tất cả
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              {/* User Info - Desktop */}
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-3 text-sm text-gray-600 mr-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>

                {/* User Avatar & Dropdown */}
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-50 transition-colors duration-200"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-semibold text-sm">
                      {getUserInitials(user?.name || user?.email)}
                    </div>
                  )}
                  <FaChevronDown
                    className={`text-gray-600 text-sm transition-transform duration-200 ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  {/* User Info in Dropdown */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                        Online
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {userMenuItems.map((item, index) =>
                      item.onClick ? (
                        <button
                          key={index}
                          onClick={item.onClick}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        >
                          <item.icon className="text-gray-400" />
                          {item.label}
                        </button>
                      ) : (
                        <Link
                          key={index}
                          to={item.path}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        >
                          <item.icon className="text-gray-400" />
                          {item.label}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {user && (
        <NewUserForm
          isOpen={isProfileOpen}
          setIsOpen={setIsProfileOpen}
          close={() => setIsProfileOpen(false)}
          selectedUser={selectedProfile || user}
          getUsersList={() => {}}
          token={token}
          isReadOnly={false}
        />
      )}
    </header>
  );
};

export default Navbar;
