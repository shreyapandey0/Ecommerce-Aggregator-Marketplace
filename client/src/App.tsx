import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { ProductProvider } from "@/context/product-context";
import Home from "@/pages/home";
import ProductSearch from "@/pages/product-search";
import ProductDetails from "@/pages/product-details";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/search" component={ProductSearch} />
          <Route path="/product/:id" component={ProductDetails} />
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
        <Router />
        <Toaster />
      </ProductProvider>
    </QueryClientProvider>
  );
}

export default App;
