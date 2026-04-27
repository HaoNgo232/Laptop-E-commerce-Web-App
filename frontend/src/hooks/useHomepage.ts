import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useProductStore } from "@/stores/productStore";
import { useCartStore } from "@/stores/cartStore";
import type { Product } from "@/types";

export function useHomepage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { 
    products, 
    categories, 
    highStockProducts,
    bestSellingProducts,
    fetchProducts, 
    fetchCategories,
    fetchHighStockProducts,
    fetchBestSellingProducts
  } = useProductStore();
  const { addToCart } = useCartStore();

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Safe products check
  const featuredProducts = Array.isArray(products) ? products.slice(0, 8) : [];

  // Load data khi component mount
  useEffect(() => {
    fetchProducts({ limit: 12 });
    fetchCategories();
    fetchHighStockProducts(8);
    fetchBestSellingProducts(8);
  }, [fetchProducts, fetchCategories, fetchHighStockProducts, fetchBestSellingProducts]);

  // Auto-slide cho carousel
  useEffect(() => {
    if (featuredProducts.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide(
          (prev) => (prev + 1) % Math.ceil(featuredProducts.length / 4),
        );
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [featuredProducts.length]);

  // Handle quick add to cart
  const handleQuickAddToCart = async (
    product: Product,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    await addToCart(product.id, 1);
    // TODO: Thêm toast notification
  };

  // Handle carousel navigation
  const handlePrevSlide = () => {
    if (featuredProducts.length === 0) return;
    const totalSlides = Math.ceil(featuredProducts.length / 4);
    setCurrentSlide(
      (prev) => (prev - 1 + totalSlides) % totalSlides,
    );
  };

  const handleNextSlide = () => {
    if (featuredProducts.length === 0) return;
    const totalSlides = Math.ceil(featuredProducts.length / 4);
    setCurrentSlide(
      (prev) => (prev + 1) % totalSlides,
    );
  };

  // Handle navigation
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/products?category=${categoryId}`);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  return {
    // Data
    user,
    products,
    categories,
    featuredProducts,
    highStockProducts,
    bestSellingProducts,
    currentSlide,

    // States
    isAuthenticated,
    authLoading,

    // Actions
    handleQuickAddToCart,
    handlePrevSlide,
    handleNextSlide,
    handleCategoryClick,
    handleProductClick,
    navigate,
  };
}
