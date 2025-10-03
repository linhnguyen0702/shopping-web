import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Title from "../components/ui/title";
import SkeletonLoader from "../components/SkeletonLoader";
import { serverUrl } from "../../config";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaShoppingBag,
  FaCreditCard,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaTimes,
  FaSort,
  FaSync,
} from "react-icons/fa";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const paymentStatusOptions = ["pending", "paid", "failed"];

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/order/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Nếu API trả về thành công
        setOrders(data.orders); // Cập nhật state danh sách đơn hàng
      } else {
        // Nếu API trả về thất bại
        toast.error(data.message || "Không thể lấy danh sách đơn hàng");
      }
    } catch (error) {
      // Nếu có lỗi trong quá trình fetch hoặc xử lý
      console.error("Lỗi khi lấy đơn hàng:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      // Luôn chạy, dù thành công hay thất bại (thường dùng để tắt loading)
      setLoading(false);
    }
  };

  // Cập nhật trạng thái đơn hàng
  const updateOrderStatus = async (orderId, status, paymentStatus = null) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem("token");
      const updateData = { orderId, status };

      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }

      const response = await fetch(`${serverUrl}/api/order/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        // Nếu API trả về thành công
        toast.success("Đơn hàng đã được cập nhật thành công"); // Hiển thị thông báo thành công
        fetchOrders(); // Refresh orders
        setShowEditModal(false); // Đóng modal
        setEditingOrder(null); // Xóa dữ liệu đơn hàng đang chỉnh sửa
      } else {
        // Nếu API trả về thất bại
        toast.error(data.message || "Không thể cập nhật đơn hàng"); // Hiển thị thông báo lỗi
      }
    } catch (error) {
      // Nếu có lỗi trong quá trình xử lý
      console.error("Lỗi khi cập nhật đơn hàng:", error); // Hiển thị lỗi trong console
      toast.error("Không thể cập nhật đơn hàng"); // Hiển thị thông báo lỗi
    } finally {
      setIsUpdating(false);
    }
  };

  // Xóa đơn hàng
  const deleteOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này không?")) {
      // Hiển thị hộp thoại xác nhận
      return;
    }

    try {
      const token = localStorage.getItem("token"); // Lấy token từ localStorage
      const response = await fetch(`${serverUrl}/api/order/delete`, {
        // Gửi request xóa đơn hàng
        method: "POST", // Phương thức POST
        headers: {
          "Content-Type": "application/json", // Đặt header là JSON
          Authorization: `Bearer ${token}`, // Thêm token vào header
        },
        body: JSON.stringify({ orderId }), // Gửi dữ liệu xóa dưới dạng JSON
      });

      const data = await response.json(); // Lấy dữ liệu từ response
      if (data.success) {
        // Nếu API trả về thành công
        toast.success("Đơn hàng đã được xóa thành công"); // Hiển thị thông báo thành công
        fetchOrders(); // Refresh orders
      } else {
        // Nếu API trả về thất bại
        toast.error(data.message || "Không thể xóa đơn hàng"); // Hiển thị thông báo lỗi
      }
    } catch (error) {
      // Nếu có lỗi trong quá trình xử lý
      console.error("Lỗi khi xóa đơn hàng:", error); // Hiển thị lỗi trong console
      toast.error("Không thể xóa đơn hàng"); // Hiển thị thông báo lỗi
    }
  };

  // Xử lý chỉnh sửa đơn hàng
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.paymentStatus);
    setShowEditModal(true);
  };

  // Xử lý lưu thay đổi
  const handleSaveChanges = () => {
    if (!editingOrder) {
      toast.error("Không tìm thấy đơn hàng để cập nhật");
      return;
    }

    if (isUpdating) {
      return;
    }

    // Kiểm tra có thay đổi không
    const hasChanges =
      newStatus !== editingOrder.status ||
      newPaymentStatus !== editingOrder.paymentStatus;

    if (!hasChanges) {
      toast.info("Không có thay đổi nào để lưu");
      return;
    }

    updateOrderStatus(editingOrder._id, newStatus, newPaymentStatus);
  };

  // Lọc và sắp xếp đơn hàng
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === "all" || order.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Lấy màu sắc trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Lấy icon trạng thái
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="w-3 h-3" />;
      case "confirmed":
        return <FaCheckCircle className="w-3 h-3" />;
      case "shipped":
        return <FaTruck className="w-3 h-3" />;
      case "delivered":
        return <FaBox className="w-3 h-3" />;
      case "cancelled":
        return <FaTimes className="w-3 h-3" />;
      default:
        return <FaClock className="w-3 h-3" />;
    }
  };

  // Lấy màu sắc trạng thái thanh toán
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Chuyển đổi trạng thái sang tiếng Việt
  const translateStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xử lý";
      case "confirmed":
        return "Đã xác nhận";
      case "shipped":
        return "Đang giao";
      case "delivered":
        return "Đã giao";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  // Chuyển đổi trạng thái thanh toán sang tiếng Việt
  const translatePaymentStatus = (status) => {
    switch (status) {
      case "pending":
        return "Chờ thanh toán";
      case "paid":
        return "Đã thanh toán";
      case "failed":
        return "Thanh toán thất bại";
      default:
        return status;
    }
  };

  // Format tiền VNĐ
  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    // Sử dụng useEffect để gọi fetchOrders khi component mount
    fetchOrders(); // Gọi hàm fetchOrders để lấy danh sách đơn hàng
  }, []); // Chỉ chạy khi component mount

  if (loading) {
    // Nếu đang loading
    return (
      <div>
        <Title>Danh sách đơn hàng</Title>
        <div className="mt-6">
          <SkeletonLoader type="orders" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Title>Quản lý đơn hàng</Title>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          title="Làm mới danh sách đơn hàng"
        >
          <FaSync className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Thống kê đơn hàng */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                Tổng đơn hàng
              </p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {orders.length}
              </p>
            </div>
            <FaShoppingBag className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                Chờ xử lý
              </p>
              <p className="text-xl lg:text-2xl font-bold text-yellow-600">
                {orders.filter((o) => o.status === "pending").length}
              </p>
            </div>
            <FaClock className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                Đã giao
              </p>
              <p className="text-xl lg:text-2xl font-bold text-green-600">
                {orders.filter((o) => o.status === "delivered").length}
              </p>
            </div>
            <FaBox className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600">
                Doanh thu
              </p>
              <p className="text-xl lg:text-2xl font-bold text-purple-600">
                {formatVND(
                  orders.reduce((sum, order) => sum + order.amount, 0)
                )}
              </p>
            </div>
            <FaCreditCard className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Lọc và tìm kiếm */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {translateStatus(status)}
              </option>
            ))}
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">Tất cả thanh toán</option>
            {paymentStatusOptions.map((status) => (
              <option key={status} value={status}>
                {translatePaymentStatus(status)}
              </option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="date">Sắp xếp theo ngày</option>
              <option value="amount">Sắp xếp theo doanh thu</option>
              <option value="status">Sắp xếp theo trạng thái</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
            >
              <FaSort className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đặt hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doanh thu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thanh toán
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <FaUser className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {order.userId?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.userId?.email || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <FaCalendarAlt className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(order.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.items.length} sản phẩm
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatVND(order.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      {translateStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentMethod === "cod" ? (
                          <FaMoneyBillWave className="w-3 h-3" />
                        ) : (
                          <FaCreditCard className="w-3 h-3" />
                        )}
                        {translatePaymentStatus(order.paymentStatus)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Chỉnh sửa đơn hàng"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteOrder(order._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Xóa đơn hàng"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy đơn hàng
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                ? "Thử điều chỉnh bộ lọc của bạn"
                : "Không có đơn hàng nào đã được đặt"}
            </p>
          </div>
        )}
      </div>

      {/* Orders Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy đơn hàng
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                ? "Thử điều chỉnh bộ lọc của bạn"
                : "Không có đơn hàng nào đã được đặt"}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <FaUser className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.userId?.name || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditOrder(order)}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                    title="Edit Order"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteOrder(order._id)}
                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                    title="Delete Order"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">
                  Email khách hàng
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {order.userId?.email || "N/A"}
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Ngày đặt hàng
                  </div>
                  <div className="flex items-center text-sm text-gray-900">
                    <FaCalendarAlt className="w-3 h-3 mr-1 text-gray-400" />
                    {new Date(order.date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Sản phẩm</div>
                  <div className="text-sm text-gray-900">
                    {order.items.length} sản phẩm
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Doanh thu</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatVND(order.amount)}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  {translateStatus(order.status)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentMethod === "cod" ? (
                    <FaMoneyBillWave className="w-3 h-3" />
                  ) : (
                    <FaCreditCard className="w-3 h-3" />
                  )}
                  {translatePaymentStatus(order.paymentStatus)}
                </span>
              </div>

              {/* Payment Method */}
              <div className="text-xs text-gray-500">
                Phương thức thanh toán:{" "}
                {order.paymentMethod?.toUpperCase() || "N/A"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Chỉnh sửa đơn hàng
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Order #{editingOrder._id.slice(-8).toUpperCase()}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái đơn hàng
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {translateStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái thanh toán
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {paymentStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {translatePaymentStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveChanges}
                  disabled={isUpdating}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isUpdating
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  type="button"
                >
                  {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOrder(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
