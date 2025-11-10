import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
  FaBox,
  FaTimes,
  FaSync,
} from "react-icons/fa";
import { IoMdClose, IoMdCloudUpload } from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import PriceFormat from "../components/PriceFormat";
import Container from "../components/Container";
import PropTypes from "prop-types";
import Input, { Label } from "../components/ui/input";
import SmallLoader from "../components/SmallLoader";

const List = ({ token }) => {
  const location = useLocation();
  const [list, setList] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Details Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Categories and brands for edit modal
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Edit form data
  const [formData, setFormData] = useState({
    _type: "",
    name: "",
    description: "",
    brand: "",
    price: "",
    discountedPercentage: 10,
    stock: "",
    category: "",
    offer: false,
    isAvailable: true,
    badge: false,
    tags: [],
    options: [],
    combos: [],
  });

  const [imageFiles, setImageFiles] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });
  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${serverUrl}/api/product/list?isAvailable=all&_perPage=1000`
      );
      const data = response?.data;

      if (data?.success) {
        setList(data?.products);
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.log("Lỗi khi tải danh sách sản phẩm", error?.message);
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories and brands for edit modal
  const fetchCategoriesAndBrands = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/category`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/brand`),
      ]);

      const categoriesData = await categoriesRes.json();
      const brandsData = await brandsRes.json();

      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }
      if (brandsData.success) {
        setBrands(brandsData.brands);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh mục và thương hiệu:", error);
      toast.error("Không thể tải danh mục và thương hiệu");
    }
  };

  useEffect(() => {
    fetchList();
    fetchCategoriesAndBrands();
  }, []);

  // Check for search query parameter on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearchTerm(decodeURIComponent(searchQuery));
    }
  }, [location.search]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else if (
      type === "select-one" &&
      (name === "offer" || name === "isAvailable" || name === "badge")
    ) {
      setFormData({
        ...formData,
        [name]: value === "true",
      });
    } else if (
      name === "price" ||
      name === "discountedPercentage" ||
      name === "stock"
    ) {
      setFormData({
        ...formData,
        [name]: value === "" ? "" : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle individual image upload
  const handleImageChange = (e, imageKey) => {
    const file = e.target.files[0];
    if (file) {
      setImageFiles((prev) => ({
        ...prev,
        [imageKey]: file,
      }));
    }
  };

  // Remove an image
  const removeImage = (imageKey) => {
    setImageFiles((prev) => ({
      ...prev,
      [imageKey]: null,
    }));
  };

  // Open edit modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      _type: product._type || "",
      name: product.name || "",
      description: product.description || "",
      brand: product.brand || "",
      price: product.price || "",
      discountedPercentage: product.discountedPercentage || 10,
      stock: product.stock || 0,
      category: product.category || "",
      offer: product.offer || false,
      isAvailable: product.isAvailable !== false,
      badge: product.badge || false,
      tags: product.tags || [],
      options: product.options || [],
      combos: product.combos || [],
    });
    setImageFiles({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    });
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setFormData({
      _type: "",
      name: "",
      description: "",
      brand: "",
      price: "",
      discountedPercentage: 10,
      stock: "",
      category: "",
      offer: false,
      isAvailable: true,
      badge: false,
      tags: [],
      options: [],
      combos: [],
    });
    setImageFiles({
      image1: null,
      image2: null,
      image3: null,
      image4: null,
    });
  };

  // Open delete modal
  const openDeleteModal = (product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingProduct(null);
  };

  // Open/Close details modal
  const openDetailsModal = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProduct(null);
  };

  // Handlers for options
  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { label: "", price: "", stock: "" }],
    }));
  };

  const removeOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleOptionChange = (index, e) => {
    const { name, value } = e.target;
    const newOptions = [...formData.options];
    newOptions[index][name] =
      name === "price" || name === "stock" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  // Handlers for combos
  const addCombo = () => {
    setFormData((prev) => ({
      ...prev,
      combos: [
        ...prev.combos,
        { name: "", items: "", price: "", stock: "", discountNote: "" },
      ],
    }));
  };

  const removeCombo = (index) => {
    setFormData((prev) => ({
      ...prev,
      combos: prev.combos.filter((_, i) => i !== index),
    }));
  };

  const handleComboChange = (index, e) => {
    const { name, value } = e.target;
    const newCombos = [...formData.combos];
    newCombos[index][name] =
      name === "price" || name === "stock" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, combos: newCombos }));
  };

  // Handle product update
  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.category
    ) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();

      // Append form fields
      data.append("_type", formData._type);
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("brand", formData.brand);
      data.append("price", formData.price);
      data.append("discountedPercentage", formData.discountedPercentage);
      data.append("stock", formData.stock);
      data.append("category", formData.category);
      data.append("offer", formData.offer);
      data.append("isAvailable", formData.isAvailable);
      data.append("badge", formData.badge);
      data.append("tags", JSON.stringify(formData.tags));
      data.append("options", JSON.stringify(formData.options));
      data.append("combos", JSON.stringify(formData.combos));

      // Append image files only if new images are selected
      Object.keys(imageFiles).forEach((key) => {
        if (imageFiles[key]) {
          data.append(key, imageFiles[key]);
        }
      });

      const response = await axios.put(
        `${serverUrl}/api/product/update/${editingProduct._id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Let axios set proper multipart boundary
          },
        }
      );

      const responseData = response?.data;
      if (responseData?.success) {
        toast.success("Cập nhật sản phẩm thành công");
        await fetchList();
        closeEditModal();
      } else {
        toast.error(responseData?.message || "Cập nhật sản phẩm thất bại");
      }
    } catch (error) {
      console.log("Lỗi khi cập nhật sản phẩm", error);
      toast.error(
        error?.response?.data?.message || "Lỗi khi cập nhật sản phẩm"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveProduct = async () => {
    if (!deletingProduct) return;

    try {
      setSubmitting(true);
      const response = await axios.post(
        serverUrl + "/api/product/remove",
        { _id: deletingProduct._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response?.data;
      if (data?.success) {
        toast.success(data?.message);
        await fetchList();
        closeDeleteModal();
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.log("Lỗi khi xóa sản phẩm", error);
      toast.error(error?.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products based on search
  const filteredList = list.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.brand &&
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredList.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset to first page when search changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Danh sách sản phẩm ({filteredList.length})
            </h1>
            <p className="text-gray-600 mt-1">Quản lý kho sản phẩm của bạn</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchList}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              title="Làm mới danh sách sản phẩm"
            >
              <FaSync className="w-4 h-4" />
              Làm mới
            </button>
            <Link
              to="/add"
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FaPlus />
              Thêm sản phẩm
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Products List */}
        {isLoading ? (
          <>
            {/* Desktop Table Skeleton */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hình ảnh
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tồn kho
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards Skeleton */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="flex gap-2 mt-3">
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12">
            <FaBox className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm
                ? "Không tìm thấy sản phẩm nào"
                : "Chưa có sản phẩm nào"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "Hãy thử điều chỉnh từ khóa tìm kiếm"
                : "Bắt đầu bằng cách thêm sản phẩm đầu tiên"}
            </p>
            {!searchTerm && (
              <Link
                to="/add"
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Thêm sản phẩm
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hình ảnh
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tồn kho
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentProducts.map((product) => (
                      <tr
                        key={product._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={(e) => {
                          if (e.target.closest("button") === null) {
                            openDetailsModal(product);
                          }
                        }}
                      >
                        <td className="px-6 py-4">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {product.name}
                          </div>
                          {product.brand && (
                            <div className="text-xs text-gray-500 mt-1">
                              {product.brand}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            <PriceFormat amount={product.price} />
                          </div>
                          {product.discountedPercentage > 0 && (
                            <div className="text-xs text-green-600">
                              Giảm {product.discountedPercentage}%
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {product.stock || 0}
                          </div>
                          <div
                            className={`text-xs ${
                              product.stock > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {product.stock > 0 ? "Còn hàng" : "Hết hàng"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            >
                              <FaEdit />
                              Sửa
                            </button>
                            <button
                              onClick={() => openDeleteModal(product)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            >
                              <FaTrash />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={(e) => {
                    if (e.target.closest("button") === null) {
                      openDetailsModal(product);
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                        {product.brand && (
                          <span className="text-xs text-gray-500">
                            {product.brand}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            <PriceFormat amount={product.price} />
                          </div>
                          {product.discountedPercentage > 0 && (
                            <div className="text-xs text-green-600">
                              Giảm {product.discountedPercentage}%
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">
                            Tồn kho: {product.stock || 0}
                          </div>
                          <div
                            className={`text-xs ${
                              product.stock > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {product.stock > 0 ? "Còn hàng" : "Hết hàng"}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openEditModal(product)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          <FaEdit />
                          Sửa
                        </button>
                        <button
                          onClick={() => openDeleteModal(product)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          <FaTrash />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                {/* Desktop Pagination */}
                <div className="hidden sm:flex space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm border rounded-md ${
                          currentPage === page
                            ? "bg-black text-white border-black"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>

                {/* Mobile Pagination */}
                <div className="sm:hidden flex items-center space-x-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  <span className="text-sm text-gray-700">
                    Trang {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeEditModal();
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">Chỉnh sửa sản phẩm</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IoMdClose size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="p-6 space-y-6">
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Hình ảnh sản phẩm
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {["image1", "image2", "image3", "image4"].map(
                      (imageKey, index) => (
                        <div key={imageKey} className="relative">
                          <label htmlFor={`edit-${imageKey}`} className="block">
                            <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors duration-200 min-h-[120px] flex flex-col items-center justify-center bg-white">
                              {imageFiles[imageKey] ? (
                                <>
                                  <img
                                    src={URL.createObjectURL(
                                      imageFiles[imageKey]
                                    )}
                                    alt={`Xem trước ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-md mb-2"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      removeImage(imageKey);
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  >
                                    <FaTimes className="text-xs" />
                                  </button>
                                  <span className="text-xs text-gray-600">
                                    Thay đổi
                                  </span>
                                </>
                              ) : editingProduct?.images?.[index] ? (
                                <>
                                  <img
                                    src={editingProduct.images[index]}
                                    alt={`Hiện tại ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-md mb-2"
                                  />
                                  <span className="text-xs text-gray-600">
                                    Thay thế
                                  </span>
                                </>
                              ) : (
                                <>
                                  <IoMdCloudUpload className="text-3xl text-gray-400 mb-2" />
                                  <span className="text-xs text-gray-600">
                                    Tải lên hình ảnh {index + 1}
                                  </span>
                                </>
                              )}
                              <input
                                type="file"
                                id={`edit-${imageKey}`}
                                hidden
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, imageKey)}
                              />
                            </div>
                          </label>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <Label htmlFor="name">Tên sản phẩm *</Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label htmlFor="description">Mô tả *</Label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand">Thương hiệu</Label>
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn thương hiệu</option>
                      {brands.map((brand) => (
                        <option key={brand._id} value={brand.name}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="category">Danh mục *</Label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <Label htmlFor="price">Giá *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <Label htmlFor="discountedPercentage">Giảm giá %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      name="discountedPercentage"
                      value={formData.discountedPercentage}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex flex-col">
                    <Label htmlFor="stock">Tồn kho *</Label>
                    <Input
                      type="number"
                      min="0"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="_type">Loại sản phẩm</Label>
                    <select
                      name="_type"
                      value={formData._type}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn loại</option>
                      <option value="new_arrivals">Hàng mới về</option>
                      <option value="best_sellers">Bán chạy nhất</option>
                      <option value="special_offers">Ưu đãi đặc biệt</option>
                      <option value="promotions">Khuyến mãi</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="isAvailable">Tình trạng</Label>
                    <select
                      name="isAvailable"
                      value={formData.isAvailable.toString()}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">Còn hàng</option>
                      <option value="false">Hết hàng</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="offer">Ưu đãi đặc biệt</Label>
                    <select
                      name="offer"
                      value={formData.offer.toString()}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="false">Không</option>
                      <option value="true">Có</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="badge">Hiển thị nhãn</Label>
                    <select
                      name="badge"
                      value={formData.badge.toString()}
                      onChange={handleInputChange}
                      className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="false">Không</option>
                      <option value="true">Có</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>Nhãn</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                    {[
                      "Phòng khách",
                      "Phòng ngủ",
                      "Phòng bếp",
                      "Trang trí",
                      "Khác",
                    ].map((tag) => (
                      <div className="flex items-center space-x-2" key={tag}>
                        <input
                          id={`edit-${tag.toLowerCase()}`}
                          type="checkbox"
                          value={tag}
                          checked={formData.tags.includes(tag)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prevData) => ({
                                ...prevData,
                                tags: [...prevData.tags, tag],
                              }));
                            } else {
                              setFormData((prevData) => ({
                                ...prevData,
                                tags: prevData.tags.filter((t) => t !== tag),
                              }));
                            }
                          }}
                        />
                        <label
                          htmlFor={`edit-${tag.toLowerCase()}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Options (Variants) */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-2">
                    Lựa chọn sản phẩm (mua lẻ)
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Thêm các lựa chọn khác nhau cho sản phẩm như màu sắc, kích
                    thước, loại...
                  </p>
                  <div className="space-y-3">
                    {formData.options.map((option, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-end p-2 bg-gray-50 rounded border"
                      >
                        <div className="col-span-12 sm:col-span-5 flex flex-col">
                          <Label
                            htmlFor={`edit_option_label_${index}`}
                            className="mb-1"
                          >
                            Tên lựa chọn
                          </Label>
                          <Input
                            type="text"
                            name="label"
                            placeholder="VD: Màu đen"
                            value={option.label}
                            onChange={(e) => handleOptionChange(index, e)}
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-3 flex flex-col">
                          <Label
                            htmlFor={`edit_option_price_${index}`}
                            className="mb-1"
                          >
                            Giá
                          </Label>
                          <Input
                            type="number"
                            name="price"
                            placeholder="Giá"
                            value={option.price}
                            onChange={(e) => handleOptionChange(index, e)}
                          />
                        </div>
                        <div className="col-span-5 sm:col-span-3 flex flex-col">
                          <Label
                            htmlFor={`edit_option_stock_${index}`}
                            className="mb-1"
                          >
                            Tồn kho
                          </Label>
                          <Input
                            type="number"
                            name="stock"
                            placeholder="Tồn kho"
                            value={option.stock}
                            onChange={(e) => handleOptionChange(index, e)}
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="w-full bg-red-500 text-white px-2 rounded hover:bg-red-600 h-[36px] flex items-center justify-center text-sm"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-3 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-blue-200"
                  >
                    + Thêm lựa chọn
                  </button>
                </div>

                {/* Product Combos */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-2">
                    Gói Combo
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Tạo các gói combo để bán nhiều sản phẩm cùng lúc với giá ưu
                    đãi.
                  </p>
                  <div className="space-y-4">
                    {formData.combos.map((combo, index) => (
                      <div
                        key={index}
                        className="space-y-3 p-2 bg-gray-50 rounded border"
                      >
                        <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-12 sm:col-span-3 flex flex-col">
                            <Label
                              htmlFor={`edit_combo_name_${index}`}
                              className="mb-1"
                            >
                              Tên Combo
                            </Label>
                            <Input
                              type="text"
                              name="name"
                              placeholder="VD: Combo 2 món"
                              value={combo.name}
                              onChange={(e) => handleComboChange(index, e)}
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-6 flex flex-col">
                            <Label
                              htmlFor={`edit_combo_items_${index}`}
                              className="mb-1"
                            >
                              Mô tả Combo
                            </Label>
                            <Input
                              type="text"
                              name="items"
                              placeholder="VD: 1 bàn + 2 ghế"
                              value={combo.items}
                              onChange={(e) => handleComboChange(index, e)}
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-3 flex flex-col">
                            <Label
                              htmlFor={`edit_combo_price_${index}`}
                              className="mb-1"
                            >
                              Giá Combo
                            </Label>
                            <Input
                              type="number"
                              name="price"
                              placeholder="Giá combo"
                              value={combo.price}
                              onChange={(e) => handleComboChange(index, e)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-12 sm:col-span-7 flex flex-col">
                            <Label
                              htmlFor={`edit_combo_discountNote_${index}`}
                              className="mb-1"
                            >
                              Ghi chú KM
                            </Label>
                            <Input
                              type="text"
                              name="discountNote"
                              placeholder="VD: Tiết kiệm 15%"
                              value={combo.discountNote}
                              onChange={(e) => handleComboChange(index, e)}
                            />
                          </div>
                          <div className="col-span-11 sm:col-span-4 flex flex-col">
                            <Label
                              htmlFor={`edit_combo_stock_${index}`}
                              className="mb-1"
                            >
                              Tồn kho
                            </Label>
                            <Input
                              type="number"
                              name="stock"
                              placeholder="Số lượng"
                              value={combo.stock}
                              onChange={(e) => handleComboChange(index, e)}
                            />
                          </div>
                          <div className="col-span-1">
                            <button
                              type="button"
                              onClick={() => removeCombo(index)}
                              className="w-full bg-red-500 text-white px-2 rounded hover:bg-red-600 transition-colors h-[36px] flex items-center justify-center text-sm"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addCombo}
                    className="mt-3 bg-green-100 text-green-700 px-3 py-2 rounded text-sm font-medium hover:bg-green-200"
                  >
                    + Thêm Combo
                  </button>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <SmallLoader />
                        Đang cập nhật...
                      </>
                    ) : (
                      "Cập nhật sản phẩm"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeDeleteModal();
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FaTrash className="text-red-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Xóa sản phẩm
                    </h3>
                    <p className="text-gray-600">
                      Hành động này không thể hoàn tác.
                    </p>
                  </div>
                </div>

                {deletingProduct && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={deletingProduct.images?.[0]}
                        alt={deletingProduct.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {deletingProduct.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {deletingProduct.category}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-gray-600 mb-6">
                  Bạn có chắc chắn muốn xóa sản phẩm này không? Điều này sẽ xóa
                  vĩnh viễn sản phẩm khỏi kho hàng của bạn.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleRemoveProduct}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <SmallLoader />
                        Đang xóa...
                      </>
                    ) : (
                      <>
                        <FaTrash />
                        Xóa
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedProduct && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeDetailsModal();
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">Chi tiết sản phẩm</h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IoMdClose size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Product Header */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedProduct.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>
                      <strong>Thương hiệu:</strong>{" "}
                      {selectedProduct.brand || "N/A"}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedProduct.category}
                    </span>
                  </div>
                </div>

                {/* Image Gallery */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedProduct.images.map((img, index) => (
                    <div
                      key={index}
                      className="border rounded-lg overflow-hidden"
                    >
                      <img
                        src={img}
                        alt={`${selectedProduct.name} - image ${index + 1}`}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Mô tả
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Pricing & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Giá</Label>
                    <p className="text-lg font-semibold text-gray-900">
                      <PriceFormat amount={selectedProduct.price} />
                    </p>
                  </div>
                  <div>
                    <Label>Giảm giá</Label>
                    <p
                      className={`text-lg font-semibold ${
                        selectedProduct.discountedPercentage > 0
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      {selectedProduct.discountedPercentage}%
                    </p>
                  </div>
                  <div>
                    <Label>Tồn kho</Label>
                    <p
                      className={`text-lg font-semibold ${
                        selectedProduct.stock > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedProduct.stock} (
                      {selectedProduct.stock > 0 ? "Còn hàng" : "Hết hàng"})
                    </p>
                  </div>
                </div>

                {/* Other Details */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Thông tin khác
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <p>
                      <strong>Loại:</strong> {selectedProduct._type || "N/A"}
                    </p>
                    <p>
                      <strong>Ưu đãi:</strong>{" "}
                      {selectedProduct.offer ? "Có" : "Không"}
                    </p>
                    <p>
                      <strong>Nhãn:</strong>{" "}
                      {selectedProduct.badge ? "Có" : "Không"}
                    </p>
                    <p>
                      <strong>Tình trạng:</strong>{" "}
                      {selectedProduct.isAvailable ? "Hiển thị" : "Ẩn"}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeDetailsModal}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

List.propTypes = {
  token: PropTypes.string.isRequired,
};

export default List;
