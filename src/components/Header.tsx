"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="w-full bg-gradient-to-br from-purple-700 to-indigo-700 text-white shadow-md">
      
      {/* 🔹 Top part (Logo + Menu) */}
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        
        {/* 🎨 Лого */}
        <h1>
          <Link
            href=""
            className="text-xl md:text-2xl font-bold hover:underline"
          >
            🎨 QAZART
          </Link>
        </h1>

        {/* 🧭 Навигация — ПК */}
        <nav className="hidden md:flex gap-6 items-center text-sm md:text-base">
          <Link href="" className="hover:underline">Басты бет</Link>
          <Link href="/i" className="hover:underline">Эскиздер</Link>

          {!loading && !user && (
            <Link href="/auth/sign_i" className="hover:underline">
              Кіру / Тіркелу
            </Link>
          )}

          {!loading && user && (
            <Link href="/profil" className="hover:underline">
              Профиль
            </Link>
          )}
        </nav>

        {/* 📱 Мобиль мәзір кнопка */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded hover:bg-purple-800 transition text-lg"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Навигацияны ашу"
        >
          {menuOpen ? "✖️" : "☰"}
        </button>
      </div>

      {/* 📱 Мобиль мәзір */}
      {menuOpen && (
        <nav className="md:hidden flex flex-col items-center bg-indigo-800 py-4 space-y-3 text-base">
          <Link href="" className="hover:underline" onClick={() => setMenuOpen(false)}>
            Басты бет
          </Link>
          <Link href="/s" className="hover:underline" onClick={() => setMenuOpen(false)}>
            Эскиздер
          </Link>

          {!loading && !user && (
            <Link
              href="/auth/sign_i"
              className="hover:underline"
              onClick={() => setMenuOpen(false)}
            >
              Кіру/Тіркелу
            </Link>
          )}

          {!loading && user && (
            <Link
              href="/profil"
              className="hover:underline"
              onClick={() => setMenuOpen(false)}
            >
              Профиль
            </Link>
          )}
        </nav>
      )}

      {/* 🔹 Мұғалім + Оқушы туралы info bar */}
      <div className="w-full bg-purple-900/60 text-purple-100 text-center text-xs md:text-sm py-2 px-4 backdrop-blur-sm">
       
      </div>

    </header>
  );
}
