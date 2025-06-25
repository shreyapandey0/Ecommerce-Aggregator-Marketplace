import React from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Trash2, Plus, Minus } from "lucide-react";

const CartPage = () => {
  const { state, dispatch } = useCart();

  // Extract cart items from state
  const cartItems = state.items.map((item) => {
    // Find the platform for this item
    const platform =
      item.product.platforms.find((p) => p.id === item.platformId) ||
      item.product.platforms[0];

    return {
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      platform: platform,
    };
  });

  // Calculate total
  const cartTotal = state.total;

  // Cart actions
  const updateQuantity = (itemId: number, quantity: number) => {
    const item = state.items.find((i) => i.id === itemId);
    if (item) {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId: item.product.id, quantity },
      });
    }
  };

  const removeFromCart = (itemId: number) => {
    const item = state.items.find((i) => i.id === itemId);
    if (item) {
      dispatch({
        type: "REMOVE_FROM_CART",
        payload: { productId: item.product.id },
      });
    }
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  if (!cartItems?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">Your cart is empty</p>
          <Button
            className="mt-4"
            onClick={() => (window.location.href = "/search")}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg shadow-sm mb-4 flex items-center"
            >
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-24 h-24 object-cover rounded-md"
              />
              <div className="ml-4 flex-grow">
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-gray-500 text-sm">{item.platform.name}</p>
                <div className="flex items-center mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      updateQuantity(item.id, Math.max(1, item.quantity - 1))
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="mx-3">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-4 text-red-500"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatPrice(item.platform.price * item.quantity)}
                </p>
                {item.platform.originalPrice && (
                  <p className="text-sm text-gray-500 line-through">
                    {formatPrice(item.platform.originalPrice * item.quantity)}
                  </p>
                )}
              </div>
            </div>
          ))}
          <Button variant="outline" className="mt-4" onClick={clearCart}>
            Clear Cart
          </Button>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>
            <Button
              className="w-full mt-6"
              size="lg"
              onClick={() => (window.location.href = "/checkout")}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
