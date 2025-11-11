"use client";

import { useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useTRPC } from "@/trpc/client";

interface ProductDetailViewProps {
  productSlug: string;
}

const ProductDetailView = ({ productSlug }: ProductDetailViewProps) => {
  const trpc = useTRPC();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [animatingItem, setAnimatingItem] = useState(false);

  const { data: product } = useSuspenseQuery(
    trpc.products.getBySlug.queryOptions({ slug: productSlug })
  );

  const { data: recommendedProducts = [] } = useQuery(
    trpc.products.getFeatured.queryOptions({ limit: 4 })
  );

  const productImages = (product.images as string[]) || [];
  const images = productImages.length > 0 ? productImages : ['/images/login-pic-1.jpg'];
  const features = product.descriptionAr?.split('.').filter(f => f.trim()) || [];

  const handleAddToCart = () => {
    const productImageElement = document.querySelector('[data-main-product-image]') as HTMLElement;
    const cartIcon = document.querySelector('[href="/cart"]');
    
    if (productImageElement && cartIcon) {
      const imageRect = productImageElement.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();
      
      const clone = productImageElement.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = `${imageRect.left}px`;
      clone.style.top = `${imageRect.top}px`;
      clone.style.width = `${imageRect.width}px`;
      clone.style.height = `${imageRect.height}px`;
      clone.style.zIndex = '9999';
      clone.style.pointerEvents = 'none';
      clone.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
      clone.style.borderRadius = '1rem';
      clone.style.overflow = 'hidden';
      
      document.body.appendChild(clone);
      
      requestAnimationFrame(() => {
        clone.style.transform = `translate(${cartRect.left - imageRect.left + cartRect.width / 2}px, ${cartRect.top - imageRect.top}px) scale(0.1) rotate(360deg)`;
        clone.style.opacity = '0';
      });
      
      setTimeout(() => {
        clone.remove();
      }, 800);
      
      setAnimatingItem(true);
      setTimeout(() => {
        setAnimatingItem(false);
      }, 800);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideUp {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className="bg-white min-h-screen" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Icon name="arrow" className="size-4" fill="currentColor" />
              <span>رجوع للحوايج</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            <div className="space-y-4">
              <div 
                className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group"
                data-main-product-image
              >
                <Image
                  src={images[selectedImage]}
                  alt={product.nameAr}
                  fill
                  className="object-cover"
                  priority
                />
                
                {selectedImage > 0 && (
                  <button
                    onClick={() => setSelectedImage(selectedImage - 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="arrow" className="size-6" fill="currentColor" />
                  </button>
                )}
                
                {selectedImage < images.length - 1 && (
                  <button
                    onClick={() => setSelectedImage(selectedImage + 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 rotate-180"
                  >
                    <Icon name="arrow" className="size-6" fill="currentColor" />
                  </button>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedImage === index
                          ? "bg-white w-8"
                          : "bg-white/60 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all snap-start ${
                        selectedImage === index
                          ? "border-gray-900 scale-95"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.nameAr} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {product.nameAr}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-bold text-gray-900">{product.price} د.ت</span>
                  {product.compareAtPrice && (
                    <span className="text-xl text-gray-400 line-through">{product.compareAtPrice} د.ت</span>
                  )}
                </div>
                <span className={`px-3 py-1 ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-sm font-medium rounded-full`}>
                  {product.stock > 0 ? 'متوفر' : 'غير متوفر'}
                </span>
              </div>

              <p className="text-gray-700 leading-relaxed mb-8">
                {product.descriptionAr || product.description}
              </p>

              {features.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">المميزات:</h3>
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Icon name="checkmark" className="size-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" />
                        <span className="text-gray-700">{feature.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6 mt-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-6 py-3 hover:bg-gray-100 active:scale-95 transition-all text-gray-700 font-medium text-lg"
                    >
                      -
                    </button>
                    <div className="px-8 py-3 text-center font-bold text-gray-900 border-x-2 border-gray-300 relative overflow-hidden min-w-[4rem]">
                      <span 
                        key={quantity}
                        className="inline-block animate-[slideUp_0.3s_ease-out]"
                      >
                        {quantity}
                      </span>
                    </div>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-6 py-3 hover:bg-gray-100 active:scale-95 transition-all text-gray-700 font-medium text-lg"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={animatingItem || product.stock === 0}
                    className={`flex-1 bg-gray-900 text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 ${
                      (animatingItem || product.stock === 0) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Icon name="cart" className="size-5" fill="currentColor" />
                    <span>{product.stock === 0 ? 'غير متوفر' : 'زيد للسلة'}</span>
                  </button>
                </div>

                <button className="w-full mt-3 border-2 border-gray-300 text-gray-700 py-3 px-8 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Icon name="heart" className="size-5" fill="currentColor" />
                  <span>زيد للمفضلة</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">حوايج مقترحة</h2>
              <p className="text-gray-600">حوايج أخرى قد تعجبك</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {recommendedProducts.map((item) => {
                const itemImages = (item.images as string[]) || [];
                const firstImage = itemImages[0] || '/images/login-pic-1.jpg';
                
                return (
                  <Link
                    key={item.id}
                    href={`/product/${item.slug}`}
                    className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      <Image
                        src={firstImage}
                        alt={item.nameAr}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 hover:text-gray-700 transition-colors">
                        {item.nameAr}
                      </h3>
                      <p className="text-lg font-bold text-gray-900">
                        {item.price} د.ت
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const ProductDetailViewSuspense = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">جاري التحميل...</div>
    </div>
  );
};

export default ProductDetailView;
