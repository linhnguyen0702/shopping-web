import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Title from "../components/ui/title";
import { IoMdAdd, IoMdCloudUpload } from "react-icons/io";
import { FaTimes } from "react-icons/fa";
import Input, { Label } from "../components/ui/input";
import toast from "react-hot-toast";
import { serverUrl } from "../../config";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SmallLoader from "../components/SmallLoader";

const Add = ({ token }) => {
  const [isLoading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const navigate = useNavigate();
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

  // Fetch categories and brands
  const fetchCategoriesAndBrands = async () => {
    try {
      setLoadingData(true);
      const [categoriesRes, brandsRes] = await Promise.all([
        fetch(`${serverUrl}/api/category`),
        fetch(`${serverUrl}/api/brand`),
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
      toast.error("Lỗi khi tải danh mục và thương hiệu");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndBrands();
  }, []);

  // Handle input change
  const handleChange = (e) => {
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

  const handleUploadProduct = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.stock ||
      !formData.category
    ) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    // Check if at least one image is uploaded
    const hasImage = Object.values(imageFiles).some((file) => file !== null);
    if (!hasImage) {
      toast.error("Vui lòng tải lên ít nhất một hình ảnh");
      return;
    }

    try {
      setLoading(true);
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

      // Append image files
      Object.keys(imageFiles).forEach((key) => {
        if (imageFiles[key]) {
          data.append(key, imageFiles[key]);
        }
      });

      const response = await axios.post(serverUrl + "/api/product/add", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response?.data;
      if (responseData?.success) {
        toast.success(responseData?.message);
        navigate("/list");
      } else {
        toast.error(responseData?.message);
      }
    } catch (error) {
      console.log("Lỗi khi tải lên dữ liệu sản phẩm", error);
      toast.error(error?.response?.data?.message || "Lỗi khi tải lên sản phẩm");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="xl:max-w-5xl bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <IoMdAdd className="text-white text-xl" />
            </div>
            <div>
              <Title className="text-xl sm:text-2xl font-bold text-gray-800">
                Thêm sản phẩm mới
              </Title>
              <p className="text-sm text-gray-500 mt-1">
                Tạo sản phẩm mới cho cửa hàng của bạn
              </p>
            </div>
          </div>

          <form
            className="space-y-6 sm:space-y-8"
            onSubmit={handleUploadProduct}
          >
            {/* Image Upload Section */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Hình ảnh sản phẩm
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {["image1", "image2", "image3", "image4"].map(
                  (imageKey, index) => (
                    <div key={imageKey} className="relative">
                      <label htmlFor={imageKey} className="block">
                        <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors duration-200 min-h-[120px] flex flex-col items-center justify-center bg-white">
                          {imageFiles[imageKey] ? (
                            <>
                              <img
                                src={URL.createObjectURL(imageFiles[imageKey])}
                                alt={`Preview ${index + 1}`}
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
                          ) : (
                            <>
                              <IoMdCloudUpload className="text-3xl text-gray-400 mb-2" />
                              <span className="text-xs text-gray-600">
                                Ảnh sản phẩm {index + 1}
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            id={imageKey}
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
              <p className="text-sm text-gray-500 mt-3">
                Tải lên tối đa 4 hình ảnh. Hình ảnh đầu tiên sẽ là hình ảnh
                chính của sản phẩm.
              </p>
            </div>

            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <Label htmlFor="name">Tên sản phẩm </Label>
                  <Input
                    type="text"
                    placeholder="Nhập tên sản phẩm"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="lg:col-span-2">
                  <Label htmlFor="description">Mô tả </Label>
                  <textarea
                    placeholder="Nhập mô tả sản phẩm"
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="brand">Thương hiệu</Label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loadingData}
                  >
                    <option value="">
                      {loadingData ? "Loading brands..." : "Thương hiệu"}
                    </option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="_type">Loại sản phẩm</Label>
                  <select
                    name="_type"
                    value={formData._type}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Loại sản phẩm</option>
                    <option value="new_arrivals">Mới về</option>
                    <option value="best_sellers">Bán chạy</option>
                    <option value="special_offers">Ưu đãi đặc biệt</option>
                    <option value="promotions">Khuyến mãi</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Giá và kho hàng (Mặc định)
              </h3>
              <p className="text-sm text-gray-500 -mt-3 mb-4">
                Giá và tồn kho này áp dụng khi sản phẩm không có lựa chọn nào
                hoặc khi được mua riêng lẻ.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <Label htmlFor="price">Giá </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="discountedPercentage">
                    Phần trăm giảm giá
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="10"
                    name="discountedPercentage"
                    value={formData.discountedPercentage}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-col">
                  <Label htmlFor="stock">Số lượng trong kho </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Product Options (Variants) */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Lựa chọn sản phẩm (mua lẻ)
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Thêm các lựa chọn khác nhau cho sản phẩm như màu sắc, kích
                thước, loại... Mỗi lựa chọn sẽ có giá và tồn kho riêng.
              </p>
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-end"
                  >
                    <div className="col-span-5 flex flex-col">
                      <Label htmlFor={`option_label_${index}`} className="mb-1">
                        Tên lựa chọn
                      </Label>
                      <Input
                        type="text"
                        name="label"
                        placeholder="VD: Màu đen, Size L"
                        value={option.label}
                        onChange={(e) => handleOptionChange(index, e)}
                      />
                    </div>
                    <div className="col-span-3 flex flex-col">
                      <Label htmlFor={`option_price_${index}`} className="mb-1">
                        Giá
                      </Label>
                      <Input
                        type="number"
                        name="price"
                        placeholder="Giá lựa chọn"
                        value={option.price}
                        onChange={(e) => handleOptionChange(index, e)}
                      />
                    </div>
                    <div className="col-span-3 flex flex-col">
                      <Label htmlFor={`option_stock_${index}`} className="mb-1">
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
                        className="w-full bg-red-500 text-white px-2 rounded hover:bg-red-600 transition-colors h-[36px] flex items-center justify-center text-sm"
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
                className="mt-4 bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                + Thêm lựa chọn
              </button>
            </div>

            {/* Product Combos */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Gói Combo
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Tạo các gói combo để bán nhiều sản phẩm cùng lúc với giá ưu đãi.
              </p>
              <div className="space-y-4">
                {formData.combos.map((combo, index) => (
                  <div key={index} className="space-y-3">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-12 sm:col-span-3 flex flex-col">
                        <Label htmlFor={`combo_name_${index}`} className="mb-1">
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
                          htmlFor={`combo_items_${index}`}
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
                          htmlFor={`combo_price_${index}`}
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
                          htmlFor={`combo_discountNote_${index}`}
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
                          htmlFor={`combo_stock_${index}`}
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
                className="mt-4 bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
              >
                + Thêm Combo
              </button>
            </div>

            {/* Category and Settings */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Danh mục và cài đặt
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="category">Danh mục </Label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loadingData}
                  >
                    <option value="">
                      {loadingData ? "Đang tải danh mục..." : "Chọn danh mục"}
                    </option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="isAvailable">Tình trạng</Label>
                  <select
                    name="isAvailable"
                    value={formData.isAvailable.toString()}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Có sẵn</option>
                    <option value="false">Hết hàng</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="offer">Ưu đãi đặc biệt</Label>
                  <select
                    name="offer"
                    value={formData.offer.toString()}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="badge">Hiển thị huy hiệu</Label>
                  <select
                    name="badge"
                    value={formData.badge.toString()}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Thẻ sản phẩm
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {[
                  "Phòng khách",
                  "Phòng ngủ",
                  "Phòng bếp",
                  "Trang trí",
                  "Đồ dùng decor khác",
                ].map((tag) => (
                  <div className="flex items-center space-x-2" key={tag}>
                    <input
                      id={tag.toLowerCase()}
                      type="checkbox"
                      name="tags"
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
                      htmlFor={tag.toLowerCase()}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                disabled={isLoading}
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <SmallLoader />
                    <span>Đang thêm sản phẩm</span>
                  </>
                ) : (
                  <>
                    <IoMdAdd className="text-lg" />
                    <span>Thêm sản phẩm</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

Add.propTypes = {
  token: PropTypes.string.isRequired,
};

export default Add;
