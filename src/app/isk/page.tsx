"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import {
  doc,
  getDoc,
  runTransaction,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

type Sketch = {
  id: string;
  title: string;
  imageUrl?: string;
  description?: string;
  createdBy?: string;
  createdAt?: unknown;
  storagePath?: string; // optional path to delete from storage later
};

type UserData = {
  points?: number;
  completedSketches?: unknown[];
  role?: string;
};

type SketchData = {
  title?: string;
  imageUrl?: string;
  description?: string;
  createdBy?: string;
  createdAt?: unknown;
  storagePath?: string;
};

// 🔹 Локальды (preloaded) эскиздер — қажет болса көрсетіледі
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
  const [role, setRole] = useState<"teacher" | "student" | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [points, setPoints] = useState<number | null>(null);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [selectedSketch, setSelectedSketch] = useState<Sketch | null>(null);
  const [openDesc, setOpenDesc] = useState<Record<string, boolean>>({});
  const [remoteSketches, setRemoteSketches] = useState<Sketch[]>([]);
  const [adding, setAdding] = useState(false); // teacher add modal
  const [addForm, setAddForm] = useState({ title: "", description: "" });
  const [loadingSketches, setLoadingSketches] = useState(true);

  // file upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const router = useRouter();
  // компонент жоғарғы бөлігінде (useState already imported)
