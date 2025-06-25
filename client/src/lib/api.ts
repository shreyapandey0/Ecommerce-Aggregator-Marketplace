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

  // Add query
  if (query) {
    params.append("query", query);
  }

  if (filters) {
    // Convert entire filters object to JSON
    params.append("filters", JSON.stringify(filters));
  }

  console.log(`Searching with params: ${params.toString()}`);
  try {
    const response = await api.get(`/products/search?${params.toString()}`);
    console.log("API Response:", {
      dataCount: response.data.products?.length || 0,
      source: response.data._meta?.source || "unknown",
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
