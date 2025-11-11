"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Button from "@/components/Button";
import Icon from "@/components/Icon";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: Date;
}

interface AccountViewProps {
  user: User;
}

const AccountView = ({ user }: AccountViewProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    ...trpc.orders.getMyOrders.queryOptions(),
  });

  useEffect(() => {
    if (searchParams.get('order') === 'success') {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.replace('/account');
      }, 5000);
    }
  }, [searchParams, router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-50 text-yellow-700",
      processing: "bg-blue-50 text-blue-700",
      shipped: "bg-purple-50 text-purple-700",
      delivered: "bg-green-50 text-green-700",
      cancelled: "bg-red-50 text-red-700",
    };
    return colors[status] || "bg-gray-50 text-gray-700";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: "قيد الانتظار",
      processing: "قيد المعالجة",
      shipped: "تم الشحن",
      delivered: "تم التسليم",
      cancelled: "ملغي",
    };
    return texts[status] || status;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ar-TN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const allOrders = [
    ...(ordersData?.regularOrders || []).map((order: any) => ({
      ...order,
      type: 'regular',
      displayTotal: order.total,
    })),
    ...(ordersData?.randomBoxOrders || []).map((order: any) => ({
      ...order,
      type: 'randomBox',
      displayTotal: order.amount,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      {showSuccess && (
        <div className="bg-green-50 border-r-4 border-green-500 text-green-800 p-4 mb-4">
          <div className="max-w-4xl mx-auto px-6 flex items-center gap-3">
            <Icon name="check-circle" className="w-5 h-5" fill="currentColor" />
            <p className="font-medium">تم إنشاء الطلب بنجاح! شكراً لك على الشراء.</p>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col">
        <div className="w-full bg-white border-b border-gray-200 py-12">
          <div className="max-w-4xl mx-auto px-6 flex flex-col items-center">
            <div className="mb-6">
              {user.image ? (
                <img 
                  src={user.image} 
                  alt={user.name} 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white text-2xl font-bold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500 mt-2">
              عضو منذ {new Date(user.createdAt).toLocaleDateString('ar-TN', {
                year: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>

        <div className="w-full flex-1">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="flex flex-col gap-6">
              <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Icon name="cart" className="w-5 h-5 text-blue-600" fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">الطلبات</h2>
                    <p className="text-sm text-gray-500">جميع طلباتك</p>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                  </div>
                ) : allOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="cart" className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" />
                    <p className="text-gray-600">لا توجد طلبات</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allOrders.map((order: any) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-900">
                                {order.type === 'regular' ? `#${order.orderNumber}` : `صندوق مفاجآت`}
                              </h3>
                              <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-lg font-bold text-gray-900">
                              {parseFloat(order.displayTotal).toFixed(3)} د.ت
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 mb-1">اسم المستلم</p>
                              <p className="font-medium text-gray-900">{order.shippingName}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">رقم الهاتف</p>
                              <p className="font-medium text-gray-900">{order.shippingPhone}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500 mb-1">العنوان</p>
                              <p className="font-medium text-gray-900">
                                {order.shippingAddress}, {order.shippingCity}
                              </p>
                            </div>
                            {order.type === 'regular' && (
                              <>
                                <div>
                                  <p className="text-gray-500 mb-1">المجموع الفرعي</p>
                                  <p className="font-medium text-gray-900">{parseFloat(order.subtotal).toFixed(3)} د.ت</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">التوصيل</p>
                                  <p className="font-medium text-gray-900">
                                    {parseFloat(order.shippingCost) === 0 ? 'مجاني' : `${parseFloat(order.shippingCost).toFixed(3)} د.ت`}
                                  </p>
                                </div>
                              </>
                            )}
                            {order.paymentMethod && (
                              <div>
                                <p className="text-gray-500 mb-1">طريقة الدفع</p>
                                <p className="font-medium text-gray-900">
                                  {order.paymentMethod === 'cash' ? 'الدفع عند الاستلام' : 'بطاقة الدفع'}
                                </p>
                              </div>
                            )}
                            {order.trackingNumber && (
                              <div>
                                <p className="text-gray-500 mb-1">رقم التتبع</p>
                                <p className="font-medium text-gray-900">{order.trackingNumber}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                    <Icon name="heart" className="w-5 h-5 text-pink-600" fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">المفضّلة</h2>
                    <p className="text-sm text-gray-500">المنتجات المفضلة لديك</p>
                  </div>
                </div>
                <Link
                  href="/favorites"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mt-4"
                >
                  <span>عرض المفضلة</span>
                  <Icon name="arrow" className="w-4 h-4 rotate-180" fill="currentColor" />
                </Link>
              </div>

              <div className="w-full pt-6">
                <Button
                  onClick={handleSignOut}
                  className="w-full !h-12 text-red-600 hover:bg-red-50 border border-red-200"
                >
                  خروج من الحساب
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountView;
