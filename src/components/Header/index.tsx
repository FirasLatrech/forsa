"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import AuthModal from "@/modules/auth/ui/components/auth-modal";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

const Header = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { data: session } = authClient.useSession();
  
  const userId = session?.user?.id;
  
  const { data: cartItems = [] } = useQuery({
    ...trpc.cart.getItems.queryOptions({ userId: userId || '' }),
    enabled: !!userId,
  });
  
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className=" bg-white border-b border-gray-200 z-50" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              ثلاثة دنانير
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/shop" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                الحوايج
              </Link>
              <Link href="/new" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                الجديد
              </Link>
              <Link href="/categories" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                الأنواع
              </Link>
              <Link href="/sale" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                السولد
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="شنوّا تلوّج عليه..."
                className="w-64 h-9 pr-9 pl-4 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              />
              <Icon
                name="search"
                className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
                fill="currentColor"
              />
            </div>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="sm:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="لوّج"
            >
              <Icon name="search" className="size-5 text-gray-700" fill="currentColor" />
            </button>

            <button 
              onClick={() => {
                if (session) {
                  router.push("/account");
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="hover:opacity-80 transition-opacity" 
              aria-label="الكومت متاعي"
            >
              {session ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-sm font-semibold">
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              ) : (
                <div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Icon name="profile" className="size-5 text-gray-700" fill="currentColor" />
                </div>
              )}
            </button>

            <Link href="/favorites" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative" aria-label="المفضّلة">
              <Icon name="heart" className="size-5 text-gray-700" fill="currentColor" />
            </Link>

            <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative" aria-label="السلة">
              <Icon name="cart" className="size-5 text-gray-700" fill="currentColor" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 left-0.5 bg-gray-900 text-white text-xs rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-medium">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {isSearchOpen && (
          <div className="sm:hidden py-4 border-t border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="شنوّا تلوّج عليه..."
                className="w-full h-10 pr-10 pl-4 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              />
              <Icon
                name="search"
                className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
                fill="currentColor"
              />
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)}>
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      </Modal>
    </header>
  );
};

export default Header;
