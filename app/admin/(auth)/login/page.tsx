"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("========== LOGIN RESULT ==========");
      console.log("DATA:", data);
      console.log("ERROR:", error);
      console.log("==================================");

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      console.error("========== FULL ERROR ==========");
      console.error(err);
      console.error("================================");

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-2xl border border-yellow-500/20 bg-zinc-900 p-8 shadow-2xl"
      >
        <h1 className="text-4xl font-bold text-yellow-400">
          Nexar CMS
        </h1>

        <p className="mt-2 text-zinc-400">
          Founder Login
        </p>

        <input
          type="email"
          placeholder="Email"
          className="mt-8 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="mt-4 text-sm text-red-500 break-all">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? "Signing In..." : "Login"}
        </button>
      </form>
    </main>
  );
}
