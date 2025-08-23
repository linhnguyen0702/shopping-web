import { useState, useEffect } from "react";
import { FaBoxes, FaExclamationTriangle, FaCheckCircle, FaSync } from "react-icons/fa";
import { MdOutlineInventory, MdLowPriority } from "react-icons/md";
import axios from "axios";
import { serverUrl } from "../../config";
import toast from "react-hot-toast";
import { formatVND } from "../helpers/currencyHelper";

const Inventory = () => {
  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    inStockProducts: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hàm lấy dữ liệu tồn kho từ API
  const fetchInventoryData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${serverUrl}/api/product/list?isAvailable=false`);
      
      if (response.data?.success) {
        const products = response.data.products;
        
        // Tính toán thống kê tồn kho
        const totalProducts = products.length;
        const outOfStockProducts = products.filter(product => (product.stock || 0) === 0).length;
        const lowStockProducts = products.filter(product => {
          const stock = product.stock || 0;
          // Sản phẩm sắp hết hàng: tồn kho dưới 10 hoặc dưới 20% giá trị ban đầu
          return stock > 0 && stock < 10;
        }).length;
        const inStockProducts = totalProducts - outOfStockProducts;

        // Cập nhật thống kê
        setInventoryStats({
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          inStockProducts
        });

        // Lấy danh sách sản phẩm sắp hết hàng
        const lowStockList = products
          .filter(product => {
            const stock = product.stock || 0;
            return stock > 0 && stock < 10;
          })
          .map(product => ({
            name: product.name,
            stock: product.stock || 0,
            threshold: 10,
            category: product.category,
            price: product.price
          }))
          .sort((a, b) => a.stock - b.stock) // Sắp xếp theo số lượng tồn kho tăng dần
          .slice(0, 10); // Chỉ hiển thị 10 sản phẩm đầu tiên

        setLowStockItems(lowStockList);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu tồn kho:", error);
      toast.error("Không thể tải dữ liệu tồn kho");
    } finally {
      setIsLoading(false);
    }
  };

  // Tải dữ liệu khi component mount
  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Hàm làm mới dữ liệu
  const handleRefresh = () => {
    fetchInventoryData();
    toast.success("Đã làm mới dữ liệu tồn kho");
  };

  const stats = [
    {
      title: "Tổng sản phẩm",
      value: inventoryStats.totalProducts.toLocaleString(),
      icon: <FaBoxes />,
      color: "blue",
      description: "Tổng số sản phẩm trong hệ thống"
    },
    {
      title: "Sản phẩm sắp hết hàng",
      value: inventoryStats.lowStockProducts.toLocaleString(),
      icon: <FaExclamationTriangle />,
      color: "yellow",
      description: "Sản phẩm có tồn kho dưới 10"
    },
    {
      title: "Hết hàng",
      value: inventoryStats.outOfStockProducts.toLocaleString(),
      icon: <MdLowPriority />,
      color: "red",
      description: "Sản phẩm không còn tồn kho"
    },
    {
      title: "Còn hàng",
      value: inventoryStats.inStockProducts.toLocaleString(),
      icon: <FaCheckCircle />,
      color: "green",
      description: "Sản phẩm còn tồn kho"
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Quản lý tồn kho
            </h1>
            <p className="text-gray-600">
              Theo dõi và quản lý tồn kho sản phẩm theo thời gian thực
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            <FaSync className={`text-sm ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}
              >
                {stat.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </h3>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-gray-500 text-xs mt-1">{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Cảnh báo sắp hết hàng
              </h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {lowStockItems.length} sản phẩm
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
        <div className="p-6">
          {lowStockItems.length > 0 ? (
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>Danh mục: {item.category}</span>
                      <span>Giá: {formatVND(item.price)}</span>
                      <span>Ngưỡng cảnh báo: {item.threshold} sản phẩm</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      item.stock <= 3 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {item.stock}
                    </span>
                    <p className="text-sm text-gray-600">sản phẩm còn lại</p>
                    {item.stock <= 3 && (
                      <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Cần bổ sung gấp!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaCheckCircle className="mx-auto text-4xl text-green-500 mb-3" />
              <p className="text-gray-600">Không có sản phẩm nào sắp hết hàng</p>
              <p className="text-sm text-gray-500 mt-1">Tất cả sản phẩm đều có đủ tồn kho</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Hành động nhanh</h3>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý tồn kho và bổ sung hàng hóa
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={handleRefresh}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <MdOutlineInventory className="text-2xl text-gray-400 mb-2 mx-auto group-hover:text-blue-500" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700">
                Cập nhật tồn kho
              </p>
              <p className="text-xs text-gray-500 mt-1">Làm mới dữ liệu</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group">
              <FaBoxes className="text-2xl text-gray-400 mb-2 mx-auto group-hover:text-green-500" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-green-700">
                Nhập hàng loạt
              </p>
              <p className="text-xs text-gray-500 mt-1">Bổ sung tồn kho</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group">
              <FaCheckCircle className="text-2xl text-gray-400 mb-2 mx-auto group-hover:text-purple-500" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-purple-700">
                Kiểm kê kho
              </p>
              <p className="text-xs text-gray-500 mt-1">Đối soát tồn kho</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
