import Link from "next/link";
import Icon from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4" dir="rtl">
      <div className="max-w-2xl w-full text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="text-[20rem] font-bold text-gray-300">404</div>
          </div>
          
          <div className="relative z-10 space-y-8 py-12">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                  <Icon name="AlertCircle" className="w-16 h-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full animate-pulse delay-75"></div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-bold text-gray-900">
                404
              </h1>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                الصفحة مالقيناهاش! 😅
              </h2>
              <p className="text-xl text-gray-600 max-w-md mx-auto">
                يظهرلي الصفحة اللي قاعد تلوج عليها ماعادش موجودة ولا تبدلت البلاصة
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link
                href="/"
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                <Icon name="Home" className="w-5 h-5" />
                <span>رجوع للرئيسية</span>
              </Link>
              
              <Link
                href="/shop"
                className="group flex items-center gap-3 px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-semibold shadow-md hover:shadow-lg hover:border-blue-500 hover:text-blue-600 transform hover:-translate-y-1 transition-all duration-200"
              >
                <Icon name="ShoppingBag" className="w-5 h-5" />
                <span>تسوق الآن</span>
              </Link>
            </div>

            <div className="pt-12">
              <p className="text-sm text-gray-500 mb-4">ممكن تكون تبحث على:</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href="/shop"
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow-md hover:text-blue-600 transition-all duration-200 text-sm"
                >
                  المنتجات
                </Link>
                <Link
                  href="/favorites"
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow-md hover:text-blue-600 transition-all duration-200 text-sm"
                >
                  المفضلة
                </Link>
                <Link
                  href="/cart"
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow-md hover:text-blue-600 transition-all duration-200 text-sm"
                >
                  السلة
                </Link>
                <Link
                  href="/account"
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow-md hover:text-blue-600 transition-all duration-200 text-sm"
                >
                  حسابي
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            لو المشكل مازال موجود، تنجم تتصل بينا و نساعدوك 💙
          </p>
        </div>
      </div>
    </div>
  );
}

