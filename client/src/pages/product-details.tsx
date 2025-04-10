import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { ArrowLeft, CheckCircle2, XCircle, Calendar, RefreshCw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import { Link } from 'wouter';
import { useProduct } from '@/context/product-context';
import { formatPrice } from '@/lib/utils';
import { Platform } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

const ProductDetails: React.FC = () => {
  const [, params] = useRoute('/product/:id');
  const productId = params?.id ? parseInt(params.id) : 0;
  const { addToCompare, removeFromCompare, isInCompare } = useProduct();
  const { toast } = useToast();
  
  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${productId}`],
    queryFn: () => api.getProductById(productId),
    enabled: !!productId,
    retry: 1,
  });
  
  // Track selected platform
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(
    product?.platforms.find(p => p.isBestDeal)?.id || 
    product?.platforms[0]?.id || 
    null
  );
  
  // Update selected platform when product data loads
  React.useEffect(() => {
    if (product && product.platforms.length > 0) {
      const bestDeal = product.platforms.find(p => p.isBestDeal);
      setSelectedPlatformId(bestDeal?.id || product.platforms[0].id);
    }
  }, [product]);
  
  const selectedPlatform: Platform | undefined = 
    product?.platforms.find(p => p.id === selectedPlatformId) || 
    product?.platforms[0];
    
  // Calculate discount if there's an original price
  const getDiscountPercentage = (platform: Platform) => {
    if (platform.originalPrice && platform.originalPrice > platform.price) {
      return Math.round(
        ((platform.originalPrice - platform.price) / platform.originalPrice) * 100
      );
    }
    return 0;
  };
  
  const handleToggleCompare = () => {
    if (!product) return;
    
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
      toast({
        title: "Removed from comparison",
        description: `${product.name} has been removed from your comparison list.`,
      });
    } else {
      addToCompare(product);
      toast({
        title: "Added to comparison",
        description: `${product.name} has been added to your comparison list.`,
      });
    }
  };
  
  // Handle buy now / view deal
  const handleViewDeal = () => {
    toast({
      title: "Redirecting to seller",
      description: `You will be redirected to ${selectedPlatform?.name} to complete your purchase.`,
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 w-40 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 p-4 rounded-lg text-red-700 flex items-start">
          <XCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Error loading product</h3>
            <p className="text-sm">
              We couldn't load the product details. Please try again or navigate back to search.
            </p>
            <Link href="/search">
              <Button variant="link" className="px-0 mt-2 text-red-700">
                ← Back to search
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/search">
          <Button variant="link" className="px-0 text-gray-600 hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to search results
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center">
          <img 
            src={product.image} 
            alt={product.name} 
            className="max-h-80 object-contain"
          />
        </div>
        
        {/* Product Info & Platforms */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">{product.name}</h1>
          
          {/* Ratings */}
          <div className="flex items-center mb-4">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className="h-5 w-5 fill-current" 
                  fill={i < product.rating ? 'currentColor' : 'none'}
                  strokeWidth={1}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-1">({product.reviewCount} reviews)</span>
          </div>
          
          {/* Category */}
          <div className="text-sm text-gray-500 mb-4">
            Category: <span className="font-medium">{product.category}</span>
          </div>
          
          {/* Description */}
          <p className="text-gray-700 mb-6">{product.description}</p>
          
          {/* Platform Tabs */}
          <Tabs defaultValue={selectedPlatformId || product.platforms[0].id} onValueChange={setSelectedPlatformId}>
            <TabsList className="w-full mb-4">
              {product.platforms.map(platform => (
                <TabsTrigger 
                  key={platform.id} 
                  value={platform.id}
                  className="flex-1"
                >
                  <span className={`w-3 h-3 rounded-full ${
                    platform.isBestDeal ? 'bg-green-600' : 'bg-gray-400'
                  } mr-2`}></span>
                  {platform.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {product.platforms.map(platform => (
              <TabsContent key={platform.id} value={platform.id} className="border-t border-gray-200 pt-4">
                <div className="flex items-baseline mb-3">
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(platform.price)}</span>
                  {platform.originalPrice && platform.originalPrice > platform.price && (
                    <>
                      <span className="text-sm text-gray-500 line-through ml-2">
                        {formatPrice(platform.originalPrice)}
                      </span>
                      <span className="text-xs text-green-600 ml-2">
                        {getDiscountPercentage(platform)}% off
                      </span>
                    </>
                  )}
                </div>
                
                <div className="space-y-3 text-sm mb-6">
                  {platform.freeDelivery && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      <span>Free delivery</span>
                    </div>
                  )}
                  {platform.codAvailable ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      <span>Cash on delivery available</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <XCircle className="h-4 w-4 mr-1.5" />
                      <span>Cash on delivery unavailable</span>
                    </div>
                  )}
                  {platform.deliveryDate && (
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 mr-1.5 mt-0.5 text-gray-500" />
                      <span>Delivery by <span className="font-medium">{platform.deliveryDate}</span></span>
                    </div>
                  )}
                  {platform.returnPolicy && (
                    <div className="flex items-start">
                      <RefreshCw className="h-4 w-4 mr-1.5 mt-0.5 text-gray-500" />
                      <span>{platform.returnPolicy}</span>
                    </div>
                  )}
                </div>
                
                {platform.isBestDeal && (
                  <div className="bg-green-50 text-green-700 text-sm font-medium p-2 rounded-md flex items-center mb-4">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Best deal available on {platform.name}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleViewDeal}
                  >
                    View Deal
                  </Button>
                  <Button
                    variant="outline"
                    className={isInCompare(product.id) ? "bg-primary-50 text-primary border-primary" : ""}
                    onClick={handleToggleCompare}
                  >
                    {isInCompare(product.id) ? "Remove from Compare" : "Add to Compare"}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      
      {/* Product Details Section */}
      <div className="mt-12">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Product Details</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="prose max-w-none">
            <p>{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
