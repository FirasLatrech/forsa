"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useTRPC } from "@/trpc/client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/modules/favorites/server/actions";
import { addProductToCart } from "@/modules/cart/server/actions";

const FavoritesView = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [animatingItems, setAnimatingItems] = useState<Record<string, boolean>>({});

  const { data: favorites = [], isLoading } = useQuery({
    ...trpc.favorites.getAll.queryOptions({ userId: userId || '' }),
    enabled: !!userId,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [['favorites', 'getAll']] });
      
      const previousFavorites = queryClient.getQueryData([['favorites', 'getAll'], { input: { userId: variables.userId }, type: 'query' }]);
      
      queryClient.setQueryData(
        [['favorites', 'getAll'], { input: { userId: variables.userId }, type: 'query' }],
        (old: any) => {
          if (!old) return old;
          return old.filter((item: any) => item.productId !== variables.productId);
        }
      );
      
      return { previousFavorites };
    },
    onError: (error, variables, context: any) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          [['favorites', 'getAll'], { input: { userId: variables.userId }, type: 'query' }],
          context.previousFavorites
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [['favorites', 'getAll']] });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: addProductToCart,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [['cart', 'getItems']] });
      
      const previousCart = queryClient.getQueryData([['cart', 'getItems'], { input: { userId: variables.userId }, type: 'query' }]);
      
      queryClient.setQueryData(
        [['cart', 'getItems'], { input: { userId: variables.userId }, type: 'query' }],
        (old: any) => {
          if (!old) return old;
          
          const existingItemIndex = old.findIndex(
            (item: any) => item.productId === variables.productId && item.itemType === 'product'
          );
          
          if (existingItemIndex >= 0) {
            const newCart = [...old];
            newCart[existingItemIndex] = {
              ...newCart[existingItemIndex],
              quantity: newCart[existingItemIndex].quantity + variables.quantity,
            };
            return newCart;
          } else {
            return [
              ...old,
              {
                id: `temp-${Date.now()}`,
                userId: variables.userId,
                productId: variables.productId,
                randomBoxId: null,
                itemType: 'product',
                quantity: variables.quantity,
                price: '0',
                customAmount: null,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
          }
        }
      );
      
      return { previousCart };
    },
    onError: (error: Error, variables, context: any) => {
      if (context?.previousCart) {
        queryClient.setQueryData(
          [['cart', 'getItems'], { input: { userId: variables.userId }, type: 'query' }],
          context.previousCart
        );
      }
      console.error('Error adding product to cart:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [['cart', 'getItems']] });
    },
  });

  const handleRemoveFavorite = async (productId: string) => {
    if (!userId) return;
    
    await toggleFavoriteMutation.mutateAsync({
      userId,
      productId,
    });
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const newQuantity = Math.max(0, current + delta);
      return { ...prev, [productId]: newQuantity };
    });
  };

  const handleAddToCart = async (productId: string) => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    const quantity = quantities[productId] || 1;
    const productImage = document.querySelector(`[data-product-image="${productId}"]`) as HTMLElement;
    const cartIcon = document.querySelector('[href="/cart"]');
    
    setAnimatingItems(prev => ({ ...prev, [productId]: true }));
    
    try {
      await addProductMutation.mutateAsync({
        userId,
        productId,
        quantity,
      });

      if (productImage && cartIcon) {
        const imageRect = productImage.getBoundingClientRect();
        const cartRect = cartIcon.getBoundingClientRect();
        
        const clone = productImage.cloneNode(true) as HTMLElement;
        clone.style.position = 'fixed';
        clone.style.left = `${imageRect.left}px`;
        clone.style.top = `${imageRect.top}px`;
        clone.style.width = `${imageRect.width}px`;
        clone.style.height = `${imageRect.height}px`;
        clone.style.zIndex = '9999';
        clone.style.pointerEvents = 'none';
        clone.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        clone.style.borderRadius = '1rem';
        clone.style.overflow = 'hidden';
        
        document.body.appendChild(clone);
        
        requestAnimationFrame(() => {
          clone.style.transform = `translate(${cartRect.left - imageRect.left + cartRect.width / 2}px, ${cartRect.top - imageRect.top}px) scale(0.1) rotate(360deg)`;
          clone.style.opacity = '0';
        });
        
        setTimeout(() => {
          clone.remove();
          setQuantities(prev => ({ ...prev, [productId]: 0 }));
        }, 800);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setTimeout(() => {
        setAnimatingItems(prev => ({ ...prev, [productId]: false }));
      }, 800);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">المفضلة</h1>
          <p className="text-base md:text-lg text-gray-600 mb-8">منتجاتك المفضلة في مكان واحد</p>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-12 md:p-16 text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-red-50 to-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="heart" className="w-10 h-10 md:w-12 md:h-12 text-red-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">قائمة المفضلة فارغة</h2>
            <p className="text-sm md:text-base text-gray-600 mb-8 max-w-md mx-auto">ابدأ بإضافة منتجاتك المفضلة عشان تلقاهم بسرعة وقت الي تحب</p>
            <Link 
              href="/shop"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 md:px-8 py-3 md:py-3.5 rounded-xl hover:bg-gray-800 transition-all font-semibold text-sm md:text-base hover:scale-105 active:scale-95"
            >
              <span>تصفح المنتجات</span>
              <Icon name="arrow" className="w-4 h-4 rotate-180" fill="currentColor" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">المفضلة</h1>
            <p className="text-sm md:text-base text-gray-600">
              {favorites.length} {favorites.length === 1 ? 'منتج' : 'منتجات'} في قائمتك
            </p>
          </div>
          <Link 
            href="/shop"
            className="flex items-center gap-2 text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <span className="hidden sm:inline">تصفح المنتجات</span>
            <Icon name="arrow" className="w-4 h-4 rotate-180" fill="currentColor" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {favorites.map((favorite) => {
            const product = favorite.product;
            if (!product) return null;

            const quantity = quantities[product.id] || 0;
            const displayPrice = parseFloat(product.price).toFixed(3);

            return (
              <div 
                key={favorite.id}
                className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative">
                  <Link href={`/product/${product.id}`}>
                    <div 
                      data-product-image={product.id}
                      className="relative aspect-square bg-gray-100 overflow-hidden"
                    >
                      <Image
                        src={product.images?.[0] || '/images/placeholder.jpg'}
                        alt={product.nameAr || product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => handleRemoveFavorite(product.id)}
                    className="absolute top-2 md:top-3 left-2 md:left-3 p-1.5 md:p-2 bg-white/95 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-md hover:scale-110 z-10"
                    aria-label="إزالة من المفضلة"
                  >
                    <Icon name="heart" className="w-4 h-4 md:w-5 md:h-5 text-red-500" fill="currentColor" />
                  </button>
                </div>

                <div className="p-3 flex flex-col gap-2">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors line-clamp-2 mb-1 min-h-[2.5rem] md:min-h-[2.5rem]">
                      {product.nameAr || product.name}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-base md:text-lg font-bold text-gray-900">
                      {displayPrice}
                    </span>
                    <span className="text-xs md:text-sm text-gray-500">د.ت</span>
                    {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
                      <span className="text-xs text-gray-400 line-through">
                        {parseFloat(product.compareAtPrice).toFixed(3)}
                      </span>
                    )}
                  </div>

                  {quantity > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <button
                        onClick={() => handleQuantityChange(product.id, -1)}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Icon name="minus" className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <span className="text-base md:text-lg font-bold min-w-[2rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(product.id, 1)}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Icon name="plus" className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  )}

                  {quantity === 0 ? (
                    <button
                      onClick={() => handleQuantityChange(product.id, 1)}
                      className="w-full bg-gray-100 text-gray-900 py-2 md:py-2.5 px-3 rounded-xl text-xs md:text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Icon name="plus" className="w-3 h-3 md:w-4 md:h-4" />
                      <span>أضف للسلة</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={animatingItems[product.id]}
                      className={`w-full bg-gray-900 text-white py-2 md:py-2.5 px-3 rounded-xl text-xs md:text-sm font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                        animatingItems[product.id] ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Icon name="cart" className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" />
                      <span>زيد</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FavoritesView;

