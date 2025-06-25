import { client } from "./storage";
import postgres from "postgres";
import "dotenv/config";
// Using client imported from storage.ts, no need for duplicate postgres connection
export async function insertSampleProducts() {
  try {
    // First check if products already exist before inserting - FIXED QUERY
    const existingProducts = await client`
      SELECT COUNT(*) as count FROM seller_products 
      WHERE name LIKE 'DealAxe%'
    `;
    // If products already exist, skip insertion
    if (parseInt(existingProducts[0].count) > 0) {
      console.log("Sample products already exist, skipping insertion");
      return;
    }

    // Rest of your insertion code remains the same
    // First check if seller exists using raw SQL
    const sellers = await client`SELECT * FROM sellers WHERE id = 1`;
    // If seller doesn't exist, create it
    if (sellers.length === 0) {
      await client`
        INSERT INTO sellers (id, user_id, store_name, description, contact)
        VALUES (1, 1, 'DealAxe Store', 'Official DealAxe seller', 'contact@dealaxe.com')
        ON CONFLICT (id) DO NOTHING
      `;
    }

    const sampleProducts = [
      // Electronics
      {
        name: "DealAxe Pro Wireless Earbuds",
        description: "Premium wireless earbuds with noise cancellation",
        category: "electronics", // Changed to lowercase to match API
        price: 79.99,
        stock: 50,
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df",
        seller_id: 1,
      },
      {
        name: "DealAxe Smart Watch X1",
        description: "Advanced fitness tracking and notifications",
        category: "electronics", // Changed to lowercase
        price: 129.99,
        stock: 30,
        image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a",
        seller_id: 1,
      },

      // Fashion
      {
        name: "DealAxe Classic Denim Jacket",
        description: "Timeless style with modern comfort",
        category: "fashion", // Changed to lowercase
        price: 59.99,
        stock: 100,
        image: "https://images.unsplash.com/photo-1601933973783-43cf8a7d4c5f",
        seller_id: 1,
      },
      {
        name: "DealAxe Premium Sneakers",
        description: "Comfortable everyday sneakers",
        category: "fashion", // Changed to lowercase
        price: 89.99,
        stock: 75,
        image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86",
        seller_id: 1,
      },

      // Grocery
      {
        name: "DealAxe Organic Trail Mix",
        description: "Healthy mix of nuts and dried fruits",
        category: "grocery", // Changed to lowercase
        price: 12.99,
        stock: 200,
        image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32",
        seller_id: 1,
      },
      {
        name: "DealAxe Premium Coffee Beans",
        description: "Freshly roasted Arabica coffee beans",
        category: "grocery", // Changed to lowercase
        price: 19.99,
        stock: 150,
        image: "https://images.unsplash.com/photo-1587734361993-0275015fe533",
        seller_id: 1,
      },
    ];

    // Use raw SQL for insertion with explicit primary key conflict handling
    for (const product of sampleProducts) {
      try {
        await client`
          INSERT INTO seller_products 
          (seller_id, name, description, category, price, stock, image)
          VALUES 
          (${product.seller_id}, ${product.name}, ${product.description}, 
           ${product.category}, ${product.price}, ${product.stock}, ${product.image})
          ON CONFLICT (name) DO NOTHING
        `;
      } catch (insertError) {
        console.log(`Skipping product ${product.name}: ${insertError.message}`);
      }
    }
    console.log("Sample products inserted successfully");
  } catch (error) {
    console.error("Error inserting sample products:", error);
  }
}
