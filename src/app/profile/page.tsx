"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // user profile data from firestore (realtime)
  const [profileData, setProfileData] = useState<any>(null);

  // role: "teacher" | "student" | "unknown"
  const [role, setRole] = useState<"teacher" | "student" | "unknown">("unknown");

  // teacher stats
  const [mySketchCount, setMySketchCount] = useState<number>(0);
  const [mySketchTotalCompletes, setMySketchTotalCompletes] = useState<number>(0);

  const router = useRouter();

  useEffect(() => {
    let userUnsub: (() => void) | null = null;
    // auth listener
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth/sign_in");
        setLoading(false);
        return;
      }

      setUser(currentUser);
      // subscribe to user's doc for realtime updates (points, fullName, grade, role)
      const uRef = doc(db, "users", currentUser.uid);
      userUnsub = onSnapshot(
        uRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfileData(data);
            setRole(data?.role === "teacher" ? "teacher" : "student");
          } else {
            setProfileData(null);
            setRole("student");
          }
          setLoading(false);
        },
        (err) => {
          console.error("user onSnapshot err:", err);
          setLoading(false);
        }
      );

      // If teacher, load teacher-specific stats
      fetchTeacherStats(currentUser.uid);
    });

    return () => {
      unsubAuth();
      if (userUnsub) userUnsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // fetch teacher stats (count of sketches and total completes)
  const fetchTeacherStats = async (uid: string) => {
    try {
      const q = query(collection(db, "sketches"), where("teacherId", "==", uid));
      const snap = await getDocs(q);
      setMySketchCount(snap.size);

      // compute total completes across sketches
      let totalCompletes = 0;
      snap.docs.forEach((d) => {
        const data = d.data() as any;
        if (Array.isArray(data.completedBy)) totalCompletes += data.completedBy.length;
      });
      setMySketchTotalCompletes(totalCompletes);
    } catch (err) {
      console.error("fetchTeacherStats err:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-700 text-white">
        <div>Жүктелуде...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-700 text-white">
        <div>Кіру керек</div>
      </div>
    );
  }

  // defaults
  const fullName = profileData?.fullName || user.displayName || "Аты-жөні енгізілмеген";
  const grade = profileData?.grade || profileData?.class || "";
  const points = profileData?.points || 0;

  const getBadge = (p: number) => {
    if (p >= 100) return "🏆 Алтын жеңімпаз";
    if (p >= 50) return "🥈 Күміс белсенді";
    if (p >= 20) return "🥉 Қола қатысушы";
    return "🌱 Жаңадан бастаушы";
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-purple-700 to-indigo-700 text-white px-6 py-10">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Профиль</h1>
          <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded text-white">Шығу</button>
        </div>

        {/* Common user card */}
        <div className="bg-white/90 text-blue-900 rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{fullName}</h2>

              {/* only show grade for students */}
              {role === "student" && grade && (
                <p className="text-sm text-blue-700">{grade} — сынып</p>
              )}

              <p className="text-sm text-blue-700">Email: {user.email}</p>
              <p className="text-sm text-blue-700">Роль: <span className="font-medium">{role}</span></p>
            </div>

            {/* only show points for students */}
            {role === "student" ? (
              <div className="text-right">
                <p className="text-2xl font-extrabold">⭐ {points}</p>
                <p className="text-sm">{getBadge(points)}</p>
              </div>
            ) : (
              <div className="text-right">
                {/* teacher — no points */}
              </div>
            )}
          </div>
        </div>

        {/* Role specific UI */}
        {role === "student" ? (
          // student view
          <section className="bg-white/10 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Оқушы панелі</h3>
            <p className="mb-4 text-white/80">
              Бұл жерде сіз орындаған эскиздеріңіз бен ұпайларыңызды бақылай аласыз.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded">
                <div className="text-sm text-white/80">Жалпы ұпай</div>
                <div className="text-2xl font-bold">{points}</div>
              </div>

              <div className="bg-white/5 p-4 rounded">
                <div className="text-sm text-white/80">Марапат</div>
                <div className="text-2xl">{getBadge(points)}</div>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={() => router.push("/isk")} className="px-4 py-2 bg-indigo-600 rounded">Эскиздар галереясына өту</button>
            </div>
          </section>
        ) : (
          // teacher view — no upload, no grade, no points
          <section className="bg-white/10 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Мұғалім панелі</h3>
            <p className="mb-4 text-white/80">Сізге арналған статистика</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded">
                <div className="text-sm text-white/80">Эскиздар саны</div>
                <div className="text-2xl font-bold">6</div>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={() => router.push("/isk")} className="px-4 py-2 bg-indigo-600 rounded">Эскиздар галереясына өту</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
