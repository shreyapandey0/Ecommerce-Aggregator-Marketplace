import React, { useState } from "react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const { state, dispatch } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check for required fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.address ||
      !formData.cardNumber
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Simple card validation
    if (formData.cardNumber.length < 16 || !/^\d+$/.test(formData.cardNumber)) {
      toast({
        title: "Invalid Card",
        description: "Please enter a valid card number",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Success! Clear cart and redirect
    toast({
      title: "Payment Successful",
      description: "Your order has been placed!",
    });

    // Clear the cart
    dispatch({ type: "CLEAR_CART" });

    // Redirect to confirmation page or home
    // In checkout.tsx, update the redirect after payment success:
    window.location.href = "/order-success";
    setLoading(false);
  };

  // Calculate order total
  const subtotal = state.total;
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  // Find platform for each item
  const cartItems = state.items.map((item) => {
    const platform =
      item.product.platforms.find((p) => p.id === item.platformId) ||
      item.product.platforms[0];
    return {
      ...item,
      platform,
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checkout Form */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Shipping Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <h2 className="text-lg font-medium mt-6 mb-4">Payment Details</h2>

              <div>
                <Label htmlFor="cardNumber">Card Number *</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  required
                  maxLength={16}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardExpiry">Expiry Date *</Label>
                  <Input
                    id="cardExpiry"
                    name="cardExpiry"
                    placeholder="MM/YY"
                    value={formData.cardExpiry}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cardCvc">CVC *</Label>
                  <Input
                    id="cardCvc"
                    name="cardCvc"
                    placeholder="123"
                    value={formData.cardCvc}
                    onChange={handleChange}
                    required
                    maxLength={3}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                disabled={loading}
              >
                {loading ? "Processing..." : `Pay ${formatPrice(total)}`}
              </Button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center py-2 border-b">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatPrice(item.platform.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
