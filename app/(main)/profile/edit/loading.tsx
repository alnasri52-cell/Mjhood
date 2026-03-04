export default function ProfileEditLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6 animate-pulse">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-full" />
                </div>
                {/* Form fields */}
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="mb-5">
                        <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
                        <div className="h-10 bg-gray-200 rounded-lg" />
                    </div>
                ))}
                {/* Save button */}
                <div className="h-12 bg-gray-200 rounded-lg mt-6" />
            </div>
        </div>
    );
}
