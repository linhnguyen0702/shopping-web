import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import { useDispatch } from "react-redux";
import {
  setOrderCount,
  resetCart,
  addToCart,
  addUser,
} from "../redux/orebiSlice";
import { fetchWishlist } from "../redux/wishlistThunks";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserCircle,
  FaArrowRight,
} from "react-icons/fa";
import Container from "../components/Container";
import { useGoogleLogin } from "@react-oauth/google";

const SignIn = () => {
  const translateError = (message) => {
    const errorMap = {
      "Missing data": "Dữ liệu gửi đi bị thiếu. Vui lòng thử lại.",
      "Invalid OTP": "Mã OTP không hợp lệ hoặc đã hết hạn.",
      "User not found": "Không tìm thấy người dùng với email này.",
      "Failed to send OTP": "Không thể gửi OTP, vui lòng thử lại.",
      "Failed to reset password":
        "Đặt lại mật khẩu thất bại, vui lòng thử lại.",
      "OTP has expired": "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
      "Incorrect password": "Mật khẩu không chính xác.",
      "User logged in successfully": "Đăng nhập thành công",
      "Invalid token":
        "Phiên làm việc không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
    };
    return errorMap[message] || message || "Có lỗi không xác định xảy ra.";
  };

  const dispatch = useDispatch();

  // Lấy giỏ hàng từ backend và cập nhật Redux
  const fetchUserCart = async (token) => {
    try {
      const response = await fetch(`${serverUrl}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log("📦 Dữ liệu giỏ hàng từ server:", data);

      if (data.success && data.cart) {
        // Reset giỏ hàng trước khi load từ server
        dispatch(resetCart());

        // Kiểm tra cấu trúc dữ liệu
        if (Array.isArray(data.cart.products)) {
          // Cấu trúc: { products: [...] }
          data.cart.products.forEach((item) => {
            dispatch(addToCart(item));
          });
          console.log(
            "✅ Đã đồng bộ giỏ hàng từ server:",
            data.cart.products.length,
            "sản phẩm"
          );
        } else if (data.cart.products) {
          // Cấu trúc khác, có thể là object
          console.log(
            "⚠️ Cấu trúc giỏ hàng không phải array:",
            typeof data.cart.products
          );
        } else {
          console.log("📦 Giỏ hàng trống hoặc chưa có sản phẩm");
        }
      } else {
        console.log("❌ Không thể lấy giỏ hàng:", data.message);
      }
    } catch (error) {
      // Không báo lỗi cho user, chỉ log
      console.error("Lỗi khi lấy giỏ hàng:", error);
    }
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errEmail, setErrEmail] = useState("");
  const [errPassword, setErrPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // OTP Flow states
  const [otpStep, setOtpStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(`${serverUrl}/api/user/google/code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: tokenResponse.code }),
        });
        const data = await res.json();
        if (data?.success && data?.token) {
          // Mặc định quyền user do backend cấp; client chỉ lưu token
          localStorage.setItem("token", data.token);
          await fetchUserOrderCount(data.token);
          toast.success("Đăng nhập Google thành công");
          navigate("/");
        } else {
          toast.error(
            translateError(data?.message || "Đăng nhập Google thất bại")
          );
        }
      } catch (error) {
        console.error("Lỗi đăng nhập Google:", error);
        toast.error(translateError("Đăng nhập Google thất bại"));
      }
    },
    onError: () => toast.error(translateError("Google login thất bại")),
    flow: "auth-code",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const handleEmail = (e) => {
    setEmail(e.target.value);
    setErrEmail("");
  };

  const handlePassword = (e) => {
    setPassword(e.target.value);
    setErrPassword("");
  };

  // Function to fetch user orders and update count
  const fetchUserOrderCount = async (token) => {
    try {
      const response = await fetch(`${serverUrl}/api/order/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        dispatch(setOrderCount(data.orders.length));
      }
    } catch (error) {
      console.error("Lỗi khi lấy số lượng đơn hàng:", error);
      // Don't show error to user as this is not critical
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Reset errors
    setErrEmail("");
    setErrPassword("");

    if (!email) {
      setErrEmail("Nhập email");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setErrPassword("Nhập mật khẩu");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(serverUrl + "/api/user/login", {
        email,
        password,
      });
      const data = response?.data;
      if (data?.success) {
        localStorage.setItem("token", data?.token);

        // Lưu thông tin user vào Redux
        if (data?.user) {
          dispatch(addUser(data.user));
        }

        // Lấy số lượng đơn hàng
        await fetchUserOrderCount(data?.token);
        // Đồng bộ giỏ hàng từ server
        await fetchUserCart(data?.token);
        // Đồng bộ wishlist từ server (silent to avoid loading state during login)
        dispatch(fetchWishlist({ silent: true }));

        const successMsg = translateError(data?.message);
        toast.success(successMsg);
        navigate("/");
      } else {
        toast.error(translateError(data?.message));
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      toast.error(
        translateError(error?.response?.data?.message || "Đăng nhập thất bại")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Gửi OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Vui lòng nhập email");
      return;
    }

    setModalLoading(true);
    try {
      const response = await fetch(`${serverUrl}/api/user/password/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Mã OTP đã được gửi đến email của bạn");
        setOtpStep(2);
      } else {
        toast.error(translateError(data.message));
      }
    } catch (error) {
      console.error("Lỗi khi gửi OTP:", error);
      toast.error(translateError("Có lỗi xảy ra, vui lòng thử lại."));
    } finally {
      setModalLoading(false);
    }
  };

  // Step 2: Xác thực OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    setModalLoading(true);
    try {
      const response = await fetch(
        `${serverUrl}/api/user/password/otp/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail, otp }),
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success("Xác thực OTP thành công");
        setResetToken(data.resetToken);
        setOtpStep(3);
      } else {
        toast.error(translateError(data.message));
      }
    } catch (error) {
      console.error("Lỗi khi xác thực OTP:", error);
      toast.error(translateError("Có lỗi xảy ra, vui lòng thử lại."));
    } finally {
      setModalLoading(false);
    }
  };

  // Step 3: Đổi mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setModalLoading(true);
    try {
      // Chuẩn bị payload theo đúng format backend yêu cầu
      const payload = {
        resetToken: resetToken,
        newPassword: newPassword,
      };

      const response = await fetch(`${serverUrl}/api/user/password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại");
        setShowForgotModal(false);
        setOtpStep(1);
        setResetEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmNewPassword("");
        setResetToken("");
      } else {
        // Log chi tiết để debug backend trả gì
        console.error("Reset password failed response:", data);
        toast.error(translateError(data.message || "Có lỗi khi đổi mật khẩu"));
      }
    } catch (error) {
      console.error("Lỗi khi đặt lại mật khẩu:", error);
      toast.error(translateError("Có lỗi xảy ra, vui lòng thử lại."));
    } finally {
      setModalLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResendOTP = async () => {
    setModalLoading(true);
    try {
      const response = await fetch(`${serverUrl}/api/user/password/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Đã gửi lại mã OTP");
      } else {
        toast.error(translateError(data.message));
      }
    } catch (error) {
      console.error("Lỗi khi gửi lại OTP:", error);
      toast.error(translateError("Không thể gửi lại OTP"));
    } finally {
      setModalLoading(false);
    }
  };

  // Reset modal khi đóng
  const handleCloseModal = () => {
    setShowForgotModal(false);
    setOtpStep(1);
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetToken("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Container>
        <div className="sm:w-[450px] w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FaUserCircle className="text-2xl text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Chào mừng trở lại
              </h1>
              <p className="text-gray-600">
                Đăng nhập vào tài khoản của bạn để tiếp tục mua sắm
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-6">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleEmail}
                    autoComplete="username" // Thêm dòng này
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errEmail ? "border-red-300" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                    placeholder="Vui lòng nhập email"
                  />
                </div>
                {errEmail && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                  >
                    <span className="font-bold">!</span>
                    {errEmail}
                  </motion.p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePassword}
                    autoComplete="new-password" // Thêm dòng này
                    className={`block w-full pl-10 pr-12 py-3 border ${
                      errPassword ? "border-red-300" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors`}
                    placeholder="Vui lòng nhập mật khẩu"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                  >
                    <span className="font-bold">!</span>
                    {errPassword}
                  </motion.p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setResetEmail("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang đăng nhập...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Đăng nhập
                    <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Hoặc đăng nhập bằng
                  </span>
                </div>
              </div>
            </div>

            {/* Google Login */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => googleLogin()}
                className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 hover:bg-gray-50 transition-colors"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Đăng nhập với Google
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Bạn chưa có tài khoản? Tạo tài khoản mới
                <FaArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </Container>
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quên mật khẩu</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Nhập Email */}
            {otpStep === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Nhập email để nhận mã OTP xác thực
                </p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="Vui lòng nhập email"
                  className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 focus:ring-4 focus:ring-gray-500 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </form>
            )}

            {/* Step 2: Nhập OTP */}
            {otpStep === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-800">
                    📧 Mã OTP đã được gửi đến <strong>{resetEmail}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Mã OTP (6 chữ số)
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalLoading || otp.length !== 6}
                  className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 focus:ring-4 focus:ring-gray-500 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? "Đang xác thực..." : "Xác nhận OTP"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={modalLoading}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
                  >
                    Gửi lại mã OTP
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Nhập mật khẩu mới */}
            {otpStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                      placeholder="Nhập mật khẩu mới"
                      className="w-full py-3 px-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                    >
                      {showNewPassword ? (
                        <svg
                          className="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      minLength={6}
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full py-3 px-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmNewPassword(!showConfirmNewPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                    >
                      {showConfirmNewPassword ? (
                        <svg
                          className="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {newPassword &&
                  confirmNewPassword &&
                  newPassword !== confirmNewPassword && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">
                        ⚠️ Mật khẩu xác nhận không khớp
                      </p>
                    </div>
                  )}

                <button
                  type="submit"
                  disabled={modalLoading || newPassword !== confirmNewPassword}
                  className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 focus:ring-4 focus:ring-gray-500 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                </button>
              </form>
            )}

            {/* Progress Indicator */}
            <div className="mt-6 flex justify-center items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  otpStep >= 1 ? "bg-gray-900" : "bg-gray-300"
                }`}
              />
              <div className="w-8 h-0.5 bg-gray-300" />
              <div
                className={`w-3 h-3 rounded-full ${
                  otpStep >= 2 ? "bg-gray-900" : "bg-gray-300"
                }`}
              />
              <div className="w-8 h-0.5 bg-gray-300" />
              <div
                className={`w-3 h-3 rounded-full ${
                  otpStep >= 3 ? "bg-gray-900" : "bg-gray-300"
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
