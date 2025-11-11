"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Icon from "@/components/Icon";

const navigation = [
  { name: "لوحة التحكم", href: "/dashboard", icon: "LayoutDashboard" },
  { name: "المنتجات", href: "/dashboard/products", icon: "Package" },
  { name: "الفئات", href: "/dashboard/categories", icon: "FolderTree" },
  { name: "المستخدمين", href: "/dashboard/users", icon: "Users" },
  { name: "الطلبات", href: "/dashboard/orders", icon: "ShoppingBag" },
  { name: "الصناديق العشوائية", href: "/dashboard/random-boxes", icon: "Gift" },
  { name: "المحادثات", href: "/dashboard/chat", icon: "message" },
  { name: "التحليلات", href: "/dashboard/analytics", icon: "general" },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const trpc = useTRPC();

  const { data: unreadData } = useQuery({
    ...trpc.chat.adminGetUnreadCount.queryOptions(),
    refetchInterval: 5000,
  });

  const unreadCount = unreadData?.count || 0;

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 shadow-lg">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <Link href="/dashboard" className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-cairo), sans-serif' }}>
          ثري دينار
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.href === "/dashboard/chat" && unreadCount > 0;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:shadow-sm"
              }`}
            >
              <Icon name={item.icon as any} className="w-5 h-5" />
              <span className="flex-1">{item.name}</span>
              {showBadge && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
        >
          <Icon name="ArrowRight" className="w-5 h-5" />
          <span>رجوع للمتجر</span>
        </Link>
      </div>
    </div>
  );
};
