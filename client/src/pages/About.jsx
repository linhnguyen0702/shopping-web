import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import { FiAward, FiHome, FiTrendingUp, FiEdit3, FiBox, FiTruck } from "react-icons/fi";

// Dữ liệu cho các phần
const values = [
  {
    icon: <FiAward className="w-8 h-8" />,
    title: "Chất Lượng Vượt Trội",
    description:
      "Mỗi sản phẩm đều là một tác phẩm được chế tác tỉ mỉ từ những vật liệu tốt nhất, đảm bảo độ bền và vẻ đẹp trường tồn với thời gian.",
  },
  {
    icon: <FiHome className="w-8 h-8" />,
    title: "Thiết Kế Tinh Tế",
    description:
      "Chúng tôi tin rằng đồ nội thất không chỉ để sử dụng, mà còn để kể một câu chuyện. Thiết kế của chúng tôi là sự giao thoa giữa thẩm mỹ và công năng.",
  },
  {
    icon: <FiTrendingUp className="w-8 h-8" />,
    title: "Luôn Đón Đầu Xu Hướng",
    description:
      "Đội ngũ của chúng tôi không ngừng sáng tạo và cập nhật những xu hướng mới nhất để mang đến những không gian sống đầy cảm hứng và phong cách.",
  },
];

const team = [
    {
        name: "Nguyễn Thị Thùy linh",
        role: "Nhà Sáng Lập & CEO",
        image: "data:image/jpeg;base64,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"
    },
    {
        name: "Lê Ngọc Huyền",
        role: "Trưởng Nhóm Thiết Kế",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop"
    },
    {
        name: "Nguyễn Văn A",
        role: "Nghệ Nhân Chính",
        image: "https://cdn11.dienmaycholon.vn/filewebdmclnew/public/userupload/files/Image%20FP_2024/anh-dai-dien-tet-48.jpg"
    }
];

const testimonials = [
    {
        quote: "Chất lượng sản phẩm thật đáng kinh ngạc. Căn phòng của tôi trông hoàn toàn khác biệt và sang trọng hơn hẳn. Chắc chắn sẽ quay lại mua sắm tại Decora.",
        name: "Anh Minh",
        location: "Hà Nội"
    },
    {
        quote: "Dịch vụ tư vấn rất chuyên nghiệp. Họ đã giúp tôi chọn được những món đồ hoàn hảo cho căn hộ của mình. Rất hài lòng với trải nghiệm mua sắm.",
        name: "Chị Lan",
        location: "TP. Hồ Chí Minh"
    }
];

