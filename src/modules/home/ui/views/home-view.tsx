"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { product as productSchema } from "@/db/schema";
import { useRouter } from "next/navigation";
import { addRandomBoxToCart, addProductToCart } from "@/modules/cart/server/actions";
import { toggleFavorite } from "@/modules/favorites/server/actions";
import { authClient } from "@/lib/auth-client";

const HomeView = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [animatingItems, setAnimatingItems] = useState<Record<string, boolean>>({});
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  
  const { data: featuredProducts, isLoading } = useQuery(
    trpc.products.getFeatured.queryOptions({ limit: 8 })
  );

  const { data: randomBoxes, isLoading: isLoadingBoxes } = useQuery(
    trpc.randomBoxes.getAll.queryOptions()
  );

  const productIds = featuredProducts?.map(p => p.id) || [];
  const { data: favoritesMap = {} } = useQuery({
    ...trpc.favorites.check.queryOptions({ userId: userId || '', productIds }),
    enabled: !!userId && productIds.length > 0,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [['favorites', 'check']] });
      
      const queryKey = [['favorites', 'check'], { input: { userId: variables.userId, productIds }, type: 'query' }];
      const previousMap = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return { [variables.productId]: true };
        return {
          ...old,
          [variables.productId]: !old[variables.productId],
        };
      });
      
      return { previousMap };
    },
    onError: (error, variables, context: any) => {
      if (context?.previousMap) {
        const queryKey = [['favorites', 'check'], { input: { userId: variables.userId, productIds }, type: 'query' }];
        queryClient.setQueryData(queryKey, context.previousMap);
      }
      console.error('Error toggling favorite:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [['favorites', 'check']] });
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

  const addRandomBoxMutation = useMutation({
    mutationFn: addRandomBoxToCart,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [['cart', 'getItems']] });
      
      const previousCart = queryClient.getQueryData([['cart', 'getItems'], { input: { userId: variables.userId }, type: 'query' }]);
      
      queryClient.setQueryData(
        [['cart', 'getItems'], { input: { userId: variables.userId }, type: 'query' }],
        (old: any) => {
          if (!old) return [];
          
          return [
            ...old,
            {
              id: `temp-${Date.now()}`,
              userId: variables.userId,
              productId: null,
              randomBoxId: variables.randomBoxId || null,
              itemType: 'random_box',
              quantity: 1,
              price: variables.amount,
              customAmount: variables.isCustom ? variables.amount : null,
              metadata: { isCustom: variables.isCustom },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];
        }
      );
      
      return { previousCart };
    },
    onSuccess: () => {
      setAddingToCart(null);
      router.push('/cart');
    },
    onError: (error: Error, variables, context: any) => {
      if (context?.previousCart) {
        queryClient.setQueryData(
          [['cart', 'getItems'], { input: { userId: variables.userId }, type: 'query' }],
          context.previousCart
        );
      }
      console.error('Error adding to cart:', error);
      setAddingToCart(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [['cart', 'getItems']] });
    },
  });

  const handleAddBoxToCart = async (boxId: string, amount: string) => {
    if (!session?.user?.id) {
      router.push('/sign-in');
      return;
    }
    
    setAddingToCart(boxId);
    await addRandomBoxMutation.mutateAsync({
      userId: session.user.id,
      randomBoxId: boxId,
      amount,
      isCustom: false,
    });
  };

  const handleCustomAmountSubmit = async () => {
    if (!session?.user?.id) {
      router.push('/sign-in');
      return;
    }
    
    const amount = parseFloat(customAmount);
    if (amount >= 10 && amount <= 2000) {
      setAddingToCart("custom");
      await addRandomBoxMutation.mutateAsync({
        userId: session.user.id,
        amount: amount.toFixed(2),
        isCustom: true,
      });
      setCustomAmount("");
      setShowCustomInput(false);
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const newQuantity = Math.max(0, current + delta);
      return { ...prev, [productId]: newQuantity };
    });
  };

  const handleToggleFavorite = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      router.push('/sign-in');
      return;
    }

    await toggleFavoriteMutation.mutateAsync({
      userId,
      productId,
    });
  };

  const handleAddToCart = async (productId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!session?.user?.id) {
      router.push('/sign-in');
      return;
    }

    const quantity = quantities[productId] || 1;
    const productImage = document.querySelector(`[data-product-image="${productId}"]`) as HTMLElement;
    const cartIcon = document.querySelector('[href="/cart"]');
    
    setAnimatingItems(prev => ({ ...prev, [productId]: true }));
    
    try {
      await addProductMutation.mutateAsync({
        userId: session.user.id,
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
      <div className="bg-white min-h-screen" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <div className="h-7 sm:h-8 w-40 sm:w-48 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-5 sm:h-6 w-56 sm:w-64 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 sm:h-10 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 sm:h-10 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideUp {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className="bg-white min-h-screen" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                الأكثر مبيعا
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                الحوايج اللي الناس تحبهم برشا
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
            >
              <span>شوف الكل</span>
              <Icon name="arrow" className="size-4 rotate-180" fill="currentColor" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {featuredProducts?.map((product: typeof productSchema.$inferSelect) => {
              const hasDiscount = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);
              const primaryImage = product.images?.[0] || '/images/placeholder.jpg';
              
              return (
              <div
                key={product.id}
                className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <Link href={`/product/${product.id}`} className="block">
                  <div 
                    className="relative aspect-square bg-gray-100 overflow-hidden"
                    data-product-image={product.id}
                  >
                    <Image
                        src={primaryImage}
                        alt={product.nameAr || product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                      {hasDiscount && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium text-white bg-red-500">
                          تخفيض
                        </div>
                      )}
                      {!hasDiscount && product.isNew && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium text-white bg-blue-500">
                          جديد
                      </div>
                    )}
                    <button
                      className={`absolute top-2 left-2 sm:top-3 sm:left-3 p-1.5 sm:p-2 bg-white rounded-full transition-all duration-300 hover:scale-110 shadow-sm ${
                        favoritesMap[product.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => handleToggleFavorite(product.id, e)}
                    >
                      <Icon 
                        name={favoritesMap[product.id] ? 'heart-fill' : 'heart'}
                        className={`size-3 sm:size-4 transition-colors ${
                          favoritesMap[product.id] ? 'text-red-500' : 'text-gray-700'
                        }`} 
                        fill="currentColor"
                      />
                    </button>
                  </div>
                </Link>

                <div className="p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 hover:text-gray-700 transition-colors mb-1 sm:mb-2">
                      {product.nameAr || product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <span className="text-base sm:text-lg font-bold text-gray-900">
                      {parseFloat(product.price).toFixed(2)} د.ت
                    </span>
                    {hasDiscount && (
                      <span className="text-xs sm:text-sm text-gray-500 line-through">
                        {parseFloat(product.compareAtPrice!).toFixed(2)} د.ت
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 sm:gap-1.5">
                    <div className="flex items-center justify-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleQuantityChange(product.id, -1)}
                        className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 active:scale-95 transition-all text-gray-700 font-medium text-sm"
                        disabled={!quantities[product.id] || quantities[product.id] === 0}
                      >
                        -
                      </button>
                      <div className="flex-1 py-1.5 sm:py-2 text-center font-medium text-gray-900 border-x border-gray-300 relative overflow-hidden text-sm">
                        <span 
                          key={quantities[product.id] || 1}
                          className="inline-block animate-[slideUp_0.3s_ease-out]"
                        >
                          {quantities[product.id] || 1}
                        </span>
                      </div>
                      <button
                        onClick={() => handleQuantityChange(product.id, 1)}
                        className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 active:scale-95 transition-all text-gray-700 font-medium text-sm"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(product.id, e)}
                      disabled={animatingItems[product.id]}
                      className={`w-full bg-gray-900 text-white py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                        animatingItems[product.id] ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Icon name="cart" className="size-3 sm:size-4" fill="currentColor" />
                      <span>زيد</span>
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          <div className="mt-6 sm:mt-8 flex justify-center sm:hidden">
            <Link
              href="/shop"
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              <span>شوف الكل</span>
              <Icon name="arrow" className="size-4 rotate-180" fill="currentColor" />
            </Link>
          </div>
        </div>

        <div className="mb-8 sm:mb-12 mt-10 sm:mt-16">
          <div className="text-center mb-6 sm:mb-8 px-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
              صندوق المفاجآت
            </h2>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              اختار المبلغ متاعك و احصل على حوايج بقيمة أكثر
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto px-2 sm:px-0">
            {isLoadingBoxes ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-3xl bg-gray-200 animate-pulse min-h-[280px]" />
                ))}
              </>
            ) : (
              randomBoxes?.map((box) => (
                <div
                  key={box.id}
                  className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br ${box.colorGradient} shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 cursor-pointer`}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <div className="relative p-6 sm:p-8 flex flex-col items-center justify-center text-white min-h-[240px] sm:min-h-[280px]">
                    <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform">
                      {box.icon}
                    </div>
                    <div className="text-4xl sm:text-5xl font-bold mb-1 sm:mb-2">
                      {parseFloat(box.amount).toFixed(0)}
                    </div>
                    <div className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6">
                      دينار
                    </div>
                    <button
                      onClick={() => handleAddBoxToCart(box.id, box.amount)}
                      disabled={addingToCart === box.id}
                      className="bg-white text-gray-900 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingToCart === box.id ? (
                        <>
                          <div className="size-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                          <span>جاري الإضافة...</span>
                        </>
                      ) : (
                        <>
                          <span>اطلب توا</span>
                          <Icon name="arrow" className="size-4 rotate-180" fill="currentColor" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 cursor-pointer">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              <div className="relative p-6 sm:p-8 flex flex-col items-center justify-center text-white min-h-[240px] sm:min-h-[280px]">
                {!showCustomInput ? (
                  <>
                    <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform">
                      🎨
                    </div>
                    <div className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-center">
                      مبلغ مخصص
                    </div>
                    <div className="text-xs sm:text-sm mb-4 sm:mb-6 text-center text-white/90 px-2">
                      من 10 إلى 2,000,000 د.ت
                    </div>
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="bg-white text-gray-900 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <span>اختار المبلغ</span>
                      <Icon name="arrow" className="size-4 rotate-180" fill="currentColor" />
                    </button>
                  </>
                ) : (
                  <div className="w-full space-y-3 sm:space-y-4 px-2">
                    <div className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center">
                      اكتب المبلغ
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        max="2000000"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="10 - 2,000,000"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl text-gray-900 text-center font-bold text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-white"
                      />
                      <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                        د.ت
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCustomAmountSubmit}
                        disabled={!customAmount || parseFloat(customAmount) < 10 || parseFloat(customAmount) > 2000000 || addingToCart === "custom"}
                        className="flex-1 bg-white text-gray-900 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {addingToCart === "custom" ? (
                          <>
                            <div className="size-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs sm:text-sm">جاري الإضافة...</span>
                          </>
                        ) : (
                          <span>اطلب</span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomAmount("");
                        }}
                        disabled={addingToCart === "custom"}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 text-center px-4">
            <p className="text-xs sm:text-sm text-gray-500">
              كل صندوق يحتوي على حوايج بقيمة أكثر من المبلغ اللي دفعتو 🎁
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default HomeView;

