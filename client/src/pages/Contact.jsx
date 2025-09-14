import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
} from "react-icons/fa";

const Contact = () => {
  return (
    <div className="min-h-screen bg-[#f5f6fa] py-8 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Thông tin liên hệ */}
          <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-[#205295] mb-2">
              Thông tin liên hệ
            </h2>
            <p className="mb-4 text-gray-700">
              Orebi Shopping là đơn vị chuyên cung cấp các sản phẩm máy tính,
              laptop, thiết bị công nghệ và giải pháp chuyển đổi số chính hãng
              từ các thương hiệu hàng đầu thế giới. Với phương châm “Uy tín –
              Chất lượng – Dịch vụ tận tâm”, chúng tôi luôn nỗ lực mang đến cho
              khách hàng những trải nghiệm mua sắm an toàn, tiện lợi và đáng tin
              cậy.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="mt-1 text-[#205295]" />
                <div>
                  <span className="font-semibold">Địa chỉ:</span>
                  <br />
                  Thôn 2 - Hạ Lôi - Mê Linh , Thành Phố Hà Nội,
                  Việt Nam
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaClock className="mt-1 text-[#205295]" />
                <div>
                  <span className="font-semibold">Thời gian làm việc:</span>
                  <br />
                  8h - 22h
                  <br />
                  Từ thứ 2 đến thứ bảy
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaPhoneAlt className="mt-1 text-[#205295]" />
                <div>
                  <span className="font-semibold">Hotline:</span>
                  <br />
                  0368251814
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaEnvelope className="mt-1 text-[#205295]" />
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
            <h2 className="text-xl font-bold text-[#205295] mb-2">
              Liên hệ với chúng tôi
            </h2>
            <p className="mb-4 text-gray-600 text-sm">
              Nếu bạn có thắc mắc gì, có thể gửi yêu cầu cho chúng tôi, và chúng
              tôi sẽ liên lạc lại với bạn sớm nhất có thể.
            </p>
            <form className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Họ và tên"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#205295]"
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#205295]"
                required
              />
              <input
                type="tel"
                placeholder="Điện thoại*"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#205295]"
                required
              />
              <textarea
                placeholder="Nội dung"
                rows={3}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#205295]"
                required
              />
              <button
                type="submit"
                className="bg-[#205295] text-white font-semibold rounded py-2 mt-2 hover:bg-[#163a5f] transition"
              >
                Gửi thông tin
              </button>
            </form>
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
