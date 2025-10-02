import { useState } from "react";
import axios from "axios";
import { serverUrl } from "../../config";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
} from "react-icons/fa";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Liên hệ",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Danh sách chủ đề liên hệ
  const subjectOptions = [
    { value: "Liên hệ", label: "Liên hệ" },
    { value: "Tư vấn sản phẩm", label: "Tư vấn sản phẩm" },
    { value: "Hỗ trợ kỹ thuật", label: "Hỗ trợ kỹ thuật" },
    { value: "Khiếu nại", label: "Khiếu nại" },
    { value: "Đổi trả", label: "Đổi trả" },
    { value: "Hợp tác", label: "Hợp tác" },
    { value: "Khác", label: "Khác" },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${serverUrl}/api/contact/public`,
        formData
      );

      if (response.data.success) {
        setSuccess(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "Liên hệ",
          message: "",
        });
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] py-8 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Thông tin liên hệ */}
          <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-[#111827] mb-2">
              Thông tin liên hệ
            </h2>
            <p className="mb-4 text-gray-700">
              Decora là thương hiệu chuyên cung cấp nội thất và đồ decor với
              phong cách hiện đại, tinh tế và bền vững. Chúng tôi mang đến cho
              khách hàng sản phẩm chính hãng, đa dạng mẫu mã, từ nội thất gia
              đình, văn phòng đến các phụ kiện trang trí độc đáo, giúp không
              gian sống và làm việc trở nên ấm cúng – tiện nghi – đậm dấu ấn cá
              nhân. Với phương châm “Tinh tế – Bền vững – Giá trị thẩm mỹ”,
              Decora không chỉ chú trọng đến chất lượng sản phẩm, mà còn quan
              tâm đến dịch vụ hậu mãi và trải nghiệm mua sắm. Chúng tôi cam kết
              đồng hành cùng khách hàng trong việc kiến tạo những không gian
              sống hiện đại, sang trọng và đầy cảm hứng.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="mt-1 text-[#111827]" />
                <div>
                  <span className="font-semibold">Địa chỉ:</span>
                  <br />
                  Thôn 2 - Hạ Lôi - Mê Linh , Thành Phố Hà Nội, Việt Nam
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaClock className="mt-1 text-[#111827]" />
                <div>
                  <span className="font-semibold">Thời gian làm việc:</span>
                  <br />
                  8h - 22h
                  <br />
                  Từ thứ 2 đến thứ bảy
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaPhoneAlt className="mt-1 text-[#111827]" />
                <div>
                  <span className="font-semibold">Hotline:</span>
                  <br />
                  0368251814
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaEnvelope className="mt-1 text-[#111827]" />
                <div>
                  <span className="font-semibold">Email:</span>
                  <br />
                  linhyang0702@gmail.com
                </div>
              </div>
            </div>
          </div>
          {/* Form liên hệ */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-[#111827] mb-2">
              Liên hệ với chúng tôi
            </h2>
            <p className="mb-4 text-gray-600 text-sm">
              Nếu bạn có thắc mắc gì, có thể gửi yêu cầu cho chúng tôi, và chúng
              tôi sẽ liên lạc lại với bạn sớm nhất có thể.
            </p>
            {success ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-700 font-medium">
                  ✓ Tin nhắn đã được gửi thành công!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Chúng tôi sẽ liên hệ lại với bạn sớm nhất có thể.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-green-600 text-sm underline mt-2"
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  name="name"
                  placeholder="Họ và tên"
                  value={formData.name}
                  onChange={handleChange}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#205295]"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#205295]"
                  required
                />
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#205295] bg-white"
                  required
                >
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Điện thoại"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#205295]"
                />
                <textarea
                  name="message"
                  placeholder="Nội dung"
                  rows={3}
                  value={formData.message}
                  onChange={handleChange}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#205295]"
                  required
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#111827] text-white font-semibold rounded py-2 mt-2 hover:bg-[#163a5f] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang gửi..." : "Gửi thông tin"}
                </button>
              </form>
            )}
          </div>
        </div>
        {/* Google Map */}
        <div className="bg-white rounded-xl shadow p-4">
          <iframe
            title="Google Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.426024052499!2d105.7829393154026!3d21.01371409356321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab3c4b4e4e3d%3A0x4e4e4e4e4e4e4e4e!2zMTAwIE5nw7MgMSBQaOG6oW0gVHXDom4gVMOgaSwgUGjGsOG7nW5nIE5naOG6pXkgxJDhu5NuLCBD4bqndSBHaeG6pXksIEjDoCBO4buZaQ!5e0!3m2!1svi!2s!4v1680000000000!5m2!1svi!2s"
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: 8 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default Contact;
