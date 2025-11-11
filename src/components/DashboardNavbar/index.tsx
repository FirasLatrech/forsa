"use client";

import { authClient } from "@/lib/auth-client";
import Icon from "@/components/Icon";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardNavbarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export const DashboardNavbar = ({ user }: DashboardNavbarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 mr-64" dir="rtl">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800">لوحة التحكم</h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Icon name="Bell" className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-800">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <Icon name="ChevronDown" className="w-4 h-4 text-gray-600" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <button
                  onClick={() => router.push("/account")}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Icon name="User" className="w-4 h-4" />
                  <span>حسابي</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icon name="LogOut" className="w-4 h-4" />
                  <span>خروج</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

