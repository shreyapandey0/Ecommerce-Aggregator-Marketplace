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

  const [sortBy, setSortBy] = useState("bestMatch");

  const selectedProductsCount = compareProducts.filter(
    (p) => p.selected
  ).length;

  const handleApplyFilters = () => {
    // Close mobile filters if open
    setShowMobileFilters(false);

    // Force a refetch with the new filters
    if (currentQuery) {
      refetchSearch();
    } else if (currentCategory) {
      refetchCategory();
    }

    console.log("Applied filters:", JSON.stringify(filters));
  };

  // Sort products based on sortBy state
  const sortProducts = (productsToSort: any[]) => {
    if (!productsToSort || productsToSort.length === 0) return [];

    const sorted = [...productsToSort];

    switch (sortBy) {
      case "priceLowToHigh":
        return sorted.sort((a, b) => {
          const aMinPrice = Math.min(...a.platforms.map((p: any) => p.price));
          const bMinPrice = Math.min(...b.platforms.map((p: any) => p.price));
          return aMinPrice - bMinPrice;
        });
      case "priceHighToLow":
        return sorted.sort((a, b) => {
          const aMinPrice = Math.min(...a.platforms.map((p: any) => p.price));
          const bMinPrice = Math.min(...b.platforms.map((p: any) => p.price));
          return bMinPrice - aMinPrice;
        });
      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating);
      default:
        return sorted; // Best match - keep original order
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    // Update URL with search params
    const searchParams = new URLSearchParams();
    searchParams.set("query", searchInput);
    if (filters.category) searchParams.set("category", filters.category);
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?${searchParams}`
    );

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
  // Check if we're using the mock data
  const isMockData =
    data?._meta?.source === "mock" || categoryData?._meta?.source === "mock";

  // Get the products from the appropriate data source
  const unsortedProducts = currentQuery
    ? data?.products || []
    : categoryData?.products || [];

  // Apply sorting to products
  const products = sortProducts(unsortedProducts);

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
            <h3 className="font-heading font-medium text-gray-900">
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

      {/* API Rate Limit Banner */}
      {isMockData && (
        <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="font-heading font-medium text-amber-800">
                API Rate Limit Reached
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                You're currently viewing sample product data because the
                RapidAPI monthly quota has been exceeded. Filters and search
                functionality will still work with the sample data.
              </p>
            </div>
          </div>
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
              <h2 className="font-heading font-bold text-xl text-gray-900">
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

              {/* Display Active Filters */}
              {Object.keys(filters).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {filters.category && (
                    <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-xs flex items-center">
                      Category: {filters.category}
                      <button
                        className="ml-1 text-gray-600"
                        onClick={() =>
                          setFilters({ ...filters, category: undefined })
                        }
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {filters.priceRange &&
                    (filters.priceRange[0] > 0 ||
                      filters.priceRange[1] < 2000) && (
                      <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-xs flex items-center">
                        Price: ₹{filters.priceRange[0]} - ₹
                        {filters.priceRange[1]}
                        <button
                          className="ml-1 text-gray-600"
                          onClick={() =>
                            setFilters({ ...filters, priceRange: [0, 2000] })
                          }
                        >
                          ×
                        </button>
                      </div>
                    )}

                  {filters.brands && filters.brands.length > 0 && (
                    <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-xs flex items-center">
                      Brands: {filters.brands.length}
                      <button
                        className="ml-1 text-gray-600"
                        onClick={() => setFilters({ ...filters, brands: [] })}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {filters.rating && (
                    <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-xs flex items-center">
                      Rating: {filters.rating}+ stars
                      <button
                        className="ml-1 text-gray-600"
                        onClick={() =>
                          setFilters({ ...filters, rating: undefined })
                        }
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {filters.deliveryOptions?.codAvailable && (
                    <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-xs flex items-center">
                      COD Available
                      <button
                        className="ml-1 text-gray-600"
                        onClick={() => {
                          const newOptions = {
                            ...filters.deliveryOptions,
                            codAvailable: false,
                          };
                          setFilters({
                            ...filters,
                            deliveryOptions: newOptions,
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {filters.deliveryOptions?.freeDelivery && (
                    <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-xs flex items-center">
                      Free Delivery
                      <button
                        className="ml-1 text-gray-600"
                        onClick={() => {
                          const newOptions = {
                            ...filters.deliveryOptions,
                            freeDelivery: false,
                          };
                          setFilters({
                            ...filters,
                            deliveryOptions: newOptions,
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <button
                    className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs flex items-center"
                    onClick={() => {
                      setFilters({});
                      handleApplyFilters();
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center mt-2 sm:mt-0">
              <span className="text-sm text-gray-700 mr-2">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="bestMatch">Best Match</option>
                <option value="priceLowToHigh">Price: Low to High</option>
                <option value="priceHighToLow">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
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
