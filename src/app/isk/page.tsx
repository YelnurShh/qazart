"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  runTransaction,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

type Sketch = {
  id: string;
  title: string;
  imageUrl?: string;
  description?: string;
};

// 🔹 Алдын ала кодталған эскиздер — қыздардың көйлектері
const PRELOADED_SKETCHES: Sketch[] = [
  {
    id: "sketch-01",
    title: "Плиссирленген етекті сәнді көйлек (алдыңғы және артқы көрініс)",
    imageUrl: "/sketches/9823278.jpg",
    description:
      "Бұл модель белден төмен толықтай плиссирленген етегі бар классикалық қыздар көйлегі. Алдыңғы бөлігінде V-тәрізді ойынды, бел тұсында сәндік бантик орналастырылған. Қысқа жеңді, силуэті жарасымды, эстетикалық таза сызықтардан тұрады. Артқы бөлігі түзу сызықты шілтерлі (вытачка) және белдік сызығы анық көрінеді. Киім конструкциясын сызу, пішінін талдау және сәндік элементтерді белгілеу жаттығулары үшін өте қолайлы эскиз..",
  },
  {
    id: "sketch-02",
    title: "Шарша етекті классикалық қыздар көйлегі",
    imageUrl: "/sketches/9847800.jpg",
    description:
      "Бұл модель қысқа жеңді, кең квадрат пішінді ойындысы бар классикалық қыздар көйлегі. Алдыңғы бөлігінде декоративті үш түйме және фигураны айқындайтын тік сызықты рельефтік тігістер орналасқан. Белден төмен жұмсақ көлемді (сборка) етек беріліп, төменгі бөлігіндегі декоративті жолақ көйлекке нәзік сәндік акцент қосады. Артқы бөлімі қарапайым әрі таза пішілген — талғамды силуэтті жаттықтыруға арналған тамаша эскиз.",
  },
  {
    id: "sketch-03",
    title: "Корсет белді сәндік қысқа көйлек",
    imageUrl: "/sketches/9859051.jpg",
    description:
      "Бұл модель заманауи корсет стиліндегі қыздар көйлегі. Алдыңғы бөлігінде формалы кеуде пішіні, декоративті тік рельеф тігістері және түйме тәрізді сәндік элементтер орналасқан. Қабыршақталған үлкейтілген қолғап-жеңдер (пышные рукава) силуэтке романтикалық көрініс береді. Белден төмен жұмсақ, толқынды етіп салынған етек қозғалысты әдемі көрсетеді. Артқы бөлігінде корсет тәрізді тік сызықтар фигураны айқындай түседі. Бұл эскиз — корсет құрылымын, жең формасын және көлемді етекті сызуды меңгеруге арналған тамаша үлгі.",
  },
  {
    id: "sketch-04",
    title: "Ағымды силуэтті V-ойынды жеңіл көйлек",
    imageUrl: "/sketches/9931662.jpg",
    description:
      "Бұл модельдің басты ерекшелігі — терең V тәрізді ойындысы мен иықтан төмен түсетін жұмсақ фалды жеңдері. Алдыңғы және артқы бөлігінде матаның табиғи ағымын көрсететін нәзік бүктер (драпировка) жасалған. Бел сызығы нақты белгіленген, ал етегі кең, толқынды формада түседі. Силуэттің жеңілдігі мен қозғалыстағы әсемдігін көрсетуге арналған тамаша эскиз. Жеңіл маталармен жұмыс істеуді, драпировка жасауды және көлемді етекті пішуді үйренуге өте қолайлы.",
  },
  {
    id: "sketch-05",
    title: "Ұзын етекті, V-ойынды классикалық көйлек",
    imageUrl: "/sketches/9931688.jpg",
    description:
      "Бұл модель ұзын, кең етекті және талғампаз силуэтке ие классикалық көйлек. Алдыңғы бөлігінде терең V-пішінді ойынды мен фигураны айқындайтын рельефтік тігістер орналасқан. Жеңдері көлемді (фонарь-жең), білезік тұсында манжетпен және сәндік түймелермен толықтырылған. Артқы көріністе де V тәрізді ойынды сақталған, ал етек сызығы біркелкі, ағымды формада салынған. Бұл эскиз жең конструкциясын, ұзын силуэтті және рельефті сызықтарды жаттықтыру үшін өте қолайлы.",
  },
  {
    id: "sketch-06",
    title: "Алдыңғы декоративті сызықтары бар денеге қонымды көйлек",
    imageUrl: "/sketches/9859116.jpg",
    description:
      "Бұл модель денеге қонымды, талды айқын көрсететін силуэтке ие қысқа жеңді көйлек. Алдыңғы бөлігінде тік рельефті сызықтар, орталық бойымен түймелі планка және толқын тәрізді сәндік өңдеу (декоративті фестон) орналасқан. Жеңдері қысқа әрі сәндік бөлшектермен толықтырылған. Артқы көріністе де рельефтік сызықтар силуэтті ұзартып, фигураны көркем көрсетеді. Бұл эскиз — рельеф сызықтарын, декоративті элементтерді және тар, қонымды силуэтті сызуды үйренуге арналған тамаша үлгі.",
  },
];

