export default function MapLoading() {
    return (
        <div className="h-screen w-full bg-gray-100 animate-pulse relative">
            {/* Fake map header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm p-3 flex gap-3">
                <div className="h-10 bg-gray-200 rounded-lg flex-1" />
                <div className="h-10 w-10 bg-gray-200 rounded-lg" />
            </div>
            {/* Fake map area */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-100" />
            {/* Fake bottom card */}
            <div className="absolute bottom-6 left-4 right-4 bg-white rounded-xl shadow-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
        </div>
    );
}
