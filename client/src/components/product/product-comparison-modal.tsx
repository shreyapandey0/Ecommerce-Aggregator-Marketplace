import React, { useState, useEffect } from "react";
import { Award, CheckCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/context/product-context";
import { formatPrice } from "@/lib/utils";
import { UserPreferences, defaultPreferences } from "@/context/product-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const ProductComparisonModal: React.FC = () => {
  const {
    compareProducts,
    compareModalOpen,
    closeCompareModal,
    clearCompare,
    userPreferences,
    setUserPreferences,
    getRecommendedProduct,
    getProductScore,
  } = useProduct();

  // Filter for only selected products
  const selectedProducts = compareProducts.filter((p) => p.selected);

  // State for local user preferences (before saving to context)
  const [localPreferences, setLocalPreferences] =
    useState<UserPreferences>(userPreferences);

  // Reset local preferences when modal opens
  useEffect(() => {
    if (compareModalOpen) {
      setLocalPreferences(userPreferences);
    }
  }, [compareModalOpen, userPreferences]);

  // Save preferences to context
  const savePreferences = () => {
    setUserPreferences(localPreferences);
  };

  // Reset preferences to defaults
  const resetPreferences = () => {
    setLocalPreferences(defaultPreferences);
  };

  // Get the recommended product ID
  const recommendedProductId = getRecommendedProduct(selectedProducts);

  // Calculate scores for each product for the progress bars
  const productScores = selectedProducts.map((product) => ({
    id: product.id,
    score: getProductScore(product),
    isRecommended: product.id === recommendedProductId,
  }));

  // Find max score for normalization
  const maxScore = Math.max(...productScores.map((p) => p.score));

  // Updates a single preference value
  const updatePreference = (key: keyof UserPreferences, value: number) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("comparison-preferences");
    return saved
      ? JSON.parse(saved)
      : {
          price: true,
          delivery: true,
          rating: true,
        };
  });

  useEffect(() => {
    localStorage.setItem("comparison-preferences", JSON.stringify(preferences));
  }, [preferences]);

  return (
    <Dialog open={compareModalOpen} onOpenChange={closeCompareModal}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-heading font-semibold">
            Advanced Product Comparison
          </DialogTitle>
          <DialogDescription>
            Compare products and customize importance factors to find your
            perfect match
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="comparison"
          className="flex-grow flex flex-col overflow-hidden"
        >
          <TabsList className="mx-6">
            <TabsTrigger value="comparison">Product Comparison</TabsTrigger>
            <TabsTrigger value="preferences">Your Preferences</TabsTrigger>
          </TabsList>

          {/* COMPARISON TAB */}
          <TabsContent
            value="comparison"
            className="flex-grow overflow-auto p-6 pt-4 data-[state=inactive]:hidden"
          >
            {/* Recommendation Section */}
            {recommendedProductId && (
              <div className="mb-6 bg-primary-50 p-4 rounded-lg border border-primary-200">
                <div className="flex items-center mb-2">
                  <Award className="text-primary-500 mr-2" />
                  <h3 className="font-semibold text-lg">Recommended for You</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Based on your preferences, we recommend:
                </p>

                {/* Product Scores */}
                <div className="space-y-3">
                  {productScores.map(({ id, score, isRecommended }) => {
                    const product = selectedProducts.find((p) => p.id === id);
                    if (!product) return null;

                    // Get best platform
                    const platform =
                      product.platforms.find((p) => p.isBestDeal) ||
                      product.platforms[0];

                    return (
                      <div
                        key={id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2"
                      >
                        <div className="flex-shrink-0 w-full sm:w-1/3 flex items-center">
                          <img
                            src={
                              product.image || "https://via.placeholder.com/300"
                            }
                            alt={product.name}
                            className="h-10 w-10 object-contain mr-3"
                          />
                          <div className="truncate">
                            <div className="font-medium truncate">
                              {product.name}
                            </div>
                            <div className="text-sm text-primary-700">
                              {formatPrice(platform.price)}
                            </div>
                          </div>
                        </div>

                        <div className="flex-grow flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                isRecommended ? "bg-primary-600" : "bg-gray-500"
                              }`}
                              style={{ width: `${(score / maxScore) * 100}%` }}
                            ></div>
                          </div>

                          <span className="text-sm font-medium text-gray-700 w-12 text-right">
                            {Math.round(score * 100) / 100}
                          </span>

                          {isRecommended && (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 ml-1 h-6 px-2"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-xs">Best</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed Comparison Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_repeat(auto-fill,minmax(180px,1fr))] gap-4 overflow-x-auto pb-4">
              {/* Feature Headers */}
              <div className="sticky left-0 bg-white z-10">
                <div className="h-36"></div>{" "}
                {/* Empty space for product images */}
                <div className="font-medium py-3 border-b flex items-center justify-between">
                  Price
                  <PreferenceIndicator
                    level={userPreferences.priceImportance}
                  />
                </div>
                <div className="font-medium py-3 border-b flex items-center justify-between">
                  Delivery
                  <PreferenceIndicator
                    level={userPreferences.deliveryImportance}
                  />
                </div>
                <div className="font-medium py-3 border-b flex items-center justify-between">
                  Cash on Delivery
                  <PreferenceIndicator level={userPreferences.codImportance} />
                </div>
                <div className="font-medium py-3 border-b flex items-center justify-between">
                  Return Policy
                  <PreferenceIndicator
                    level={userPreferences.returnPolicyImportance}
                  />
                </div>
                <div className="font-medium py-3 border-b flex items-center justify-between">
                  Rating
                  <PreferenceIndicator
                    level={userPreferences.ratingImportance}
                  />
                </div>
                <div className="font-medium py-3 border-b flex items-center justify-between">
                  Seller
                  <PreferenceIndicator
                    level={userPreferences.sellerReputationImportance}
                  />
                </div>
                <div className="font-medium py-3 border-b">Overall Score</div>
              </div>

              {/* Product Columns */}
              {selectedProducts.map((product) => {
                // For comparison, we'll use the best deal platform or first platform
                const platform =
                  product.platforms.find((p) => p.isBestDeal) ||
                  product.platforms[0];
                const isRecommended = product.id === recommendedProductId;
                const score = getProductScore(product);

                return (
                  <div
                    key={product.id}
                    className={`${
                      isRecommended ? "ring-2 ring-primary-500 rounded-lg" : ""
                    }`}
                  >
                    <div className="h-36 flex flex-col items-center justify-center mb-4 relative p-2">
                      {isRecommended && (
                        <Badge className="absolute top-0 right-0 bg-primary-500">
                          Recommended
                        </Badge>
                      )}
                      <img
                        src={product.image || "https://via.placeholder.com/300"}
                        alt={product.name}
                        className="max-h-24 object-contain mb-2"
                      />
                      <div className="text-sm font-medium text-center line-clamp-2">
                        {product.name}
                      </div>
                    </div>

                    <div className="font-bold text-primary-700 py-3 border-b">
                      {formatPrice(platform.price)}
                    </div>

                    <div
                      className={`py-3 border-b ${
                        platform.freeDelivery
                          ? "text-green-600"
                          : "text-gray-700"
                      }`}
                    >
                      {platform.freeDelivery
                        ? "Free Delivery"
                        : "Paid Delivery"}
                    </div>

                    <div
                      className={`py-3 border-b ${
                        platform.codAvailable
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {platform.codAvailable ? "Available" : "Not Available"}
                    </div>

                    <div className="py-3 border-b">{platform.returnPolicy}</div>

                    <div className="py-3 border-b">
                      {product.rating || 0}.0{" "}
                      <span className="text-yellow-500">★</span>
                    </div>

                    <div className="py-3 border-b">{platform.name}</div>

                    <div className="py-3 border-b font-semibold">
                      {Math.round(score * 100) / 100}
                      {isRecommended && (
                        <span className="ml-2 text-primary-500">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent
            value="preferences"
            className="flex-grow overflow-auto p-6 data-[state=inactive]:hidden"
          >
            <div className="max-w-3xl mx-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  Customize Your Preferences
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Adjust the importance of each factor to get personalized
                  product recommendations. Higher values mean the factor is more
                  important to you.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <PreferenceSlider
                  title="Price"
                  description="How important is getting the lowest price?"
                  value={localPreferences.priceImportance}
                  onChange={(value) =>
                    updatePreference("priceImportance", value[0])
                  }
                />

                <PreferenceSlider
                  title="Delivery"
                  description="How important is free or fast delivery?"
                  value={localPreferences.deliveryImportance}
                  onChange={(value) =>
                    updatePreference("deliveryImportance", value[0])
                  }
                />

                <PreferenceSlider
                  title="Cash on Delivery"
                  description="How important is having cash on delivery option?"
                  value={localPreferences.codImportance}
                  onChange={(value) =>
                    updatePreference("codImportance", value[0])
                  }
                />

                <PreferenceSlider
                  title="Return Policy"
                  description="How important is having a flexible return policy?"
                  value={localPreferences.returnPolicyImportance}
                  onChange={(value) =>
                    updatePreference("returnPolicyImportance", value[0])
                  }
                />

                <PreferenceSlider
                  title="Product Rating"
                  description="How important are high product ratings?"
                  value={localPreferences.ratingImportance}
                  onChange={(value) =>
                    updatePreference("ratingImportance", value[0])
                  }
                />

                <PreferenceSlider
                  title="Seller Reputation"
                  description="How important is buying from reputable sellers?"
                  value={localPreferences.sellerReputationImportance}
                  onChange={(value) =>
                    updatePreference("sellerReputationImportance", value[0])
                  }
                />
              </Accordion>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={resetPreferences}>
                  Reset to Defaults
                </Button>
                <Button onClick={savePreferences} className="mt-4">
                  Save Preferences
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Footer */}
        <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeCompareModal}>
              Close
            </Button>
            <Button variant="destructive" onClick={clearCompare}>
              Clear Selection
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper component to show preference importance level
const PreferenceIndicator: React.FC<{ level: number }> = ({ level }) => {
  const dots = [];
  for (let i = 0; i < 5; i++) {
    dots.push(
      <div
        key={i}
        className={`h-1.5 w-1.5 rounded-full ${
          i < level ? "bg-primary-500" : "bg-gray-200"
        }`}
      />
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex space-x-0.5">{dots}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Importance: {level}/5</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Preference slider component
interface PreferenceSliderProps {
  title: string;
  description: string;
  value: number;
  onChange: (value: number[]) => void;
}

const PreferenceSlider: React.FC<PreferenceSliderProps> = ({
  title,
  description,
  value,
  onChange,
}) => {
  return (
    <AccordionItem value={title.toLowerCase()}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center">
          <span>{title}</span>
          <div className="ml-2 flex space-x-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i <= value ? "bg-primary-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{description}</p>
          <div className="flex items-center">
            <span className="text-sm mr-3 w-32 text-gray-500">
              Less Important
            </span>
            <Slider
              value={[value]}
              min={1}
              max={5}
              step={1}
              onValueChange={onChange}
              className="flex-1"
            />
            <span className="text-sm ml-3 w-32 text-right text-gray-500">
              More Important
            </span>
          </div>
          <div className="flex justify-between px-2">
            <span className="text-xs">1</span>
            <span className="text-xs">2</span>
            <span className="text-xs">3</span>
            <span className="text-xs">4</span>
            <span className="text-xs">5</span>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default ProductComparisonModal;
