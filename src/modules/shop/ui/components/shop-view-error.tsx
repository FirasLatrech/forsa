const ShopViewError = () => {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
            <div className="text-center">
                <div className="text-6xl mb-4">😕</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">صار مشكل</h2>
                <p className="text-gray-600 mb-6">ما نجمناش نجيبو المنتجات. حاول مرة أخرى.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                    حاول مرة أخرى
                </button>
            </div>
        </div>
    );
};

export default ShopViewError;

