import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Link } from "wouter";

const OrderSuccess = () => {
  // Generate a random order number
  const orderNumber = `ORD-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Order Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-500">Order Number</p>
          <p className="text-lg font-medium">{orderNumber}</p>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          We've sent a confirmation email with order details and tracking
          information.
        </p>

        <div className="flex flex-col space-y-2">
          <Link href="/">
            <Button className="w-full">Continue Shopping</Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="w-full">
              View Orders
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
