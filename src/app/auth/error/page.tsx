
export default function AuthError() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
        <p className="mt-2">Something went wrong during authentication.</p>
        <a href="/auth/login" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
          Try Again
        </a>
      </div>
    </div>
  );
}