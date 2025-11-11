"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { updateCartItemQuantity, removeCartItem } from "@/modules/cart/server/actions";

type CartItemWithData = {
  id: string;
  userId: string;
  productId: string | null;
  randomBoxId: string | null;
  itemType: "product" | "random_box";
  quantity: number;
  price: string;
  customAmount: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  productData?: any;
  randomBoxData?: any;
};

const CartView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
  const userId = session?.user?.id;

  const { data: cartItems = [], isLoading } = useQuery({
    ...trpc.cart.getItems.queryOptions({ userId: userId || '' }),
    enabled: !!userId,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: updateCartItemQuantity,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [['cart', 'getItems']] });
      
      const previousCart = queryClient.getQueryData([['cart', 'getItems'], { input: { userId: userId || '' }, type: 'query' }]);
      
      queryClient.setQueryData(
        [['cart', 'getItems'], { input: { userId: userId || '' }, type: 'query' }],
        (old: any) => {
          if (!old) return old;
          return old.map((item: any) =>
            item.id === variables.id
              ? { ...item, quantity: variables.quantity }
              : item
          );
        }
      );
      
      return { previousCart };
    },
    onError: (error, variables, context: any) => {
      if (context?.previousCart) {
        queryClient.setQueryData(
          [['cart', 'getItems'], { input: { userId: userId || '' }, type: 'query' }],
          context.previousCart
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [['cart', 'getItems']] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: removeCartItem,
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: [['cart', 'getItems']] });
      
      const previousCart = queryClient.getQueryData([['cart', 'getItems'], { input: { userId: userId || '' }, type: 'query' }]);
      
      queryClient.setQueryData(
        [['cart', 'getItems'], { input: { userId: userId || '' }, type: 'query' }],
        (old: any) => {
          if (!old) return old;
          return old.filter((item: any) => item.id !== itemId);
        }
      );
      
      return { previousCart };
    },
    onError: (error, itemId, context: any) => {
      if (context?.previousCart) {
        queryClient.setQueryData(
          [['cart', 'getItems'], { input: { userId: userId || '' }, type: 'query' }],
          context.previousCart
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [['cart', 'getItems']] });
    },
  });

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  };

  const removeItem = (id: string) => {
    removeItemMutation.mutate(id);
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.customAmount ? parseFloat(item.customAmount) : parseFloat(item.price);
    return sum + (itemPrice * item.quantity);
  }, 0);
  const shipping = subtotal >= 50 ? 0 : 5.000;
  const total = subtotal + shipping;

  if (!session?.user) {
    return (
      <div className="bg-gray-50 min-h-screen" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl p-16 text-center">
            <div className="mb-6">
              <Icon name="cart" className="size-20 text-gray-300 mx-auto" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">لازم تسجل الدخول</h2>
            <p className="text-gray-600 mb-6">باش تشوف السلة متاعك، لازم تسجل الدخول أولا</p>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              <span>سجل الدخول</span>
              <Icon name="arrow" className="size-4 rotate-180" fill="currentColor" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">السلة متاعي</h1>
          <p className="text-gray-600">{cartItems.length} حاجة في السلة</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-40 animate-pulse" />
              ))}
            </div>
            <div className="bg-white rounded-2xl p-6 h-96 animate-pulse" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center">
            <div className="mb-6">
              <Icon name="cart" className="size-20 text-gray-300 mx-auto" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">السلة فارغة</h2>
            <p className="text-gray-600 mb-6">زيد حوايج باش تبدا الشراء</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              <span>ابدا التسوق</span>
              <Icon name="arrow" className="size-4 rotate-180" fill="currentColor" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {(cartItems as CartItemWithData[]).map((item) => {
                const isRandomBox = item.itemType === 'random_box';
                const isCustomBox = item.customAmount !== null;
                const displayName = isRandomBox 
                  ? (isCustomBox 
                      ? `صندوق مفاجآت مخصص - ${parseFloat(item.customAmount || item.price).toFixed(0)} دينار`
                      : item.randomBoxData?.nameAr || 'صندوق مفاجآت')
                  : item.productData?.nameAr || item.productData?.name || 'منتج';
                const displayImage = isRandomBox 
                  ? null
                  : item.productData?.images?.[0] || '/images/placeholder.jpg';
                const price = parseFloat(item.customAmount || item.price);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 sm:p-6 flex gap-4 sm:gap-6 hover:shadow-md transition-shadow"
                  >
                    {isRandomBox ? (
                      <div className="flex-shrink-0">
                        <div className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gradient-to-br ${item.randomBoxData?.colorGradient || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                          <span className="text-5xl">{item.randomBoxData?.icon || '🎁'}</span>
                        </div>
                      </div>
                    ) : (
                      <Link href={`/product/${item.productId}`} className="flex-shrink-0">
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100">
                          <Image
                            src={displayImage}
                            alt={displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>
                    )}

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                            {displayName}
                          </h3>
                          {isRandomBox && !isCustomBox && item.randomBoxData && (
                            <p className="text-sm text-gray-500 mb-1">
                              قيمة الحوايج: {parseFloat(item.randomBoxData.minValue).toFixed(0)} - {parseFloat(item.randomBoxData.maxValue || item.randomBoxData.minValue).toFixed(0)} د.ت
                            </p>
                          )}
                          <p className="text-sm text-gray-600">السعر: {price.toFixed(3)} د.ت</p>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors group flex-shrink-0"
                          aria-label="حذف"
                        >
                          <Icon name="trash" className="size-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="currentColor" />
                          <span className="text-sm font-medium text-gray-600 group-hover:text-red-500 transition-colors">حذف</span>
                        </button>
                      </div>

                      {!isRandomBox && (
                        <div className="flex items-center mt-4">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-3 sm:px-4 py-2 hover:bg-gray-100 active:scale-95 transition-all text-gray-700 font-medium"
                            >
                              -
                            </button>
                            <span className="px-4 sm:px-6 py-2 text-center font-bold text-gray-900 border-x border-gray-300 min-w-[3rem]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-3 sm:px-4 py-2 hover:bg-gray-100 active:scale-95 transition-all text-gray-700 font-medium"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                      {isRandomBox && (
                        <div className="mt-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            صندوق مفاجآت
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-left">
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        {(price * item.quantity).toFixed(3)} د.ت
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-6">ملخص الطلب</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>المجموع الفرعي</span>
                    <span className="font-medium">{subtotal.toFixed(3)} د.ت</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>التوصيل</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-green-600">مجاني</span>
                      ) : (
                        `${shipping.toFixed(3)} د.ت`
                      )}
                    </span>
                  </div>

                  {subtotal < 50 && subtotal > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        زيد {(50 - subtotal).toFixed(3)} د.ت باش التوصيل يولي مجاني
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">المجموع</span>
                      <span className="text-2xl font-bold text-gray-900">{total.toFixed(3)} د.ت</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors mb-3"
                >
                  أكمل الشراء
                </button>

                <Link
                  href="/shop"
                  className="block text-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  واصل التسوق
                </Link>

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Icon name="shield" className="size-5 text-green-600" fill="currentColor" />
                    <span>دفع آمن و موثوق</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Icon name="shipping" className="size-5 text-blue-600" fill="currentColor" />
                    <span>توصيل سريع</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Icon name="repeat" className="size-5 text-purple-600" fill="currentColor" />
                    <span>استرجاع سهل</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartView;

