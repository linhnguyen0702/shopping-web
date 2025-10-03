// Middleware to backup favorites to localStorage for faster loading
export const favoritesBackupMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Backup favorites to localStorage whenever favorites change
  if (
    action.type?.startsWith("favorites/") ||
    action.type?.includes("addToFavorites") ||
    action.type?.includes("removeFromFavorites")
  ) {
    const state = store.getState();
    const favorites = state.favoriteReducer?.favorites || [];

    // Only backup if we have favorites and they're different from stored
    if (favorites.length > 0) {
      try {
        const stored = localStorage.getItem("favorites_backup");
        const storedFavorites = stored ? JSON.parse(stored) : [];

        // Simple comparison - only update if different
        if (JSON.stringify(favorites) !== JSON.stringify(storedFavorites)) {
          localStorage.setItem("favorites_backup", JSON.stringify(favorites));
        }
      } catch (error) {
        console.error("Error backing up favorites:", error);
      }
    }
  }

  return result;
};

// Helper to restore favorites from localStorage backup
export const restoreFavoritesBackup = () => {
  try {
    const stored = localStorage.getItem("favorites_backup");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error restoring favorites backup:", error);
    return [];
  }
};
