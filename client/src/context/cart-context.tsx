import React, { createContext, useContext, useReducer, useEffect } from "react";
import { ProductWithPlatforms } from "@shared/schema";

interface CartItem {
  id: number; // We'll use a timestamp for this
  product: ProductWithPlatforms;
  quantity: number;
  platformId: string;
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: "ADD_TO_CART"; payload: Omit<CartItem, "id"> }
  | { type: "REMOVE_FROM_CART"; payload: { productId: number } }
  | {
      type: "UPDATE_QUANTITY";
      payload: { productId: number; quantity: number };
    }
  | { type: "CLEAR_CART" };

const CartContext = createContext<
  | {
      state: CartState;
      dispatch: React.Dispatch<CartAction>;
    }
  | undefined
>(undefined);

// Function to calculate total price
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    // Find the platform in the item's product platforms array
    const platform = item.product.platforms.find(
      (p) => p.id === item.platformId
    );

    // If platform exists, add its price * quantity to the total
    return total + (platform?.price || 0) * item.quantity;
  }, 0);
};

// Cart reducer function - FIXED
const cartReducer = (state: CartState, action: CartAction): CartState => {
  console.log("Cart action:", action.type, action.payload);

  switch (action.type) {
    case "ADD_TO_CART": {
      // Make sure we have valid product data
      if (!action.payload.product || !action.payload.product.id) {
        console.error("Invalid product data:", action.payload);
        return state;
      }

      // Clone the product to avoid reference issues
      const productToAdd = {
        ...action.payload.product,
        platforms: [...(action.payload.product.platforms || [])],
      };

      // Check if product already exists in cart
      const existingItemIndex = state.items.findIndex(
        (item) => item.product.id === productToAdd.id
      );

      console.log("Adding product:", productToAdd.id, productToAdd.name);
      console.log("Existing item index:", existingItemIndex);
      console.log(
        "Current items:",
        state.items.map((item) => `${item.product.id}: ${item.product.name}`)
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;

        console.log("Updated items (existing):", updatedItems);

        return {
          ...state,
          items: updatedItems,
          total: calculateTotal(updatedItems),
        };
      }

      // Make sure the platform exists in the product
      const platformExists = productToAdd.platforms.some(
        (p) => p.id === action.payload.platformId
      );

      // If platform doesn't exist, add a default one
      if (!platformExists && productToAdd.platforms.length > 0) {
        // Use existing platform but update the ID
        const defaultPlatform = {
          ...productToAdd.platforms[0],
          id: action.payload.platformId,
          name: "DealAxe Store",
        };
        productToAdd.platforms = [
          defaultPlatform,
          ...productToAdd.platforms.slice(1),
        ];
      } else if (!platformExists) {
        // No platforms at all, create one
        productToAdd.platforms = [
          {
            id: action.payload.platformId,
            name: "DealAxe Store",
            price: 0, // This should be updated with the actual price
            codAvailable: true,
            freeDelivery: true,
            deliveryDate: "3-5 business days",
            returnPolicy: "30 days replacement",
            isBestDeal: true,
          },
        ];
      }

      // Create new item with an ID
      const newItem = {
        id: Date.now(), // Use timestamp as ID
        product: productToAdd,
        quantity: action.payload.quantity,
        platformId: action.payload.platformId,
      };

      const updatedItems = [...state.items, newItem];
      console.log(
        "Updated items (new):",
        updatedItems.map((item) => `${item.product.id}: ${item.product.name}`)
      );

      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems),
      };
    }
    // Original format - keep this structure but update the logic
    case "REMOVE_FROM_CART": {
      const updatedItems = state.items.filter(
        (item) => item.product.id !== action.payload.productId
      );
      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems),
      };
    }
    case "UPDATE_QUANTITY": {
      const updatedItems = state.items.map((item) =>
        item.product.id === action.payload.productId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return {
        ...state,
        items: updatedItems,
        total: calculateTotal(updatedItems),
      };
    }
    case "CLEAR_CART":
      return {
        items: [],
        total: 0,
      };
    default:
      return state;
  }
};

// Initialize state from localStorage if available
const getInitialState = (): CartState => {
  if (typeof window === "undefined") {
    return { items: [], total: 0 };
  }

  try {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      // Validate the parsed cart
      if (parsedCart && Array.isArray(parsedCart.items)) {
        return parsedCart;
      }
    }
  } catch (error) {
    console.error("Error parsing cart from localStorage:", error);
  }

  return { items: [], total: 0 };
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(cartReducer, getInitialState());

  // Save cart to localStorage whenever it changes
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cart", JSON.stringify(state));
        // Debug what's being saved
        console.log("Saving to cart with items:", state.items.length);
        console.log(
          "Cart item IDs:",
          state.items.map((item) => item.product.id)
        );
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    }
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

// This hook needs to be exported properly
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