export default function SketchesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [points, setPoints] = useState<number | null>(null);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [selectedSketch, setSelectedSketch] = useState<Sketch | null>(null); // толық ашу үшін
  const [openDesc, setOpenDesc] = useState<Record<string, boolean>>({}); // сипаттамаларды ашу/жабу
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/auth/sign_in");
        return;
      }
      setUser(u);

      // Firestore-дан қолданушы деректерін аламыз: points және completedSketches
      try {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          setPoints(typeof data.points === "number" ? data.points : 0);
          const list: string[] = Array.isArray(data.completedSketches)
            ? data.completedSketches
            : [];
          const map: Record<string, boolean> = {};
          list.forEach((id) => (map[id] = true));
          setCompleted(map);
        } else {
          // Егер құжат жоқ болса — бастапқы мәндермен құжатын жасай аламыз
          await setDoc(doc(db, "users", u.uid), {
            points: 0,
            completedSketches: [],
          });
          setPoints(0);
          setCompleted({});
        }
      } catch (err) {
        console.error("Firestore load user error", err);
      }
    });

    return () => unsub();
  }, [router]);

  // Эскизді орындады деп белгілегенде орындалатын функция
  const markComplete = async (sketchId: string) => {
    if (!user) return;
    if (completed[sketchId]) return; // екі рет ұпай санамас үшін

    setProcessing((p) => ({ ...p, [sketchId]: true }));

    const userRef = doc(db, "users", user.uid);

    try {
      // Транзакция арқылы атомарлы түрде ұпай қосып, completedSketches-ке id қосамыз
      await runTransaction(db, async (tx) => {
        const uSnap = await tx.get(userRef);
        if (!uSnap.exists()) {
          tx.set(userRef, { points: 10, completedSketches: [sketchId] });
          setPoints(10);
          return;
        }

        const data = uSnap.data() as any;
        const currentPoints = typeof data.points === "number" ? data.points : 0;
        const done: string[] = Array.isArray(data.completedSketches)
          ? data.completedSketches
          : [];

        if (done.includes(sketchId)) {
          // Егер басқа клиентпен бұрын өңделген болса — ештеңе істемейміз
          return;
        }

        const newPoints = currentPoints + 10;
        tx.update(userRef, {
          points: newPoints,
          completedSketches: arrayUnion(sketchId),
        });

        // жергілікті күйді дереу жаңартамыз
        setPoints(newPoints);
        setCompleted((m) => ({ ...m, [sketchId]: true }));
      });
    } catch (err) {
      console.error("markComplete error", err);
      // балама: егер транзакция мүмкін болмаса — updateDoc-пен орындау
      try {
        await updateDoc(userRef, {
          points: (points || 0) + 10,
          completedSketches: arrayUnion(sketchId),
        });
        setPoints((p) => (p === null ? 10 : p + 10));
        setCompleted((m) => ({ ...m, [sketchId]: true }));
      } catch (e) {
        console.error("fallback update error", e);
      }
    } finally {
      setProcessing((p) => ({ ...p, [sketchId]: false }));
    }
  };

  // Белгіленгенді алып тастау (қалаған жағдайда)
  const undoComplete = async (sketchId: string) => {
    if (!user) return;
    if (!completed[sketchId]) return;
    setProcessing((p) => ({ ...p, [sketchId]: true }));
    const userRef = doc(db, "users", user.uid);
    try {
      await runTransaction(db, async (tx) => {
        const uSnap = await tx.get(userRef);
        if (!uSnap.exists()) return;
        const data = uSnap.data() as any;
        const currentPoints = typeof data.points === "number" ? data.points : 0;
        const newPoints = Math.max(0, currentPoints - 10);
        tx.update(userRef, {
          points: newPoints,
          completedSketches: arrayRemove(sketchId),
        });
        setPoints(newPoints);
        setCompleted((m) => {
          const copy = { ...m };
          delete copy[sketchId];
          return copy;
        });
      });
    } catch (err) {
      console.error("undo error", err);
    } finally {
      setProcessing((p) => ({ ...p, [sketchId]: false }));
    }
  };

  const toggleDesc = (id: string) => {
    setOpenDesc((s) => ({ ...s, [id]: !s[id] }));
  };

  const truncate = (text?: string, length = 120) => {
    if (!text) return "";
    return text.length > length ? text.slice(0, length).trimEnd() + "..." : text;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-200 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Көркем еңбек — Эскиздер</h1>
          <div className="text-right">
            <p className="font-semibold">{user?.displayName ?? ""}</p>
            <p className="text-sm text-gray-600">Ұпай: {points ?? "—"}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRELOADED_SKETCHES.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl shadow p-4 flex flex-col"
            >
              <button
                onClick={() => setSelectedSketch(s)}
                className="h-40 bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center focus:outline-none"
                aria-label={`Эскиз ${s.title} толық ашу`}
              >
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt={s.title}
                    className="h-full object-cover w-full"
                  />
                ) : (
                  <span className="text-gray-400">Сурет жоқ</span>
                )}
              </button>

              <h2 className="font-bold text-lg">{s.title}</h2>
              <p className="text-sm text-gray-600 flex-1 mt-2">
                {openDesc[s.id] ? s.description : truncate(s.description)}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => toggleDesc(s.id)}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  {openDesc[s.id] ? "Жасыру" : "Сипаттаманы ашу"}
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                {!completed[s.id] ? (
                  <button
                    disabled={processing[s.id]}
                    onClick={() => markComplete(s.id)}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 disabled:opacity-60"
                  >
                    {processing[s.id] ? "Өңделуде..." : "Орындалды — 10 ұпай"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => undoComplete(s.id)}
                      disabled={processing[s.id]}
                      className="flex-1 bg-red-200 text-red-800 px-4 py-2 rounded-xl font-semibold hover:bg-red-300 disabled:opacity-60"
                    >
                      {processing[s.id] ? "Өңделуде..." : "Белгіленді өшіру — -10"}
                    </button>
                    <button
                      onClick={() => setSelectedSketch(s)}
                      className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-semibold hover:bg-blue-100"
                    >
                      Қарау
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-gray-600">
          * Әр эскизді бір рет белгілегенде ғана 10 ұпай қосылады. Егер сіз қате
          бассаңыз, "Белгіленді өшіру" арқылы ұпайды алып тастай аласыз.
        </p>
      </div>

      {/* Lightbox / Modal — суретті толық көрсету */}
      {selectedSketch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedSketch(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start p-4 border-b">
              <h3 className="font-bold text-lg">{selectedSketch.title}</h3>
              <button
                onClick={() => setSelectedSketch(null)}
                className="text-gray-600 hover:text-gray-900"
                aria-label="Жабу"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {selectedSketch.imageUrl ? (
                <img
                  src={selectedSketch.imageUrl}
                  alt={selectedSketch.title}
                  className="w-full h-auto rounded"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Сурет жоқ
                </div>
              )}
              <p className="mt-3 text-gray-700">{selectedSketch.description}</p>
              <div className="mt-4 flex gap-2">
                {!completed[selectedSketch.id] ? (
                  <button
                    onClick={() => {
                      markComplete(selectedSketch.id);
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600"
                  >
                    Орындалды — 10 ұпай
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      undoComplete(selectedSketch.id);
                    }}
                    className="bg-red-200 text-red-800 px-4 py-2 rounded-xl font-semibold hover:bg-red-300"
                  >
                    Белгіленді өшіру — -10
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
