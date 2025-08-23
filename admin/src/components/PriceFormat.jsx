import { cn } from "./ui/cn";

const PriceFormat = ({ amount, className, currency = "VND" }) => {
  let formattedAmount;
  
  if (currency === "VND") {
    // Định dạng VND: không có phần thập phân, có ký hiệu đ
    formattedAmount = new Number(amount).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } else {
    // Hỗ trợ các loại tiền tệ khác nếu cần
    formattedAmount = new Number(amount).toLocaleString("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    });
  }
  
  return <span className={cn(className)}>{formattedAmount}</span>;
};

export default PriceFormat;
