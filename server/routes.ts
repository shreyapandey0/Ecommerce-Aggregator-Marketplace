import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import {
  Platform,
  ProductWithPlatforms,
  SearchFilters,
  insertCartItemSchema,
} from "@shared/schema";

// Parse and validate the RAPID_API_KEY environment variable
const RAPID_API_KEY = process.env.RAPID_API_KEY || "";
if (!RAPID_API_KEY) {
  console.error(
    "No RAPID_API_KEY found in environment variables. API calls will likely fail."
  );
  console.error(
    "Please make sure your .env file contains RAPID_API_KEY=your_api_key"
  );
} else {
  console.log("RAPID_API_KEY is set and ready to use");
}

// Helper to handle async route functions
const asyncHandler = (fn: Function) => (req: any, res: any) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error("Error in request:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });
};

// Function to get product details via Rapid API
async function getProductDetailsFromAPI(
  productId: string
): Promise<ProductWithPlatforms | null> {
  try {
    console.log(
      "Attempting to fetch product details from RapidAPI with ID:",
      productId
    );

    if (!productId) {
      console.log("No product ID provided for API details fetch");
      return null;
    }
    // Using the real-time-product-search API from RapidAPI - product details endpoint
    const options = {
      method: "GET",
      url: "https://real-time-product-search.p.rapidapi.com/product-details-v2",
      params: {
        product_id: productId,
        country: "us",
        language: "en",
      },
      headers: {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": "real-time-product-search.p.rapidapi.com",
      },
    };
    console.log("API Request options:", JSON.stringify(options));
    const response = await axios.request(options);
    console.log("API Response status:", response.status);
    if (!response.data) {
      console.error("No data returned from API");
      return null;
    }
    // Log full response for debugging
    console.log(
      "Full product details response:",
      JSON.stringify(response.data).slice(0, 500) + "..."
    ); // Log important fields for troubleshooting
    if (response.data && response.data.data) {
      console.log("Product title:", response.data.data.product_title);
      console.log(
        "Product description:",
        response.data.data.product_description?.slice(0, 100) + "..."
      );
      console.log(
        "Product photos:",
        response.data.data.product_photos
          ? JSON.stringify(response.data.data.product_photos).slice(0, 200)
          : "None"
      );
      console.log(
        "Product attributes:",
        response.data.data.product_attributes
          ? Object.keys(response.data.data.product_attributes).join(", ")
          : "None"
      );
    }

    const data = response.data.data || response.data;

    // Extract price from typical_price_range
    let itemPrice = 0;
    let originalPrice = 0;
    if (
      data.typical_price_range &&
      Array.isArray(data.typical_price_range) &&
      data.typical_price_range.length > 0
    ) {
      // Use the lowest price in the range
      itemPrice = parseFloat(
        data.typical_price_range[0].replace(/[^0-9.]/g, "")
      );
      // Use the highest price as original price if available
      if (data.typical_price_range.length > 1) {
        originalPrice = parseFloat(
          data.typical_price_range[1].replace(/[^0-9.]/g, "")
        );
      } else {
        originalPrice = itemPrice;
      }
    }
    // Create a platform for the product
    const platforms: Platform[] = [
      {
        id: "online",
        name: "Online Store",
        price: itemPrice || 99.99,
        originalPrice: originalPrice > 0 ? originalPrice : undefined,
        codAvailable: false,
        freeDelivery: false,
        deliveryDate: "Standard delivery",
        returnPolicy: "30 days return",
        isBestDeal: true,
      },
    ];
    // For each offer, add as a platform
    if (data.product_num_offers && data.product_num_offers > 0) {
      platforms[0].name = "Multiple Retailers";
    }
    return {
      id: 1, // This will be replaced by storage when saved
      name: data.product_title || "Unknown Product",
      description: data.product_description || "No description available",
      category: data.product_attributes?.Category || "Electronics",
      image:
        data.product_photos && data.product_photos.length > 0
          ? data.product_photos[0]
          : "https://via.placeholder.com/300",
      platforms,
      rating: data.product_rating ? Math.round(data.product_rating) : 4,
      reviewCount: data.product_num_reviews
        ? parseInt(data.product_num_reviews)
        : 0,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error fetching product details from API:", error);
    if (axios.isAxiosError(error)) {
      console.error("API Error Response:", error.response?.data);
      console.error("API Error Status:", error.response?.status);
    }
    return null;
  }
}

// Function to search products via Rapid API
async function searchProductsFromAPI(
  query: string,
  category?: string
): Promise<ProductWithPlatforms[]> {
  try {
    if (!query) {
      console.log("No query provided for API search");
      return [];
    }

    // Define params type with optional category field
    interface SearchParams {
      q: string;
      country: string;
      language: string;
      page: string;
      limit: string;
      sort_by: string;
      product_condition: string;
      min_rating: string;
      category?: string; // Make category optional in the type
    }

    // Using the real-time-product-search API from RapidAPI
    const options = {
      method: "GET",
      url: "https://real-time-product-search.p.rapidapi.com/search",
      params: {
        q: query, // Use provided query without Nike shoes default
        country: "uk",
        language: "en",
        page: "1",
        limit: "10",
        sort_by: "BEST_MATCH",
        product_condition: "ANY",
        min_rating: "ANY",
      } as SearchParams, // Cast to our interface that includes optional category
      headers: {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": "real-time-product-search.p.rapidapi.com",
      },
    };

    // Add category filter if provided
    if (category) {
      // Convert general category names to API specific categories
      switch (category.toLowerCase()) {
        case "electronics":
          options.params.category = "Electronics";
          break;
        case "fashion":
        case "clothing":
          options.params.category = "Apparel";
          break;
        case "beauty":
          options.params.category = "Beauty";
          break;
        default:
          // Use the category as provided
          options.params.category = category;
      }
    }

    console.log("API Request options:", JSON.stringify(options));
    const response = await axios.request(options);
    console.log("API Response status:", response.status);

    // Log a sample of the response data for debugging
    if (response.data && response.data.data && response.data.data.products) {
      console.log(
        `Found ${response.data.data.products.length} products from API`
      );
      if (response.data.data.products.length > 0) {
        console.log(
          "First product sample:",
          JSON.stringify(response.data.data.products[0].product_title)
        );
      }
    }

    if (
      !response.data ||
      !response.data.data ||
      !Array.isArray(response.data.data.products)
    ) {
      console.error(
        "Unexpected API response format:",
        JSON.stringify(response.data)
      );
      return [];
    }

    // Map the API response to our ProductWithPlatforms structure
    return response.data.data.products.map((item: any, index: number) => {
      // Process offer data into platform structure
      const platforms: Platform[] = [];

      // Extract price - prioritize offer price if available
      let itemPrice = 0;
      let originalPrice = 0;

      // First try to get price from offer
      if (item.offer?.price) {
        itemPrice = parseFloat(item.offer.price.replace(/[^0-9.]/g, ""));
        originalPrice = itemPrice; // Default to same price if no original available
      }

      // Fallback to typical_price_range if no offer price
      if (itemPrice === 0 && item.typical_price_range?.length > 0) {
        itemPrice = parseFloat(
          item.typical_price_range[0].replace(/[^0-9.]/g, "")
        );
        if (item.typical_price_range.length > 1) {
          originalPrice = parseFloat(
            item.typical_price_range[1].replace(/[^0-9.]/g, "")
          );
        }
      }

      // Final fallback if no prices found
      if (itemPrice === 0) {
        itemPrice = 99.99;
        originalPrice = 99.99;
      }

      // Add platform information
      if (item.offer) {
        platforms.push({
          id:
            item.offer.store_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
            "store",
          name: item.offer.store_name || "Store",
          price: itemPrice,
          originalPrice: originalPrice > itemPrice ? originalPrice : undefined,
          codAvailable: false,
          freeDelivery:
            item.offer.shipping?.toLowerCase().includes("free") || false,
          deliveryDate: item.offer.shipping || "Standard delivery",
          returnPolicy: "30 days return",
          isBestDeal: true,
        });
      } else {
        platforms.push({
          id: "online",
          name: "Online Store",
          price: itemPrice,
          originalPrice: originalPrice > itemPrice ? originalPrice : undefined,
          codAvailable: false,
          freeDelivery: false,
          deliveryDate: "Standard delivery",
          returnPolicy: "30 days return",
          isBestDeal: true,
        });
      }

      return {
        id: index + 1, // Generate sequential IDs
        name: item.product_title || "Unknown Product",
        description: item.product_description || "No description available",
        category:
          category || item.product_attributes?.Category || "Electronics",
        image:
          item.product_photos && item.product_photos.length > 0
            ? item.product_photos[0]
            : "https://via.placeholder.com/300",
        platforms,
        rating: item.product_rating ? Math.round(item.product_rating) : 4,
        reviewCount: item.product_num_reviews
          ? parseInt(item.product_num_reviews)
          : 0,
        createdAt: new Date(),
      };
    });
  } catch (error) {
    console.error("Error fetching products from API:", error);
    if (axios.isAxiosError(error)) {
      console.error("API Error Response:", error.response?.data);
      console.error("API Error Status:", error.response?.status);
    }
    return []; // Return empty array on error
  }
}

// Function to get mock products when API key isn't available
function getMockProducts(
  category: string = "Electronics"
): ProductWithPlatforms[] {
  const products: ProductWithPlatforms[] = [
    {
      id: 1,
      name: "Samsung Galaxy S22 Ultra",
      description: "Top-of-the-line smartphone with advanced camera system",
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1605464315513-cbcb36c89961",
      platforms: [
        {
          id: "amazon",
          name: "Amazon",
          price: 899.99,
          codAvailable: true,
          freeDelivery: true,
          deliveryDate: "Aug 25",
          returnPolicy: "10 days replacement",
        },
        {
          id: "flipkart",
          name: "Flipkart",
          price: 849.99,
          codAvailable: true,
          freeDelivery: true,
          deliveryDate: "Aug 25",
          returnPolicy: "10 days replacement",
          isBestDeal: true,
        },
        {
          id: "bestbuy",
          name: "BestBuy",
          price: 899.99,
          codAvailable: true,
          freeDelivery: true,
          deliveryDate: "Aug 25",
          returnPolicy: "10 days replacement",
        },
      ],
      rating: 4,
      reviewCount: 432,
      createdAt: new Date(),
    },
    {
      id: 2,
      name: "Google Pixel 7 Pro",
      description: "Google's flagship smartphone with the best camera",
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab",
      platforms: [
        {
          id: "amazon",
          name: "Amazon",
          price: 799.99,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Aug 24",
          returnPolicy: "30 days replacement",
          isBestDeal: true,
        },
        {
          id: "bestbuy",
          name: "BestBuy",
          price: 849.99,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Aug 26",
          returnPolicy: "15 days replacement",
        },
      ],
      rating: 4,
      reviewCount: 257,
      createdAt: new Date(),
    },
    {
      id: 3,
      name: "Apple iPhone 14 Pro",
      description:
        "Apple's premium iPhone with Dynamic Island and A16 Bionic chip",
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1607936854279-55e8a4c64888",
      platforms: [
        {
          id: "apple",
          name: "Apple Store",
          price: 999.99,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Aug 22",
          returnPolicy: "14 days replacement",
          isBestDeal: true,
        },
        {
          id: "amazon",
          name: "Amazon",
          price: 999.99,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Aug 27",
          returnPolicy: "30 days replacement",
        },
      ],
      rating: 5,
      reviewCount: 512,
      createdAt: new Date(),
    },
  ];

  // If a specific category is requested, filter the products
  if (category.toLowerCase() !== "electronics") {
    return products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  return products;
}

// Get sample fashion products
function getFashionProducts(): ProductWithPlatforms[] {
  return [
    {
      id: 4,
      name: "Nike Air Max 270",
      description: "Comfortable everyday shoes with large air cushion",
      category: "Fashion",
      image: "https://images.unsplash.com/photo-1552346154-21d32810aba3",
      platforms: [
        {
          id: "nike",
          name: "Nike Store",
          price: 150.00,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Aug 25",
          returnPolicy: "30 days return",
          isBestDeal: true,
        },
        {
          id: "amazon",
          name: "Amazon",
          price: 159.99,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Aug 24",
          returnPolicy: "30 days return",
        },
      ],
      rating: 4,
      reviewCount: 328,
      createdAt: new Date(),
    },
    {
      id: 5,
      name: "Levi's 501 Original Fit Jeans",
      description: "Classic straight leg jeans with button fly",
      category: "Fashion",
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d",
      platforms: [
        {
          id: "levis",
          name: "Levi's Store",
          price: 59.99,
          originalPrice: 69.99,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Aug 23",
          returnPolicy: "30 days return",
        },
        {
          id: "amazon",
          name: "Amazon",
          price: 52.99,
          originalPrice: 69.99,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Aug 24",
          returnPolicy: "30 days return",
          isBestDeal: true,
        },
      ],
      rating: 4,
      reviewCount: 1205,
      createdAt: new Date(),
    },
  ];
}

// Get sample grocery products
function getGroceryProducts(): ProductWithPlatforms[] {
  return [
    {
      id: 6,
      name: "Organic Bananas (Pack of 5)",
      description: "Fresh organic bananas",
      category: "Grocery",
      image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224",
      platforms: [
        {
          id: "wholefoods",
          name: "Whole Foods",
          price: 2.99,
          codAvailable: false,
          freeDelivery: false,
          deliveryDate: "Today",
          returnPolicy: "Same day return",
        },
        {
          id: "amazon",
          name: "Amazon Fresh",
          price: 2.49,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Tomorrow",
          returnPolicy: "3 days return",
          isBestDeal: true,
        },
      ],
      rating: 4,
      reviewCount: 89,
      createdAt: new Date(),
    },
    {
      id: 7,
      name: "Organic Milk (1 Gallon)",
      description: "Fresh organic whole milk",
      category: "Grocery",
      image: "https://images.unsplash.com/photo-1563636619-e9143da7973b",
      platforms: [
        {
          id: "wholefoods",
          name: "Whole Foods",
          price: 5.99,
          codAvailable: false,
          freeDelivery: false,
          deliveryDate: "Today",
          returnPolicy: "Same day return",
          isBestDeal: true,
        },
        {
          id: "walmart",
          name: "Walmart",
          price: 6.49,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Tomorrow",
          returnPolicy: "3 days return",
        },
      ],
      rating: 5,
      reviewCount: 124,
      createdAt: new Date(),
    },
  ];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Prefix all routes with /api
  const apiRouter = app;

  // Search products
  apiRouter.get(
    "/api/products/search",
    asyncHandler(async (req, res) => {
      const query = req.query.query || req.query.q || "";
      const category = req.query.category?.toString();
      
      console.log(`Searching for: "${query}" in category: ${category || "All"}`);
      
      // If we have a valid search query, try to get results from API
      let products: ProductWithPlatforms[] = [];
      
      if (query && RAPID_API_KEY) {
        // Use the real API
        products = await searchProductsFromAPI(query.toString(), category);
        
        // Add a meta field to indicate source of results
        const result = {
          products,
          _meta: {
            source: "rapid_api",
            query,
            category
          }
        };
        
        return res.json(result);
      } else if (query) {
        // For testing without an API key
        products = getMockProducts(category || "Electronics");
        const result = {
          products,
          _meta: {
            source: "mock",
            sample: true,
            query,
            category
          }
        };
        
        return res.json(result);
      } else {
        // If no query, return empty results
        return res.json({ 
          products: [],
          _meta: {
            source: "none",
            reason: "No query provided"
          }
        });
      }
    })
  );

  // Get products by category
  apiRouter.get(
    "/api/products/category/:category",
    asyncHandler(async (req, res) => {
      const { category } = req.params;
      console.log(`Getting products for category: ${category}`);
      
      let products: ProductWithPlatforms[] = [];
      
      // Check which category was requested
      switch (category.toLowerCase()) {
        case "electronics":
          products = getMockProducts("Electronics");
          break;
        case "fashion":
          products = getFashionProducts();
          break;
        case "grocery":
          products = getGroceryProducts();
          break;
        default:
          products = getMockProducts("Electronics");
      }
      
      return res.json({ 
        products,
        _meta: {
          source: "category",
          category
        }
      });
    })
  );

  // Get product details
  apiRouter.get(
    "/api/products/:id",
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      
      console.log(`Getting product details for ID: ${id}`);
      
      if (RAPID_API_KEY) {
        // Try to fetch from API first
        const product = await getProductDetailsFromAPI(id);
        
        if (product) {
          return res.json(product);
        }
      }
      
      // Fallback to mock data
      const allProducts = [
        ...getMockProducts(),
        ...getFashionProducts(),
        ...getGroceryProducts()
      ];
      
      const product = allProducts.find(p => p.id === parseInt(id));
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      return res.json(product);
    })
  );

  // Cart Routes
  
  // Get cart items
  apiRouter.get(
    "/api/cart",
    asyncHandler(async (req, res) => {
      // This would typically use user authentication to get the user's cart
      // For this implementation, we'll return an empty cart or mock data
      return res.json({ cartItems: [] });
    })
  );
  
  // Add to cart
  apiRouter.post(
    "/api/cart",
    asyncHandler(async (req, res) => {
      try {
        const cartItem = insertCartItemSchema.parse(req.body);
        // In a real implementation, we would save this to the database
        
        // For this implementation, we'll return a success message
        return res.status(201).json({
          id: 1,
          ...cartItem,
          createdAt: new Date()
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        throw error;
      }
    })
  );
  
  // Update cart item
  apiRouter.put(
    "/api/cart/:id",
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: "Quantity must be at least 1" });
      }
      
      // In a real implementation, we would update the cart item in the database
      
      return res.json({
        id: parseInt(id),
        quantity,
        productId: 1,
        platformId: "amazon",
        createdAt: new Date()
      });
    })
  );
  
  // Remove from cart
  apiRouter.delete(
    "/api/cart/:id",
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      
      // In a real implementation, we would delete the cart item from the database
      
      return res.status(204).send();
    })
  );
  
  // Clear cart
  apiRouter.delete(
    "/api/cart",
    asyncHandler(async (req, res) => {
      // In a real implementation, we would delete all cart items for the user
      
      return res.status(204).send();
    })
  );

  const httpServer = createServer(app);

  return httpServer;
}
