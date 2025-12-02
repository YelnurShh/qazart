"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fact, setFact] = useState<string>("");

  useEffect(() => {
    const facts = [
      "Күлгін және сары түсті бірге қолдану — композицияға контраст пен энергия береді.",
      "Light & Shadow техникасы — форманың көлемін көрсетудің ең күшті тәсілдерінің бірі.",
      "Акрил бояуы тез кебеді, сондықтан түсті тез әрі батыл араластыруға мүмкіндік береді.",
      "Градиентті тегіс ету үшін — үлкен жұмсақ қылқаламмен шеттарын жайлап біріктір.",
      "Креативті артта текстураны қаңылтыр, жіп, мата сияқты материалдармен жасауға болады.",
      "Өнерде қате деген жоқ — әр штрих жаңа идеяға жол ашады."
    ];
    setFact(facts[Math.floor(Math.random() * facts.length)]);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#2E026D] via-[#5F2EEA] to-[#3B82F6] text-slate-50">

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Шығармашылықты қосыңыз.
            <span className="block text-indigo-100/90 mt-2 text-2xl md:text-3xl font-semibold">Эскиздермен үйреніп, тәжірибе жасаңыз.</span>
          </h2>

          <p className="text-slate-100/80 max-w-xl mb-6">
            Практикалық тапсырмалар, мұғалімдер салған эскиздер және күнделікті кеңестер — бәрі оқушыларға арналған.
            Мәтінді қарапайым және түсінікті етіп сақтаңыз: жасаңыз, бояңыз, түсініктеме беріңіз.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <Link
    href="./isk"
    className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-3 rounded-xl shadow-lg hover:translate-y-0.5 transform transition"
  >
    📚 Эскиздерді қарау
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  </Link>

  <Link
    href="./apay"
    className="inline-flex items-center justify-center gap-2 bg-indigo-600/80 text-white font-semibold px-5 py-3 rounded-xl ring-1 ring-white/10 hover:brightness-105 transition"
  >
    ❓ Сұрақ-жауап
  </Link>

  <Link
    href="./tasks"
    className="inline-flex items-center justify-center gap-2 bg-pink-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg hover:bg-pink-400 transition"
  >
    📘 Тапсырмалар
  </Link>
</div>

          {/* small card */}
          <div className="mt-8 w-full max-w-md bg-white/6 border border-white/8 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-2xl">✨</div>
            <div>
              <div className="text-sm text-white/90 font-semibold">Бүгінгі кеңес</div>
              <p className="text-sm text-white/80 mt-1 leading-snug">{fact}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="bg-white/6 border border-white/6 rounded-2xl p-5 hover:scale-[1.01] transition">
            <h3 className="font-bold text-white/90 mb-2">Ұпай мен мотивация</h3>
            <p className="text-sm text-white/80">Оқушыларға ұпай арқылы мотивация. Әр аяқталған эскиз — 10 ұпай.</p>
          </article>

          <article className="bg-white/6 border border-white/6 rounded-2xl p-5 hover:scale-[1.01] transition">
            <h3 className="font-bold text-white/90 mb-2">Мұғалімнің бақылауы</h3>
            <p className="text-sm text-white/80">Мұғалімдер өз эскиздерін жүктейді, өзгертіп, қажет болса өшіреді.</p>
          </article>

          <article className="bg-white/6 border border-white/6 rounded-2xl p-5 hover:scale-[1.01] transition">
            <h3 className="font-bold text-white/90 mb-2">Оңай сақтау</h3>
            <p className="text-sm text-white/80">Оқушылар суреттерді құрылғыға жүктей алады немесе архивтеп алады.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
