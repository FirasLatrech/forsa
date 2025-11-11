"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import Field from "@/components/Field";
import { authClient } from "@/lib/auth-client";

const CheckoutView = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const { data: cartItems = [] } = useQuery({
    ...trpc.cart.getItems.queryOptions({ userId: userId || '' }),
    enabled: !!userId,
  });

  const [formData, setFormData] = useState({
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    shippingCity: "",
    notes: "",
    paymentMethod: "cash",
  });

  const productItems = cartItems.filter((item: any) => item.itemType === 'product');
  const randomBoxItems = cartItems.filter((item: any) => item.itemType === 'random_box');

  const subtotal = cartItems.reduce((sum, item: any) => {
    const itemPrice = item.customAmount ? parseFloat(item.customAmount) : parseFloat(item.price);
    return sum + (itemPrice * item.quantity);
  }, 0);

  const shipping = subtotal >= 50 ? 0 : 5.000;
  const total = subtotal + shipping;

  const createOrderMutation = useMutation({
    ...trpc.orders.create.mutationOptions(),
    onSuccess: () => {
      router.push('/account?order=success');
    },
  });

  const createRandomBoxOrderMutation = useMutation({
    ...trpc.orders.createRandomBoxOrder.mutationOptions(),
    onSuccess: () => {
      if (productItems.length === 0) {
        router.push('/account?order=success');
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (productItems.length > 0) {
      await createOrderMutation.mutateAsync(formData);
    }

    if (randomBoxItems.length > 0) {
      await createRandomBoxOrderMutation.mutateAsync({
        shippingName: formData.shippingName,
        shippingPhone: formData.shippingPhone,
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
      });
    }

    if (productItems.length === 0 && randomBoxItems.length > 0) {
      router.push('/account?order=success');
    }
  };

  if (!session?.user) {
    router.push('/sign-in');
    return null;
  }

  if (cartItems.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">إتمام الطلب</h1>
          <p className="text-gray-600">أكمل معلومات الشحن والدفع</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">معلومات الشحن</h2>
                <div className="space-y-4">
                  <Field
                    label="الاسم الكامل"
                    name="shippingName"
                    value={formData.shippingName}
                    onChange={(e) => setFormData({ ...formData, shippingName: e.target.value })}
                    required
                    className="text-sm"
                  />
                  <Field
                    label="رقم الهاتف"
                    name="shippingPhone"
                    type="tel"
                    value={formData.shippingPhone}
                    onChange={(e) => setFormData({ ...formData, shippingPhone: e.target.value })}
                    required
                    className="text-sm"
                  />
                  <Field
                    label="العنوان"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                    required
                    className="text-sm"
                  />
                  <Field
                    label="المدينة"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                    required
                    className="text-sm"
                  />
                  <Field
                    label="ملاحظات (اختياري)"
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    textarea
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">طريقة الدفع</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === "cash"}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">الدفع عند الاستلام</div>
                      <div className="text-sm text-gray-500">ادفع نقداً عند استلام الطلب</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === "card"}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">بطاقة الدفع</div>
                      <div className="text-sm text-gray-500">ادفع باستخدام بطاقة الدفع</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-4">
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
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">المجموع</span>
                      <span className="text-2xl font-bold text-gray-900">{total.toFixed(3)} د.ت</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createOrderMutation.isPending || createRandomBoxOrderMutation.isPending}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                  {createOrderMutation.isPending || createRandomBoxOrderMutation.isPending ? (
                    <>
                      <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      جاري المعالجة...
                    </>
                  ) : (
                    "تأكيد الطلب"
                  )}
                </button>

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Icon name="shield" className="size-5 text-green-600" fill="currentColor" />
                    <span>دفع آمن و موثوق</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Icon name="shipping" className="size-5 text-blue-600" fill="currentColor" />
                    <span>توصيل سريع</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutView;

