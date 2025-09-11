import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { setOrderCount } from "../redux/orebiSlice";
import { serverUrl } from "../../config";

const AuthBridge = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    const goHome = () => navigate("/", { replace: true });

    const applyToken = async () => {
      if (!token) {
        goHome();
        return;
      }
      try {
        localStorage.setItem("token", token);
        // Fetch order count quietly
        try {
          const res = await fetch(`${serverUrl}/api/order/my-orders`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data?.success) {
            dispatch(setOrderCount(data.orders.length));
          }
        } catch {
          // im lặng nếu lỗi
        }
        // Thông báo đăng nhập thành công (qua bridge)
        toast.success("Đăng nhập thành công");
      } finally {
        goHome();
      }
    };

    applyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-700">
      Đang đăng nhập...
    </div>
  );
};

export default AuthBridge;
