"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // 🔥 Spinner үшін
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/"); 
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl">

        <h1 className="text-3xl font-extrabold text-center text-white mb-6 drop-shadow-lg">
          Кіру
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 bg-white/20 text-white placeholder-purple-200 border border-white/30 rounded-lg 
                       focus:ring-2 focus:ring-pink-400 focus:outline-none backdrop-blur-sm"
          />
          <input
            type="password"
            placeholder="Құпиясөз"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 bg-white/20 text-white placeholder-purple-200 border border-white/30 rounded-lg 
                       focus:ring-2 focus:ring-pink-400 focus:outline-none backdrop-blur-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Күтіңіз...
              </div>
            ) : (
              "Кіру"
            )}
          </button>
        </form>

        {error && (
          <p className="text-red-300 text-sm text-center mt-4">{error}</p>
        )}

        <p className="text-sm text-purple-100/80 text-center mt-6">
          Аккаунтыңыз жоқ па?{" "}
          <a href="./signup" className="text-white font-semibold hover:underline">
            Тіркелу
          </a>
        </p>
      </div>
    </div>
  );
}
