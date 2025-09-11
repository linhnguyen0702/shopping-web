import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Dialog, DialogPanel } from "@headlessui/react";
import Title from "./ui/title";
import { IoCloseOutline } from "react-icons/io5";
import { headerNavigation } from "../constants/navigation";
import { useSelector } from "react-redux";

const MobileNavigation = () => {
  const location = useLocation();
  const { products, userInfo, orderCount } = useSelector(
    (state) => state.orebiReducer
  );
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden text-2xl p-2 hover:bg-gray-50 rounded-md"
      >
        ☰
      </button>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50 md:hidden"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" />
        <div className="fixed inset-0 flex items-start justify-center pt-16 px-4">
          <DialogPanel className="w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Title className="text-xl font-bold text-gray-900">
                  Danh mục
                </Title>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-50 rounded-full"
                >
                  <IoCloseOutline className="text-2xl" />
                </button>
              </div>

              <div className="space-y-1">
                {headerNavigation?.map((item) => (
                  <NavLink
                    key={item?.title}
                    to={item?.link}
                    onClick={() => setIsOpen(false)}
                    state={{ data: location.pathname.split("/")[1] }}
                    className={`block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-black transition-all duration-200 transform hover:translate-x-1 ${
                      location?.pathname === item?.link
                        ? "bg-gray-100 text-black font-semibold"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            location?.pathname === item?.link
                              ? "bg-black"
                              : "bg-gray-300"
                          }`}
                        />
                        {item?.title}
                      </div>
                      {item?.link === "/orders" &&
                        userInfo &&
                        orderCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {orderCount}
                          </span>
                        )}
                    </div>
                  </NavLink>
                ))}

                <Link
                  to={"/cart"}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-black transition-all duration-200 transform hover:translate-x-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span>Giỏ hàng</span>
                    {products?.length > 0 && (
                      <span className="ml-auto bg-black text-white text-xs px-2 py-1 rounded-full">
                        {products.length}
                      </span>
                    )}
                  </div>
                </Link>

                {userInfo ? (
                  <Link
                    to={"/profile"}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-black transition-all duration-200 transform hover:translate-x-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <span>Hồ sơ ({userInfo?.name})</span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to={"/signin"}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-black transition-all duration-200 transform hover:translate-x-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      Đăng nhập
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default MobileNavigation;
