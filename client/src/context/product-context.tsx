import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProductWithPlatforms, SearchFilters } from '@shared/schema';

interface SelectedProduct extends ProductWithPlatforms {
  selected: boolean;
}

interface ProductContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  compareProducts: SelectedProduct[];
  addToCompare: (product: ProductWithPlatforms) => void;
  removeFromCompare: (productId: number) => void;
  isInCompare: (productId: number) => boolean;
  compareModalOpen: boolean;
  openCompareModal: () => void;
  closeCompareModal: () => void;
  clearCompare: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [compareProducts, setCompareProducts] = useState<SelectedProduct[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Limit compare products to maximum 3 items
  const addToCompare = (product: ProductWithPlatforms) => {
    // If already at max capacity (3), don't add more
    if (compareProducts.filter(p => p.selected).length >= 3) {
      // Remove the oldest one and add the new one
      const updated = [...compareProducts];
      const firstSelectedIndex = updated.findIndex(p => p.selected);
      
      if (firstSelectedIndex !== -1) {
        updated[firstSelectedIndex] = { ...updated[firstSelectedIndex], selected: false };
      }
      
      setCompareProducts([
        ...updated,
        { ...product, selected: true }
      ]);
    } else {
      setCompareProducts([
        ...compareProducts,
        { ...product, selected: true }
      ]);
    }
  };

  const removeFromCompare = (productId: number) => {
    setCompareProducts(
      compareProducts.map(p => 
        p.id === productId ? { ...p, selected: false } : p
      )
    );
  };

  const isInCompare = (productId: number) => {
    return compareProducts.some(p => p.id === productId && p.selected);
  };

  const openCompareModal = () => {
    if (compareProducts.filter(p => p.selected).length >= 2) {
      setCompareModalOpen(true);
    }
  };

  const closeCompareModal = () => {
    setCompareModalOpen(false);
  };

  const clearCompare = () => {
    setCompareProducts([]);
  };

  // Clean up compare products by removing any unselected products
  useEffect(() => {
    if (compareProducts.length > 0) {
      const selected = compareProducts.filter(p => p.selected);
      if (selected.length === 0) {
        setCompareProducts([]);
      } else if (selected.length !== compareProducts.length) {
        setCompareProducts(selected);
      }
    }
  }, [compareProducts]);

  return (
    <ProductContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,
        compareProducts,
        addToCompare,
        removeFromCompare,
        isInCompare,
        compareModalOpen,
        openCompareModal,
        closeCompareModal,
        clearCompare,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};
