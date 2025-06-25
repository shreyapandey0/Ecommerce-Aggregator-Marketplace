import React, { useState } from "react";
import { Link } from "wouter";
import {
  Heart,
  CheckCircle2,
  CalendarDays,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Platform, ProductWithPlatforms } from "@shared/schema";
import { useProduct } from "@/context/product-context";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
interface ProductCardProps {
  product: ProductWithPlatforms;
}
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCompare, removeFromCompare, isInCompare } = useProduct();
  const { state, dispatch } = useCart();
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform>(
    product.platforms.find((p) => p.isBestDeal) || product.platforms[0]
  );
  // Check if this is a Dealaxe product (seller product)
  const isDealaxeProduct = isCartEligible(product, activePlatform);

  const toggleCompare = () => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  function isCartEligible(product: ProductWithPlatforms, platform: Platform) {
    // Seller products have IDs >= 1000
    const isSellerProduct = product.id >= 1000;
    // Sample products have DealAxe in the name
    const isSampleProduct = product.name.includes("DealAxe");
    // Real product detection
    const isDealaxePlatform = platform.name === "DealAxe Store";
    // For debugging
    console.log("Product eligible check:", {
      id: product.id,
      name: product.name,
      platform: platform.name,
      isSellerProduct,
      isSampleProduct,
      isDealaxePlatform,
      result: isSellerProduct || isDealaxePlatform || isSampleProduct,
    });
    // Return true for any of our products (not API products)
    return isSellerProduct || isDealaxePlatform || isSampleProduct;
  }
  // Add to cart function - FIXED
  const handleAddToCart = () => {
    if (isDealaxeProduct) {
      // Debug logging
      console.log("Adding to cart:", {
        productId: product.id,
        productName: product.name,
        platformId: activePlatform.id,
        isDealaxeProduct,
      });
      // Ensure we're using the right platform
      const dealaxePlatform =
        product.platforms.find((p) => p.name === "DealAxe Store") ||
        activePlatform;

      // Dispatch with full product info
      dispatch({
        type: "ADD_TO_CART",
        payload: {
          product: {
            ...product,
            // Ensure these fields exist
            id: product.id,
            name: product.name,
            image: product.image,
            category: product.category,
          },
          quantity: 1,
          platformId: dealaxePlatform.id,
        },
      });
      // Check localStorage after adding
      setTimeout(() => {
        console.log(
          "Cart in localStorage:",
          JSON.parse(localStorage.getItem("cart") || '{"items":[]}')
        );
      }, 500);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    } else {
      toast({
        title: "Comparison Only",
        description: "This product is for price comparison only.",
      });
    }
  };

  // Calculate discount percentage if originalPrice exists
  const getDiscountPercentage = () => {
    if (
      activePlatform.originalPrice &&
      activePlatform.originalPrice > activePlatform.price
    ) {
      return Math.round(
        ((activePlatform.originalPrice - activePlatform.price) /
          activePlatform.originalPrice) *
          100
      );
    }
    return 0;
  };
  const discountPercent = getDiscountPercentage();
  // Function to handle image errors
  const handleImageError = () => {
    console.log("Image failed to load:", product.image);
    setImageError(true);
  };
  // Get appropriate image URL
  const imageUrl = imageError
    ? "https://via.placeholder.com/300"
    : product.image;
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Product Image - UPDATED with error handling */}
      <div className="relative h-48 bg-gray-100">
        <Link href={`/product/${product.id}`}>
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-4"
            onError={handleImageError}
          />
        </Link>
        <button
          className={`absolute top-2 right-2 p-1.5 rounded-full ${
            isInCompare(product.id)
              ? "bg-primary/10 text-primary"
              : "bg-white/80 hover:bg-white text-gray-600 hover:text-primary"
          } transition-colors`}
          title={
            isInCompare(product.id) ? "Remove from compare" : "Add to compare"
          }
          onClick={toggleCompare}
        >
          <Heart
            className="h-5 w-5"
            fill={isInCompare(product.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      {/* Rest of your component remains the same */}
      {/* Product Info */}
      <div className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-heading font-medium text-lg mb-1 text-gray-900 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {/* Rating stars */}
        <div className="flex items-center mb-2">
          <div className="flex text-amber-500">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill={i < product.rating ? "currentColor" : "#e5e7eb"}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">
            ({product.reviewCount} reviews)
          </span>
        </div>
        {/* Platform Tabs */}
        <div className="flex border-b border-gray-200 mb-3 overflow-x-auto no-scrollbar">
          {product.platforms.map((platform) => (
            <button
              key={platform.id}
              className={`flex items-center py-2 px-3 border-b-2 text-sm font-medium whitespace-nowrap ${
                activePlatform.id === platform.id
                  ? "border-primary bg-primary-50 text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActivePlatform(platform)}
            >
              <span
                className={`w-3 h-3 rounded-full ${
                  activePlatform.id === platform.id
                    ? "bg-primary"
                    : "bg-gray-300"
                } mr-2`}
              ></span>
              {platform.name}
            </button>
          ))}
        </div>
        {/* Platform Details */}
        <div className="platform-details">
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(activePlatform.price)}
            </span>
            {activePlatform.originalPrice &&
              activePlatform.originalPrice > activePlatform.price && (
                <>
                  <span className="text-sm text-gray-500 line-through ml-2">
                    {formatPrice(activePlatform.originalPrice)}
                  </span>
                  {discountPercent > 0 && (
                    <span className="text-xs text-green-600 ml-2">
                      {discountPercent}% off
                    </span>
                  )}
                </>
              )}
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {activePlatform.freeDelivery && (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span>Free delivery</span>
              </div>
            )}
            {activePlatform.codAvailable ? (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span>Cash on delivery available</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Cash on delivery unavailable</span>
              </div>
            )}
            {activePlatform.deliveryDate && (
              <div className="flex items-start">
                <CalendarDays className="h-4 w-4 mr-1.5 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>
                  Delivery by{" "}
                  <span className="font-medium">
                    {activePlatform.deliveryDate}
                  </span>
                </span>
              </div>
            )}
            {activePlatform.returnPolicy && (
              <div className="flex items-start">
                <RefreshCw className="h-4 w-4 mr-1.5 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>{activePlatform.returnPolicy}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            {isDealaxeProduct ? (
              // Dealaxe product - add to cart button
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            ) : (
              // API product - view deal button
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                View Deal
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800"
              onClick={toggleCompare}
            >
              {isInCompare(product.id) ? "Remove" : "Compare"}
            </Button>
          </div>
        </div>
      </div>
      {activePlatform.isBestDeal && (
        <div className="bg-green-50 py-2 px-4 text-center">
          <span className="text-green-700 text-sm font-medium">Best Deal</span>
        </div>
      )}
      {isDealaxeProduct && (
        <div className="bg-primary-50 py-2 px-4 text-center">
          <span className="text-primary-700 text-sm font-medium">
            DealAxe Store
          </span>
        </div>
      )}
    </div>
  );
};
export default ProductCard;
