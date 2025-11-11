"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useTRPC } from "@/trpc/client";
import { useShopFilters } from "@/modules/shop/hooks/use-shop-filters";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { addProductToCart } from "@/modules/cart/server/actions";
import { toggleFavorite } from "@/modules/favorites/server/actions";

const ShopView = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const [filters, { setPage, setSearch, setCategoryId, setSortBy }] = useShopFilters();
  
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [animatingItems, setAnimatingItems] = useState<Record<string, boolean>>({});
  const [searchInput, setSearchInput] = useState(filters.search);
  const preferencesLoadedRef = useRef(false);
  const isLoadingPreferencesRef = useRef(false);
  const lastSavedFiltersRef = useRef<string>("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { data: savedFilters } = useQuery({
    ...trpc.preferences.getShopFilters.queryOptions(),
    enabled: !!userId && !preferencesLoadedRef.current,
  });

  const saveFiltersMutation = useMutation({
    ...trpc.preferences.saveShopFilters.mutationOptions(),
  });

  useEffect(() => {
    if (savedFilters && userId && !preferencesLoadedRef.current) {
      preferencesLoadedRef.current = true;
      isLoadingPreferencesRef.current = true;
      if (savedFilters.search) {
        setSearch(savedFilters.search);
        setSearchInput(savedFilters.search);
      }
      if (savedFilters.categoryId) setCategoryId(savedFilters.categoryId);
      if (savedFilters.sortBy) setSortBy(savedFilters.sortBy);
      setTimeout(() => {
        isLoadingPreferencesRef.current = false;
      }, 1000);
    }
  }, [savedFilters, userId, setSearch, setCategoryId, setSortBy]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const trackSearchMutation = useMutation({
    ...trpc.analytics.trackSearch.mutationOptions(),
  });

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchInput !== filters.search) {
        setSearch(searchInput);
        if (filters.page !== 1) {
          setPage(1);
        }
        if (searchInput.trim()) {
          trackSearchMutation.mutate({
            searchQuery: searchInput.trim(),
            categoryId: filters.categoryId || undefined,
          });
        }
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput, filters.search, filters.categoryId, filters.page, setSearch, setPage, trackSearchMutation]);

  useEffect(() => {
    if (!userId || isLoadingPreferencesRef.current) return;

    const currentFiltersKey = `${filters.search || ""}-${filters.categoryId || ""}-${filters.sortBy || ""}`;
    if (lastSavedFiltersRef.current === currentFiltersKey) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const filtersToSave = {
        search: filters.search || undefined,
        categoryId: filters.categoryId || undefined,
        sortBy: filters.sortBy,
      };
      const filtersKey = `${filtersToSave.search || ""}-${filtersToSave.categoryId || ""}-${filtersToSave.sortBy || ""}`;
      
      if (lastSavedFiltersRef.current !== filtersKey) {
        lastSavedFiltersRef.current = filtersKey;
        saveFiltersMutation.mutate(filtersToSave);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [filters.search, filters.categoryId, filters.sortBy, userId]);

  const { data: productsData, isLoading: isLoadingProducts } = useQuery(
    trpc.products.getMany.queryOptions({
      page: filters.page,
      pageSize: 12,
      search: filters.search || undefined,
      categoryId: filters.categoryId || undefined,
      sortBy: filters.sortBy,
    })
  ); 

  const { data: categories = [] } = useQuery(
    trpc.categories.getAll.queryOptions()
  );

  const sortOptions = [
    { value: "popular", label: "الأكثر شعبية" },
    { value: "newest", label: "الأحدث" },
    { value: "price-asc", label: "السعر: من الأقل للأعلى" },
    { value: "price-desc", label: "السعر: من الأعلى للأقل" },
  ];

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || {
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const productIds = products.map(p => p.id) || [];
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

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const newQuantity = Math.max(0, current + delta);
      return { ...prev, [productId]: newQuantity };
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">الحوايج</h1>
            <p className="text-sm sm:text-base text-gray-600">كل شي بـ 3 دنانير</p>
          </div>

          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="لوّج على الحاجة اللي تحبها..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-12 sm:h-14 pr-12 sm:pr-14 pl-5 sm:pl-6 text-sm sm:text-base bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all"
              />
              <Icon
                name="search"
                className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-gray-400"
                fill="currentColor"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                  }}
                  className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Icon name="close-think" className="size-3 sm:size-4 text-gray-500" fill="currentColor" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8">
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 sticky top-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">الأنواع</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <button
                    onClick={() => {
                      setCategoryId('');
                      if (filters.page !== 1) setPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      !filters.categoryId
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>الكل</span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setCategoryId(category.id);
                        if (filters.page !== 1) setPage(1);
                      }}
                      className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        filters.categoryId === category.id
                          ? "bg-gray-900 text-white"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span>{category.nameAr}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">ترتيب</h3>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      if (filters.page !== 1) setPage(1);
                    }}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </aside>

            <main className="flex-1">
              <div className="mb-4 sm:mb-6 flex items-center justify-between">
                <p className="text-sm sm:text-base text-gray-600">
                  <span className="font-bold text-gray-900">{pagination.totalCount}</span> حاجة
                </p>
              </div>

              {isLoadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-3 sm:space-y-4">
                      <div className="aspect-square bg-gray-200 rounded-xl sm:rounded-2xl"></div>
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="mb-3 sm:mb-4">
                    <Icon name="search" className="size-12 sm:size-16 text-gray-300 mx-auto" fill="currentColor" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">ما لقيناش حاجة</h3>
                  <p className="text-sm sm:text-base text-gray-600">جرّب تلوّج بكلمة أخرى</p>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {products.map((product) => {
                    const productImages = (product.images as string[]) || [];
                    const firstImage = productImages[0] || '/images/login-pic-1.jpg';
                    
                    return (
                    <div
                      key={product.id}
                      className="group bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <Link href={`/product/${product.slug}`} className="block">
                        <div 
                          className="relative aspect-square bg-gray-100 overflow-hidden"
                          data-product-image={product.id}
                        >
                          <Image
                            src={firstImage}
                            alt={product.nameAr}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
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
                        <Link href={`/product/${product.slug}`}>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 hover:text-gray-700 transition-colors mb-1 sm:mb-2">
                            {product.nameAr}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-base sm:text-lg font-bold text-gray-900">{product.price} د.ت</span>
                          {product.compareAtPrice && (
                            <span className="text-xs sm:text-sm text-gray-400 line-through">{product.compareAtPrice} د.ت</span>
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
                  )})}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="mt-6 sm:mt-8 flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                    <button
                      onClick={() => setPage(filters.page - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                    >
                      السابق
                    </button>
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                            pageNum === filters.page
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setPage(filters.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                    >
                      التالي
                    </button>
                  </div>
                )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShopView;

