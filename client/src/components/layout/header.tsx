import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useProduct } from "@/context/product-context";
import { useCart } from "@/context/cart-context"; // Added import for cart context

const Header: React.FC = () => {
  const [, navigate] = useLocation();
  const { setSearchTerm } = useProduct();
  const { cartItemCount } = useCart(); // Access cart item count
  const [searchInput, setSearchInput] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchTerm(searchInput);
      navigate(`/search?query=${encodeURIComponent(searchInput)}`);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <span className="text-xl font-heading font-bold text-gray-900">
              Dealaxe
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-primary font-medium"
            >
              Home
            </Link>
            <Link
              href="/search?category=electronics"
              className="text-gray-600 hover:text-primary font-medium"
            >
              Electronics
            </Link>
            <Link
              href="/search?category=fashion"
              className="text-gray-600 hover:text-primary font-medium"
            >
              Fashion
            </Link>
            <Link
              href="/search?category=grocery"
              className="text-gray-600 hover:text-primary font-medium"
            >
              Grocery
            </Link>
            <Link
              href="/cart"
              className="flex items-center space-x-1 text-gray-600 hover:text-primary"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
            </Link>
            <div className="flex gap-2">
              <Button variant="ghost" className="text-sm">
                Login
              </Button>
              <Button variant="ghost" className="text-sm" asChild>
                <Link href="/seller/dashboard">Seller Dashboard</Link>
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col h-full py-6">
                <div className="flex items-center mb-6">
                  <ShoppingCart className="h-6 w-6 text-primary mr-2" />
                  <span className="text-lg font-heading font-bold">
                    ShopCompare
                  </span>
                </div>

                <nav className="flex flex-col space-y-4">
                  <Link
                    href="/"
                    className="py-2 text-gray-600 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/search?category=electronics"
                    className="py-2 text-gray-600 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Electronics
                  </Link>
                  <Link
                    href="/search?category=fashion"
                    className="py-2 text-gray-600 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Fashion
                  </Link>
                  <Link
                    href="/search?category=grocery"
                    className="py-2 text-gray-600 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Grocery
                  </Link>
                  <Link
                    href="/cart"
                    className="py-2 text-gray-600 hover:text-primary flex items-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    <span>Cart</span>
                  </Link>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="text-sm">
                      Login
                    </Button>
                    <Button variant="ghost" className="text-sm" asChild>
                      <Link href="/seller/dashboard">Seller Dashboard</Link>
                    </Button>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Search Form */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9"
            />
            <Button type="submit" size="icon" className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;
