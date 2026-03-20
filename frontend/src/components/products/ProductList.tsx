import { ProductCard, ProductSkeleton } from '@/components/products';
import type { Product } from "@/types";
import { motion } from 'framer-motion';

interface ProductListProps {
    readonly products: Product[];
    readonly isLoading?: boolean;
}

export function ProductList({ products, isLoading = false }: ProductListProps) {

    // Loading state
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Loading skeleton */}
                {Array.from({ length: 8 }).map((_, index) => (
                    <ProductSkeleton key={`skeleton-${index}`} />
                ))}
            </div>
        );
    }

    // Empty state
    if (!products || products.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">
                    Không tìm thấy sản phẩm nào
                </div>
                <p className="text-gray-400 text-sm">
                    Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
            </div>
        );
    }

    // Products grid
    return (
        <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
                <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    // Áp dụng delay dựa trên index để tạo hiệu ứng lần lượt
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <ProductCard key={product.id} product={product} />
                </motion.div>
            ))}
        </motion.div>
    );
}