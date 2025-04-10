import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useProduct } from "@/context/product-context";
import ProductGrid from "@/components/product/product-grid";
import ProductFilters from "@/components/product/product-filters";
import ProductComparisonModal from "@/components/product/product-comparison-modal";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

const ProductSearch: React.FC = () => {
  const [location] = useLocation();
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    compareProducts,
    openCompareModal,
  } = useProduct();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    // Support both 'q' and 'query' parameters for backwards compatibility
    const queryParam = params.get("query") || params.get("q");
    const categoryParam = params.get("category");

    if (queryParam) {
      console.log("URL query parameter found:", queryParam);
      setSearchTerm(queryParam);
      setCurrentQuery(queryParam);
      setSearchInput(queryParam);

      // If we got here with a query parameter, trigger a refetch
      setTimeout(() => {
        refetchSearch().catch((err) =>
          console.error("Error fetching search results:", err)
        );
      }, 100);
    }

    if (categoryParam) {
      setCurrentCategory(categoryParam);
      setFilters({ ...filters, category: categoryParam });
    }
  }, [location]);

  // Fetch products based on search term and filters
  const {
    data,
    isLoading,
    error,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: ["/api/products/search", currentQuery, filters],
    queryFn: () => api.searchProducts(currentQuery, filters),
    enabled: !!currentQuery, // Only run query if there's a search term
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false,
  });

  // Fetch category products if no search term but category is selected
  const {
    data: categoryData,
    isLoading: isCategoryLoading,
    refetch: refetchCategory,
  } = useQuery({
    queryKey: ["/api/products/category", currentCategory],
    queryFn: () => api.getProductsByCategory(currentCategory, filters),
    enabled: !currentQuery && !!currentCategory, // Only run if no search term but has category
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false,
  });

  const selectedProductsCount = compareProducts.filter(
    (p) => p.selected
  ).length;

  const handleApplyFilters = () => {
    // Close mobile filters if open
    setShowMobileFilters(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    console.log("Submitting search for:", searchInput);
    setCurrentQuery(searchInput);
    setSearchTerm(searchInput);

    // If we're searching, make sure to trigger a refetch
    if (searchInput.trim()) {
      try {
        await refetchSearch();
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    }
  };

  // Determine which products to display
  const products = currentQuery
    ? data?.products || []
    : categoryData?.products || [];

  // Determine loading state
  const loading = currentQuery ? isLoading : isCategoryLoading;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search for products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" className="bg-primary-500">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>

      {/* Comparison Tool Banner */}
      {selectedProductsCount > 0 && (
        <div className="bg-primary-50 rounded-lg p-4 mb-6 border border-primary-100 flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h3 className="font-heading font-medium text-dark-900">
              Compare products across platforms
            </h3>
            <p className="text-gray-500 text-sm">
              Select up to 3 products to compare prices and features
            </p>
          </div>
          <Button
            onClick={openCompareModal}
            disabled={selectedProductsCount < 2}
            className="mt-3 sm:mt-0 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
          >
            Compare Selected ({selectedProductsCount})
          </Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter Sidebar - Desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <ProductFilters
            filters={filters}
            setFilters={setFilters}
            onApplyFilters={handleApplyFilters}
          />
        </aside>

        {/* Mobile Filter Button */}
        <div className="md:hidden mb-4">
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-center w-full bg-white border border-gray-300 rounded-lg py-2 px-4 shadow-sm"
              >
                <Filter className="h-5 w-5 mr-2" />
                <span className="font-medium">Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
              <div className="p-4 h-full overflow-auto">
                <ProductFilters
                  filters={filters}
                  setFilters={setFilters}
                  onApplyFilters={handleApplyFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Results Section */}
        <div className="flex-grow">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-xl text-dark-900">
                {currentQuery
                  ? `Search: ${currentQuery}`
                  : currentCategory || "All Products"}
              </h2>
              <p className="text-gray-500 text-sm">
                {loading
                  ? "Searching for products..."
                  : products?.length > 0
                  ? `Showing ${products.length} results${
                      currentQuery ? ` for "${currentQuery}"` : ""
                    }`
                  : currentQuery
                  ? "No products found for your search"
                  : "No products found"}
              </p>
            </div>
            <div className="flex items-center mt-2 sm:mt-0">
              <span className="text-sm text-gray-700 mr-2">Sort by:</span>
              <select className="bg-white border border-gray-300 rounded-lg py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option>Best Match</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest Arrivals</option>
                <option>Customer Rating</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <ProductGrid
            products={products}
            isLoading={loading}
            error={
              error ? "Error loading products. Please try again." : undefined
            }
          />
        </div>
      </div>

      {/* Product Comparison Modal */}
      <ProductComparisonModal />
    </div>
  );
};

export default ProductSearch;