const [dragActive, setDragActive] = useState(false);


  // Әуелі аутентификация мен қолданушы деректерін алу + рольды оқу
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/auth/sign_in");
        return;
      }
      setUser(u);
      setLoadingRole(true);

      try {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as UserData;
          setPoints(typeof data.points === "number" ? data.points : 0);
          const list: string[] = Array.isArray(data.completedSketches)
            ? data.completedSketches.filter((value): value is string => typeof value === "string")
            : [];
          const map: Record<string, boolean> = {};
          list.forEach((id) => (map[id] = true));
          setCompleted(map);

          // роль аламыз (teacher / student). Егер жоқ болса student деп аламыз.
          const r = data.role === "teacher" ? "teacher" : "student";
          setRole(r);
        } else {
          // Егер құжат жоқ болса — әдепкі аккаунт құжатын жасайық (өте қарапайым)
          await setDoc(userRef, { points: 0, completedSketches: [], role: "student" });
          setPoints(0);
          setCompleted({});
          setRole("student");
        }
      } catch (err) {
        console.error("Firestore load user error", err);
        setRole("student");
      } finally {
        setLoadingRole(false);
      }
    });

    return () => unsubAuth();
  }, [router]);

  // Firestore-тен мұғалімдер салған эскиздерді realtime түрде алады
  useEffect(() => {
    setLoadingSketches(true);
    const sketchesRef = collection(db, "sketches");
    const q = query(sketchesRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr: Sketch[] = [];
        snap.forEach((d) => {
          const data = d.data() as SketchData;
          arr.push({
            id: d.id,
            title: data.title ?? "",
            imageUrl: data.imageUrl,
            description: data.description,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            storagePath: data.storagePath,
          });
        });
        setRemoteSketches(arr);
        setLoadingSketches(false);
      },
      (err) => {
        console.error("sketches onSnapshot error", err);
        setLoadingSketches(false);
      }
    );

    return () => unsub();
  }, []);

  // markComplete және undoComplete — бұрынғы логикадан өзгеше емес
  const markComplete = async (sketchId: string) => {
    if (!user) return;
    if (completed[sketchId]) return;

    setProcessing((p) => ({ ...p, [sketchId]: true }));
    const userRef = doc(db, "users", user.uid);

    try {
      await runTransaction(db, async (tx) => {
        const uSnap = await tx.get(userRef);
        if (!uSnap.exists()) {
          tx.set(userRef, { points: 10, completedSketches: [sketchId] });
          setPoints(10);
          return;
        }

        const data = uSnap.data() as UserData;
        const currentPoints = typeof data.points === "number" ? data.points : 0;
        const done: string[] = Array.isArray(data.completedSketches)
          ? data.completedSketches.filter((value): value is string => typeof value === "string")
          : [];

        if (done.includes(sketchId)) return;

        const newPoints = currentPoints + 10;
        tx.update(userRef, {
          points: newPoints,
          completedSketches: arrayUnion(sketchId),
        });

        setPoints(newPoints);
        setCompleted((m) => ({ ...m, [sketchId]: true }));
      });
    } catch (err) {
      console.error("markComplete error", err);
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

  const undoComplete = async (sketchId: string) => {
    if (!user) return;
    if (!completed[sketchId]) return;
    setProcessing((p) => ({ ...p, [sketchId]: true }));
    const userRef = doc(db, "users", user.uid);
    try {
      await runTransaction(db, async (tx) => {
        const uSnap = await tx.get(userRef);
        if (!uSnap.exists()) return;
        const data = uSnap.data() as UserData;
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

  // --- FILE UPLOAD (Storage) logic for teacher ---
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      if (!f.type.startsWith("image/")) {
        alert("Тек сурет файлдарын жүктеуге болады.");
        e.currentTarget.value = "";
        return;
      }
      // Optional: файл өлшемін шектеу (мысалы 5MB)
      const MAX_MB = 10;
      if (f.size > MAX_MB * 1024 * 1024) {
        alert(`Файл  ${MAX_MB}MB-тен үлкен болмауы керек.`);
        e.currentTarget.value = "";
        return;
      }
      setFile(f);
    }
  };

  const handleUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Қайта кіріңіз.");
    const { title, description } = addForm;
    if (!title.trim()) return alert("Атауын енгізіңіз.");
    if (!file) return alert("Сурет таңдап алыңыз.");

    try {
      setUploading(true);
      setUploadProgress(0);
      // filename және storage path
      const safeName = file.name.replace(/\s+/g, "_");
      const filename = `${Date.now()}_${safeName}`;
      const path = `sketches/${user.uid}/${filename}`;
      const sRef = storageRef(storage, path);

      const uploadTask = uploadBytesResumable(sRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(prog);
        },
        (uploadErr) => {
          console.error("Upload error", uploadErr);
          alert("Файлды жүктеу кезінде қате пайда болды.");
          setUploading(false);
          setUploadProgress(null);
        },
        async () => {
          // аяқталды
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          // Firestore-ге жазамыз (сонымен бірге storagePath сақтаймыз)
          const sketchesRef = collection(db, "sketches");
          await addDoc(sketchesRef, {
            title: title.trim(),
            imageUrl: downloadURL,
            description: description?.trim() || "",
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            storagePath: path,
          });
          // тазалау
          setAddForm({ title: "", description: "" });
          setFile(null);
          setUploadProgress(null);
          setUploading(false);
          setAdding(false);
          alert("Эскиз сәтті қосылды.");
        }
      );
    } catch (err) {
      console.error("handleUploadAndSave error", err);
      alert("Эскиз қосу кезінде қате пайда болды.");
      setUploading(false);
      setUploadProgress(null);
    }
  };

  // Мұғалім өзінің қосқан эскизін өшіру (Firestore + Storage объектісін жою)
  const deleteSketch = async (sketchId: string) => {
    if (!user) return;
    const proceed = confirm("Эскизді шын өшіргіңіз келе ме? Бұл әрекетті кері қайтару мүмкін емес.");
    if (!proceed) return;
    try {
      // алдымен document-ты аламыз (storagePath бар болса жоямыз)
      const docRef = doc(db, "sketches", sketchId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        alert("Эскиз табылған жоқ.");
        return;
      }
      const data = snap.data() as { storagePath?: string };
      const storagePath = data?.storagePath;
      // егер storagePath болса -> deleteObject
      if (storagePath) {
        try {
          const sRef = storageRef(storage, storagePath);
          await deleteObject(sRef);
        } catch (sErr) {
          // файл табылмаса немесе қате болса — логтап жалғастыру
          console.warn("Storage delete warning:", sErr);
        }
      }
      // Firestore document жою
      await deleteDoc(docRef);
    } catch (err) {
      console.error("delete sketch error", err);
      alert("Эскизді өшіруде қате пайда болды.");
    }
  };

  // Енгізулер үшін қарапайым элемент
  const SketchCard = ({ s }: { s: Sketch }) => {
    const isRemote = !!s.createdBy;
    const isOwner = user && s.createdBy === user.uid;
    const isCompleted = !!completed[s.id];

    return (
      <div className="bg-white rounded-2xl shadow p-4 flex flex-col">
        <button
          onClick={() => setSelectedSketch(s)}
          className="h-40 bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center focus:outline-none"
          aria-label={`Эскиз ${s.title} толық ашу`}
        >
          {s.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={s.imageUrl} alt={s.title} className="h-full object-cover w-full" />
          ) : (
            <span className="text-gray-400">Сурет жоқ</span>
          )}
        </button>

        <h2 className="font-bold text-lg">{s.title}</h2>
        <p className="text-sm text-gray-600 flex-1 mt-2">{openDesc[s.id] ? s.description : truncate(s.description)}</p>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => toggleDesc(s.id)} className="text-sm text-indigo-600 hover:underline">
            {openDesc[s.id] ? "Жасыру" : "Сипаттаманы ашу"}
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {role === "teacher" ? (
            // Мұғалім: тек өз эскизін өшіру мүмкіндігі (және эскизді қарау)
            <>
              <button onClick={() => setSelectedSketch(s)} className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-semibold hover:bg-blue-100">
                Қарау
              </button>
              {isRemote && isOwner && (
                <button onClick={() => deleteSketch(s.id)} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600">
                  Өшіру
                </button>
              )}
            </>
          ) : (
            // student view: download + қарау + орындалды батырмасы
            <>
              <a href={s.imageUrl} download className="flex-1 text-center bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700">
                Жүктеу
              </a>
              <button onClick={() => setSelectedSketch(s)} className="flex-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-semibold hover:bg-blue-100">
                Қарау
              </button>
              {!isCompleted ? (
                <button disabled={processing[s.id]} onClick={() => markComplete(s.id)} className="flex-1 bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 disabled:opacity-60">
                  {processing[s.id] ? "Өңделуде..." : "Орындалды"}
                </button>
              ) : (
                <button onClick={() => undoComplete(s.id)} disabled={processing[s.id]} className="flex-1 bg-red-200 text-red-800 px-4 py-2 rounded-xl font-semibold hover:bg-red-300 disabled:opacity-60">
                  {processing[s.id] ? "Өңделуде..." : "Қайтару"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Егер әлі роль анықталмаса — айналу индикаторы
  if (loadingRole || loadingSketches) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Рөлі анықталуда және эскиздер жүктелуде...</p>
        </div>
      </main>
    );
  }

  // Қоспа: PRELOADED_SKETCHES + remoteSketches (мұғалімдердің)
  const allSketches = [...PRELOADED_SKETCHES, ...remoteSketches];

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-200 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Көркем еңбек — Эскиздер</h1>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold">{user?.displayName ?? user?.email ?? ""}</p>
              {/* Ұпайды мұғалімдерге көрсету қажет емес */}
              {role === "student" && <p className="text-sm text-gray-600">Ұпай: {points ?? "—"}</p>}
            </div>

            {/* Мұғалім болса, эскиз қосу батырмасы */}
            {role === "teacher" && (
              <button onClick={() => setAdding((v) => !v)} className="bg-yellow-500 text-white px-4 py-2 rounded-xl shadow hover:bg-yellow-600">
                {adding ? "Форманы жабу" : "Эскиз қосу"}
              </button>
            )}
          </div>
        </header>

        {/* Мұғалім үшін файлпен қосу формасы */}
        {adding && role === "teacher" && (
          <form onSubmit={handleUploadAndSave} className="bg-white rounded-xl p-4 mb-6 shadow">
            <h3 className="font-bold mb-2">Жаңа эскиз қосу (жүктеу)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="p-2 border rounded"
                placeholder="Атауы"
                value={addForm.title}
                onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
              />
              <input
                className="p-2 border rounded"
                placeholder="Қысқаша сипаттама"
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div />
            </div>

            {/* --- REPLACE THE OLD FILE INPUT BLOCK WITH THIS --- */}
<div className="mt-3">
  <label className="block mb-1 text-sm font-medium">Суретті таңдаңыз (jpg, png):</label>

  {/* Drag & drop контейнер */}
  <div
    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
    onDrop={(e) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files?.[0] ?? null;
      if (f && f.type.startsWith("image/")) {
        setFile(f);
      } else {
        alert("Тек сурет файлдарын тастаңыз.");
      }
    }}
    className={
      "relative rounded-lg p-4 border-2 flex flex-col items-center justify-center transition " +
      (dragActive
        ? "border-indigo-500 bg-indigo-50"
        : "border-dashed border-gray-300 bg-white")
    }
    aria-label="Суретті тастаңыз немесе таңдаңыз"
  >
    <div className="flex flex-col items-center gap-2">
      <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 16v-4a4 4 0 014-4h2a4 4 0 014 4v4M12 12v8" />
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 4v8" />
      </svg>

      <p className="text-sm text-gray-600">
        Файлды осында сүйреп тастаңыз немесе
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("sketch-file-input") as HTMLInputElement | null;
            el?.click();
          }}
          className="ml-1 underline text-indigo-600 hover:text-indigo-700"
        >
          файл таңдаңыз
        </button>
      </p>

      <p className="text-xs text-gray-400">Макс өлшем: 10 MB. Тек суреттер (jpg, png, ...) қабылданады.</p>

      {/* Hidden input */}
      <input
        id="sketch-file-input"
        type="file"
        accept="image/*"
        onChange={(e) => onFileChange(e)}
        className="sr-only"
      />
    </div>

    {/* Превью және файл аты */}
    {file && (
      <div className="mt-3 w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {file && URL.createObjectURL ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={URL.createObjectURL(file)} alt={file.name} className="w-16 h-16 object-cover rounded-md border" />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">PNG</div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setFile(null); }}
            className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200"
          >
            Жою
          </button>
        </div>
      </div>
    )}
  </div>

  {/* Прогресс бары (болса) */}
  {uploadProgress !== null && (
    <div className="mt-3">
      <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
        <div style={{ width: `${uploadProgress}%` }} className="h-3 bg-green-500" />
      </div>
      <p className="text-sm text-gray-600 mt-1">Жүктеу: {uploadProgress}%</p>
    </div>
  )}
</div>


            <div className="mt-3 flex gap-2">
              <button type="submit" disabled={uploading} className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 disabled:opacity-60">
                {uploading ? "Жүктелуде..." : "Жүктеп, қосу"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setFile(null);
                  setUploadProgress(null);
                }}
                className="bg-gray-200 px-4 py-2 rounded-xl"
              >
                Болдырмау
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allSketches.map((s) => (
            <SketchCard key={s.id} s={s} />
          ))}
        </div>

        <p className="mt-6 text-sm text-gray-600">
          * PRELOADED: алдын ала жүктелген эскиздер — мұғалімдер салғандар төменде көрінеді. Студенттер суретті жүктей алады.
        </p>
      </div>

      {/* Lightbox / Modal — суретті толық көрсету */}
      {selectedSketch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedSketch(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start p-4 border-b">
              <h3 className="font-bold text-lg">{selectedSketch.title}</h3>
              <button onClick={() => setSelectedSketch(null)} className="text-gray-600 hover:text-gray-900" aria-label="Жабу">
                ✕
              </button>
            </div>
            <div className="p-4">
              {selectedSketch.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={selectedSketch.imageUrl} alt={selectedSketch.title} className="w-full h-auto rounded" />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">Сурет жоқ</div>
              )}
              <p className="mt-3 text-gray-700">{selectedSketch.description}</p>
              <div className="mt-4 flex gap-2">
                {role === "teacher" ? (
                  // мұғалім тек қарай алады және егер өзінің болса өшіре алады
                  <>
                    <button onClick={() => setSelectedSketch(null)} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-semibold hover:bg-blue-100">
                      Жабу
                    </button>
                    {selectedSketch.createdBy === user?.uid && (
                      <button
                        onClick={() => {
                          deleteSketch(selectedSketch.id);
                          setSelectedSketch(null);
                        }}
                        className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600"
                      >
                        Осы эскизді өшіру
                      </button>
                    )}
                  </>
                ) : (
                  // студентке жүктеу батырмасы
                  <a href={selectedSketch.imageUrl} download className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700">
                    Суретті жүктеу
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
