"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ValidationError {
  field: string;
  message: string;
}

const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 12 characters" },
  { id: "uppercase", label: "At least one uppercase letter (A-Z)" },
  { id: "lowercase", label: "At least one lowercase letter (a-z)" },
  { id: "digit", label: "At least one digit (0-9)" },
];

function validatePasswordStrength(password: string): Record<string, boolean> {
  return {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
  };
}

export default function ChangePasswordPage(): React.ReactNode {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<Record<string, boolean>>({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
  });

  useEffect(() => {
    setValidation(validatePasswordStrength(newPassword));
  }, [newPassword]);

  const isPasswordValid = Object.values(validation).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && newPassword !== "";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Password does not meet all requirements");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to change password");
        return;
      }

      // Redirect to admin compliance rules page
      router.push("/admin/compliance/rules");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Change Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please set a new password for your account
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="current-password"
              className="block text-sm font-medium text-gray-700"
            >
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />

            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-gray-700">
                Password requirements:
              </p>
              <ul className="space-y-1">
                {PASSWORD_REQUIREMENTS.map((req) => (
                  <li
                    key={req.id}
                    className={`text-xs flex items-center ${
                      validation[req.id] ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    <span className={`mr-2 ${validation[req.id] ? "text-green-600" : "text-gray-400"}`}>
                      {validation[req.id] ? "✓" : "○"}
                    </span>
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
            {newPassword && confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || !passwordsMatch}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Changing password..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
