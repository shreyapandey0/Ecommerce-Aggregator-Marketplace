import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { ProductProvider } from "@/context/product-context";
import { CartProvider } from "@/context/cart-context";
import Home from "@/pages/home";
import ProductSearch from "@/pages/product-search";
import ProductDetails from "@/pages/product-details";
import SellerDashboard from "@/pages/seller-dashboard";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderSuccess from "@/pages/ordersuccess";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/search" component={ProductSearch} />
          <Route path="/product/:id" component={ProductDetails} />
          <Route path="/seller/dashboard" component={SellerDashboard} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/order-success" component={OrderSuccess} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProductProvider>
        <CartProvider>
          <Router />
          <Toaster />
        </CartProvider>
      </ProductProvider>
    </QueryClientProvider>
  );
}

export default App;
