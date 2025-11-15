import { useState } from "react";
import OpenStreetMapAutocomplete from "./OpenStreetMapAutocomplete";

/**
 * Component demo để test OpenStreetMap Autocomplete
 * Sử dụng component này để kiểm tra xem OpenStreetMap API có hoạt động không
 */
const OpenStreetMapDemo = () => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [address, setAddress] = useState("");

  const handlePlaceSelected = (place) => {
    setSelectedPlace(place);
    console.log("Selected place:", place);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🗺️ OpenStreetMap Autocomplete Demo
      </h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tìm kiếm địa chỉ
        </label>
        <OpenStreetMapAutocomplete
          value={address}
          onChange={setAddress}
          onPlaceSelected={handlePlaceSelected}
        />
        <p className="mt-2 text-sm text-gray-500">
          Bắt đầu nhập địa chỉ để xem gợi ý từ OpenStreetMap (Miễn phí, không cần API key)
        </p>
      </div>

      {selectedPlace && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Thông tin địa chỉ đã chọn:
          </h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Địa chỉ đầy đủ:
                </span>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedPlace.fullAddress || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Đường:
                </span>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedPlace.street || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Thành phố:
                </span>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedPlace.city || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Tỉnh/Thành phố:
                </span>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedPlace.state || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Mã bưu điện:
                </span>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedPlace.zipCode || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Quốc gia:
                </span>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedPlace.country || "N/A"}
                </p>
              </div>
            </div>

            {selectedPlace.location && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-600">
                  Tọa độ:
                </span>
                <p className="text-sm text-gray-900 mt-1">
                  Lat: {selectedPlace.location.lat.toFixed(6)}, Lng:{" "}
                  {selectedPlace.location.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="text-sm font-semibold text-green-900 mb-2">
          ✨ Ưu điểm của OpenStreetMap:
        </h4>
        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
          <li>🆓 Hoàn toàn miễn phí - Không cần API key</li>
          <li>🌍 Dữ liệu bản đồ mở, cộng đồng cập nhật</li>
          <li>🚀 Không giới hạn số lượng request</li>
          <li>🔒 Không thu thập dữ liệu người dùng</li>
          <li>📍 Hỗ trợ tìm kiếm và geocoding chính xác</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          📖 Hướng dẫn sử dụng:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Nhập địa chỉ vào ô tìm kiếm (ít nhất 3 ký tự)</li>
          <li>Chọn một địa chỉ từ danh sách gợi ý</li>
          <li>Nhấp vào nút bản đồ để hiển thị/ẩn bản đồ tương tác</li>
          <li>Nhấp vào bản đồ để chọn vị trí chính xác</li>
          <li>Thông tin chi tiết sẽ tự động được điền</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h4 className="text-sm font-semibold text-purple-900 mb-2">
          🔧 Công nghệ sử dụng:
        </h4>
        <div className="text-sm text-purple-800 space-y-1">
          <p>• <strong>Leaflet</strong> - Thư viện bản đồ JavaScript mã nguồn mở</p>
          <p>• <strong>React-Leaflet</strong> - React components cho Leaflet</p>
          <p>• <strong>Nominatim API</strong> - Dịch vụ geocoding của OpenStreetMap</p>
          <p>• <strong>OpenStreetMap Tiles</strong> - Tiles bản đồ miễn phí</p>
        </div>
      </div>
    </div>
  );
};

export default OpenStreetMapDemo;

