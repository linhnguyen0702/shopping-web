import { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../../config";

const ForgotPassword = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Gửi OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/user/password/otp/send`,
        { email }
      );

      if (response.data.success) {
        toast.success("Mã OTP đã được gửi đến email của bạn");
        setStep(2);
      } else {
        toast.error(response.data.message || "Không thể gửi OTP");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Xác thực OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/user/password/otp/verify`,
        { email, otp }
      );

      if (response.data.success) {
        toast.success("Xác thực OTP thành công");
        setResetToken(response.data.resetToken);
        setStep(3);
      } else {
        toast.error(response.data.message || "OTP không hợp lệ");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP không chính xác");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Đổi mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/user/password/reset`,
        { newPassword },
        {
          headers: {
            Authorization: `Bearer ${resetToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại");
        setTimeout(() => {
          onBackToLogin();
        }, 1500);
      } else {
        toast.error(response.data.message || "Không thể đổi mật khẩu");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/user/password/otp/send`,
        { email }
      );

      if (response.data.success) {
        toast.success("Đã gửi lại mã OTP");
      } else {
        toast.error(response.data.message);
      }
    } catch {
      toast.error("Không thể gửi lại OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-6">
            <button
              onClick={onBackToLogin}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Quay lại đăng nhập
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Quên mật khẩu
            </h1>
            <p className="text-gray-600">
              {step === 1 && "Nhập email và mật khẩu mới để đổi mật khẩu"}
              {step === 2 && "Nhập mã OTP đã được gửi đến email"}
              {step === 3 && "Tạo mật khẩu mới"}
            </p>
          </div>

          {/* Step 1: Nhập Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="linhyang0702@gmail.com"
                  className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </form>
          )}

          {/* Step 2: Nhập OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <svg
                    className="w-5 h-5 inline mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Mã OTP đã được gửi đến <strong>{email}</strong>
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
                  className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70 text-center text-2xl font-mono tracking-widest"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xác thực..." : "Xác nhận OTP"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  Gửi lại mã OTP
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Nhập mật khẩu mới */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full py-3 px-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                  >
                    {showPassword ? (
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
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full py-3 px-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/70"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
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
                confirmPassword &&
                newPassword !== confirmPassword && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      ⚠️ Mật khẩu xác nhận không khớp
                    </p>
                  </div>
                )}

              <button
                type="submit"
                disabled={loading || newPassword !== confirmPassword}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </button>
            </form>
          )}

          {/* Progress Indicator */}
          <div className="mt-6 flex justify-center items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                step >= 1 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <div className="w-8 h-0.5 bg-gray-300" />
            <div
              className={`w-3 h-3 rounded-full ${
                step >= 2 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <div className="w-8 h-0.5 bg-gray-300" />
            <div
              className={`w-3 h-3 rounded-full ${
                step >= 3 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2025 Admin Dashboard. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </div>
  );
};

ForgotPassword.propTypes = {
  onBackToLogin: PropTypes.func.isRequired,
};

export default ForgotPassword;
