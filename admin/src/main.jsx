import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import { store } from "./redux/store.js";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
      <Provider store={store}>
        <GoogleOAuthProvider clientId="356923892224-v7hvk8ttlek527hksiin7tus7e1v3k3f.apps.googleusercontent.com">
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#000000",
                color: "#ffffff",
              },
            }}
          />
        </GoogleOAuthProvider>
      </Provider>
    </StrictMode>
  </BrowserRouter>
);
