import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import PropTypes from "prop-types";

// Fix for default marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component để xử lý click trên bản đồ
function LocationMarker({ position, setPosition, onLocationChange }) {
  useMapEvents({
    click(e) {
      const newPos = e.latlng;
      setPosition(newPos);
      // Reverse geocoding để lấy địa chỉ từ tọa độ
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}&accept-language=vi`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.address) {
            const addr = data.address;
            const addressData = {
              street:
                addr.road ||
                addr.suburb ||
                addr.neighbourhood ||
                data.display_name.split(",")[0] ||
                "",
              city:
                addr.city ||
                addr.town ||
                addr.village ||
                addr.county ||
                addr.state_district ||
                "",
              state: addr.state || "",
              zipCode: addr.postcode || "",
              country: addr.country || "Việt Nam",
              fullAddress: data.display_name || "",
              location: {
                lat: newPos.lat,
                lng: newPos.lng,
              },
            };
            onLocationChange(addressData);
          }
        })
        .catch((error) => {
          console.error("Reverse geocoding error:", error);
        });
    },
  });

  return position ? <Marker position={position} /> : null;
}

LocationMarker.propTypes = {
  position: PropTypes.object,
  setPosition: PropTypes.func.isRequired,
  onLocationChange: PropTypes.func.isRequired,
};

const OpenStreetMapAutocomplete = ({ onPlaceSelected, value, onChange }) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState([10.8231, 106.6297]); // Default: Ho Chi Minh City
  const [markerPosition, setMarkerPosition] = useState(null);
  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Sử dụng Nominatim API của OpenStreetMap
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=vn&limit=5&accept-language=vi`,
        {
          headers: {
            "User-Agent": "YourAppName/1.0", // Nominatim yêu cầu User-Agent
          },
        }
      );

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (onChange) {
      onChange(newValue);
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(newValue);
    }, 500);
  };

  const handleSuggestionClick = async (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);

    // Lấy thông tin chi tiết từ Nominatim
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=vi`
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const addressData = {
          street:
            addr.road ||
            addr.suburb ||
            addr.neighbourhood ||
            suggestion.display_name.split(",")[0] ||
            "",
          city:
            addr.city ||
            addr.town ||
            addr.village ||
            addr.county ||
            addr.state_district ||
            "",
          state: addr.state || "",
          zipCode: addr.postcode || "",
          country: addr.country || "Việt Nam",
          fullAddress: suggestion.display_name || "",
          location: {
            lat: lat,
            lng: lon,
          },
        };

        setInputValue(suggestion.display_name);
        setShowSuggestions(false);
        setSuggestions([]);
        setMapPosition([lat, lon]);
        setMarkerPosition({ lat, lng: lon });

        if (onPlaceSelected) {
          onPlaceSelected(addressData);
        }
      }
    } catch (error) {
      console.error("Error fetching address details:", error);
    }
  };

  const handleMapLocationChange = (addressData) => {
    setInputValue(addressData.fullAddress);
    if (onPlaceSelected) {
      onPlaceSelected(addressData);
    }
    if (onChange) {
      onChange(addressData.fullAddress);
    }
  };

  return (
    <div className="relative" ref={suggestionsRef}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Nhập địa chỉ hoặc tìm kiếm trên bản đồ..."
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          )}
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title={showMap ? "Ẩn bản đồ" : "Hiện bản đồ"}
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.place_id}-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">
                    {suggestion.display_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {suggestion.type}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map Display */}
      {showMap && (
        <div className="mt-3 border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-3 py-2 border-b border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Mẹo:</strong> Nhấp vào bản đồ để chọn vị trí chính xác
            </p>
          </div>
          <MapContainer
            center={mapPosition}
            zoom={13}
            style={{ height: "300px", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
              position={markerPosition}
              setPosition={setMarkerPosition}
              onLocationChange={handleMapLocationChange}
            />
          </MapContainer>
        </div>
      )}

      {/* Info Text */}
      <p className="mt-2 text-xs text-gray-500">
        🗺️ Sử dụng OpenStreetMap - Miễn phí, không cần API key
      </p>
    </div>
  );
};

OpenStreetMapAutocomplete.propTypes = {
  onPlaceSelected: PropTypes.func,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default OpenStreetMapAutocomplete;

