import Container from "../components/Container";
import ProductGridSkeleton from "../components/skeletons/ProductGridSkeleton";

const Product = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <Container>
        <ProductGridSkeleton title="Đang tải sản phẩm..." count={8} />
      </Container>
    </div>
  );
};

export default Product;
