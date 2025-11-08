import { useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import Container from "../components/Container";
import Breadcrumbs from "../components/Breadcrumbs";

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const faqData = [
    {
      category: "Đơn hàng và Vận chuyển",
      questions: [
        {
          question: "Bao lâu thì giao hàng?",
          answer:
            "Vận chuyển tiêu chuẩn thường mất 3-5 ngày làm việc trong khu vực Việt Nam. Vận chuyển nhanh (1-2 ngày làm việc) và vận chuyển ngay (ngay lập tức) cũng có sẵn với mức phí thêm. Thời gian vận chuyển quốc tế phụ thuộc vào địa điểm, thường mất 7-14 ngày làm việc.",
        },
        {
          question: "Có thể theo dõi đơn hàng của tôi không?",
          answer:
            "Có! Khi đơn hàng được giao, bạn sẽ nhận được số tracking qua email. Bạn cũng có thể theo dõi đơn hàng của mình bằng cách đăng nhập vào tài khoản của mình và vào phần 'Đơn hàng của tôi'.",
        },
        {
          question: "Quy tắc trả hàng của bạn là gì?",
          answer:
            "Chúng tôi cung cấp chính sách trả hàng trong 30 ngày cho các sản phẩm chưa sử dụng trong gói gốc. Các sản phẩm phải được trả lại trong vòng 30 ngày sau khi giao hàng. Việc hoàn tiền sẽ được xử lý trong vòng 5-7 ngày làm việc sau khi chúng tôi nhận được sản phẩm trả lại.",
        },
        {
          question: "Có giao hàng quốc tế không?",
          answer:
            "Có, chúng tôi giao hàng đến hầu hết các quốc gia trên thế giới. Chi phí vận chuyển và thời gian giao hàng quốc tế phụ thuộc vào địa điểm. Khách hàng chịu trách nhiệm về các thuế hải quan hoặc thuế.",
        },
      ],
    },
    {
      category: "Sản phẩm và Kích thước",
      questions: [
        {
          question: "Làm thế nào để biết kích thước nào để đặt hàng?",
          answer:
            "Mỗi trang sản phẩm bao gồm biểu đồ kích thước và đo lường chi tiết. Bạn cũng có thể kiểm tra hướng dẫn kích thước chung trong phần chân trang. Nếu bạn nằm giữa các kích thước, chúng tôi khuyến nghị kích thước lớn hơn. Đội ngũ dịch vụ khách hàng của chúng tôi sẽ hỗ trợ với các câu hỏi về kích thước.",
        },
        {
          question: "Các sản phẩm của bạn có phải là gốc không?",
          answer:
            "Chắc chắn! Chúng tôi lấy sản phẩm trực tiếp từ các đại lý và đối tác thương hiệu được cấp phép. Mỗi sản phẩm đi kèm với bảo hành chân thật và gói gốc.",
        },
        {
          question: "Bạn có cung cấp bảo hành sản phẩm không?",
          answer:
            "Có, tất cả sản phẩm đi kèm với bảo hành từ nhà sản xuất. Điều kiện bảo hành phụ thuộc vào thương hiệu và loại sản phẩm. Các tùy chọn bảo hành mở rộng có thể có sẵn trong quá trình thanh toán cho các sản phẩm cụ thể.",
        },
        {
          question: "Bạn thường xuyên nhập hàng không?",
          answer:
            "Chúng tôi thường nhập hàng các sản phẩm phổ biến, thường là mỗi 2-4 tuần. Bạn có thể đăng ký nhận thông báo nhập hàng trên trang sản phẩm hết hàng. Theo dõi chúng tôi trên mạng xã hội để nhận thông báo mới nhất về các sản phẩm mới.",
        },
      ],
    },
    {
      category: "Tài khoản và Thanh toán",
      questions: [
        {
          question: "Tôi có cần tài khoản để mua hàng không?",
          answer:
            "Mặc dù bạn có thể thanh toán như khách, tạo tài khoản cho phép bạn theo dõi đơn hàng, lưu sản phẩm vào danh sách yêu thích, lưu địa chỉ vận chuyển và truy cập lợi ích thành viên độc quyền.",
        },
        {
          question: "Phương thức thanh toán nào bạn chấp nhận?",
          answer:
            "Chúng tôi chấp nhận thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng và thanh toán qua mã QR. Tất cả các thanh toán đều được xử lý an toàn.",
        },
        {
          question: "Thông tin thanh toán của tôi có an toàn không?",
          answer:
            "Chắc chắn! Chúng tôi sử dụng mã hóa SSL và tuân thủ tiêu chuẩn PCI DSS để bảo vệ thông tin thanh toán của bạn. Chúng tôi không bao giờ lưu thông tin thẻ tín dụng của bạn trên máy chủ của chúng tôi.",
        },
        {
          question: "Tôi có thể lưu nhiều địa chỉ vận chuyển không?",
          answer:
            "Có, người dùng đã đăng ký có thể lưu nhiều địa chỉ vận chuyển trong tài khoản của họ để thanh toán nhanh hơn. Bạn có thể thêm, chỉnh sửa hoặc xóa địa chỉ bất cứ lúc nào trong cài đặt tài khoản của bạn.",
        },
      ],
    },
    {
      category: "Dịch vụ khách hàng",
      questions: [
        {
          question: "Làm thế nào để liên hệ dịch vụ khách hàng?",
          answer:
            "Bạn có thể liên hệ với đội ngũ dịch vụ khách hàng qua email tại support@orebi.com, điện thoại tại 1-800-OREBI-SHOP, hoặc thông qua tính năng chat trực tiếp của chúng tôi. Chúng tôi có sẵn từ thứ Hai đến thứ Năm từ 9AM-6PM EST.",
        },
        {
          question: "Tôi nhận được một sản phẩm hỏng thì sao?",
          answer:
            "Chúng tôi xin lỗi nếu bạn nhận được một sản phẩm hỏng! Vui lòng liên hệ với chúng tôi trong vòng 48 giờ sau khi giao hàng với hình ảnh của sản phẩm hỏng. Chúng tôi sẽ sắp xếp cho bạn một sản phẩm thay thế hoặc hoàn trả đầy đủ ngay lập tức.",
        },
        {
          question: "Tôi có thể hủy hoặc chỉnh sửa đơn hàng của mình không?",
          answer:
            "Đơn hàng có thể được hủy hoặc chỉnh sửa trong vòng 1 giờ sau khi đặt hàng. Sau đó, đơn hàng được đưa vào quy trình đóng gói và không thể được thay đổi. Vui lòng liên hệ dịch vụ khách hàng sớm nhất có thể nếu bạn cần thay đổi.",
        },
        {
          question: "Bạn có cung cấp giá so sánh không?",
          answer:
            "Có! Chúng tôi cung cấp giá so sánh trên các sản phẩm tương tự từ các đại lý được cấp phép. Sản phẩm phải có sẵn và giá của đối thủ phải có thể kiểm tra được. Liên hệ dịch vụ khách hàng với chi tiết cho yêu cầu giá so sánh.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <Breadcrumbs currentPage="FAQ" />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Các câu hỏi thường gặp
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tìm câu trả lời cho các câu hỏi thường gặp về mua hàng với Orebi.
              Không tìm thấy những gì bạn đang tìm kiếm? Liên hệ với đội ngũ
              dịch vụ khách hàng team.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqData.map((category, categoryIndex) => (
              <div
                key={categoryIndex}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="bg-gray-900 text-white px-6 py-4">
                  <h2 className="text-xl font-semibold">{category.category}</h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {category.questions.map((item, questionIndex) => {
                    const itemKey = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openItems[itemKey];

                    return (
                      <div
                        key={questionIndex}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <button
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-200"
                          onClick={() => toggleItem(itemKey)}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 pr-4">
                              {item.question}
                            </h3>
                            {isOpen ? (
                              <IoChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            ) : (
                              <IoChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-6 pb-4">
                            <p className="text-gray-600 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Vẫn còn câu hỏi?
            </h2>
            <p className="text-gray-600 mb-6">
              Đội ngũ dịch vụ khách hàng của chúng tôi ở đây để giúp bạn với bất
              kỳ câu hỏi hoặc quan tâm.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/contact"
                className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors duration-200"
              >
                Liên hệ với chúng tôi
              </a>
              <a
                href="mailto:support@orebi.com"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Hỗ trợ qua email
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default FAQ;
