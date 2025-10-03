import { useEffect, useCallback } from "react";
import Banner from "./components/Banner";
import Container from "./components/Container";
import BestSellers from "./components/homeProducts/BestSellers";
import NewArrivals from "./components/homeProducts/NewArrivals";
import ProductOfTheYear from "./components/homeProducts/ProductOfTheYear";
import SpecialOffers from "./components/homeProducts/SpecialOffers";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import {
  addUser,
  removeUser,
  setOrderCount,
  resetOrderCount,
} from "./redux/orebiSlice";
import { fetchWishlist } from "./redux/wishlistThunks";
import { hydrateFavorites } from "./redux/favoriteSlice";
import { restoreFavoritesBackup } from "./redux/favoritesMiddleware";
import { serverUrl } from "../config";

function App() {
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  // Function to fetch user orders and update count
  const fetchUserOrderCount = useCallback(
    async (token) => {
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
    },
    [dispatch]
  );

  useEffect(() => {
    // Restore favorites backup immediately for fast UI response
    const backupFavorites = restoreFavoritesBackup();
    if (backupFavorites.length > 0) {
      dispatch(hydrateFavorites(backupFavorites));
    }

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        dispatch(addUser(decodedToken));
        // Fetch order count for authenticated users
        fetchUserOrderCount(token);
        // Fetch wishlist for authenticated users (silent background load)
        dispatch(fetchWishlist({ silent: true }));
      } catch (error) {
        console.error("Token không hợp lệ", error);
        localStorage.removeItem("token");
        dispatch(resetOrderCount());
      }
    } else {
      dispatch(removeUser());
      dispatch(resetOrderCount());
    }
  }, [token, dispatch, fetchUserOrderCount]);
  return (
    <main className="w-full overflow-hidden">
      <Banner />
      <Container className="py-5 md:py-10">
        <NewArrivals />
        <BestSellers />
        <ProductOfTheYear />
        <SpecialOffers />
      </Container>
    </main>
  );
}

export default App;
