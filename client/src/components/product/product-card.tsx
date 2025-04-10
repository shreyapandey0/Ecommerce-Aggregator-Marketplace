import React, { useState } from 'react';
import { Link } from 'wouter';
import { Heart, CheckCircle2, CalendarDays, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Platform, ProductWithPlatforms } from '@shared/schema';
import { useProduct } from '@/context/product-context';

interface ProductCardProps {
  product: ProductWithPlatforms;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCompare, removeFromCompare, isInCompare } = useProduct();
  const [activePlatform, setActivePlatform] = useState<Platform>(
    product.platforms.find(p => p.isBestDeal) || product.platforms[0]
  );
  
  const toggleCompare = () => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  // Calculate discount percentage if originalPrice exists
  const getDiscountPercentage = () => {
    if (activePlatform.originalPrice && activePlatform.originalPrice > activePlatform.price) {
      return Math.round(
        ((activePlatform.originalPrice - activePlatform.price) / activePlatform.originalPrice) * 100
      );
    }
    return 0;
  };

  const discountPercent = getDiscountPercentage();

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        <Link href={`/product/${product.id}`}>
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-contain p-4"
          />
        </Link>
        <button 
          className={`absolute top-2 right-2 p-1.5 rounded-full ${
            isInCompare(product.id) 
              ? 'bg-primary/10 text-primary' 
              : 'bg-white/80 hover:bg-white text-gray-600 hover:text-primary'
          } transition-colors`} 
          title={isInCompare(product.id) ? "Remove from compare" : "Add to compare"}
          onClick={toggleCompare}
        >
          <Heart className="h-5 w-5" fill={isInCompare(product.id) ? "currentColor" : "none"} />
        </button>
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-heading font-medium text-lg mb-1 text-gray-900 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center mb-2">
          <div className="flex text-amber-500">
            {[...Array(5)].map((_, i) => (
              <svg 
                key={i} 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                viewBox="0 0 20 20" 
                fill={i < product.rating ? 'currentColor' : '#e5e7eb'}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">({product.reviewCount} reviews)</span>
        </div>
        
        {/* Platform Tabs */}
        <div className="flex border-b border-gray-200 mb-3 overflow-x-auto no-scrollbar">
          {product.platforms.map((platform) => (
            <button 
              key={platform.id}
              className={`flex items-center py-2 px-3 border-b-2 text-sm font-medium whitespace-nowrap ${
                activePlatform.id === platform.id
                  ? 'border-primary bg-primary-50 text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActivePlatform(platform)}
            >
              <span className={`w-3 h-3 rounded-full ${
                activePlatform.id === platform.id ? 'bg-primary' : 'bg-gray-300'
              } mr-2`}></span>
              {platform.name}
            </button>
          ))}
        </div>
        
        {/* Platform Details */}
        <div className="platform-details">
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-gray-900">{formatPrice(activePlatform.price)}</span>
            {activePlatform.originalPrice && activePlatform.originalPrice > activePlatform.price && (
              <>
                <span className="text-sm text-gray-500 line-through ml-2">
                  {formatPrice(activePlatform.originalPrice)}
                </span>
                {discountPercent > 0 && (
                  <span className="text-xs text-green-600 ml-2">{discountPercent}% off</span>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cash on delivery unavailable</span>
              </div>
            )}
            {activePlatform.deliveryDate && (
              <div className="flex items-start">
                <CalendarDays className="h-4 w-4 mr-1.5 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>Delivery by <span className="font-medium">{activePlatform.deliveryDate}</span></span>
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
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              View Deal
            </Button>
            <Button 
              variant="outline" 
              className="bg-gray-100 hover:bg-gray-200 text-gray-800"
              onClick={toggleCompare}
            >
              {isInCompare(product.id) ? 'Remove' : 'Compare'}
            </Button>
          </div>
        </div>
      </div>
      
      {activePlatform.isBestDeal && (
        <div className="bg-green-50 py-2 px-4 text-center">
          <span className="text-green-700 text-sm font-medium">Best Deal</span>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
