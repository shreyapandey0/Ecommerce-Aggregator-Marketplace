import React from "react";
import { Link, useLocation } from "wouter";
import HeroSection from "@/components/layout/hero-section";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import ProductGrid from "@/components/product/product-grid";
import { ArrowRight, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Home: React.FC = () => {
  const [, navigate] = useLocation();

  // Fetch featured electronics products
  const { data: electronicsData, isLoading: electronicsLoading } = useQuery({
    queryKey: ["/api/products/category/electronics"],
    queryFn: () => api.getProductsByCategory("electronics"),
  });

  // Fetch featured fashion products
  const { data: fashionData, isLoading: fashionLoading } = useQuery({
    queryKey: ["/api/products/category/fashion"],
    queryFn: () => api.getProductsByCategory("fashion"),
  });

  // Fetch featured grocery products
  const { data: groceryData, isLoading: groceryLoading } = useQuery({
    queryKey: ["/api/products/category/grocery"],
    queryFn: () => api.getProductsByCategory("grocery"),
  });

  return (
    <div>
      {/* Hero Section */}
      <HeroSection />

      {/* Category Section */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-heading font-bold mb-6">
            Shop by Category
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Electronics Category */}
            <Link
              href="/search?category=electronics"
              className="relative overflow-hidden rounded-lg shadow-md group"
            >
              <img
                src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80"
                alt="Electronics"
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex items-end">
                <div className="p-4 w-full">
                  <h3 className="text-xl font-heading font-semibold text-white">
                    Electronics
                  </h3>
                  <p className="text-white/80 text-sm">
                    Compare prices on the latest gadgets
                  </p>
                </div>
              </div>
            </Link>

            {/* Fashion Category */}
            <Link
              href="/search?category=fashion"
              className="relative overflow-hidden rounded-lg shadow-md group"
            >
              <img
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80"
                alt="Fashion"
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex items-end">
                <div className="p-4 w-full">
                  <h3 className="text-xl font-heading font-semibold text-white">
                    Fashion
                  </h3>
                  <p className="text-white/80 text-sm">
                    Discover trending styles at best prices
                  </p>
                </div>
              </div>
            </Link>

            {/* Grocery Category */}
            <Link
              href="/search?category=grocery"
              className="relative overflow-hidden rounded-lg shadow-md group"
            >
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=300&q=80"
                alt="Grocery"
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex items-end">
                <div className="p-4 w-full">
                  <h3 className="text-xl font-heading font-semibold text-white">
                    Grocery
                  </h3>
                  <p className="text-white/80 text-sm">
                    Compare prices on everyday essentials
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section with Tabs */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-heading font-bold mb-6">
            Featured Products
          </h2>

          <Tabs defaultValue="electronics" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="electronics">Electronics</TabsTrigger>
              <TabsTrigger value="fashion">Fashion</TabsTrigger>
              <TabsTrigger value="grocery">Grocery</TabsTrigger>
            </TabsList>

            <TabsContent value="electronics">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-heading font-semibold">
                  Top Electronics
                </h3>
                <Link
                  href="/search?category=electronics"
                  className="text-primary hover:text-primary-600 font-medium text-sm flex items-center"
                >
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <ProductGrid
                products={electronicsData?.products || []}
                isLoading={electronicsLoading}
              />
            </TabsContent>

            <TabsContent value="fashion">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-heading font-semibold">
                  Trending Fashion
                </h3>
                <Link
                  href="/search?category=fashion"
                  className="text-primary hover:text-primary-600 font-medium text-sm flex items-center"
                >
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <ProductGrid
                products={fashionData?.products || []}
                isLoading={fashionLoading}
              />
            </TabsContent>

            <TabsContent value="grocery">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-heading font-semibold">
                  Grocery Essentials
                </h3>
                <Link
                  href="/search?category=grocery"
                  className="text-primary hover:text-primary-600 font-medium text-sm flex items-center"
                >
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <ProductGrid
                products={groceryData?.products || []}
                isLoading={groceryLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How ShopCompare Works */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-10">
            How DealAxe Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2">
                Search for Products
              </h3>
              <p className="text-gray-600">
                Enter what you're looking for, and we'll search across multiple
                platforms.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2">
                Compare Prices & Features
              </h3>
              <p className="text-gray-600">
                View all delivery options, prices, and seller policies in one
                place.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2">
                Purchase with Confidence
              </h3>
              <p className="text-gray-600">
                Select the best deal and get redirected to complete your
                purchase.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
