// ✅ VALID - place this at the very top of routes.ts
// Top of server/routes.ts
import express from "express";
import type { Express, Request, Response } from "express"; // ✅ Correct place
// ✅ At the top of the file
import type { ProductWithPlatforms, Platform } from "@shared/schema";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url"; // Add this line
import { v4 as uuidv4 } from "uuid";
import { createServer, type Server } from "http";
import { db, client } from "./storage"; // Add client import
import axios from "axios";
import { z } from "zod";
import { SearchFilters, insertCartItemSchema } from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.resolve(__dirname, "public");

// Parse and validate the RAPID_API_KEY environment variable
// For development, use the hardcoded key if environment variable is not available
const RAPID_API_KEY =
  process.env.RAPID_API_KEY ||
  "d8a30eb275mshec2cfe16116a9d6p13dbd2jsn56b3c356acc3";
console.log("RAPID_API_KEY exists:", !!RAPID_API_KEY);
console.log(
  "RAPID_API_KEY value (first few chars):",
  RAPID_API_KEY.substring(0, 5) + "..."
);
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
const asyncHandler =
  (
    fn: (
      req: import("express").Request,
      res: import("express").Response
    ) => Promise<void>
  ) =>
  (req: import("express").Request, res: import("express").Response) => {
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
        country: "in", // Changed to India
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
        originalPrice: originalPrice !== undefined ? originalPrice : null,
        codAvailable: false,
        freeDelivery: false,
        deliveryDate: "Standard delivery",
        returnPolicy: "10days return",
        isBestDeal: false,
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
// Function to search products via Rapid API
async function searchProductsFromAPI(
  query: string,
  filters?: SearchFilters
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
      category?: string;
      min_price?: string;
      max_price?: string;
    }

    // Using the real-time-product-search API from RapidAPI
    const options = {
      method: "GET",
      url: "https://real-time-product-search.p.rapidapi.com/search",
      params: {
        q: query,
        country: "in", // Changed to India
        language: "en",
        page: "1",
        limit: "20",
        sort_by: "BEST_MATCH",
        product_condition: "ANY",
        min_rating: "ANY",
      } as SearchParams,
      headers: {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": "real-time-product-search.p.rapidapi.com",
      },
    };

    // Add category filter if provided
    if (filters?.category) {
      // Convert general category names to API specific categories
      switch (filters.category.toLowerCase()) {
        case "electronics":
          options.params.category = "Electronics";
          break;
        case "fashion":
        case "clothing":
          options.params.category = "Apparel";
          break;
        case "grocery":
          options.params.category = "Grocery";
          break;
        case "beauty":
          options.params.category = "Beauty";
          break;
        default:
          // Use the category as provided
          options.params.category = filters.category;
      }
    }

    // Apply rating filter if provided
    if (filters?.rating) {
      options.params.min_rating = filters.rating.toString();
    }

    // Apply price range filter if provided
    if (
      filters?.priceRange &&
      Array.isArray(filters.priceRange) &&
      filters.priceRange.length === 2
    ) {
      // No currency conversion - everything is in INR now
      if (filters.priceRange[0] > 0) {
        options.params.min_price = filters.priceRange[0].toString();
      }

      if (filters.priceRange[1] < 100000) {
        options.params.max_price = filters.priceRange[1].toString();
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
    let products = response.data.data.products.map(
      (item: any, index: number) => {
        // Process offer data into platform structure
        const platforms: Platform[] = [];

        // Extract price - prioritize offer price if available
        let itemPrice = 0;
        let originalPrice = 0;

        // First try to get price from offer
        if (item.offer?.price) {
          itemPrice = parseFloat(item.offer.price.replace(/[^\d.]/g, ""));
          originalPrice = itemPrice;
        }

        // Fallback to typical_price_range if no offer price
        if (itemPrice === 0 && item.typical_price_range?.length > 0) {
          itemPrice = parseFloat(
            item.typical_price_range[0].replace(/[^\d.]/g, "")
          );
          if (item.typical_price_range.length > 1) {
            originalPrice = parseFloat(
              item.typical_price_range[1].replace(/[^\d.]/g, "")
            );
          }
        }

        // Final fallback if no prices found
        if (itemPrice === 0) {
          itemPrice = 8350; // ₹8,350 as fallback price
          originalPrice = 8350;
        }

        // Add platform information
        if (item.offer) {
          platforms.push({
            id:
              item.offer.store_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
              "store",
            name: item.offer.store_name || "Store",
            price: itemPrice,
            originalPrice:
              originalPrice > itemPrice ? originalPrice : undefined,
            codAvailable: item.offer?.payment_options?.includes("COD") || false,
            freeDelivery:
              item.offer.shipping?.toLowerCase().includes("free") || false,
            deliveryDate: item.offer.shipping || "Standard delivery",
            returnPolicy: "10 days return",
            isBestDeal: false,
          });
        } else {
          platforms.push({
            id: "online",
            name: "Online Store",
            price: itemPrice,
            originalPrice:
              originalPrice > itemPrice ? originalPrice : undefined,
            codAvailable: false,
            freeDelivery: false,
            deliveryDate: "Standard delivery",
            returnPolicy: "10 days return",
            isBestDeal: false,
          });
        }

        return {
          id: index + 1,
          name: item.product_title || "Unknown Product",
          description: item.product_description || "No description available",
          category:
            filters?.category ||
            item.product_attributes?.Category ||
            "Electronics",
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
      }
    );

    // Apply additional client-side filtering for filters not supported by the API

    if (filters?.brands && filters.brands.length > 0) {
      products = products.filter((product) => {
        const productText = (
          product.name +
          " " +
          product.description
        ).toLowerCase();
        return filters.brands!.some((brand) =>
          productText.includes(brand.toLowerCase())
        );
      });
    }
    // After brand filtering in searchProductsFromAPI
    // Add client-side price range filtering as backup
    if (
      filters?.priceRange &&
      Array.isArray(filters.priceRange) &&
      filters.priceRange.length === 2
    ) {
      const minPrice = filters.priceRange[0];
      const maxPrice = filters.priceRange[1];

      // Only apply client-side filtering if we have valid price ranges
      if (minPrice > 0 || maxPrice < 100000) {
        console.log(
          `Applying client-side price filter: ${minPrice} - ${maxPrice}`
        );

        products = products.filter((product) => {
          // Get the lowest price from any platform
          const productPrice = Math.min(
            ...product.platforms.map((p) => p.price)
          );

          // Apply both min and max filters
          return (
            (minPrice <= 0 || productPrice >= minPrice) &&
            (maxPrice >= 100000 || productPrice <= maxPrice)
          );
        });

        console.log(
          `After price filtering: ${products.length} products remain`
        );
      }
    }
    // Filter by delivery options
    if (filters?.deliveryOptions) {
      if (filters.deliveryOptions.codAvailable) {
        products = products.filter((product) =>
          product.platforms.some((p) => p.codAvailable)
        );
      }
      if (filters.deliveryOptions.freeDelivery) {
        products = products.filter((product) =>
          product.platforms.some((p) => p.freeDelivery)
        );
      }
      // Handle express delivery if you have this data
      if (filters.deliveryOptions.expressDelivery) {
        products = products.filter((product) =>
          product.platforms.some((p) =>
            p.deliveryDate?.toLowerCase().includes("express")
          )
        );
      }
    }

    return products;
  } catch (error) {
    console.error("Error fetching products from API:", error);
    if (axios.isAxiosError(error)) {
      console.error("API Error Response:", error.response?.data);
      console.error("API Error Status:", error.response?.status);
    }
    return [];
  }
}
// Function to get mock products when API key isn't available
function getMockProducts(
  category: string = "electronics"
): ProductWithPlatforms[] {
  // Convert category to lowercase for case-insensitive comparison
  category = category.toLowerCase();

  const allProducts: ProductWithPlatforms[] = [
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

  // Filter products by lowercase category for case-insensitive matching
  return allProducts.filter(
    (product) => product.category.toLowerCase() === category
  );
}
export function registerRoutes(app: Express): Server {
  // Create and return HTTP server
  const server = createServer(app);
  // Route to search products with Rapid API
  // Keep this API endpoint exactly as it is
  // In setupRoutes function
  app.get(
    "/api/products/search",
    asyncHandler(async (req, res) => {
      const query = req.query.query as string;

      // Extract filters from query parameters
      const filters: SearchFilters = {};

      if (req.query.category) {
        filters.category = req.query.category as string;
      }

      if (req.query.rating) {
        filters.rating = Number(req.query.rating);
      }

      if (req.query.priceRange) {
        try {
          filters.priceRange = JSON.parse(req.query.priceRange as string);
        } catch (e) {
          console.error("Invalid priceRange parameter:", req.query.priceRange);
        }
      }

      if (req.query.brands) {
        try {
          filters.brands = JSON.parse(req.query.brands as string);
        } catch (e) {
          console.error("Invalid brands parameter:", req.query.brands);
        }
      }

      if (req.query.deliveryOptions) {
        try {
          filters.deliveryOptions = JSON.parse(
            req.query.deliveryOptions as string
          );
        } catch (e) {
          console.error(
            "Invalid deliveryOptions parameter:",
            req.query.deliveryOptions
          );
        }
      }

      // Get products with the filters applied
      let products = [];

      try {
        products = await searchProductsFromAPI(query, filters);
        console.log(
          `Found ${products.length} products matching query "${query}" with filters`
        );
      } catch (error) {
        console.error("Failed to fetch products from API:", error);

        // Fallback to mock products if API request fails
        products = getMockProducts(filters.category);
        return res.json({
          products,
          _meta: { source: "mock", reason: "API request failed" },
        });
      }

      return res.json({ products });
    })
  );
  // Route to get product details
  app.get(
    "/api/products/:id",
    asyncHandler(async (req, res) => {
      const productId = Number(req.params.id);
      console.log("Getting product details for ID:", productId);

      try {
        // Check if this is one of our seller products (ID > 1000)
        if (productId >= 1000) {
          // This is a seller product - fetch from database
          const dbProductId = productId - 1000; // Remove the offset we added
          const sellerProductResult = await client`
            SELECT * FROM seller_products WHERE id = ${dbProductId}
          `;

          if (sellerProductResult && sellerProductResult.length > 0) {
            // Convert to ProductWithPlatforms format
            const sellerProduct = sellerProductResult[0];
            const product = {
              id: productId, // Keep the offset ID for consistency
              name: sellerProduct.name,
              description:
                sellerProduct.description || "No description available",
              category: sellerProduct.category,
              image: sellerProduct.image || "https://via.placeholder.com/300",
              platforms: [
                {
                  id: "dealaxe-store",
                  name: "DealAxe Store",
                  price: Number(sellerProduct.price),
                  originalPrice: null,
                  codAvailable: true,
                  freeDelivery: true,
                  deliveryDate: "3-5 business days",
                  returnPolicy: "30 days replacement",
                  isBestDeal: true,
                },
              ],
              rating: 4,
              reviewCount: 10,
              createdAt: sellerProduct.created_at || new Date(),
            };

            return res.json(product);
          }
        }

        // If not found in our database or it's a regular product, try API
        const apiProduct = await getProductDetailsFromAPI(productId.toString());
        if (apiProduct) {
          return res.json(apiProduct);
        }

        // If all else fails, return 404
        res.status(404).json({ error: "Product not found" });
      } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).json({ error: "Failed to fetch product details" });
      }
    })
  );
  // Route to get products by category
  app.get(
    "/api/products/category/:category",
    asyncHandler(async (req, res) => {
      const category = req.params.category.toLowerCase(); // Make lowercase for consistent matching
      console.log("Getting products for category:", category);

      try {
        // Get mock products filtered by category
        const mockProducts = getMockProducts(category);
        console.log(
          `Found ${mockProducts.length} mock products for category ${category}`
        );

        // Get seller products using raw SQL query - ensure lowercase comparison
        const sellerProductsResults = await client`
        SELECT * FROM seller_products 
        WHERE LOWER(category) = ${category}
      `;

        console.log(
          `Found ${sellerProductsResults.length} seller products for category ${category}`
        );
        if (sellerProductsResults.length > 0) {
          console.log(
            "First seller product sample:",
            sellerProductsResults[0].name
          );
        }

        // Convert seller products to the ProductWithPlatforms format
        const sellerProducts = sellerProductsResults.map((product: any) => ({
          id: 1000 + parseInt(product.id), // Add offset to avoid ID conflicts, ensure it's a number
          name: product.name,
          description: product.description || "No description available",
          category: product.category,
          image: product.image || "https://via.placeholder.com/300",
          platforms: [
            {
              id: "dealaxe-store",
              name: "DealAxe Store",
              price: parseFloat(product.price),
              originalPrice: null,
              codAvailable: true,
              freeDelivery: true,
              deliveryDate: "3-5 business days",
              returnPolicy: "30 days replacement",
              isBestDeal: true,
            },
          ],
          rating: 4,
          reviewCount: 10,
          createdAt: product.created_at || new Date(),
        }));

        // Log some output for debugging
        console.log(`Converted ${sellerProducts.length} seller products`);
        if (sellerProducts.length > 0) {
          console.log(
            "First seller product sample after conversion:",
            sellerProducts[0].name,
            sellerProducts[0].id
          );
        }

        // Combine both sets of products
        const combinedProducts = [...mockProducts, ...sellerProducts];
        // Create a Set of unique product names to deduplicate
        const uniqueProductNames = new Set();
        const uniqueProducts = combinedProducts.filter((product) => {
          // If we've seen this product name before, filter it out
          if (uniqueProductNames.has(product.name)) {
            return false;
          }
          // Otherwise add it to our set and keep it
          uniqueProductNames.add(product.name);
          return true;
        });
        console.log(
          `Returning ${uniqueProducts.length} unique products for category ${category}`
        );

        res.json({
          products: uniqueProducts,
          _meta: {
            source: "combined",
            count: uniqueProducts.length,
            mockCount: mockProducts.length,
            sellerCount: sellerProducts.length,
          },
        });
      } catch (error) {
        console.error("Error in category products:", error);
        // Return error response
        res.status(500).json({
          error: "Failed to fetch products",
          message: error.message,
        });
      }
    })
  );
  // Route to get cart items
  app.get(
    "/api/cart",
    asyncHandler(async (req, res) => {
      try {
        // This would normally validate a user session and retrieve their cart
        // For demo purposes, return mock cart data
        res.json({
          items: [],
          total: 0,
        });
      } catch (error) {
        console.error("Error getting cart:", error);
        res.status(500).json({ error: "Failed to get cart" });
      }
    })
  );
  // Route to add item to cart
  app.post(
    "/api/cart",
    asyncHandler(async (req, res) => {
      try {
        // Validate request body against schema
        const cartItemData = insertCartItemSchema.parse(req.body);
        console.log("Adding item to cart:", cartItemData);
        // In a real app, we would validate the user session and save to database
        // For now, just return success response
        res.status(201).json({
          message: "Item added to cart",
          item: cartItemData,
        });
      } catch (error) {
        console.error("Error adding to cart:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to add item to cart" });
      }
    })
  );
  // In routes.ts - Update the seller products endpoint:
  app.get(
    "/api/sellers/products",
    asyncHandler(async (req, res) => {
      try {
        // Exclude sample products by ID range or by adding a flag column
        const products = await client`
      SELECT * FROM seller_products
      WHERE id > 10  -- Assuming sample product IDs are < 10
      ORDER BY id DESC
    `;
        res.json(products);
      } catch (error) {
        console.error("Error fetching seller products:", error);
        res.status(500).json({ error: "Failed to fetch seller products" });
      }
    })
  );

  app.post(
    "/api/sellers/products",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const product: {
          sellerId?: number;
          name: string;
          description?: string;
          category: string;
          price: string | number;
          stock?: string | number;
          image?: string;
        } = req.body;

        // Validate the product has required fields
        if (!product.name || !product.category || !product.price) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Ensure image URL is valid
        const imageUrl = product.image || "https://via.placeholder.com/400x300";

        console.log("Adding seller product:", {
          ...product,
          image: imageUrl,
        });

        // Insert product with validated image URL
        const result = await client`
      INSERT INTO seller_products 
      (seller_id, name, description, category, price, stock, image)
      VALUES 
      (${product.sellerId || 1}, ${product.name}, ${product.description || ""}, 
       ${product.category.toLowerCase()}, ${parseFloat(
          product.price.toString()
        )}, ${parseInt(product.stock?.toString() || "0")}, ${imageUrl})
      RETURNING *
    `;

        if (result && result.length > 0) {
          console.log("Product added successfully:", result[0]);
          res.status(201).json(result[0]);
        } else {
          throw new Error("Failed to add product");
        }
      } catch (error) {
        console.error("Error adding seller product:", error);
        res.status(500).json({ error: "Failed to add product" });
      }
    })
  );
  // Add a mock upload endpoint if you don't have one
  // Add this to your routes.ts file
  app.post(
    "/api/upload",
    asyncHandler(async (req, res) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return res.status(400).json({ error: "No files were uploaded." });
        }

        // The name of the input field is used to retrieve the uploaded file
        const uploadedFile = req.files.image;

        // If it's not an array, make it one
        const files = Array.isArray(uploadedFile)
          ? uploadedFile
          : [uploadedFile];
        const file = files[0];

        // Generate a unique filename
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000);
        const filename = `${timestamp}_${randomNum}${path.extname(file.name)}`;

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Move the file to the uploads directory
        const uploadPath = path.join(uploadsDir, filename);
        await file.mv(uploadPath);

        // Generate the URL for the uploaded file
        const fileUrl = `/uploads/${filename}`;

        console.log("File uploaded successfully:", fileUrl);
        res.json({ url: fileUrl });
      } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    })
  );
  return server;
}
