import { useState, useEffect, useRef } from "react";
import { FaBell, FaCheck, FaInfoCircle, FaExclamationTriangle, FaShoppingBag, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { config } from "../../config";
import toast from "react-hot-toast";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${config.baseUrl}/api/notifications?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId, event) => {
    if (event) event.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${config.baseUrl}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${config.baseUrl}/api/notifications/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("Đã đánh dấu tất cả là đã đọc");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${config.baseUrl}/api/notifications`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      const data = await response.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
        // If it was unread, decrease count
        const wasUnread = notifications.find(n => n._id === notificationId && !n.isRead);
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success("Đã xóa thông báo");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "order":
        return <FaShoppingBag className="text-blue-500" />;
      case "warning":
        return <FaExclamationTriangle className="text-yellow-500" />;
      case "system":
        return <FaInfoCircle className="text-gray-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  // Custom date formatter: HH:mm dd/MM/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    // Navigate based on type
    if (notification.type === 'order') {
      // Try to find orderId in various places
      let orderId = notification.data?.orderId || notification.metadata?.orderId;
      
      // Fallback for admin notifications (Vietnamese keys)
      if (!orderId && notification.data && notification.data["Mã đơn hàng"]) {
        orderId = notification.data["Mã đơn hàng"];
      }

      console.log("Navigating to order:", orderId);

      if (orderId) {
        navigate(`/checkout/${orderId}`);
        setIsOpen(false);
      } else {
        console.warn("Could not find orderId in notification:", notification);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-2xl text-gray-700 hover:text-black relative transition-colors duration-300 p-2"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 w-5 h-5 rounded-full text-xs bg-red-500 text-white flex items-center justify-center font-medium animate-pulse border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100] origin-top-right transition-all normal-case">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm border border-gray-200"
              >
                <FaCheck className="w-3 h-3" /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-black rounded-full mx-auto mb-2"></div>
                Đang tải...
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${
                      !notification.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <button
                           onClick={(e) => deleteNotification(notification._id, e)}
                           className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                           title="Xóa thông báo"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">
                            {formatDate(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification._id, e)}
                              className="text-xs text-blue-600 font-medium hover:text-blue-800"
                            >
                              Đánh dấu đã đọc
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FaBell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Không có thông báo nào</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
