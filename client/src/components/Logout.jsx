import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetAll, removeUser } from "../redux/orebiSlice";
// import { persistor } from "../redux/store";

const Logout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      // Chỉ xóa token, tránh clear toàn bộ để không làm rối redux-persist
      localStorage.removeItem("token");

      // Reset Redux state ngay lập tức
      dispatch(removeUser());
      dispatch(resetAll());

      // Không purge nữa để tránh làm localStorage trống tạm thời

      toast.success("Đăng xuất thành công");
      navigate("/signin", { replace: true });
    } catch {
      navigate("/signin", { replace: true });
    }
  };

  return (
    <Button onClick={handleLogout} className="px-8 py-2.5">
      Đăng xuất
    </Button>
  );
};

export default Logout;
