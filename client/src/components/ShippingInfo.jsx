import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import PriceFormat from "./PriceFormat";
import { FaTruck, FaBox, FaWeight } from "react-icons/fa";
import { config } from "../../config";

const ShippingInfo = ({ productId, quantity = 1 }) => {
  const [shippingOptions, setShippingOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchShippingOptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${config.baseUrl}/api/shipping/providers`
      );
      const data = await response.json();

      if (data.success) {
        // Calculate shipping fee for each option
        const optionsWithFees = [];

        for (const provider of data.providers) {
          for (const service of provider.services) {
            try {
              const feeResponse = await fetch(
                `${config.baseUrl}/api/shipping/calculate-product`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    productId,
                    quantity,
                    provider: provider.id,
                    serviceType: service.id,
                  }),
                }
              );

              const feeData = await feeResponse.json();
              if (feeData.success) {
                optionsWithFees.push({
                  provider: provider.name,
                  logo: provider.logo,
                  service: service.name,
                  estimatedDelivery: service.estimatedDelivery,
                  fee: feeData.shippingFee,
                });
              }
            } catch (error) {
              console.error("Error calculating fee:", error);
            }
          }
        }

        // Sort by fee (lowest first)
        optionsWithFees.sort((a, b) => a.fee - b.fee);
        setShippingOptions(optionsWithFees);
      }
    } catch (error) {
      console.error("Error fetching shipping options:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && productId) {
      fetchShippingOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, productId, quantity]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <FaTruck className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Thông tin vận chuyển</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            expanded ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-2">
                Đang tải phí vận chuyển...
              </p>
            </div>
          ) : shippingOptions.length > 0 ? (
            <>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaBox className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">
                    Phí vận chuyển tốt nhất
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {shippingOptions[0].logo} {shippingOptions[0].provider}
                    </div>
                    <div className="text-sm text-gray-600">
                      {shippingOptions[0].service} -{" "}
                      {shippingOptions[0].estimatedDelivery}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    <PriceFormat amount={shippingOptions[0].fee} />
                  </div>
                </div>
              </div>

              <details className="group">
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium list-none flex items-center gap-1">
                  <span>Xem tất cả phương thức vận chuyển</span>
                  <svg
                    className="w-4 h-4 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="mt-2 space-y-2">
                  {shippingOptions.slice(1).map((option, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {option.logo} {option.provider}
                          </div>
                          <div className="text-xs text-gray-600">
                            {option.service} - {option.estimatedDelivery}
                          </div>
                        </div>
                        <div className="font-semibold text-gray-900">
                          <PriceFormat amount={option.fee} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <div className="flex items-start gap-2">
                  <FaWeight className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Lưu ý vận chuyển:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>
                        Phí vận chuyển được tính dựa trên trọng lượng và kích
                        thước sản phẩm
                      </li>
                      <li>
                        Thời gian giao hàng có thể thay đổi tùy theo địa chỉ
                        nhận hàng
                      </li>
                      <li>
                        Phí vận chuyển cuối cùng sẽ được xác nhận khi đặt hàng
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">
              Không thể tải thông tin vận chuyển
            </p>
          )}
        </div>
      )}
    </div>
  );
};

ShippingInfo.propTypes = {
  productId: PropTypes.string.isRequired,
  quantity: PropTypes.number,
};

export default ShippingInfo;
