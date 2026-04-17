"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@ums/domain";

interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export default function DashboardPage(): React.ReactNode {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/me");
        if (!response.ok) {
          router.push("/login");
          return;
        }
        const userData = await response.json();
        setUser(userData);
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleDashboards: Record<UserRole, string> = {
    AUTHORIZED_PROPOSER: "Proposer Dashboard",
    FEEDER_BODY_SECRETARY: "Feeder Body Secretary Dashboard",
    REGISTRAR: "Registrar Dashboard",
    TREASURER_LEGAL: "Treasurer/Legal Dashboard",
    VICE_CHANCELLOR: "Vice Chancellor Dashboard",
    SYNDICATE_MEMBER: "Syndicate Member Dashboard",
    SYSTEM_ADMINISTRATOR: "System Administrator Dashboard",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Welcome, {user.name}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{user.email}</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Dashboard</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {roleDashboards[user.role]}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg opacity-50 cursor-not-allowed">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-400">Meeting Calendar</h4>
            <p className="mt-2 text-sm text-gray-400">Slice 3 - Coming Soon</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg opacity-50 cursor-not-allowed">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-400">APCE</h4>
            <p className="mt-2 text-sm text-gray-400">Slice 2 - Coming Soon</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg opacity-50 cursor-not-allowed">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-400">Workspaces</h4>
            <p className="mt-2 text-sm text-gray-400">Slices 4,6,7 - Coming Soon</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg opacity-50 cursor-not-allowed">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-400">Intelligence</h4>
            <p className="mt-2 text-sm text-gray-400">Slice 4+ - Coming Soon</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg opacity-50 cursor-not-allowed">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-lg font-medium text-gray-400">Cockpit</h4>
            <p className="mt-2 text-sm text-gray-400">Slice 5 - Coming Soon</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
