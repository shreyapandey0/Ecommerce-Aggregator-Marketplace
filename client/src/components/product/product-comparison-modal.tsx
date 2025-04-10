import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/context/product-context';
import { formatPrice } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const ProductComparisonModal: React.FC = () => {
  const { 
    compareProducts, 
    compareModalOpen, 
    closeCompareModal, 
    clearCompare 
  } = useProduct();

  // Filter for only selected products
  const selectedProducts = compareProducts.filter(p => p.selected);

  return (
    <Dialog open={compareModalOpen} onOpenChange={closeCompareModal}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-semibold">Compare Products</DialogTitle>
        </DialogHeader>

        {/* Modal Content */}
        <div className="flex-grow overflow-auto py-4">
          <div className="grid grid-cols-1 md:grid-cols-[150px_repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {/* Feature Headers */}
            <div className="sticky left-0 bg-white z-10">
              <div className="h-36"></div> {/* Empty space for product images */}
              <div className="font-medium py-3 border-b">Price</div>
              <div className="font-medium py-3 border-b">Delivery</div>
              <div className="font-medium py-3 border-b">Cash on Delivery</div>
              <div className="font-medium py-3 border-b">Return Policy</div>
              <div className="font-medium py-3 border-b">Rating</div>
              <div className="font-medium py-3 border-b">Seller</div>
            </div>
            
            {/* Product Columns */}
            {selectedProducts.map(product => {
              // For comparison, we'll use the best deal platform or first platform
              const platform = product.platforms.find(p => p.isBestDeal) || product.platforms[0];
              
              return (
                <div key={product.id}>
                  <div className="h-36 flex items-center justify-center mb-4">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="max-h-full object-contain"
                    />
                  </div>
                  <div className="font-bold text-primary-700 py-3 border-b">{formatPrice(platform.price)}</div>
                  <div className={`py-3 border-b ${platform.freeDelivery ? 'text-green-600' : 'text-gray-700'}`}>
                    {platform.freeDelivery ? 'Free Delivery' : 'Paid Delivery'}
                  </div>
                  <div className={`py-3 border-b ${platform.codAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                    {platform.codAvailable ? 'Available' : 'Not Available'}
                  </div>
                  <div className="py-3 border-b">{platform.returnPolicy}</div>
                  <div className="py-3 border-b">{product.rating}.0 ★</div>
                  <div className="py-3 border-b">{platform.name}</div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Modal Footer */}
        <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeCompareModal}>
              Close
            </Button>
            <Button onClick={clearCompare}>
              Clear Selection
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductComparisonModal;
