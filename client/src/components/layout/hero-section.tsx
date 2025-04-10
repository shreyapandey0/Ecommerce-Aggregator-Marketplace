import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProduct } from '@/context/product-context';

const HeroSection: React.FC = () => {
  const [, navigate] = useLocation();
  const { setSearchTerm } = useProduct();
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchTerm(searchInput);
      navigate(`/search?query=${encodeURIComponent(searchInput)}`);
    }
  };

  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-900 text-white">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-4">
            Compare and shop across all your favorite platforms
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-8">
            Find the best deals on electronics, fashion, and groceries all in one place
          </p>
          
          {/* Large Search Form for Hero Section */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-12 pr-28 py-6 text-gray-900 rounded-lg"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="w-6 h-6 text-gray-500" />
              </div>
              <Button 
                type="submit" 
                className="absolute inset-y-0 right-0 rounded-l-none bg-amber-500 hover:bg-amber-600 text-white font-medium px-6"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
