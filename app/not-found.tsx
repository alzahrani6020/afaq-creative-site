import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-afaq-bg flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-[120px] md:text-[180px] font-extrabold bg-gradient-to-r from-afaq-gold via-afaq-gold2 to-afaq-teal bg-clip-text text-transparent leading-none">
          404
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mt-4">
          الصفحة غير موجودة
        </h1>
        <p className="text-white/40 mt-3 max-w-md mx-auto">
          يبدو أن الصفحة التي تبحث عنها قد تم نقلها أو حذفها. دعنا نعيدك للصفحة الرئيسية.
        </p>
        <Link href="/" className="inline-block mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-afaq-gold to-afaq-gold2 text-afaq-bg font-bold hover:shadow-lg hover:shadow-afaq-gold/30 transition-all">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
