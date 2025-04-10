import type { Express, Request, Response } from "express";
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
const asyncHandler = (fn: Function) => (req: Request, res: Response) => {
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
          deliveryDate: "Aug 27",
          returnPolicy: "7 days replacement",
        },
        {
          id: "flipkart",
          name: "Flipkart",
          price: 789.99,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Aug 27",
          returnPolicy: "7 days replacement",
        },
        {
          id: "bestbuy",
          name: "BestBuy",
          price: 749.99,
          codAvailable: false,
          freeDelivery: true,
          deliveryDate: "Aug 27",
          returnPolicy: "7 days replacement",
          isBestDeal: true,
        },
      ],
      rating: 4,
      reviewCount: 218,
      createdAt: new Date(),
    },
    {
      id: 3,
      name: "Apple iPhone 14 Pro",
      description: "Apple's premium smartphone with innovative features",
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1509741102003-ca64bfe5f069",
      platforms: [
        {
          id: "amazon",
          name: "Amazon",
          price: 999.0,
          codAvailable: true,
          freeDelivery: true,
          deliveryDate: "Next day delivery",
          returnPolicy: "14 days replacement",
          isBestDeal: true,
        },
        {
          id: "flipkart",
          name: "Flipkart",
          price: 1029.99,
          codAvailable: true,
          freeDelivery: true,
          deliveryDate: "Next day delivery",
          returnPolicy: "14 days replacement",
        },
        {
          id: "bestbuy",
          name: "BestBuy",
          price: 1049.99,
          codAvailable: true,
          freeDelivery: true,
          deliveryDate: "Next day delivery",
          returnPolicy: "14 days replacement",
        },
      ],
      rating: 5,
      reviewCount: 856,
      createdAt: new Date(),
    },
  ];

  return products.filter((p) => p.category === category || category === "all");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  // Environment check endpoint (this helps debugging)
  app.get("/api/check-environment", (req: Request, res: Response) => {
    const hasRapidApiKey = !!process.env.RAPID_API_KEY;
    const hasDatabaseUrl = !!process.env.DATABASE_URL;

    res.json({
      environment: process.env.NODE_ENV || "development",
      rapidApiKey: hasRapidApiKey ? "Present" : "Missing",
      databaseUrl: hasDatabaseUrl ? "Present" : "Missing",
      message: hasRapidApiKey
        ? "Ready to search with RapidAPI"
        : "RapidAPI key is missing - API searches will fail",
    });
  });

  // Common product search handler for both singular and plural routes
  const handleProductSearch = async (req: Request, res: Response) => {
    // Accept both 'query' and 'q' parameters to handle different client implementations
    const query = (req.query.query as string) || (req.query.q as string) || "";
    const category = req.query.category as string;

    // For debugging
    console.log("Search request received:", {
      query,
      category,
      params: req.query,
    });

    // Parse filters from request params
    const filters: SearchFilters = {};

    if (req.query.minPrice && req.query.maxPrice) {
      filters.priceRange = [
        parseFloat(req.query.minPrice as string),
        parseFloat(req.query.maxPrice as string),
      ];
    }

    if (req.query.brands) {
      filters.brands = (req.query.brands as string).split(",");
    }

    if (
      req.query.codAvailable === "true" ||
      req.query.freeDelivery === "true" ||
      req.query.expressDelivery === "true"
    ) {
      filters.deliveryOptions = {
        codAvailable: req.query.codAvailable === "true",
        freeDelivery: req.query.freeDelivery === "true",
        expressDelivery: req.query.expressDelivery === "true",
      };
    }

    if (req.query.rating) {
      filters.rating = parseInt(req.query.rating as string);
    }

    try {
      // For real search with API, prioritize RapidAPI only if query is provided
      if (query.trim()) {
        console.log("Attempting RapidAPI search...");
        try {
          // Verify API key is present
          if (!RAPID_API_KEY) {
            console.error("RAPID_API_KEY is missing!");
            throw new Error("API key not configured");
          }
          // Log API key status for debugging (don't log the actual key)
          console.log(
            "RAPID_API_KEY status:",
            RAPID_API_KEY ? "Present (using for search)" : "Missing"
          );
          console.log(
            "Attempting to fetch products from RapidAPI with query:",
            query
          );

          // Validate API key before attempting request
          if (!RAPID_API_KEY) {
            throw new Error("RAPID_API_KEY is missing. Cannot perform search.");
          }

          const products = await searchProductsFromAPI(query, category);

          if (products && products.length > 0) {
            console.log(`API Success: ${products.length} products`);
            // Add debug info to response
            return res.json({
              products,
              filters,
              _meta: {
                source: "rapidapi",
                count: products.length,
                sample:
                  products.length > 0
                    ? {
                        name: products[0].name,
                        price: products[0].platforms[0]?.price,
                        store: products[0].platforms[0]?.name,
                      }
                    : null,
              },
            });
          } else {
            console.log(
              "No products found from RapidAPI, falling back to database"
            );
          }
        } catch (apiError) {
          console.error("Error fetching from API:", apiError);
          console.error(
            "Error details:",
            apiError instanceof Error ? apiError.message : "Unknown error"
          );
        }
      } else {
        console.log("No search query provided, skipping API search");
      }

      // Fallback to database
      console.log("Attempting to fetch products from database");
      try {
        const products = await storage.searchProducts(query, {
          ...filters,
          category,
        });

        // If still no products and not in production, use mock data as final fallback
        if (products.length === 0 && process.env.NODE_ENV !== "production") {
          console.log("No products found in database, using mock data");
          const mockProducts = getMockProducts(category);
          return res.json({ products: mockProducts, filters });
        }

        console.log(`Returning ${products.length} products from database`);
        res.json({ products, filters });
      } catch (dbError) {
        console.error("Database error when searching products:", dbError);
        // Use mock data as final fallback
        console.log("Database error, using mock data");
        const mockProducts = getMockProducts(category);
        return res.json({ products: mockProducts, filters });
      }
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  };

  // Register both singular and plural routes for product search
  app.get("/api/products/search", asyncHandler(handleProductSearch));
  app.get("/api/product/search", asyncHandler(handleProductSearch)); // Add singular endpoint for backward compatibility

  // Get products by category
  app.get(
    "/api/products/category/:category",
    asyncHandler(async (req: Request, res: Response) => {
      const category = req.params.category;

      try {
        let products: ProductWithPlatforms[] = [];

        try {
          // First try to get products from the database
          products = await storage.getProductsByCategory(category, {});
        } catch (dbError) {
          console.error(
            "Database error when fetching category products:",
            dbError
          );
          // Continue to fallback
        }

        // If no products found in database or there was a database error, use mock data as fallback
        if (products.length === 0) {
          console.log(`Using mock data for category: ${category}`);
          products = getMockProducts(category);
        }

        res.json({ products });
      } catch (error) {
        console.error("Error getting products by category:", error);
        // Even if there's an error, return mock data instead of 500 error
        const mockProducts = getMockProducts(category);
        res.json({ products: mockProducts });
      }
    })
  );

  // Get product by ID
  app.get(
    "/api/products/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const id = parseInt(req.params.id);

      try {
        // First try to get the product from database storage
        let product: ProductWithPlatforms | undefined | null = null;
        try {
          product = await storage.getProduct(id);
        } catch (dbError) {
          console.error("Database error when fetching product:", dbError);
        }

        // If product not found in database, try to get it from RapidAPI
        if (!product && RAPID_API_KEY) {
          try {
            // Get product_id from query param if available (for RapidAPI product_id format)
            const rapidApiProductId = req.query.product_id as string;
            if (rapidApiProductId) {
              console.log(
                "Attempting to fetch product details from RapidAPI with ID:",
                rapidApiProductId
              );
              product = await getProductDetailsFromAPI(rapidApiProductId);

              if (product) {
                // Override ID to match request
                product.id = id;
                return res.json(product);
              }
            } else {
              console.log("No RapidAPI product_id provided in query params");
            }
          } catch (apiError) {
            console.error("Error fetching product from API:", apiError);
          }
        }

        // If still not found, check mock data
        if (!product) {
          // If not found in storage, try to get from mock data for demo purposes
          const mockProducts = getMockProducts("all");
          const mockProduct = mockProducts.find((p) => p.id === id);

          if (mockProduct) {
            return res.json(mockProduct);
          } else {
            return res.status(404).json({ error: "Product not found" });
          }
          return;
        }

        res.json(product);
      } catch (error) {
        console.error("Error getting product:", error);
        res.status(500).json({ error: "Failed to get product" });
      }
    })
  );

  // New endpoint to get product details from RapidAPI by product_id
  app.get(
    "/api/product-details",
    asyncHandler(async (req: Request, res: Response) => {
      const productId = req.query.product_id as string;

      if (!productId) {
        return res.status(400).json({ error: "product_id is required" });
      }

      try {
        // Validate API key before attempting request
        if (!RAPID_API_KEY) {
          return res.status(500).json({
            error: "RAPID_API_KEY is missing. Cannot fetch product details.",
            message:
              "Please add the RAPID_API_KEY to your environment variables.",
          });
        }

        console.log("Attempting to fetch product details with ID:", productId);
        const product = await getProductDetailsFromAPI(productId);

        if (!product) {
          return res
            .status(404)
            .json({ error: "Product not found or API error" });
        }

        res.json(product);
      } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).json({ error: "Failed to fetch product details" });
      }
    })
  );
  // Cart operations
  app.get(
    "/api/cart",
    asyncHandler(async (req: Request, res: Response) => {
      // Using a mock user ID for demo purposes
      const userId = 1;

      try {
        try {
          const cartItems = await storage.getCartItems(userId);
          res.json({ cartItems });
        } catch (dbError) {
          console.error("Database error when fetching cart items:", dbError);
          // Return empty cart instead of error
          res.json({ cartItems: [] });
        }
      } catch (error) {
        console.error("Error getting cart items:", error);
        // Return empty cart instead of error
        res.json({ cartItems: [] });
      }
    })
  );

  app.post(
    "/api/cart",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        // Validate request body
        const parsedData = insertCartItemSchema.parse(req.body);

        const cartItem = await storage.addToCart(parsedData);
        res.status(201).json(cartItem);
      } catch (error) {
        if (error instanceof z.ZodError) {
          res
            .status(400)
            .json({ error: "Invalid cart item data", details: error.errors });
        } else {
          console.error("Error adding to cart:", error);
          res.status(500).json({ error: "Failed to add to cart" });
        }
      }
    })
  );

  app.put(
    "/api/cart/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;

      try {
        const updatedCartItem = await storage.updateCartItem(id, quantity);

        if (!updatedCartItem) {
          res.status(404).json({ error: "Cart item not found" });
          return;
        }

        res.json(updatedCartItem);
      } catch (error) {
        console.error("Error updating cart item:", error);
        res.status(500).json({ error: "Failed to update cart item" });
      }
    })
  );

  app.delete(
    "/api/cart/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const id = parseInt(req.params.id);

      try {
        const success = await storage.removeFromCart(id);

        if (!success) {
          res.status(404).json({ error: "Cart item not found" });
          return;
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ error: "Failed to remove from cart" });
      }
    })
  );

  app.delete(
    "/api/cart",
    asyncHandler(async (req: Request, res: Response) => {
      // Using a mock user ID for demo purposes
      const userId = 1;

      try {
        await storage.clearCart(userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ error: "Failed to clear cart" });
      }
    })
  );

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
