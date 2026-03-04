export default function SearchLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Search bar skeleton */}
                <div className="h-12 bg-gray-200 rounded-xl animate-pulse mb-6" />
                {/* Filter pills */}
                <div className="flex gap-2 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
                    ))}
                </div>
                {/* Result cards */}
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 mb-4 shadow-sm animate-pulse">
                        <div className="flex gap-4">
                            <div className="h-16 w-16 bg-gray-200 rounded-lg flex-shrink-0" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-1/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
