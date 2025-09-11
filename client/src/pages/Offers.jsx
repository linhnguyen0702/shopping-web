import Container from "../components/Container";
import ProductGridSkeleton from "../components/skeletons/ProductGridSkeleton";

const Offers = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <Container>
        <ProductGridSkeleton title="Đang tải khuyến mãi..." count={8} />
      </Container>
    </div>
  );
};

export default Offers;
