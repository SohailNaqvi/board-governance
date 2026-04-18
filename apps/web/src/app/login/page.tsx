"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllSeedUsers } from "../../lib/auth";

export default function LoginPage(): React.ReactNode {
  const router = useRouter();
  const [selectedEmail, setSelectedEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const users = getAllSeedUsers();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmail) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selectedEmail }),
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        alert("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Development Mode - Select a user to login
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="user-select"
              className="block text-sm font-medium text-gray-700"
            >
              Select User
            </label>
            <select
              id="user-select"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Choose a user --</option>
              {users.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!selectedEmail || isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
