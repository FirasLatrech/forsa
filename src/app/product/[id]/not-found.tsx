import Link from "next/link";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className="text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ما لقيناش المنتج</h2>
        <p className="text-gray-600 mb-6">المنتج اللي تبحث عليه غير موجود</p>
        <Link href="/shop" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
          رجوع للحوايج
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

