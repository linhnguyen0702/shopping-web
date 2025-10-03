import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import orebiReducer from "./orebiSlice";
import favoriteReducer from "./favoriteSlice";
import { favoritesBackupMiddleware } from "./favoritesMiddleware";

const persistConfig = {
  key: "root",
  version: 1,
  storage,
};

const favoritePersistConfig = {
  key: "favorites",
  version: 1,
  storage,
  whitelist: ["favorites"], // Chỉ persist favorites array, không persist loading/error
};

const persistedOrebiReducer = persistReducer(persistConfig, orebiReducer);
const persistedFavoriteReducer = persistReducer(
  favoritePersistConfig,
  favoriteReducer
);

export const store = configureStore({
  reducer: {
    orebiReducer: persistedOrebiReducer,
    favoriteReducer: persistedFavoriteReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(favoritesBackupMiddleware),
});

export let persistor = persistStore(store);
