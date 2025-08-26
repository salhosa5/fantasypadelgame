"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const sp = useSearchParams();
  const nextUrl = sp.get("next") || "/my-team";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, email, password }),
      });
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Failed to register");
        return;
      }
      
      router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md mx-auto p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600">Join UAE Pro League Fantasy</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Team Name</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Enter your team name"
              value={teamName} 
              onChange={e => setTeamName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Enter your email"
              type="email"
              autoComplete="username"
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Enter your password" 
              type="password"
              autoComplete="new-password"
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            className="w-full bg-black text-white font-medium rounded-lg px-4 py-3 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(nextUrl)}`} className="text-blue-600 hover:text-blue-800 font-medium">
            Sign in
          </Link>
        </div>
        
        <div className="text-center">
          <Link href="/rules" className="text-sm text-blue-600 hover:text-blue-800">
            Learn the Rules
          </Link>
        </div>
      </div>
    </div>
  );
}