import React from 'react';
import { Link } from 'wouter';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">ShopCompare</h3>
            <p className="text-gray-400 text-sm">Find the best deals across all your favorite shopping platforms in one convenient place.</p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white text-sm">Home</Link></li>
              <li><Link href="/search?category=electronics" className="text-gray-400 hover:text-white text-sm">Electronics</Link></li>
              <li><Link href="/search?category=fashion" className="text-gray-400 hover:text-white text-sm">Fashion</Link></li>
              <li><Link href="/search?category=grocery" className="text-gray-400 hover:text-white text-sm">Grocery</Link></li>
            </ul>
          </div>
          
          {/* Help & Support */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Help & Support</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm">FAQs</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Contact Us</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-3">Get the latest deals and updates.</p>
            <form className="flex">
              <Input
                type="email"
                placeholder="Your email address"
                className="bg-gray-800 border-gray-700 rounded-r-none focus:ring-primary focus:border-primary text-white"
              />
              <Button type="submit" className="rounded-l-none">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">© 2023 ShopCompare. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">Facebook</span>
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">Instagram</span>
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <span className="sr-only">Twitter</span>
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