// Dữ liệu sản phẩm nổi bật với ảnh đã được sửa
const featuredProducts = [
    { name: "Ghế Sofa Vải Lanh", imageUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=2070&auto=format&fit=crop" },
    { name: "Bàn Cà Phê Gỗ Sồi", imageUrl: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?q=80&w=1964&auto=format&fit=crop" },
    { name: "Ghế Sofa Vải Linen Hiện Đại", imageUrl: "https://www.marthastewart.com/thmb/JSJwSMsolMumuoCAHHIjICbzYgs%3D/1500x0/filters%3Ano_upscale%28%29%3Amax_bytes%28150000%29%3Astrip_icc%28%29/BradRamseyInteriors_credit_CarolineSharpnack-dee35c1fab554898af7c549697c2f592.jpg" },
    { name: "Sofa Luxury Cao Cấp", imageUrl: "https://www.bocadolobo.com/en/inspiration-and-ideas/wp-content/uploads/2023/09/50-luxury-living-rooms-38-750x1024.jpg" },
];

const About = () => {
  return (
    <div className="bg-[#FDFDFD] text-gray-700 font-sans ">
      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-16 md:pb-10">
        <Container>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                Nơi Mỗi Không Gian Đều Kể Một Câu Chuyện
              </h1>
              <p className="text-lg mb-8 leading-relaxed">
                Tại Decora, chúng tôi tin rằng nội thất là linh hồn của ngôi nhà. Sứ mệnh của chúng tôi là mang đến những sản phẩm không chỉ đẹp về hình thức mà còn bền bỉ về chất lượng, giúp bạn kiến tạo nên không gian sống trong mơ của riêng mình.
              </p>
              <Link to="/shop">
                <button className="px-8 py-3 bg-gray-800 text-white font-semibold rounded-full hover:bg-gray-900 transition-colors duration-300 transform hover:scale-105">
                  Khám phá Bộ sưu tập
                </button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-80 md:h-[500px] rounded-lg overflow-hidden shadow-xl"
            >
              <img
                src="https://www.marthastewart.com/thmb/JSJwSMsolMumuoCAHHIjICbzYgs%3D/1500x0/filters%3Ano_upscale%28%29%3Amax_bytes%28150000%29%3Astrip_icc%28%29/BradRamseyInteriors_credit_CarolineSharpnack-dee35c1fab554898af7c549697c2f592.jpg"
                alt="Modern living room with a stylish sofa"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Featured Products Section */}
      <section className="py-10 bg-gray-50">
        <Container>
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    Sản Phẩm Nổi Bật
                </h2>
                <p className="max-w-2xl mx-auto text-gray-600">Khám phá một số thiết kế được yêu thích nhất, kết hợp hoàn hảo giữa nghệ thuật và công năng.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {featuredProducts.map((product, index) => (
                    <motion.div 
                        key={product.name} 
                        className="group relative overflow-hidden rounded-lg shadow-lg"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-64 md:h-80 object-cover transform group-hover:scale-110 transition-transform duration-500 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-4">
                            <h3 className="text-white text-lg font-semibold">{product.name}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Container>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Triết Lý Của Chúng Tôi
            </h2>
            <div className="w-24 h-1 bg-gray-800 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-left"
              >
                <div className="text-gray-800 mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {value.title}
                </h3>
                <p className="leading-relaxed text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Our Story Section */}
      <section className="py-10 bg-[#FDFDFD]">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-lg overflow-hidden shadow-xl order-last lg:order-first w-[450px] h-[590px]"
            >
              <img
                src="https://images.unsplash.com/photo-1519947486511-46149fa0a254?q=80&w=1974&auto=format&fit=crop"
                alt="Designers sketching furniture"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Hành Trình Của Decora
              </h2>
              <div className="space-y-5 leading-relaxed">
                <p>
                  Decora ra đời từ niềm đam mê mãnh liệt với nghệ thuật chế tác và thiết kế nội thất. Chúng tôi khởi đầu là một xưởng mộc nhỏ, nơi những ý tưởng được hiện thực hóa bằng đôi tay và khối óc của những người thợ lành nghề.
                </p>
                <p>
                  Qua nhiều năm, chúng tôi đã phát triển, nhưng vẫn giữ trọn vẹn giá trị cốt lõi: sự tận tâm trong từng sản phẩm và khát khao mang đến vẻ đẹp đích thực cho mỗi ngôi nhà. Hành trình đó vẫn đang tiếp diễn, với bạn là nguồn cảm hứng lớn nhất.
                </p>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Our Process Section */}
      <section className="py-10 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Quy Trình Chế Tác
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600">Từ ý tưởng đến hiện thực, mỗi sản phẩm đều trải qua một quy trình nghiêm ngặt để đảm bảo chất lượng cao nhất.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center relative">
            {/* Dotted line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5">
                <svg width="100%" height="100%"><line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="2" strokeDasharray="8" stroke="#CBD5E0"/></svg>
            </div>
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="relative z-10 bg-white px-4">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4"><FiEdit3 className="w-12 h-12 text-gray-700"/></div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Thiết Kế</h3>
                <p className="text-gray-600">Phác thảo ý tưởng, lựa chọn vật liệu và hoàn thiện bản vẽ kỹ thuật chi tiết.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="relative z-10 bg-white px-4">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4"><FiBox className="w-12 h-12 text-gray-700"/></div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Chế Tác</h3>
                <p className="text-gray-600">Những người thợ thủ công tài hoa của chúng tôi biến bản vẽ thành hiện thực.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} className="relative z-10 bg-white px-4">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4"><FiTruck className="w-12 h-12 text-gray-700"/></div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Hoàn Thiện</h3>
                <p className="text-gray-600">Kiểm tra chất lượng nghiêm ngặt trước khi giao sản phẩm hoàn hảo đến tay bạn.</p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="py-10 bg-[#FDFDFD]">
        <Container>
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    Khách Hàng Nói Về Chúng Tôi
                </h2>
            </div>
            <div className="grid lg:grid-cols-2 gap-10">
                {testimonials.map((item, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.2 }} className="bg-white p-8 rounded-lg shadow-sm">
                        <p className="text-lg italic text-gray-600 mb-6">{`"${item.quote}"`}</p>
                        <div className="font-semibold text-gray-800">{item.name}, <span className="font-normal text-gray-500">{item.location}</span></div>
                    </motion.div>
                ))}
            </div>
        </Container>
      </section>

      {/* Meet the Team Section */}
      <section className="py-10 bg-white">
        <Container>
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    Gặp Gỡ Đội Ngũ Của Chúng Tôi
                </h2>
                <p className="max-w-2xl mx-auto text-gray-600">Những con người đầy nhiệt huyết đứng sau thành công của Decora.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {team.map((member, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.2 }} className="text-center">
                        <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden shadow-lg">
                            <img src={member.image} alt={member.name} className="w-full h-full object-cover"/>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">{member.name}</h3>
                        <p className="text-gray-500">{member.role}</p>
                    </motion.div>
                ))}
            </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-10 bg-[#FDFDFD] text-center">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Kiến Tạo Không Gian Sống Của Bạn
            </h2>
            <p className="max-w-2xl mx-auto text-lg mb-8 leading-relaxed">
              Hãy để chúng tôi đồng hành cùng bạn trên hành trình biến ngôi nhà thành tổ ấm. Khám phá những thiết kế mới nhất và tìm nguồn cảm hứng cho không gian của bạn.
            </p>
            <Link to="/contact">
              <button className="px-10 py-4 border-2 border-gray-800 text-gray-800 font-bold rounded-full hover:bg-gray-800 hover:text-white transition-all duration-300">
                Liên Hệ Tư Vấn
              </button>
            </Link>
          </motion.div>
        </Container>
      </section>
    </div>
  );
};

export default About;
