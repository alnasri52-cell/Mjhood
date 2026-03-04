import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <div className="bg-white rounded-2xl p-10 shadow-lg max-w-md w-full">
                <div className="text-6xl mb-4">🗺️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                <p className="text-gray-500 mb-6">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/map"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    Go to Map
                </Link>
            </div>
        </div>
    );
}
