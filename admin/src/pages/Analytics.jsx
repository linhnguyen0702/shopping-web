import { useState, useEffect, useCallback } from "react";
import {
  FaChartLine,
  FaUsers,
  FaShoppingCart,
  FaDollarSign,
  FaSync,
} from "react-icons/fa";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";
import axios from "axios";
import { serverUrl } from "../../config";
import { formatVND, formatCompactVND } from "../helpers/currencyHelper";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import RevenueChart from "../components/RevenueChart";
import OrderTrendChart from "../components/OrderTrendChart";

const Analytics = () => {
  const { token } = useSelector((state) => state.auth);

  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    loading: true,
    error: null,
    // dynamic growth
    revenueChangePct: 0,
    ordersChangePct: 0,
    usersChangePct: 0,
    // chart data
    monthlyOrders: [],
  });

  const calcChangePct = (current, previous) => {
    const curr = Number(current) || 0;
    const prev = Number(previous) || 0;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Number((((curr - prev) / prev) * 100).toFixed(2));
  };

  // Fetch analytics data from real APIs
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setAnalyticsData((prev) => ({ ...prev, loading: true, error: null }));

      if (!token) {
        throw new Error("Không có token xác thực");
      }

      // Fetch orders list, users list, and order stats (for MoM growth)
      const [ordersRes, usersRes, orderStatsRes] = await Promise.all([
        axios.get(`${serverUrl}/api/order/list`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/user/users?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/order/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!ordersRes.data?.success)
        throw new Error(ordersRes.data?.message || "Lỗi API đơn hàng");
      if (!usersRes.data?.success)
        throw new Error(usersRes.data?.message || "Lỗi API người dùng");
      if (!orderStatsRes.data?.success)
        throw new Error(
          orderStatsRes.data?.message || "Lỗi API thống kê đơn hàng"
        );

      const orders = ordersRes.data?.orders || [];
      const users = usersRes.data?.users || [];
      const { monthlyOrders = [] } = orderStatsRes.data?.stats || {};

      // Current totals
      const totalOrders = orders.length;
      const totalUsers = users.length;
      const totalRevenue = orders.reduce((sum, order) => {
        const amount = order.amount || order.totalAmount || order.total || 0;
        return sum + (parseFloat(amount) || 0);
      }, 0);

      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const conversionRate =
        totalUsers > 0
          ? Number(((totalOrders / totalUsers) * 100).toFixed(2))
          : 0;

      // Compute month-over-month growth using monthlyOrders (last two buckets)
      // monthlyOrders: [{ _id: {year, month}, count, revenue }]
      let ordersChangePct = 0;
      let revenueChangePct = 0;
      if (monthlyOrders.length > 0) {
        const last = monthlyOrders[monthlyOrders.length - 1];
        const prev = monthlyOrders[monthlyOrders.length - 2] || {
          count: 0,
          revenue: 0,
        };
        const currCount = Number(last.count) || 0;
        const prevCount = Number(prev.count) || 0;
        const currRevenue = Number(last.revenue) || 0;
        const prevRevenue = Number(prev.revenue) || 0;
        ordersChangePct = calcChangePct(currCount, prevCount);
        revenueChangePct = calcChangePct(currRevenue, prevRevenue);
      }

      // Compute users growth: last 30 days vs previous 30 days by createdAt
      let usersChangePct = 0;
      try {
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        const startCurr = now - 30 * day;
        const startPrev = now - 60 * day;
        const usersCurr = users.filter(
          (u) => u.createdAt && new Date(u.createdAt).getTime() >= startCurr
        ).length;
        const usersPrev = users.filter(
          (u) =>
            u.createdAt &&
            new Date(u.createdAt).getTime() >= startPrev &&
            new Date(u.createdAt).getTime() < startCurr
        ).length;
        usersChangePct = calcChangePct(usersCurr, usersPrev);
      } catch (error) {
        console.error("Error calculating user growth:", error);
      }

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        totalUsers,
        conversionRate,
        averageOrderValue,
        revenueChangePct,
        ordersChangePct,
        usersChangePct,
        monthlyOrders,
        loading: false,
        error: null,
      });

      toast.success("Đã cập nhật dữ liệu phân tích");
    } catch (error) {
      let errorMessage = "Không thể tải dữ liệu phân tích";
      if (error.response?.status === 401) {
        errorMessage = "Không có quyền truy cập - Vui lòng đăng nhập lại";
      } else if (error.response?.status === 404) {
        errorMessage = "API endpoint không tồn tại";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAnalyticsData((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAnalyticsData();
    } else {
      setAnalyticsData((prev) => ({
        ...prev,
        loading: false,
        error: "Vui lòng đăng nhập để xem dữ liệu phân tích",
      }));
    }
  }, [token, fetchAnalyticsData]);

  const stats = [
    {
      title: "Tổng doanh thu",
      value: formatVND(analyticsData.totalRevenue),
      change: `${analyticsData.revenueChangePct >= 0 ? "+" : ""}${
        analyticsData.revenueChangePct
      }%`,
      trend: analyticsData.revenueChangePct >= 0 ? "up" : "down",
      icon: <FaDollarSign />,
      color: "green",
      description: "Doanh thu thực tế từ đơn hàng",
    },
    {
      title: "Tổng đơn hàng",
      value: analyticsData.totalOrders.toLocaleString(),
      change: `${analyticsData.ordersChangePct >= 0 ? "+" : ""}${
        analyticsData.ordersChangePct
      }%`,
      trend: analyticsData.ordersChangePct >= 0 ? "up" : "down",
      icon: <FaShoppingCart />,
      color: "blue",
      description: "Số lượng đơn hàng thực tế",
    },
    {
      title: "Tổng người dùng",
      value: analyticsData.totalUsers.toLocaleString(),
      change: `${analyticsData.usersChangePct >= 0 ? "+" : ""}${
        analyticsData.usersChangePct
      }%`,
      trend: analyticsData.usersChangePct >= 0 ? "up" : "down",
      icon: <FaUsers />,
      color: "purple",
      description: "Số lượng người dùng đăng ký",
    },
    {
      title: "Tỷ lệ chuyển đổi",
      value: `${analyticsData.conversionRate}%`,
      change: `${analyticsData.ordersChangePct >= 0 ? "+" : ""}${
        analyticsData.ordersChangePct
      }%`,
      trend: analyticsData.ordersChangePct >= 0 ? "up" : "down",
      icon: <FaChartLine />,
      color: "orange",
      description: "Tỷ lệ đơn hàng từ người dùng",
    },
  ];

  if (analyticsData.loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bảng điều khiển phân tích
          </h1>
          <p className="text-gray-600">
            Đang tải dữ liệu phân tích từ hệ thống...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (analyticsData.error) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bảng điều khiển phân tích
          </h1>
          <p className="text-gray-600">
            Có lỗi xảy ra khi tải dữ liệu từ hệ thống
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <FaChartLine className="text-2xl text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">
            Không thể tải dữ liệu phân tích
          </h3>
          <p className="text-red-600 mb-4">{analyticsData.error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bảng điều khiển phân tích
            </h1>
            <p className="text-gray-600">
              Dữ liệu thực tế từ hệ thống - Cập nhật lần cuối:{" "}
              {new Date().toLocaleString("vi-VN")}
            </p>
          </div>
          <button
            onClick={fetchAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FaSync className="text-sm" />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}
              >
                {stat.icon}
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.trend === "up" ? <MdTrendingUp /> : <MdTrendingDown />}
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
            <p className="text-gray-500 text-xs mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Additional Revenue Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin doanh thu chi tiết
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">
              Doanh thu trung bình/đơn hàng
            </p>
            <p className="text-xl font-bold text-green-600">
              {formatVND(analyticsData.averageOrderValue)}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Doanh thu rút gọn</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCompactVND(analyticsData.totalRevenue)}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">
              Tăng trưởng đơn hàng (MoM)
            </p>
            <p
              className={`text-xl font-bold ${
                analyticsData.ordersChangePct >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {analyticsData.ordersChangePct >= 0 ? "+" : ""}
              {analyticsData.ordersChangePct}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Biểu đồ doanh thu thực tế
          </h3>
          <RevenueChart monthlyData={analyticsData.monthlyOrders} type="line" />
          <div className="mt-3 text-sm text-gray-600 text-center">
            Tổng doanh thu: {formatVND(analyticsData.totalRevenue)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Xu hướng đơn hàng thực tế
          </h3>
          <OrderTrendChart
            monthlyData={analyticsData.monthlyOrders}
            type="bar"
          />
          <div className="mt-3 text-sm text-gray-600 text-center">
            Tổng đơn hàng: {analyticsData.totalOrders.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
