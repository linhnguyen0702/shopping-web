import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { serverUrl } from "../../config";

// Custom hook để quản lý notifications với real-time updates
export const useNotifications = (token) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const lastFetchTime = useRef(Date.now());

  // Fetch notifications từ API
  const fetchNotifications = useCallback(
    async (force = false) => {
      if (!token) return;

      // Tránh fetch liên tục trong thời gian ngắn
      const now = Date.now();
      if (!force && now - lastFetchTime.current < 2000) {
        return;
      }
      lastFetchTime.current = now;

      try {
        setLoading(true);
        const response = await axios.get(
          `${serverUrl}/api/notifications?limit=10`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          setNotifications(response.data.notifications || []);
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Đánh dấu thông báo đã đọc
  const markAsRead = useCallback(
    async (notificationId) => {
      if (!token) return;

      try {
        await axios.put(
          `${serverUrl}/api/notifications/${notificationId}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Cập nhật local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Lỗi đánh dấu đã đọc:", error);
      }
    },
    [token]
  );

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
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
      setUnreadCount(0);
    } catch (error) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", error);
    }
  }, [token]);

  // Setup polling và event listeners
  useEffect(() => {
    if (!token) return;

    // Fetch ngay lập tức
    fetchNotifications(true);

    // Setup polling ngắn hạn (mỗi 3 giây)
    intervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 3000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, fetchNotifications]);

  // Listen cho window focus
  useEffect(() => {
    const handleFocus = () => {
      if (token) {
        fetchNotifications(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [token, fetchNotifications]);

  // Method để force refresh (dùng khi user vừa login hoặc có action đặc biệt)
  const forceRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    forceRefresh,
  };
};
