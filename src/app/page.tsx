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
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-purple-700 to-indigo-700 text-purple-50 px-4 md:px-8">

      {/* Контент */}
      <div className="flex flex-col items-center justify-center flex-1 text-center">

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 md:mb-4 leading-tight drop-shadow-lg">
          🎨 Көркем еңбек сабағына қош келдің!
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-purple-100/80 max-w-2xl mb-6 md:mb-8">
          Шығармашылық, қиял, тәжірибе — барлығы бір жерде!  
          Мұнда сурет, коллаж, мүсін және арт-техникаларды бірге зерттейміз.
        </p>

        {/* Кеңес карточкасы */}
        <section className="
          bg-white/10 
          backdrop-blur-lg 
          border border-purple-300/20 
          text-purple-50 
          rounded-2xl shadow-2xl 
          mt-6 md:mt-10 
          max-w-2xl w-full 
          p-5 md:p-8 mx-auto
        ">
          <h2 className="text-xl md:text-2xl font-bold mb-3">✨ Бүгінгі арт кеңес</h2>
          <p className="text-base md:text-lg leading-relaxed">
            {fact}
          </p>
        </section>

        {/* Сабақтарға өту */}
        <section className="mt-6 md:mt-8">
          <Link
            href=""
            className="
              bg-pink-500 
              text-white 
              font-semibold 
              px-5 md:px-6 py-3 
              rounded-xl 
              shadow-lg 
              hover:bg-pink-400 
              transition 
              text-base md:text-lg
            "
          >
            📚 Эскиздерді қарау
          </Link>
        </section>
      </div>
    </main>
  );
}
