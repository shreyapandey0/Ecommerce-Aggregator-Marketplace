import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
const SellerDashboard = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState([]);
  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/sellers/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  // Handle file input changes
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  // Upload the image
  const uploadImage = async () => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      const data = await response.json();
      setUploading(false);
      return data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploading(false);
      return null;
    }
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Upload the image first
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
          return;
        }
      }
      // Submit the product with the image URL
      const response = await fetch("/api/sellers/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          image: imageUrl,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to add product");
      }

      // Get the new product from the response
      const newProduct = await response.json();

      // Update the products list
      setProducts([newProduct, ...products]);

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      // Reset the form
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        stock: "",
        image: "",
      });
      setImageFile(null);
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Product Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Product</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="block mb-2">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-2">Category</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="grocery">Grocery</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Price (₹)</label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block mb-2">Stock</label>
              <Input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full"
              />
              {imageFile && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {uploading ? "Uploading..." : "Add Product"}
            </button>
          </form>
        </div>

        {/* Product List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Products</h2>
          <div className="space-y-4">
            {products.length === 0 ? (
              <p className="text-gray-500">No products added yet</p>
            ) : (
              products.map((product: any) => (
                <div key={product.id} className="border p-4 rounded">
                  <div className="flex items-start space-x-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-600">
                        {product.description}
                      </p>
                      <p className="text-sm">Price: ₹{product.price}</p>
                      <p className="text-sm">Stock: {product.stock}</p>
                      <p className="text-sm">Category: {product.category}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SellerDashboard;
