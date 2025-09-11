import PropTypes from "prop-types";
import ProductSkeleton from "./ProductSkeleton";

const ProductGridSkeleton = ({ title, count }) => {
  const resolvedTitle = title ?? "Đang tải...";
  const safeCount = Number.isFinite(count) && count > 0 ? count : 8;
  return (
    <div className="w-full py-10">
      <div className="flex items-center justify-between">
        <div className="text-2xl mb-3 font-bold">{resolvedTitle}</div>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: safeCount }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default ProductGridSkeleton;

ProductGridSkeleton.propTypes = {
  title: PropTypes.string,
  count: PropTypes.number,
};
