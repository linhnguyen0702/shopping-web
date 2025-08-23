import { cn } from "./ui/cn";
import PropTypes from "prop-types";

const PriceFormat = ({ amount, className, currency = "VND" }) => {
  // Handle undefined, null, or NaN values
  const numericAmount =
    typeof amount === "number" && !isNaN(amount) ? amount : 0;

  let formattedAmount;
  
  if (currency === "VND") {
    // Định dạng VND: không có phần thập phân, có ký hiệu đ
    formattedAmount = new Number(numericAmount).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } else {
    // Hỗ trợ các loại tiền tệ khác nếu cần
    formattedAmount = new Number(numericAmount).toLocaleString("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    });
  }
  
  return <span className={cn(className)}>{formattedAmount}</span>;
};

PriceFormat.propTypes = {
  amount: PropTypes.number,
  className: PropTypes.string,
  currency: PropTypes.string,
};

export default PriceFormat;
