import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { logout } from "../redux/authSlice";
import { IoMdAdd } from "react-icons/io";
import {
  FaList,
  FaUsers,
  FaBox,
  FaChevronDown,
  FaChevronRight,
  FaSignOutAlt,
  FaTags,
  FaExternalLinkAlt,
} from "react-icons/fa";
import {
  MdDashboard,
  MdAnalytics,
  MdInventory,
  MdNotifications,
} from "react-icons/md";
import { BiPackage } from "react-icons/bi";
import { HiOutlineClipboardList } from "react-icons/hi";
import { CLIENT_BASE_URL } from "../config";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [expandedCategories, setExpandedCategories] = useState({
    Products: false,
  });

  const toggleCategory = (categoryName) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Đăng xuất thành công");
    navigate("/login");
  };

  const openClientSite = () => {
    if (!CLIENT_BASE_URL) {
      toast.error("Không tìm thấy địa chỉ website khách hàng");
      return;
    }
    // Pass token via query to client AuthBridge
    const url = `${CLIENT_BASE_URL}/auth/bridge${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const sidebarItems = [
    {
      title: "Tổng quan",
      icon: <MdDashboard />,
      path: "/",
      description: "Tổng quan hoạt động",
      badge: null,
    },
    {
      title: "Phân tích",
      icon: <MdAnalytics />,
      path: "/analytics",
      description: "Báo cáo và số liệu",
      badge: "Mới",
    },
    {
      title: "Sản phẩm",
      icon: <BiPackage />,
      path: "#",
      isCategory: true,
      children: [
        {
          title: "Thêm sản phẩm",
          icon: <IoMdAdd />,
          path: "/add",
          description: "Tạo sản phẩm mới",
        },
        {
          title: "Danh sách sản phẩm",
          icon: <FaList />,
          path: "/list",
          description: "Quản lý sản phẩm",
        },
        {
          title: "Tồn kho",
          icon: <MdInventory />,
          path: "/inventory",
          description: "Theo dõi số lượng",
        },
        {
          title: "Danh mục",
          icon: <FaTags />,
          path: "/categories",
          description: "Quản lý danh mục",
        },
        {
          title: "Thương hiệu",
          icon: <FaBox />,
          path: "/brands",
          description: "Quản lý thương hiệu",
        },
      ],
    },
    {
      title: "Đơn hàng",
      icon: <HiOutlineClipboardList />,
      path: "/orders",
      description: "Quản lý đơn hàng",
      badge: null,
    },
    {
      title: "Người dùng",
      icon: <FaUsers />,
      path: "/users",
      description: "Quản lý người dùng",
    },
    {
      title: "Thông báo",
      icon: <MdNotifications />,
      path: "/notifications",
      description: "Xem thông báo hệ thống",
    },
  ];

  const renderNavItem = (item, isChild = false) => {
    if (item.isCategory) {
      const isExpanded = expandedCategories[item.title];

      return (
        <div key={item.title} className="mb-2">
          <button
            onClick={() => toggleCategory(item.title)}
            className="w-full flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 mx-1 sm:mx-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-base sm:text-lg transition-transform group-hover:scale-110 flex-shrink-0">
                {item.icon}
              </span>
              <span className="hidden sm:inline-flex font-medium truncate">
                {item.title}
              </span>
            </div>
            <span className="hidden sm:inline-flex flex-shrink-0">
              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </span>
          </button>
          <div
            className={`ml-3 sm:ml-4 space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${
              isExpanded
                ? "max-h-96 opacity-100 pb-2 mt-1 menu-expand-animation"
                : "max-h-0 opacity-0 mt-0"
            }`}
          >
            {item.children?.map((child) => renderNavItem(child, true))}
          </div>
        </div>
      );
    }

    return (
      <NavLink
        key={item.title}
        to={item.path}
        className={({ isActive }) =>
          `flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 mx-1 sm:mx-2 rounded-lg transition-all duration-200 group ${
            isActive
              ? "bg-gradient-to-r from-black to-gray-800 text-white shadow-lg"
              : "text-gray-700 hover:bg-gray-50 hover:text-black"
          } ${isChild ? "text-sm" : ""}`
        }
        title={item.description}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span
            className={`${
              isChild ? "text-sm sm:text-base" : "text-base sm:text-lg"
            } transition-transform group-hover:scale-110 flex-shrink-0`}
          >
            {item.icon}
          </span>
          <div className="hidden sm:flex flex-col min-w-0 flex-1">
            <span
              className={`font-medium truncate ${isChild ? "text-sm" : ""}`}
            >
              {item.title}
            </span>
            {!isChild && (
              <span className="text-xs text-gray-400 group-hover:text-gray-600 truncate">
                {item.description}
              </span>
            )}
          </div>
        </div>
        {item.badge && (
          <span className="hidden lg:inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <div className="w-full h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo/Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-black to-gray-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <FaBox className="text-white text-sm sm:text-lg" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg sm:text-xl text-gray-900">
              Decora Admin
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Hệ thống đang hoạt động
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable area */}
      <div className="flex-1 sidebar-scroll-area scrollbar-thin min-h-0">
        <div className="py-2 sm:py-4 px-1 sm:px-0 pb-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => renderNavItem(item))}
          </div>
        </div>
      </div>

      {/* Footer - Always visible at bottom */}
      <div className="sidebar-footer p-3 sm:p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
        <button
          onClick={openClientSite}
          className="w-full flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 group"
        >
          <FaExternalLinkAlt className="text-sm sm:text-base group-hover:scale-110 transition-transform duration-200" />
          <span className="hidden sm:inline font-medium">Xem website</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 group"
        >
          <FaSignOutAlt className="text-sm sm:text-base group-hover:scale-110 transition-transform duration-200" />
          <span className="hidden sm:inline font-medium">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
