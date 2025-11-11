"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";

const SubHeader = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    { 
      id: "home", 
      label: "مواد منزلية", 
      href: "/shop/home",
      subcategories: [
        { label: "فرش و بطانيات", href: "/shop/home/bedding" },
        { label: "ديكور", href: "/shop/home/decor" },
        { label: "تنظيف", href: "/shop/home/cleaning" },
        { label: "تخزين", href: "/shop/home/storage" },
      ]
    },
    { 
      id: "beauty", 
      label: "مواد تجميل", 
      href: "/shop/beauty",
      subcategories: [
        { label: "عناية بالبشرة", href: "/shop/beauty/skincare" },
        { label: "عناية بالشعر", href: "/shop/beauty/haircare" },
        { label: "مكياج", href: "/shop/beauty/makeup" },
        { label: "عطور", href: "/shop/beauty/perfumes" },
      ]
    },
    { 
      id: "kitchen", 
      label: "أدوات المطبخ", 
      href: "/shop/kitchen",
      subcategories: [
        { label: "أواني الطبخ", href: "/shop/kitchen/cookware" },
        { label: "أدوات التقطيع", href: "/shop/kitchen/cutting" },
        { label: "تخزين الطعام", href: "/shop/kitchen/storage" },
        { label: "أدوات الخبز", href: "/shop/kitchen/baking" },
      ]
    },
    { 
      id: "accessories", 
      label: "إكسسوارات", 
      href: "/shop/accessories",
      subcategories: [
        { label: "مجوهرات", href: "/shop/accessories/jewelry" },
        { label: "ساعات", href: "/shop/accessories/watches" },
        { label: "نظارات", href: "/shop/accessories/glasses" },
        { label: "محافظ", href: "/shop/accessories/wallets" },
      ]
    },
    { 
      id: "toys", 
      label: "ألعاب", 
      href: "/shop/toys",
      subcategories: [
        { label: "ألعاب تعليمية", href: "/shop/toys/educational" },
        { label: "ألعاب إلكترونية", href: "/shop/toys/electronic" },
        { label: "ألعاب خارجية", href: "/shop/toys/outdoor" },
        { label: "دمى و عرائس", href: "/shop/toys/dolls" },
      ]
    },
    { 
      id: "electronics", 
      label: "إلكترونيات", 
      href: "/shop/electronics",
      subcategories: [
        { label: "إكسسوارات الهواتف", href: "/shop/electronics/phone" },
        { label: "سماعات", href: "/shop/electronics/audio" },
        { label: "شواحن و كوابل", href: "/shop/electronics/chargers" },
        { label: "مكبرات صوت", href: "/shop/electronics/speakers" },
      ]
    },
  ];

  return (
    <>
      <div 
        className="relative bg-white border-b border-gray-100" 
        dir="rtl" 
        style={{ fontFamily: 'Cairo, sans-serif' }}
        onMouseLeave={() => setActiveCategory(null)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <nav className="flex items-center gap-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onMouseEnter={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeCategory === category.id
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm">
                <Icon name="shipping" className="size-4 text-gray-700" fill="currentColor" />
                <span className="text-gray-700 font-medium">توصيل مجاني للطلبيات أكثر من 50 دينار</span>
              </div>
              
              <div className="h-4 w-px bg-gray-200 hidden md:block"></div>
              
              <Link 
                href="/offers" 
                className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                <Icon name="tag" className="size-4" fill="currentColor" />
                <span>عروض خاصة</span>
              </Link>
            </div>
          </div>

          <div className="md:hidden py-2 flex items-center gap-2 text-xs text-gray-600">
            <Icon name="shipping" className="size-3.5" fill="currentColor" />
            <span>توصيل مجاني +50د</span>
            <span className="text-gray-300">•</span>
            <Link href="/offers" className="text-red-600 font-medium">
              عروض خاصة
            </Link>
          </div>
        </div>

        <div
          className={`absolute left-0 right-0 bg-white shadow-sm border-b border-gray-100 z-50 overflow-hidden ${
            activeCategory
              ? "dropdown-enter"
              : "dropdown-exit"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {categories.map((category) => (
              <div
                key={category.id}
                className={activeCategory === category.id ? "block" : "hidden"}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {category.subcategories.map((subcategory, index) => (
                    <Link
                      key={subcategory.href}
                      href={subcategory.href}
                      className="group py-3 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200 ease-out"
                      style={{
                        animation: activeCategory === category.id 
                          ? `fadeInSmooth 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.04}s both` 
                          : 'none'
                      }}
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        {subcategory.label}
                      </span>
                    </Link>
                  ))}
                </div>
                <div 
                  className="mt-6 pt-6 border-t border-gray-100"
                  style={{
                    animation: activeCategory === category.id 
                      ? 'fadeInSmooth 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' 
                      : 'none'
                  }}
                >
                  <Link
                    href={category.href}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700 transition-all duration-200"
                  >
                    <span>عرض الكل</span>
                    <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .dropdown-enter {
          animation: dropdownSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .dropdown-exit {
          animation: dropdownSlideOut 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
          pointer-events: none;
        }

        @keyframes dropdownSlideIn {
          0% {
            opacity: 0;
            transform: translateY(-12px) scaleY(0.95);
            max-height: 0;
          }
          50% {
            opacity: 0.5;
            max-height: 500px;
          }
          100% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
            max-height: 500px;
          }
        }

        @keyframes dropdownSlideOut {
          0% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
            max-height: 500px;
          }
          100% {
            opacity: 0;
            transform: translateY(-8px) scaleY(0.98);
            max-height: 0;
          }
        }

        @keyframes fadeInSmooth {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default SubHeader;

