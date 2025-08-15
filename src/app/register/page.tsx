"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName, email, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(()=>({}));
      alert(j.error || "Failed to register");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Team name"
               value={teamName} onChange={e=>setTeamName(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Email"
               value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password"
               value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-black text-white rounded px-3 py-2">Create</button>
      </form>
    </div>
  );
}
