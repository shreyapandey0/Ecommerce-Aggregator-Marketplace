import React, { createContext, useContext, useState, useEffect } from "react";
import { ProductWithPlatforms, SearchFilters } from "@shared/schema";

interface SelectedProduct extends ProductWithPlatforms {
  selected: boolean;
}

// User preferences for product comparison
export interface UserPreferences {
  priceImportance: number; // 1-5 scale for how important price is
  deliveryImportance: number; // 1-5 scale
  codImportance: number; // 1-5 scale
  returnPolicyImportance: number; // 1-5 scale
  ratingImportance: number; // 1-5 scale
  sellerReputationImportance: number; // 1-5 scale
}

// Default preferences - neutral on all factors
export const defaultPreferences: UserPreferences = {
  priceImportance: 3,
  deliveryImportance: 3,
  codImportance: 3,
  returnPolicyImportance: 3,
  ratingImportance: 3,
  sellerReputationImportance: 3,
};

interface ProductContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  compareProducts: SelectedProduct[];
  addToCompare: (product: ProductWithPlatforms) => void;
  removeFromCompare: (productId: number) => void;
  isInCompare: (productId: number) => boolean;
  compareModalOpen: boolean;
  openCompareModal: () => void;
  closeCompareModal: () => void;
  clearCompare: () => void;

  // New comparison features
  userPreferences: UserPreferences;
  setUserPreferences: (prefs: UserPreferences) => void;
  getRecommendedProduct: (products: SelectedProduct[]) => number | null; // Returns ID of recommended product
  getProductScore: (product: SelectedProduct) => number; // Get score based on user preferences
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [compareProducts, setCompareProducts] = useState<SelectedProduct[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences>(defaultPreferences);

  // Limit compare products to maximum 3 items
  const addToCompare = (product: ProductWithPlatforms) => {
    // If already at max capacity (3), don't add more
    if (compareProducts.filter((p) => p.selected).length >= 3) {
      // Remove the oldest one and add the new one
      const updated = [...compareProducts];
      const firstSelectedIndex = updated.findIndex((p) => p.selected);

      if (firstSelectedIndex !== -1) {
        updated[firstSelectedIndex] = {
          ...updated[firstSelectedIndex],
          selected: false,
        };
      }

      setCompareProducts([...updated, { ...product, selected: true }]);
    } else {
      setCompareProducts([...compareProducts, { ...product, selected: true }]);
    }
  };

  const removeFromCompare = (productId: number) => {
    setCompareProducts(
      compareProducts.map((p) =>
        p.id === productId ? { ...p, selected: false } : p
      )
    );
  };

  const isInCompare = (productId: number) => {
    return compareProducts.some((p) => p.id === productId && p.selected);
  };

  const openCompareModal = () => {
    if (compareProducts.filter((p) => p.selected).length >= 2) {
      setCompareModalOpen(true);
    }
  };

  const closeCompareModal = () => {
    setCompareModalOpen(false);
  };

  const clearCompare = () => {
    setCompareProducts([]);
  };

  // Product recommendation algorithm based on user preferences
  const getProductScore = (product: SelectedProduct): number => {
    // Find the best platform for this product (usually the one marked as best deal)
    const platform =
      product.platforms.find((p) => p.isBestDeal) || product.platforms[0];
    if (!platform) return 0;

    // Calculate normalized price score (lower is better, so we invert)
    // Find lowest price among all products being compared
    const selectedProducts = compareProducts.filter((p) => p.selected);
    const allPrices = selectedProducts.map((p) => {
      const bestPlatform =
        p.platforms.find((plat) => plat.isBestDeal) || p.platforms[0];
      return bestPlatform ? bestPlatform.price : Infinity;
    });

    const lowestPrice = Math.min(...allPrices);
    const highestPrice = Math.max(...allPrices);

    // Normalize price between 0-1 (1 is best - lowest price)
    const priceRange = highestPrice - lowestPrice;
    const normalizedPriceScore =
      priceRange === 0
        ? 1 // If all prices are the same
        : 1 - (platform.price - lowestPrice) / priceRange;

    // Other factor scores (1 is best)
    const deliveryScore = platform.freeDelivery ? 1 : 0.3;
    const codScore = platform.codAvailable ? 1 : 0.3;

    // Return policy score (basic algorithm - can be improved)
    const returnPolicyScore = platform.returnPolicy
      ?.toLowerCase()
      .includes("30")
      ? 1
      : platform.returnPolicy?.toLowerCase().includes("15")
      ? 0.7
      : platform.returnPolicy?.toLowerCase().includes("10")
      ? 0.5
      : platform.returnPolicy?.toLowerCase().includes("7")
      ? 0.3
      : 0.1;

    // Rating score - normalize between 0-1
    const ratingScore = (product.rating || 0) / 5;

    // Seller reputation (simplified - using a constant for now)
    // In a real implementation, this would come from the API
    const sellerReputationScore = 0.8;

    // Weight each factor according to user preferences (1-5 scale converted to 0-1)
    const weightedScores = [
      normalizedPriceScore * (userPreferences.priceImportance / 5),
      deliveryScore * (userPreferences.deliveryImportance / 5),
      codScore * (userPreferences.codImportance / 5),
      returnPolicyScore * (userPreferences.returnPolicyImportance / 5),
      ratingScore * (userPreferences.ratingImportance / 5),
      sellerReputationScore * (userPreferences.sellerReputationImportance / 5),
    ];

    // Calculate total score (sum of weighted factors)
    return weightedScores.reduce((sum, score) => sum + score, 0);
  };

  // Get recommended product based on user preferences
  const getRecommendedProduct = (
    products: SelectedProduct[]
  ): number | null => {
    if (!products || products.length === 0) return null;

    // Calculate scores for each product
    const productScores = products.map((p) => ({
      id: p.id,
      score: getProductScore(p),
    }));

    // Find product with highest score
    const bestProduct = productScores.reduce(
      (best, current) => (current.score > best.score ? current : best),
      { id: 0, score: -1 }
    );

    return bestProduct.id;
  };

  // Clean up compare products by removing any unselected products
  useEffect(() => {
    if (compareProducts.length > 0) {
      const selected = compareProducts.filter((p) => p.selected);
      if (selected.length === 0) {
        setCompareProducts([]);
      } else if (selected.length !== compareProducts.length) {
        setCompareProducts(selected);
      }
    }
  }, [compareProducts]);

  return (
    <ProductContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,
        compareProducts,
        addToCompare,
        removeFromCompare,
        isInCompare,
        compareModalOpen,
        openCompareModal,
        closeCompareModal,
        clearCompare,
        userPreferences,
        setUserPreferences,
        getRecommendedProduct,
        getProductScore,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
};
