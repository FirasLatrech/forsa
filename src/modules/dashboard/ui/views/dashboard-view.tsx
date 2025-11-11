"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/Icon";

const DashboardView = () => {
  const trpc = useTRPC();
  const { data: stats, isLoading } = useQuery(
    trpc.admin.stats.getOverview.queryOptions()
  );

  const statCards = [
    {
      title: "مجموع المنتجات",
      value: stats?.totalProducts ?? 0,
      icon: "Package",
      color: "bg-blue-500",
    },
    {
      title: "المنتجات النشطة",
      value: stats?.activeProducts ?? 0,
      icon: "CheckCircle",
      color: "bg-green-500",
    },
    {
      title: "الفئات",
      value: stats?.totalCategories ?? 0,
      icon: "FolderTree",
      color: "bg-purple-500",
    },
    {
      title: "المستخدمين",
      value: stats?.totalUsers ?? 0,
      icon: "Users",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-1">مرحبا بيك في لوحة الإدارة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {isLoading ? "..." : card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <Icon name={card.icon as any} className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            إجراءات سريعة
          </h2>
          <div className="space-y-3">
            <a
              href="/dashboard/products"
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Icon name="Plus" className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">زيد منتج جديد</span>
            </a>
            <a
              href="/dashboard/categories"
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Icon name="Plus" className="w-5 h-5 text-purple-600" />
              <span className="text-gray-700">زيد فئة جديدة</span>
            </a>
            <a
              href="/dashboard/orders"
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Icon name="ShoppingBag" className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">شوف الطلبات</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            معلومات النظام
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">المنصة</span>
              <span className="font-medium text-gray-900">ثري دينار</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">الإصدار</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">الحالة</span>
              <span className="flex items-center gap-2 font-medium text-green-600">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                متصل
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
