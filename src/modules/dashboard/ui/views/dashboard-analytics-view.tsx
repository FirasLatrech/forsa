"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/Icon";
import Link from "next/link";

const DashboardAnalyticsView = () => {
  const trpc = useTRPC();

  const { data: topSearches = [], isLoading: searchesLoading } = useQuery({
    ...trpc.admin.analytics.getTopSearches.queryOptions({ limit: 10 }),
  });

  const { data: mostFavorited = [], isLoading: favoritesLoading } = useQuery({
    ...trpc.admin.analytics.getMostFavorited.queryOptions({ limit: 10 }),
  });

  const { data: mostViewed = [], isLoading: viewsLoading } = useQuery({
    ...trpc.admin.analytics.getMostViewed.queryOptions({ limit: 10 }),
  });

  const { data: bestProducts = [], isLoading: bestLoading } = useQuery({
    ...trpc.admin.analytics.getBestProducts.queryOptions({ limit: 10 }),
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    ...trpc.admin.analytics.getRecentActivity.queryOptions({ limit: 20 }),
  });

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      view_product: "عرض منتج",
      add_to_cart: "إضافة للسلة",
      remove_from_cart: "إزالة من السلة",
      add_to_favorites: "إضافة للمفضلة",
      remove_from_favorites: "إزالة من المفضلة",
      purchase: "شراء",
      search: "بحث",
    };
    return labels[type] || type;
  };

  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      view_product: "show-view",
      add_to_cart: "cart",
      remove_from_cart: "cart",
      add_to_favorites: "heart",
      remove_from_favorites: "heart",
      purchase: "check-circle",
      search: "search",
    };
    return icons[type] || "general";
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      view_product: "bg-blue-50 text-blue-600",
      add_to_cart: "bg-green-50 text-green-600",
      remove_from_cart: "bg-red-50 text-red-600",
      add_to_favorites: "bg-pink-50 text-pink-600",
      remove_from_favorites: "bg-gray-50 text-gray-600",
      purchase: "bg-purple-50 text-purple-600",
      search: "bg-yellow-50 text-yellow-600",
    };
    return colors[type] || "bg-gray-50 text-gray-600";
  };

  return (
    <div className="space-y-8 pb-8" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التحليلات والنشاط</h1>
          <p className="text-gray-500 mt-2 text-sm">نظرة شاملة على نشاط المستخدمين والمنتجات الأكثر شعبية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Icon name="search" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">أكثر عمليات البحث</h2>
              <p className="text-xs text-gray-500 mt-0.5">الاستعلامات الأكثر شيوعاً</p>
            </div>
          </div>
          <div className="space-y-2">
            {searchesLoading ? (
              <div className="text-center text-gray-400 py-12">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              </div>
            ) : topSearches.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Icon name="search" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد عمليات بحث</p>
              </div>
            ) : (
              topSearches.map((search, index) => (
                <div
                  key={search.query}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-xs shrink-0 ${
                      index === 0 ? 'bg-blue-600 text-white' :
                      index === 1 ? 'bg-blue-500 text-white' :
                      index === 2 ? 'bg-blue-400 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{search.query}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{search.count} عملية</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
              <Icon name="heart" className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">الأكثر إضافة للمفضلة</h2>
              <p className="text-xs text-gray-500 mt-0.5">المنتجات المفضلة لدى المستخدمين</p>
            </div>
          </div>
          <div className="space-y-2">
            {favoritesLoading ? (
              <div className="text-center text-gray-400 py-12">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              </div>
            ) : mostFavorited.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Icon name="heart" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد منتجات مفضلة</p>
              </div>
            ) : (
              mostFavorited.map((item, index) => (
                <Link
                  key={item.productId}
                  href={`/product/${item.product.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-xs shrink-0 ${
                      index === 0 ? 'bg-pink-600 text-white' :
                      index === 1 ? 'bg-pink-500 text-white' :
                      index === 2 ? 'bg-pink-400 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate group-hover:text-gray-700">{item.product.nameAr}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.favoriteCount} إضافة</p>
                    </div>
                  </div>
                  <Icon name="arrow" className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity rotate-180" />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Icon name="show-view" className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">الأكثر مشاهدة</h2>
              <p className="text-xs text-gray-500 mt-0.5">المنتجات الأكثر زيارة</p>
            </div>
          </div>
          <div className="space-y-2">
            {viewsLoading ? (
              <div className="text-center text-gray-400 py-12">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              </div>
            ) : mostViewed.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Icon name="show-view" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد مشاهدات</p>
              </div>
            ) : (
              mostViewed.map((item, index) => (
                <Link
                  key={item.productId}
                  href={`/product/${item.product.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-xs shrink-0 ${
                      index === 0 ? 'bg-green-600 text-white' :
                      index === 1 ? 'bg-green-500 text-white' :
                      index === 2 ? 'bg-green-400 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate group-hover:text-gray-700">{item.product.nameAr}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.viewCount} مشاهدة</p>
                    </div>
                  </div>
                  <Icon name="arrow" className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity rotate-180" />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Icon name="check-circle" className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">أفضل المنتجات</h2>
              <p className="text-xs text-gray-500 mt-0.5">حسب الأداء الشامل</p>
            </div>
          </div>
          <div className="space-y-2">
            {bestLoading ? (
              <div className="text-center text-gray-400 py-12">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              </div>
            ) : bestProducts.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Icon name="check-circle" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد منتجات</p>
              </div>
            ) : (
              bestProducts.map((item, index) => (
                <Link
                  key={item.productId}
                  href={`/product/${item.product.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-semibold text-xs shrink-0 ${
                      index === 0 ? 'bg-yellow-600 text-white' :
                      index === 1 ? 'bg-yellow-500 text-white' :
                      index === 2 ? 'bg-yellow-400 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate group-hover:text-gray-700">{item.product.nameAr}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{item.views} 👁️</span>
                        <span className="text-xs text-gray-500">{item.favorites} ❤️</span>
                        <span className="text-xs text-gray-500">{item.purchases} 🛒</span>
                      </div>
                    </div>
                  </div>
                  <Icon name="arrow" className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity rotate-180" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <Icon name="clock" className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">النشاط الأخير</h2>
            <p className="text-xs text-gray-500 mt-0.5">آخر 20 نشاط للمستخدمين</p>
          </div>
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {activityLoading ? (
            <div className="text-center text-gray-400 py-12">
              <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Icon name="clock" className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا يوجد نشاط</p>
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getEventTypeColor(activity.eventType)}`}>
                  <Icon
                    name={getEventTypeIcon(activity.eventType) as any}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {activity.userName}
                    </p>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {getEventTypeLabel(activity.eventType)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {activity.searchQuery && (
                      <span className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded-md">
                        "{activity.searchQuery}"
                      </span>
                    )}
                    {activity.productName && (
                      <Link
                        href={`/product/${activity.productId}`}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        {activity.productName}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  {new Date(activity.createdAt).toLocaleString("ar-TN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalyticsView;
