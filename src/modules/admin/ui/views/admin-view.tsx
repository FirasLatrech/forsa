"use client";

import { authClient } from "@/lib/auth-client";

const AdminView = () => {
  const { data: session } = authClient.useSession();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">👑</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">لوحة التحكم</h1>
              <p className="text-gray-600 mt-1">مرحباً {session?.user?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">المنتجات</h3>
                <span className="text-3xl">📦</span>
              </div>
              <p className="text-sm text-gray-600">إدارة المنتجات والمخزون</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">الطلبات</h3>
                <span className="text-3xl">🛒</span>
              </div>
              <p className="text-sm text-gray-600">متابعة وإدارة الطلبات</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">المستخدمين</h3>
                <span className="text-3xl">👥</span>
              </div>
              <p className="text-sm text-gray-600">إدارة حسابات المستخدمين</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">الإحصائيات</h3>
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-sm text-gray-600">مشاهدة التقارير والإحصائيات</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">صناديق المفاجآت</h3>
                <span className="text-3xl">🎁</span>
              </div>
              <p className="text-sm text-gray-600">إدارة صناديق المفاجآت</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">الإعدادات</h3>
                <span className="text-3xl">⚙️</span>
              </div>
              <p className="text-sm text-gray-600">إعدادات الموقع والتطبيق</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات الجلسة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">الاسم:</span>
                <span className="font-semibold text-gray-900 mr-2">{session?.user?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">البريد:</span>
                <span className="font-semibold text-gray-900 mr-2">{session?.user?.email}</span>
              </div>
              <div>
                <span className="text-gray-600">الصلاحية:</span>
                <span className="font-semibold text-green-600 mr-2">مدير</span>
              </div>
              <div>
                <span className="text-gray-600">معرف المستخدم:</span>
                <span className="font-mono text-xs text-gray-900 mr-2">{session?.user?.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;

