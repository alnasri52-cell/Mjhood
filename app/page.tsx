export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-blue-500">Mjhood</h1>
        <h2 className="text-2xl font-light text-gray-400">Under Construction</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          We are currently preparing our platform for launch. Please check back soon.
        </p>

        {/* Secret Developer Access */}
        <div className="pt-20 opacity-0 hover:opacity-100 transition-opacity duration-500">
          <a href="/map" className="text-xs text-gray-800 hover:text-gray-600">Developer Access</a>
        </div>
      </div>
    </div>
  );
}
