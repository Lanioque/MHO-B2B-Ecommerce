/**
 * Debug Auth Page
 * Shows current authentication status from all sources
 */

import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function DebugAuthPage() {
  const session = await auth();
  const cookieStore = await cookies();
  
  const allCookies = cookieStore.getAll();
  const authCookies = allCookies.filter(c => 
    c.name.includes('auth') || c.name.includes('session')
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Debug Page</h1>
        
        {/* Session Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">NextAuth Session</h2>
          <div className="space-y-2">
            <div>
              <strong>Authenticated:</strong>{" "}
              <span className={session?.user ? "text-green-600" : "text-red-600"}>
                {session?.user ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            {session?.user && (
              <>
                <div><strong>User ID:</strong> {session.user.id}</div>
                <div><strong>Email:</strong> {session.user.email}</div>
                <div><strong>Name:</strong> {session.user.name || "N/A"}</div>
              </>
            )}
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Authentication Cookies</h2>
          {authCookies.length > 0 ? (
            <div className="space-y-2">
              {authCookies.map((cookie) => (
                <div key={cookie.name} className="border-b pb-2">
                  <div><strong>{cookie.name}</strong></div>
                  <div className="text-sm text-gray-600 truncate">
                    {cookie.value.substring(0, 50)}...
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">No authentication cookies found</p>
          )}
        </div>

        {/* All Cookies */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">All Cookies ({allCookies.length})</h2>
          <div className="max-h-96 overflow-auto">
            <pre className="text-xs">
              {JSON.stringify(
                allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 30) + '...' })),
                null,
                2
              )}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <a href="/login" className="text-blue-600 hover:underline">
              Go to Login
            </a>
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Go to Dashboard
            </a>
            <a href="/api/auth/signout" className="text-red-600 hover:underline">
              Sign Out
            </a>
          </div>
        </div>

        {/* Expected Behavior */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Expected Behavior</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>If authenticated: /login and /register should redirect to /dashboard</li>
            <li>If not authenticated: /dashboard should redirect to /login</li>
            <li>Middleware should log redirects in the server console</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

