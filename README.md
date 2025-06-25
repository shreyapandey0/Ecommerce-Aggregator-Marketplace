# Product Aggregation Platform

It is a comprehensive e-commerce marketplace that combines product aggregation with a full seller platform. Like MakeMyTrip for shopping, it aggregates products from major e-commerce sites while also enabling sellers to list their own products. Users can search, compare, purchase from multiple sources, and sellers can manage their complete storefront with integrated payment processing.

## 🌟 Features

### 🔍 Product Discovery & Comparison

- **Multi-Platform Product Search**: Search products across different e-commerce platforms
- **Advanced Filtering**: Filter by category, price range, brand, rating, and delivery options
- **Product Comparison**: Compare up to 3 products side-by-side with preference-based scoring
- **Smart Recommendations**: AI-powered product scoring based on user preferences
- **Real-time Price Comparison**: Compare prices across multiple platforms

### 🛒 Complete E-commerce Experience

- **Shopping Cart**: Full cart management with quantity controls and item removal
- **Secure Checkout**: Complete payment flow with Stripe integration
- **Order Management**: Order history, status tracking, and receipt generation
- **User Authentication**: Secure login system with session management
- **Dummy Payment Processing**: Test complete purchase flows with Stripe test mode

### 👨‍💼 Seller Dashboard (Fully Functional)

🛍 Seller Dashboard: to add, manage, and view products

- Add new products with images, descriptions, and pricing

### 💳 Payment & Order System

- 🛒 Cart and Checkout System

### 🎯 Smart Features

- **User Preferences Engine**: Customizable importance weights for price, delivery, ratings
- **Indian Market Focus**: COD options, local delivery preferences, rupee currency
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **API Integration**: Real product data from major e-commerce platforms

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Payment Processing**: Stripe integration for secure transactions
- **Authentication**: Session-based auth with PostgreSQL session store
- **API Integration**: RapidAPI for live product data
- **State Management**: React Query (TanStack Query) + Context API
- **Routing**: Wouter for client-side navigation
- **Build Tool**: Vite with hot reload

### Project Structure

```
/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── layout/     # Header, footer, hero section
│   │   │   ├── product/    # Product-related components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and API client
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main app component
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # Database interface
│   └── vite.ts            # Vite development setup
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and types
└── package.json           # Project dependencies
```

## 🔧 Key Components

### Product Search System

- **SearchProductsFromAPI**: Fetches products from RapidAPI with category and filter support
- **Product Filtering**: Client-side and server-side filtering by price, brand, rating, delivery options
- **Mock Data Fallback**: Comprehensive sample data when API is unavailable

### Filter System

- **Category Filters**: Electronics, Fashion, Grocery
- **Price Range**: Slider-based price filtering
- **Brand Filters**: Multi-select brand filtering with Indian brands
- **Rating Filters**: Minimum rating selection
- **Delivery Options**: COD, Free Delivery, Express Delivery

## 🚀 🚀 How to Run on Localhost (Step-by-Step)

🔧 Prerequisites
Node.js + npm
Vite
Git

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd folder_name

# Install dependencies (client + server)
npm install
cd client
npm install




# Optional - for live product data
RAPID_API_KEY=your_rapidapi_key_here
```

### Step 4: Start Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Complete Feature Testing

1. **Browse Products**: Search and filter products from multiple platforms
2. **Register as Seller**: Click "Become a Seller" to access seller dashboard
3. **Add Products**: Create new products with images and pricing
4. **Shop & Purchase**: Add items to cart and complete checkout
5. **Manage Orders**: View order history and seller order fulfillment

## 🔑 API Integration

### RapidAPI Setup (Optional)

1. Sign up at [RapidAPI](https://rapidapi.com/)
2. Subscribe to the "Real Time Product Search" API
3. Copy your API key to the `.env` file as `RAPID_API_KEY`

## 🛠️ Development Features

### Error Handling

- API rate limit detection and fallback to mock data
- Graceful error handling with user-friendly messages
- Network error resilience

### Performance Optimizations

- React Query for efficient data fetching and caching
- Debounced search input
- Lazy loading of product images

### Responsive Design

- Mobile-first approach
- Tablet and desktop optimized layouts
- Touch-friendly interface elements

### Environment Variables

```bash
NODE_ENV=production
DATABASE_URL=your_production_database_url
RAPID_API_KEY=your_production_api_key
PORT=5000
```

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**

- Ensure PostgreSQL is running
- Check DATABASE_URL format
- The app works without database using in-memory storage

**API Rate Limit**

- The app automatically falls back to sample data for demonstration
- For production use with live data, upgrade your RapidAPI plan

**Port Already in Use**

- Change PORT in .env file
- Kill existing processes on port 5000

### Support

For issues and questions, please create an issue in the repository.
