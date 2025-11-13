import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import "./styles/index.css";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import About from "./pages/About.jsx";
import Cart from "./pages/Cart.jsx";
import Contact from "./pages/Contact.jsx";
import Offers from "./pages/Offers.jsx";
import Order from "./pages/Order.jsx";
import Product from "./pages/Product.jsx";
import Shop from "./pages/Shop.jsx";
import SingleProduct from "./pages/SingleProduct.jsx";
import RootLayout from "./components/RootLayout.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";
import Wishlist from "./pages/Wishlist.jsx";

import Checkout from "./pages/Checkout.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentResult from "./pages/PaymentResult.jsx";
import FAQ from "./pages/FAQ.jsx";
import Blog from "./pages/Blog.jsx";
import AuthBridge from "./pages/AuthBridge.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        {
          path: "/",
          element: <App />,
        },
        {
          path: "/auth/bridge",
          element: <AuthBridge />,
        },
        {
          path: "/about",
          element: <About />,
        },
        {
          path: "/cart",
          element: <Cart />,
        },
        {
          path: "/contact",
          element: <Contact />,
        },
        {
          path: "/faq",
          element: <FAQ />,
        },
        {
          path: "/blog",
          element: <Blog />,
        },
        {
          path: "/offers",
          element: <Offers />,
        },
        {
          path: "/orders",
          element: <Order />,
        },
        {
          path: "/Product",
          element: <Product />,
        },
        {
          path: "/shop",
          element: <Shop />,
        },
        {
          path: "/signin",
          element: <SignIn />,
        },
        {
          path: "/signup",
          element: <SignUp />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/wishlist",
          element: <Wishlist />,
        },

        {
          path: "/order",
          element: <OrderPage />,
        },
        {
          path: "/checkout/:orderId",
          element: <Checkout />,
        },
        {
          path: "/order-success/:orderId",
          element: <OrderSuccess />,
        },
        {
          path: "/payment-success",
          element: <PaymentSuccess />,
        },
        {
          path: "/payment/success",
          element: <PaymentSuccess />,
        },
        {
          path: "/payment-result",
          element: <PaymentResult />,
        },
        {
          path: "/product/:id",
          element: <SingleProduct />,
        },
        {
          path: "*",
          element: <NotFound />,
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
);

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="356923892224-v7hvk8ttlek527hksiin7tus7e1v3k3f.apps.googleusercontent.com">
    <RouterProvider router={router} />
  </GoogleOAuthProvider>
);
