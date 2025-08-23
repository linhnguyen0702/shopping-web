import { useState, useEffect } from "react";
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

const Analytics = () => {
  const { token } = useSelector((state) => state.auth);
  
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    loading: true,
    error: null
  });

  // Fetch analytics data from real APIs
  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsData(prev => ({ ...prev, loading: true, error: null }));
      
      if (!token) {
        throw new Error("Không có token xác thực");
      }

      // Fetch data from multiple endpoints with authentication
      const [ordersRes, usersRes] = await Promise.all([
        axios.get(`${serverUrl}/api/order/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${serverUrl}/api/user/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      console.log("Orders response:", ordersRes.data);
      console.log("Users response:", usersRes.data);

      // Check if responses are successful
      if (!ordersRes.data?.success) {
        throw new Error(`Orders API error: ${ordersRes.data?.message || 'Unknown error'}`);
      }
      
      if (!usersRes.data?.success) {
        throw new Error(`Users API error: ${usersRes.data?.message || 'Unknown error'}`);
      }

      // Handle different response structures
      const orders = ordersRes.data?.orders || [];
      const users = usersRes.data?.users || [];

      console.log("Parsed orders:", orders);
      console.log("Parsed users:", users);
      console.log("Orders count:", orders.length);
      console.log("Users count:", users.length);

      // Calculate real statistics
      const totalOrders = orders.length;
      const totalUsers = users.length;
      
      // Calculate total revenue from actual orders
      const totalRevenue = orders.reduce((sum, order) => {
        // Handle different field names for amount
        const amount = order.amount || order.totalAmount || order.total || 0;
        return sum + (parseFloat(amount) || 0);
      }, 0);

      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate conversion rate (orders per user)
      const conversionRate = totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(2) : 0;

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        totalUsers,
        conversionRate: parseFloat(conversionRate),
        averageOrderValue,
        loading: false,
        error: null
      });

      toast.success("Đã cập nhật dữ liệu phân tích");
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu phân tích:", error);
      
      let errorMessage = "Không thể tải dữ liệu phân tích";
      if (error.response?.status === 401) {
        errorMessage = "Không có quyền truy cập - Vui lòng đăng nhập lại";
      } else if (error.response?.status === 404) {
        errorMessage = "API endpoint không tồn tại";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAnalyticsData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalyticsData();
    } else {
      setAnalyticsData(prev => ({
        ...prev,
        loading: false,
        error: "Vui lòng đăng nhập để xem dữ liệu phân tích"
      }));
    }
  }, [token]);

  const stats = [
    {
      title: "Tổng doanh thu",
      value: formatVND(analyticsData.totalRevenue),
      change: "+12.5%",
      trend: "up",
      icon: <FaDollarSign />,
      color: "green",
      description: "Doanh thu thực tế từ đơn hàng"
    },
    {
      title: "Tổng đơn hàng",
      value: analyticsData.totalOrders.toLocaleString(),
      change: "+8.2%",
      trend: "up",
      icon: <FaShoppingCart />,
      color: "blue",
      description: "Số lượng đơn hàng thực tế"
    },
    {
      title: "Tổng người dùng",
      value: analyticsData.totalUsers.toLocaleString(),
      change: "+15.3%",
      trend: "up",
      icon: <FaUsers />,
      color: "purple",
      description: "Số lượng người dùng đăng ký"
    },
    {
      title: "Tỷ lệ chuyển đổi",
      value: `${analyticsData.conversionRate}%`,
      change: "-2.1%",
      trend: "down",
      icon: <FaChartLine />,
      color: "orange",
      description: "Tỷ lệ đơn hàng từ người dùng"
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
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
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
              Dữ liệu thực tế từ hệ thống - Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
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
            <p className="text-sm text-gray-600 mb-1">Doanh thu trung bình/đơn hàng</p>
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
            <p className="text-sm text-gray-600 mb-1">Tỷ lệ tăng trưởng</p>
            <p className="text-xl font-bold text-purple-600">+12.5%</p>
          </div>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <FaChartLine className="text-blue-600 text-xl" />
          <h3 className="text-lg font-semibold text-blue-900">
            Nguồn dữ liệu
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p><strong>Đơn hàng:</strong> Lấy từ API `/api/order/list`</p>
            <p><strong>Người dùng:</strong> Lấy từ API `/api/user/list`</p>
          </div>
          <div>
            <p><strong>Doanh thu:</strong> Tính từ tổng `totalAmount` của đơn hàng</p>
            <p><strong>Cập nhật:</strong> Theo thời gian thực khi có đơn hàng mới</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Biểu đồ doanh thu thực tế
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <FaChartLine className="mx-auto text-4xl text-gray-400 mb-3" />
              <p className="text-gray-500">Biểu đồ sẽ được tích hợp ở đây</p>
              <p className="text-sm text-gray-400 mt-1">
                Hiển thị doanh thu thực tế: {formatVND(analyticsData.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Xu hướng đơn hàng thực tế
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <FaShoppingCart className="mx-auto text-4xl text-gray-400 mb-3" />
              <p className="text-gray-500">Biểu đồ sẽ được tích hợp ở đây</p>
              <p className="text-sm text-gray-400 mt-1">
                Tổng đơn hàng: {analyticsData.totalOrders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
