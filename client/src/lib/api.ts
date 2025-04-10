import axios from "axios";
import {
  SearchFilters,
  ProductWithPlatforms,
  CartItem,
  InsertCartItem,
} from "@shared/schema";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Product APIs
export const searchProducts = async (
  query: string,
  filters?: SearchFilters
) => {
  const params = new URLSearchParams();

  // Always use 'query' parameter instead of 'q' to match server expectation
  if (query) {
    params.append("query", query);
  }

  if (filters) {
    if (filters.category) {
      params.append("category", filters.category);
    }

    if (filters.priceRange) {
      params.append("minPrice", filters.priceRange[0].toString());
      params.append("maxPrice", filters.priceRange[1].toString());
    }

    if (filters.brands && filters.brands.length > 0) {
      params.append("brands", filters.brands.join(","));
    }

    if (filters.deliveryOptions) {
      if (filters.deliveryOptions.codAvailable) {
        params.append("codAvailable", "true");
      }
      if (filters.deliveryOptions.freeDelivery) {
        params.append("freeDelivery", "true");
      }
      if (filters.deliveryOptions.expressDelivery) {
        params.append("expressDelivery", "true");
      }
    }

    if (filters.rating) {
      params.append("rating", filters.rating.toString());
    }
  }

  console.log(`Searching with params: ${params.toString()}`);
  try {
    const response = await api.get(`/products/search?${params.toString()}`);
    console.log("API Response:", {
      dataCount: response.data.products?.length || 0,
      source: response.data._meta?.source || "unknown",
      sample: response.data._meta?.sample,
    });
    return response.data;
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
};

export const getProductsByCategory = async (
  category: string,
  filters?: SearchFilters
) => {
  const response = await api.get(`/products/category/${category}`);
  return response.data;
};

export const getProductById = async (
  id: number
): Promise<ProductWithPlatforms> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Cart APIs
export const getCartItems = async (): Promise<CartItem[]> => {
  const response = await api.get("/cart");
  return response.data.cartItems;
};

export const addToCart = async (item: InsertCartItem): Promise<CartItem> => {
  const response = await api.post("/cart", item);
  return response.data;
};

export const updateCartItem = async (
  id: number,
  quantity: number
): Promise<CartItem> => {
  const response = await api.put(`/cart/${id}`, { quantity });
  return response.data;
};

export const removeFromCart = async (id: number): Promise<void> => {
  await api.delete(`/cart/${id}`);
};

export const clearCart = async (): Promise<void> => {
  await api.delete("/cart");
};

export default api;
