import {
  IoCalendarOutline,
  IoBookOutline,
  IoPencilOutline,
} from "react-icons/io5";
import Container from "../components/Container";
import Breadcrumbs from "../components/Breadcrumbs";

const Blog = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <Breadcrumbs currentPage="Blog" />

        <div className="max-w-4xl mx-auto text-center">
          {/* Coming Soon Header */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-900 rounded-full mb-6">
              <IoBookOutline className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Blog sắp tới
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chúng tôi đang làm việc chăm chỉ để mang đến cho bạn nội dung tuyệt vời về
              thời trang, mẹo thời trang và xu hướng mới nhất. Hãy theo dõi!
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <IoPencilOutline className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hướng dẫn thời trang
              </h3>
              <p className="text-gray-600">
                Kinh nghiệm thời trang và mẹo thời trang để giúp bạn trông đẹp nhất.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <IoCalendarOutline className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Xu hướng thời trang
              </h3>
              <p className="text-gray-600">
                Cập nhật với xu hướng thời trang mới nhất và bộ sưu tập theo mùa.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <IoBookOutline className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Câu chuyện thương hiệu
              </h3>
              <p className="text-gray-600">
                Khám phá câu chuyện đằng sau các thương hiệu và nhà thiết kế yêu thích của bạn.
              </p>
            </div>
          </div>

          {/* Mockup Blog Posts */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Nội dung blog sắp tới
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mock Blog Post 1 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden opacity-75">
                <div className="h-48 bg-gradient-to-r from-pink-400 to-purple-600"></div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <IoCalendarOutline className="w-4 h-4 mr-1" />
                    Sắp ra mắt
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      10 Món đồ thời trang bắt buộc cho mọi mùa
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Khám phá những món đồ thời trang cơ bản sẽ giúp bạn trông đẹp suốt năm...
                  </p>
                </div>
              </div>

              {/* Mock Blog Post 2 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden opacity-75">
                <div className="h-48 bg-gradient-to-r from-blue-400 to-teal-600"></div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <IoCalendarOutline className="w-4 h-4 mr-1" />
                    Sắp ra mắt
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Cách xây dựng bộ đồ Capsule trên một ngân sách hạn chế
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Tìm hiểu cách tạo ra bộ đồ linh hoạt và đẹp mà không phải vượt quá ngân sách...
                  </p>
                </div>
              </div>

              {/* Mock Blog Post 3 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden opacity-75">
                <div className="h-48 bg-gradient-to-r from-yellow-400 to-orange-600"></div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <IoCalendarOutline className="w-4 h-4 mr-1" />
                    Sắp ra mắt
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Thời trang bền vững: Lựa chọn phù hợp với môi trường
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Khám phá cách lựa chọn thời trang bền vững cho bạn và môi trường...
                  </p>
                </div>
              </div>

              {/* Mock Blog Post 4 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden opacity-75">
                <div className="h-48 bg-gradient-to-r from-green-400 to-blue-600"></div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <IoCalendarOutline className="w-4 h-4 mr-1" />
                    Sắp ra mắt
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Mẹo thời trang từ các chuyên gia thời trang
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Nhận được những mẹo thời trang từ các chuyên gia thời trang về cách nâng cao ngoại hình của bạn...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Đăng ký nhận thông báo
            </h2>
            <p className="text-gray-600 mb-6">
              Đăng ký nhận thông báo để nhận được thông báo khi blog của chúng tôi ra mắt
              và nhận được nội dung thời trang độc quyền.
            </p>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
              <input
                type="email"
                placeholder="Nhập email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <button className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors duration-200">
                Đăng ký
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Chúng tôi tôn trọng sự riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.
            </p>
          </div>

          {/* Back to Shopping */}
          <div className="mt-12">
            <p className="text-gray-600 mb-4">
              Trong khi bạn đợi, hãy xem sản phẩm mới nhất của chúng tôi!
            </p>
            <a
              href="/shop"
              className="inline-block bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors duration-200"
            >
              Mua sắm ngay
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Blog;
