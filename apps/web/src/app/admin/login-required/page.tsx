import Link from "next/link";

export default function LoginRequiredPage(): React.ReactNode {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow text-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Login Required</h2>
          <p className="mt-4 text-gray-600">
            You need to log in to access the admin panel.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
