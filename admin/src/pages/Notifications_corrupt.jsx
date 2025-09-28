import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../../config.js";
import {
  MdNotifications,
  MdCheck,
  MdSearch,
  MdClose,
  MdPerson,
  MdLocationOn,
  MdEmail,
  MdSch  const toggleSelectNotification = (notificationId) => {
    setSelectedIds(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const createTestNotifications = async () => {
    if (!token) return;

    try {
      setUpdating(true);
      
      // Tạo notification hôm nay
      const todayNotification = {
        _id: "test-today-" + Date.now(),
        type: "login",
        title: "Test hôm nay",
        message: "Notification được tạo hôm nay",
        createdAt: new Date().toISOString(),
        isRead: false,
        metadata: { email: "test@today.com" }
      };

      // Tạo notification 5 ngày trước
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const weekNotification = {
        _id: "test-week-" + Date.now(),
        type: "user",
        title: "Test 5 ngày trước",
        message: "Notification được tạo 5 ngày trước",
        createdAt: fiveDaysAgo.toISOString(),
        isRead: false,
        metadata: { email: "test@week.com" }
      };

      // Tạo notification 20 ngày trước
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
      const monthNotification = {
        _id: "test-month-" + Date.now(),
        type: "order",
        title: "Test 20 ngày trước",
        message: "Notification được tạo 20 ngày trước",
        createdAt: twentyDaysAgo.toISOString(),
        isRead: false,
        metadata: { orderId: "ORDER-20DAYS" }
      };

      // Tạo notification 45 ngày trước
      const fortyFiveDaysAgo = new Date();
      fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
      const oldNotification = {
        _id: "test-old-" + Date.now(),
        type: "warning",
        title: "Test 45 ngày trước",
        message: "Notification được tạo 45 ngày trước",
        createdAt: fortyFiveDaysAgo.toISOString(),
        isRead: true,
        metadata: { email: "test@old.com" }
      };

      // Thêm vào state (fake data để test filter)
      setNotifications(prev => [
        todayNotification,
        weekNotification,
        monthNotification,
        oldNotification,
        ...prev
      ]);

      console.log("🧪 Đã tạo test notifications:");
      console.log("- Hôm nay:", todayNotification.createdAt);
      console.log("- 5 ngày trước:", weekNotification.createdAt);
      console.log("- 20 ngày trước:", monthNotification.createdAt);
      console.log("- 45 ngày trước:", oldNotification.createdAt);

    } catch (error) {
      console.error("Lỗi tạo test notifications:", error);
    } finally {
      setUpdating(false);
    }
  }; from "react-icons/md";
import {
  FaUser,
  FaShoppingCart,
  FaKey,
  FaTrash,
  FaExclamationTriangle,
  FaBox,
} from "react-icons/fa";

const Notifications = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  // States
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [readStatusFilter, setReadStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter options
  const typeOptions = [
    { value: "all", label: "Tất cả", icon: <MdNotifications /> },
    { value: "order", label: "Đơn hàng", icon: <FaShoppingCart /> },
    { value: "user", label: "Đăng ký", icon: <FaUser /> },
    { value: "login", label: "Đăng nhập", icon: <FaKey /> },
  ];

  const timeOptions = [
    { value: "all", label: "Tất cả thời gian" },
    { value: "today", label: "Hôm nay" },
    { value: "week", label: "7 ngày qua" },
    { value: "month", label: "30 ngày qua" },
  ];

  const readStatusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "read", label: "Đã đọc" },
    { value: "unread", label: "Chưa đọc" },
  ];

  // Fetch notifications
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${serverUrl}/api/notifications?limit=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          setNotifications(response.data.notifications || []);
        }
      } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Apply filters
  useEffect(() => {
    let filtered = [...notifications];

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    // Filter by time
    if (timeFilter !== "all") {
      let threshold;

      switch (timeFilter) {
        case "today":
          // Bắt đầu ngày hôm nay (00:00:00)
          threshold = new Date();
          threshold.setHours(0, 0, 0, 0);
          console.log("🗓️ Filter hôm nay từ:", threshold);
          break;
        case "week":
          // 7 ngày trước
          threshold = new Date();
          threshold.setDate(threshold.getDate() - 7);
          threshold.setHours(0, 0, 0, 0);
          console.log("🗓️ Filter 7 ngày từ:", threshold);
          break;
        case "month":
          // 30 ngày trước
          threshold = new Date();
          threshold.setDate(threshold.getDate() - 30);
          threshold.setHours(0, 0, 0, 0);
          console.log("🗓️ Filter 30 ngày từ:", threshold);
          break;
        default:
          threshold = null;
      }

      if (threshold) {
        console.log("📊 Trước khi filter:", filtered.length, "notifications");
        console.log("🔍 Threshold:", threshold.toISOString());
        
        filtered = filtered.filter((n) => {
          const notificationDate = new Date(n.createdAt);
          const isIncluded = notificationDate >= threshold;
          console.log(`📝 ${n.title}: ${notificationDate.toISOString()} >= ${threshold.toISOString()} = ${isIncluded}`);
          return isIncluded;
        });
        
        console.log("📊 Sau khi filter:", filtered.length, "notifications");
      }
    }

    // Filter by read status
    if (readStatusFilter !== "all") {
      if (readStatusFilter === "read") {
        filtered = filtered.filter((n) => n.isRead);
      } else if (readStatusFilter === "unread") {
        filtered = filtered.filter((n) => !n.isRead);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (n.metadata?.email &&
            n.metadata.email
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (n.metadata?.orderId &&
            n.metadata.orderId.toString().includes(searchQuery))
      );
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, typeFilter, timeFilter, readStatusFilter, searchQuery]);

  // Find notification by ID
  useEffect(() => {
    if (id && notifications.length > 0) {
      const notification = notifications.find((n) => n._id === id);
      if (notification) {
        setSelectedNotification(notification);
        setShowDetailModal(true);
        // Auto mark as read
        if (!notification.isRead && token) {
          // Inline API call để tránh dependency
          axios
            .put(
              `${serverUrl}/api/notifications/${id}/read`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .then(() => {
              setNotifications((prev) =>
                prev.map((notif) =>
                  notif._id === id ? { ...notif, isRead: true } : notif
                )
              );
              setSelectedNotification((prev) => ({ ...prev, isRead: true }));
            })
            .catch((error) => console.error("Lỗi đánh dấu đã đọc:", error));
        }
      }
    }
  }, [id, notifications, token]); // markAsRead được define inline

  const markAsRead = async (notificationId) => {
    if (!token) return;

    try {
      await axios.put(
        `${serverUrl}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );

      if (selectedNotification?._id === notificationId) {
        setSelectedNotification((prev) => ({ ...prev, isRead: true }));
      }
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;

    try {
      setUpdating(true);
      await axios.put(
        `${serverUrl}/api/notifications/mark-all-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteAllNotifications = async () => {
    if (!token || !window.confirm("Bạn có chắc muốn xóa tất cả thông báo?"))
      return;

    try {
      setUpdating(true);
      const response = await axios.delete(
        `${serverUrl}/api/notifications/delete-all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        setNotifications([]);
        setSelectedIds([]);
        setIsSelectMode(false);
        alert(`Đã xóa ${response.data.deletedCount} thông báo`);
      }
    } catch (error) {
      console.error("Lỗi xóa thông báo:", error);
      alert("Có lỗi xảy ra khi xóa thông báo");
    } finally {
      setUpdating(false);
    }
  };

  const deleteSelectedNotifications = async () => {
    if (!token || selectedIds.length === 0) return;

    if (
      !window.confirm(
        `Bạn có chắc muốn xóa ${selectedIds.length} thông báo đã chọn?`
      )
    )
      return;

    try {
      setUpdating(true);
      const response = await axios.delete(
        `${serverUrl}/api/notifications/delete-selected`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { notificationIds: selectedIds },
        }
      );

      if (response.data?.success) {
        // Remove deleted notifications from state
        setNotifications((prev) =>
          prev.filter((n) => !selectedIds.includes(n._id))
        );
        setSelectedIds([]);
        setIsSelectMode(false);
        alert(`Đã xóa ${response.data.deletedCount} thông báo`);
      }
    } catch (error) {
      console.error("Lỗi xóa thông báo đã chọn:", error);
      alert("Có lỗi xảy ra khi xóa thông báo");
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedNotifications.map((n) => n._id));
    }
  };

  const toggleSelectNotification = (notificationId) => {
    setSelectedIds((prev) => {
      if (prev.includes(notificationId)) {
        return prev.filter((id) => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const getTypeIcon = (type) => {
    const icons = {
      order: <FaShoppingCart className="text-green-500" />,
      user: <FaUser className="text-blue-500" />,
      login: <FaKey className="text-purple-500" />,
      warning: <FaExclamationTriangle className="text-yellow-500" />,
      product: <FaBox className="text-purple-500" />,
    };
    return icons[type] || <MdNotifications className="text-gray-500" />;
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

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Selection helpers
  const allCurrentPageSelected =
    paginatedNotifications.length > 0 &&
    paginatedNotifications.every((n) => selectedIds.includes(n._id));

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedNotification(null);
    navigate("/notifications");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MdNotifications className="text-blue-600" />
                Thông báo
              </h1>
              <p className="text-gray-600 mt-2">
                {unreadCount > 0
                  ? `${unreadCount} thông báo chưa đọc trong tổng số ${notifications.length}`
                  : `Tất cả ${notifications.length} thông báo đã được đọc`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Select Mode Toggle */}
              <button
                onClick={toggleSelectMode}
                disabled={updating || notifications.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                  isSelectMode
                    ? "bg-gray-500 text-white hover:bg-gray-600"
                    : "bg-purple-500 text-white hover:bg-purple-600"
                }`}
              >
                <MdCheck />
                <span>{isSelectMode ? "Hủy chọn" : "Chọn"}</span>
              </button>

              {/* Selection Actions */}
              {isSelectMode && (
                <>
                  <button
                    onClick={toggleSelectAll}
                    disabled={updating || paginatedNotifications.length === 0}
                    className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                  >
                    <MdCheck />
                    <span>
                      {allCurrentPageSelected ? "Bỏ chọn trang" : "Chọn trang"}
                    </span>
                  </button>

                  {selectedIds.length > 0 && (
                    <button
                      onClick={deleteSelectedNotifications}
                      disabled={updating}
                      className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      <FaTrash />
                      <span>Xóa đã chọn ({selectedIds.length})</span>
                    </button>
                  )}
                </>
              )}

              {/* Mark All Read */}
              {unreadCount > 0 && !isSelectMode && (
                <button
                  onClick={markAllAsRead}
                  disabled={updating}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <MdCheck />
                  <span>Đánh dấu tất cả đã đọc</span>
                </button>
              )}

              {/* Delete All */}
              {!isSelectMode && (
                <button
                  onClick={deleteAllNotifications}
                  disabled={updating || notifications.length === 0}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <FaTrash />
                  <span>Xóa tất cả</span>
                </button>
              )}

              {/* Test Button - Debug only */}
              <button
                onClick={createTestNotifications}
                disabled={updating}
                className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                <MdNotifications />
                <span>Tạo Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo email, ID đơn hàng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Read Status Filter */}
            <div>
              <select
                value={readStatusFilter}
                onChange={(e) => setReadStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {readStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Filter */}
            <div>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {paginatedNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <MdNotifications className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {filteredNotifications.length === 0 && notifications.length > 0
                  ? "Không có thông báo phù hợp"
                  : "Chưa có thông báo nào"}
              </h3>
              <p className="text-gray-600">
                {filteredNotifications.length === 0 && notifications.length > 0
                  ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                  : "Thông báo sẽ xuất hiện tại đây khi có hoạt động mới"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paginatedNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 transition-all hover:bg-gray-50 ${
                    !notification.isRead
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : ""
                  } ${
                    selectedIds.includes(notification._id)
                      ? "bg-purple-50 border-r-4 border-r-purple-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox khi ở select mode */}
                    {isSelectMode && (
                      <div className="flex-shrink-0 pt-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(notification._id)}
                          onChange={() =>
                            toggleSelectNotification(notification._id)
                          }
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    {/* Icon */}
                    <div className="flex-shrink-0 p-3 rounded-full bg-gray-100">
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        if (!isSelectMode) {
                          setSelectedNotification(notification);
                          setShowDetailModal(true);
                          navigate(`/notifications/${notification._id}`);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3
                          className={`font-semibold text-lg ${
                            !notification.isRead
                              ? "text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {notification.title}
                          {!notification.isRead && (
                            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                          )}
                        </h3>
                        <span className="text-sm text-gray-500 flex-shrink-0 ml-4">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Metadata preview */}
                      {notification.metadata && (
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {notification.metadata.email && (
                            <span className="flex items-center gap-1">
                              <MdEmail />
                              {notification.metadata.email}
                            </span>
                          )}
                          {notification.metadata.orderId && (
                            <span className="flex items-center gap-1">
                              <FaShoppingCart />
                              Đơn hàng #{notification.metadata.orderId}
                            </span>
                          )}
                          {notification.metadata.amount && (
                            <span className="font-medium text-green-600">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(notification.metadata.amount)}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            notification.type === "order"
                              ? "bg-green-100 text-green-800"
                              : notification.type === "user"
                              ? "bg-blue-100 text-blue-800"
                              : notification.type === "login"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {notification.type === "order"
                            ? "Đơn hàng"
                            : notification.type === "user"
                            ? "Đăng ký"
                            : notification.type === "login"
                            ? "Đăng nhập"
                            : notification.type}
                        </span>

                        <span className="text-xs text-gray-400">
                          {formatFullDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Hiển thị {startIndex + 1} -{" "}
                  {Math.min(
                    startIndex + itemsPerPage,
                    filteredNotifications.length
                  )}
                  trong tổng số {filteredNotifications.length} thông báo
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === page
                            ? "bg-blue-500 text-white border-blue-500"
                            : "border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  {getTypeIcon(selectedNotification.type)}
                  Chi tiết thông báo
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MdClose className="text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedNotification.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedNotification.message}
                    </p>
                  </div>

                  {/* Status & Time */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Trạng thái:</span>
                      <div className="mt-1">
                        {selectedNotification.isRead ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <MdCheck /> Đã đọc
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-blue-600">
                            <MdSchedule /> Chưa đọc
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Thời gian:</span>
                      <div className="mt-1 font-medium">
                        {formatFullDate(selectedNotification.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Information based on type */}
                  {selectedNotification.metadata && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Thông tin chi tiết
                      </h4>

                      {selectedNotification.type === "order" && (
                        <div className="space-y-3">
                          {selectedNotification.metadata.orderId && (
                            <div className="flex items-center gap-2">
                              <FaShoppingCart className="text-green-500" />
                              <span className="font-medium">Mã đơn hàng:</span>
                              <span>
                                #{selectedNotification.metadata.orderId}
                              </span>
                            </div>
                          )}
                          {selectedNotification.metadata.email && (
                            <div className="flex items-center gap-2">
                              <MdEmail className="text-blue-500" />
                              <span className="font-medium">Khách hàng:</span>
                              <span>{selectedNotification.metadata.email}</span>
                            </div>
                          )}
                          {selectedNotification.metadata.amount && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">💰</span>
                              <span className="font-medium">Tổng tiền:</span>
                              <span className="font-bold text-green-600">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(selectedNotification.metadata.amount)}
                              </span>
                            </div>
                          )}
                          {selectedNotification.metadata.address && (
                            <div className="flex items-start gap-2">
                              <MdLocationOn className="text-red-500 mt-1" />
                              <span className="font-medium">Địa chỉ:</span>
                              <span>
                                {selectedNotification.metadata.address}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {(selectedNotification.type === "user" ||
                        selectedNotification.type === "login") && (
                        <div className="space-y-3">
                          {selectedNotification.metadata.email && (
                            <div className="flex items-center gap-2">
                              <MdEmail className="text-blue-500" />
                              <span className="font-medium">Email:</span>
                              <span>{selectedNotification.metadata.email}</span>
                            </div>
                          )}
                          {selectedNotification.metadata.name && (
                            <div className="flex items-center gap-2">
                              <MdPerson className="text-purple-500" />
                              <span className="font-medium">Tên:</span>
                              <span>{selectedNotification.metadata.name}</span>
                            </div>
                          )}
                          {selectedNotification.metadata.role && (
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-500">👤</span>
                              <span className="font-medium">Vai trò:</span>
                              <span className="capitalize font-medium">
                                {selectedNotification.metadata.role === "admin"
                                  ? "Quản trị viên"
                                  : "Khách hàng"}
                              </span>
                            </div>
                          )}
                          {selectedNotification.metadata.userType && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">🏷️</span>
                              <span className="font-medium">Loại:</span>
                              <span className="capitalize">
                                {selectedNotification.metadata.userType}
                              </span>
                            </div>
                          )}
                          {selectedNotification.metadata.ip && (
                            <div className="flex items-center gap-2">
                              <span className="text-orange-500">🌐</span>
                              <span className="font-medium">IP:</span>
                              <span className="font-mono">
                                {selectedNotification.metadata.ip}
                              </span>
                            </div>
                          )}
                          {selectedNotification.metadata.userAgent && (
                            <div className="flex items-start gap-2">
                              <span className="text-gray-500 mt-1">📱</span>
                              <span className="font-medium">Thiết bị:</span>
                              <span className="text-sm">
                                {selectedNotification.metadata.userAgent}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Raw metadata for debugging */}
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                          Dữ liệu thô (JSON)
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(
                            selectedNotification.metadata,
                            null,
                            2
                          )}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Đóng
                </button>

                <div className="flex gap-3">
                  {!selectedNotification.isRead && (
                    <button
                      onClick={() => markAsRead(selectedNotification._id)}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <MdCheck />
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
