import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        The product or page you&apos;re looking for doesn&apos;t exist or has
        been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/de"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Go Home
        </Link>
        <Link
          href="/de/products"
          className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors border border-gray-300 text-sm"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}
