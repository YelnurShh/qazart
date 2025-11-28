"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/"); // кіргеннен кейін басты бетке
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Белгісіз қате шықты");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 px-4">
      
      {/* Glassmorphism Card */}
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
            className="w-full bg-purple-700 hover:bg-purple-400 text-white font-semibold py-3 rounded-lg shadow-lg transition"
          >
            Кіру
          </button>
        </form>

        {error && (
          <p className="text-red-300 text-sm text-center mt-4">{error}</p>
        )}

        <p className="text-sm text-purple-100/80 text-center mt-6">
          Аккаунтыңыз жоқ па?{" "}
          <a
            href="./signup"
            className="text-white font-semibold hover:underline"
          >
            Тіркелу
          </a>
        </p>
      </div>
    </div>
  );
}
