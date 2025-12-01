"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

type Task = {
  id: string;
  title: string;
  description?: string;
  createdBy?: string;
  createdAt?: any;
};

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"teacher" | "student" | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // form state (teacher only)
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  // Auth + role
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
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
          const data = snap.data() as any;
          setRole(data.role === "teacher" ? "teacher" : "student");
        } else {
          // әдепкі құжат жоқ болса - жасаңыз (student)
          await setDoc(userRef, { role: "student", points: 0, completedSketches: [] });
          setRole("student");
        }
      } catch (err) {
        console.error("role loading error", err);
        setRole("student");
      } finally {
        setLoadingRole(false);
      }
    });

    return () => unsub();
  }, [router]);

  // realtime tasks
  useEffect(() => {
    setLoadingTasks(true);
    const tasksRef = collection(db, "tasks");
    const q = query(tasksRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr: Task[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          arr.push({
            id: d.id,
            title: data.title,
            description: data.description,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
          });
        });
        setTasks(arr);
        setLoadingTasks(false);
      },
      (err) => {
        console.error("tasks onSnapshot error", err);
        setLoadingTasks(false);
      }
    );

    return () => unsub();
  }, []);

  // Add task (teacher)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Қайта кіріңіз.");
    if (!title.trim()) return alert("Тапсырманың атын енгізіңіз.");

    setSubmitting(true);
    try {
      const tasksRef = collection(db, "tasks");
      await addDoc(tasksRef, {
        title: title.trim(),
        description: description.trim(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setDescription("");
      setAdding(false);
    } catch (err) {
      console.error("add task error", err);
      alert("Тапсырма қосуда қате пайда болды.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete task (teacher owner only)
  const handleDelete = async (taskId: string) => {
    if (!user) return;
    const ok = confirm("Тапсырманы өшіргіңіз келе ме? Бұл әрекетті кері қайтару мүмкін емес.");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (err) {
      console.error("delete task error", err);
      alert("Өшіру кезінде қате пайда болды.");
    }
  };

  if (loadingRole || loadingTasks) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Жүктелуде...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-100 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Тапсырмалар</h1>
          <div className="text-right">
            <p className="text-sm font-medium">{user?.displayName ?? user?.email}</p>
            <p className="text-xs text-gray-600">{role === "teacher" ? "Мұғалім" : "Оқушы"}</p>
          </div>
        </header>

        {/* Teacher form toggle */}
        {role === "teacher" && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Жаңа тапсырма қосу</h2>
              <button
                onClick={() => setAdding((v) => !v)}
                className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600"
              >
                {adding ? "Форманы жабу" : "Тапсырма қосу"}
              </button>
            </div>

            {adding && (
              <form onSubmit={handleAddTask} className="mt-4 bg-white rounded-lg p-4 shadow-sm">
                <div className="grid gap-3">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="p-2 border rounded"
                    placeholder="Тапсырманың тақырыбы"
                    maxLength={120}
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="p-2 border rounded h-28 resize-y"
                    placeholder="Толық ақпарат (не керек, мерзімі, критерийлері және т.б.)"
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
                  >
                    {submitting ? "Жүктелуде..." : "Қосу"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(false);
                      setTitle("");
                      setDescription("");
                    }}
                    className="bg-gray-200 px-4 py-2 rounded-lg"
                  >
                    Болдырмау
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tasks list */}
        <section>
          {tasks.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center text-gray-600">Әзірге тапсырма жоқ.</div>
          ) : (
            <div className="grid gap-4">
              {tasks.map((t) => {
                const isOwner = user && t.createdBy === user.uid;
                return (
                  <article key={t.id} className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{t.title}</h3>
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{t.description}</p>
                        <div className="mt-3 text-xs text-gray-500">
                          {t.createdAt?.toDate ? (
                            <span>Қосылған: {t.createdAt.toDate().toLocaleString()}</span>
                          ) : (
                            <span>Жаңадан қосылды</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {/* Only owner teacher can delete */}
                        {role === "teacher" && isOwner && (
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          >
                            Өшіру
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
