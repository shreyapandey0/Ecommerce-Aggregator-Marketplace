import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Function to get relative time string
export function getRelativeTime(date: string | Date) {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHr > 0) {
    return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
}

// Determine delivery date estimate
export function getDeliveryDateEstimate(days: number = 3) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Create theme helper
export function createTheme(theme: Record<string, any>) {
  // Convert theme object to CSS variables
  const root = document.documentElement;

  // Process primary color
  if (theme.primary) {
    root.style.setProperty("--primary", toHslValues(theme.primary.DEFAULT));
    root.style.setProperty(
      "--primary-foreground",
      toHslValues(theme.primary.foreground)
    );
  }

  // Process secondary color
  if (theme.secondary) {
    root.style.setProperty("--secondary", toHslValues(theme.secondary.DEFAULT));
    root.style.setProperty(
      "--secondary-foreground",
      toHslValues(theme.secondary.foreground)
    );
  }

  // Process accent color
  if (theme.accent) {
    root.style.setProperty("--accent", toHslValues(theme.accent.DEFAULT));
    root.style.setProperty(
      "--accent-foreground",
      toHslValues(theme.accent.foreground)
    );
  }

  // Process background
  if (theme.background) {
    root.style.setProperty("--background", toHslValues(theme.background));
  }

  // Process card
  if (theme.card) {
    root.style.setProperty("--card", toHslValues(theme.card.DEFAULT));
    root.style.setProperty(
      "--card-foreground",
      toHslValues(theme.card.foreground)
    );
  }

  // Add more theme variables as needed
}

// Helper to convert hex or string colors to HSL values
function toHslValues(color: string): string {
  // For this simple implementation, we'll just return the color
  // In a real app, you'd convert hex/rgb to hsl values
  return color.startsWith("hsl")
    ? color.replace("hsl(", "").replace(")", "")
    : color;
}
