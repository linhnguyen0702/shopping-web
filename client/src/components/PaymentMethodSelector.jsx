import PropTypes from "prop-types";
import { FaMoneyBillWave, FaCreditCard, FaQrcode } from "react-icons/fa";

const PaymentMethodSelector = ({ selectedMethod, onSelectMethod, readOnly, paymentStatus }) => {
  const paymentMethods = [
    {
      id: "cod",
      name: "Thanh toán khi nhận hàng (COD)",
      icon: FaMoneyBillWave,
      description: "Thanh toán bằng tiền mặt khi nhận hàng",
      color: "green",
    },
    {
      id: "vnpay",
      name: "Ví điện tử VNPay",
      icon: FaCreditCard,
      description: "Thanh toán qua ví điện tử VNPay",
      color: "blue",
    },
    {
      id: "bank_transfer",
      name: "Chuyển khoản ngân hàng",
      icon: FaCreditCard,
      description: "Chuyển khoản qua tài khoản ngân hàng",
      color: "blue",
    },
    {
      id: "qr_code",
      name: "Quét mã QR",
      icon: FaQrcode,
      description: "Thanh toán bằng cách quét mã QR",
      color: "purple",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Phương thức thanh toán
      </h3>

      {paymentMethods.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;

        return (
          <div
            key={method.id}
            onClick={() => (!readOnly || isSelected) && onSelectMethod(method.id)}
            className={`p-4 border-2 rounded-2xl transition-all relative ${
              readOnly && !isSelected
                ? "cursor-default opacity-50 bg-gray-50"
                : "cursor-pointer"
            } ${
              isSelected
                ? `border-${method.color}-500 bg-${method.color}-50 shadow-md`
                : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-lg ${
                    isSelected ? `bg-${method.color}-100` : "bg-gray-100"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isSelected ? `text-${method.color}-600` : "text-gray-600"
                    }`}
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {method.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {method.description}
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full bg-${method.color}-500 flex items-center justify-center`}
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

PaymentMethodSelector.propTypes = {
  selectedMethod: PropTypes.string.isRequired,
  onSelectMethod: PropTypes.func.isRequired,
};

export default PaymentMethodSelector;
