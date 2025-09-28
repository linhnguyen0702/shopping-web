import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import { FaUsers, FaGlobe, FaAward, FaHeart } from "react-icons/fa";
import { MdSecurity, MdLocalShipping, MdSupport } from "react-icons/md";

const stats = [
  { number: "50K+", label: "Khách hàng", icon: <FaUsers /> },
  { number: "100+", label: "Quốc gia", icon: <FaGlobe /> },
  { number: "5 Years", label: "Kinh nghiệm", icon: <FaAward /> },
  { number: "99%", label: "Sự hài lòng", icon: <FaHeart /> },
];

const values = [
  {
    icon: <MdSecurity />,
    title: "Tin cậy & An toàn",
    description:
      "An toàn là sự ưu tiên của chúng tôi. Chúng tôi sử dụng các biện pháp bảo mật hàng đầu để bảo vệ dữ liệu và giao dịch của bạn.",
  },
  {
    icon: <MdLocalShipping />,
    title: "Nhanh & Tin cậy",
    description:
      "Giao hàng nhanh và dịch vụ tin cậy. Chúng tôi hợp tác với các nhà vận chuyển tin cậy để đảm bảo đơn hàng của bạn đến đúng hạn.",
  },
  {
    icon: <MdSupport />,
    title: "Khách hàng đầu tiên",
    description:
      "Dịch vụ khách hàng 24/7 và hoàn trả dễ dàng. Đội ngũ chuyên nghiệp của chúng tôi luôn sẵn sàng giúp đỡ bạn với bất kỳ câu hỏi hoặc có thể có vấn đề.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-20">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Về Decora Shopping
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
            Chúng tôi luôn nỗ lực mang đến cho bạn trải nghiệm mua sắm tuyệt vời nhất 
            với những sản phẩm chất lượng, dịch vụ tận tâm và mức giá không thể cạnh tranh hơn. 
            Hãy khám phá lý do vì sao hàng triệu khách hàng tin tưởng lựa chọn chúng tôi cho nhu cầu mua sắm của mình.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">{stat.icon}</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Câu chuyện của chúng tôi
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                Được thành lập vào năm 2011, Decora Shopping khởi đầu với một sứ mệnh đơn giản: 
                mang những sản phẩm chất lượng đến với mọi người, ở bất kỳ đâu. 
                Từ một cửa hàng trực tuyến nhỏ, chúng tôi đã phát triển thành một sàn thương mại uy tín, 
                phục vụ khách hàng trên toàn thế giới.
                </p>
                <p>
                Chúng tôi tin rằng mua sắm không chỉ đơn thuần là một giao dịch – 
                mà còn là một trải nghiệm mang lại niềm vui và cảm hứng. 
                Vì vậy, Decora Shopping luôn chọn lọc kỹ lưỡng sản phẩm, hợp tác với những nhà cung cấp đáng tin cậy 
                và đầu tư vào công nghệ tiên tiến để đảm bảo mọi trải nghiệm của bạn trên nền tảng đều diễn ra mượt mà.
                </p>
                <p>
                Hôm nay, chúng tôi tự hào được phục vụ hơn 50.000 khách hàng hài lòng trên toàn thế giới, 
                mang đến mọi thứ từ xu hướng thời trang mới nhất đến các sản phẩm công nghệ sáng tạo — 
                tất cả đều được bảo chứng bởi cam kết về chất lượng, giá cả hợp lý và dịch vụ khách hàng tận tâm.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl text-white">🛍️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chất lượng đầu tiên
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Mọi sản phẩm đều được chọn lọc kỹ lưỡng
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Giá trị cốt lõi của chúng tôi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Những nguyên tắc cốt lõi này định hình mọi hành động của chúng tôi và tạo nên trải nghiệm mà chúng tôi tạo ra cho khách hàng.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-2xl text-white">{value.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6">
            Sẵn sàng mua sắm cùng chúng tôi?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
            Hãy cùng hàng ngàn khách hàng hài lòng và khám phá lý do vì sao 
            Orebi Shopping là lựa chọn hàng đầu cho trải nghiệm mua sắm trực tuyến.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <button className="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                  Mua sắm ngay
                </button>
              </Link>
              <Link to="/contact">
                <button className="px-8 py-4 border border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition-colors font-semibold">
                  Liên hệ chúng tôi
                </button>
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
};

export default About;
