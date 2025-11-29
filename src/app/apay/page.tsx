// src/app/apay/chat.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  DocumentData
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Question = {
  id: string;
  studentId: string;
  studentName?: string;
  question: string;
  createdAt?: any;
  answered?: boolean;
  answer?: string;
  answeredAt?: any;
  answeredBy?: string;
};

function timestampToMillis(t: any): number {
  if (!t) return 0;
  if (typeof t.toMillis === "function") return t.toMillis();
  if (t instanceof Date) return t.getTime();
  if (typeof t.seconds === "number") return t.seconds * 1000 + (t.nanoseconds ? Math.floor(t.nanoseconds / 1e6) : 0);
  return 0;
}

function formatTimestamp(t: any) {
  if (!t) return "";
  try {
    if (typeof t.toDate === "function") return t.toDate().toLocaleString();
    if (t instanceof Date) return t.toLocaleString();
    if (typeof t.seconds === "number") return new Date(t.seconds * 1000).toLocaleString();
  } catch {}
  return "";
}

function Spinner({ size = 5 }: { size?: number }) {
  const s = `w-${size} h-${size}`;
  // using inline SVG because Tailwind w-5/h-5 classes can't be dynamic reliably in TSX here
  return (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );
}

export default function ApayChatPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [role, setRole] = useState<"teacher" | "student" | "unknown">("unknown");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [myQuestionText, setMyQuestionText] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
      console.log("AUTH CHANGED:", u?.uid, u?.email);
    });
    return () => unsub();
  }, []);

  // Load user role from Firestore
  useEffect(() => {
    let mounted = true;
    async function fetchRole() {
      if (!user) {
        setRole("unknown");
        return;
      }
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (!snap.exists()) {
          setRole("student");
          return;
        }
        const data = snap.data() as DocumentData;
        setRole(data?.role === "teacher" ? "teacher" : "student");
      } catch (err) {
        console.error("fetchRole error:", err);
        setRole("student");
      }
    }
    fetchRole();
    return () => { mounted = false; };
  }, [user]);

  // Subscribe to questions
  useEffect(() => {
    if (role === "unknown") return;
    if (!user && role !== "teacher") return;

    setLoadingQuestions(true);
    let q;
    if (role === "teacher") {
      q = query(collection(db, "questions"));
    } else {
      q = query(collection(db, "questions"), where("studentId", "==", user!.uid));
    }

    const unsub = onSnapshot(q, (snap) => {
      const arr: Question[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      arr.sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt));
      setQuestions(arr);
      setLoadingQuestions(false);
    }, (err) => {
      console.error("questions onSnapshot error:", err);
      setLoadingQuestions(false);
    });

    return () => unsub();
  }, [role, user]);

  // Send question (student)
  const sendQuestion = async () => {
    if (!user) {
      alert("Алдымен жүйеге кіріңіз.");
      return;
    }
    const text = myQuestionText.trim();
    if (!text) return alert("Сұрақ бос болмауы мүмкін.");
    setSavingId("new");
    try {
      await addDoc(collection(db, "questions"), {
        studentId: user.uid,
        studentName: user.displayName || user.email || "Оқушы",
        question: text,
        createdAt: serverTimestamp(),
        answered: false,
      });
      setMyQuestionText("");
    } catch (err) {
      console.error("sendQuestion err:", err);
      alert("Сұрақ жіберу қатесі.");
    } finally {
      setSavingId(null);
    }
  };

  // Teacher answer
  const sendAnswer = async (id: string) => {
    const ans = (editing[id] || "").trim();
    if (!ans) return alert("Жауапты жазыңыз.");
    setSavingId(id);
    try {
      const ref = doc(db, "questions", id);
      await updateDoc(ref, {
        answer: ans,
        answered: true,
        answeredAt: serverTimestamp(),
        answeredBy: user?.displayName || user?.email || "Апай",
      });
      setEditing((s) => ({ ...s, [id]: "" }));
    } catch (err) {
      console.error("sendAnswer err:", err);
      alert("Жауап жіберу қатесі.");
    } finally {
      setSavingId(null);
    }
  };

  // Student edit own question (only if not answered)
  const editQuestion = async (id: string) => {
    const newText = (editing[id] || "").trim();
    if (!newText) return alert("Жаңа мәтін бос болмауы тиіс.");
    setSavingId(id);
    try {
      const ref = doc(db, "questions", id);
      await updateDoc(ref, {
        question: newText,
        // optionally update editedAt: serverTimestamp()
      });
      setEditing((s) => ({ ...s, [id]: "" }));
    } catch (err) {
      console.error("editQuestion err:", err);
      alert("Сұрақты өзгерту қатесі.");
    } finally {
      setSavingId(null);
    }
  };

  // Delete question (student or teacher)
  const deleteQuestion = async (id: string) => {
    const ok = confirm("Сұрақты нағыз өшіргіңіз келе ме?");
    if (!ok) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "questions", id));
    } catch (err) {
      console.error("deleteQuestion err:", err);
      alert("Сұрақты өшіру қатесі.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-700">
        <div className="text-center">
          <Spinner />
          <p className="text-white mt-3">Аутентификация жүктелуде...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-700 p-6">
        <div className="max-w-md w-full bg-white/6 p-8 rounded-2xl border border-white/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Апаймен сөйлесу</h2>
          <p className="text-white/90 mb-6">Сұрақ қою үшін алдымен жүйеге кіріңіз.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => router.push("/auth/login")} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20">Кіру</button>
            <button onClick={() => router.push("/auth/sign_up")} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20">Тіркелу</button>
          </div>
        </div>
      </div>
    );
  }

  if (role === "unknown") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-700">
        <div className="text-center">
          <Spinner />
          <p className="text-white mt-3">Роль анықталуда...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-700 to-indigo-700">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Мұғаліммен сөйлесу</h1>
            <p className="text-white/80">Қолданушы: <span className="font-medium">{user.displayName || user.email}</span> — <span className="font-medium">{role}</span></p>
          </div>
          <div>
            <button onClick={() => router.push("/")} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20">Басты бет</button>
          </div>
        </div>

        {/* Student form */}
        {role === "student" && (
          <div className="mb-6 bg-white/6 p-4 rounded-xl border border-white/10">
            <label className="text-white font-medium">Сұрақ</label>
            <textarea
              value={myQuestionText}
              onChange={(e) => setMyQuestionText(e.target.value)}
              rows={3}
              className="mt-2 w-full p-3 rounded-lg bg-white/5 placeholder-white/60 text-white focus:outline-none"
              placeholder="Сұрағыңызды жазып жіберіңіз..."
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={sendQuestion}
                disabled={!myQuestionText.trim() || savingId === "new"}
                className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 disabled:opacity-50"
              >
                {savingId === "new" ? (
                  <div className="flex items-center gap-2"><Spinner /><span>Жіберілуде...</span></div>
                ) : "Жіберу"}
              </button>
              <button onClick={() => setMyQuestionText("")} className="px-3 py-2 bg-white/5 text-white rounded-md hover:bg-white/10">Тазалау</button>
            </div>
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-4">
          {loadingQuestions ? (
            <div className="flex items-center gap-3 text-white">
              <Spinner />
              <span>Сұрақтар жүктелуде...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-white/80">Сұрақтар әлі жоқ.</div>
          ) : (
            questions.map((q) => {
              const isOwner = q.studentId === user.uid;
              const canEditOrDelete = isOwner && !q.answered;
              return (
                <div key={q.id} className="bg-white/6 p-4 rounded-xl border border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-white font-semibold">{q.studentName || q.studentId}</div>
                      <div className="text-white/80 mt-1">{q.question}</div>
                      <div className="text-white/60 text-sm mt-2">Жіберілді: {formatTimestamp(q.createdAt)}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {q.answered ? (
                        <div className="text-green-300 text-sm font-medium">Жауап берілді</div>
                      ) : (
                        <div className="text-yellow-200 text-sm font-medium">Күтуде</div>
                      )}
                      {/* delete button (owner or teacher) */}
                      <div className="flex gap-2">
                        {(canEditOrDelete || role === "teacher") && (
                          <button
                            onClick={() => {
                              if (!canEditOrDelete && role === "teacher") {
                                // teacher shouldn't delete student's question lightly — but allow
                                if (!confirm("Сұрақты жою?")) return;
                                deleteQuestion(q.id);
                              } else {
                                // owner delete
                                if (!confirm("Сұрақты жою?")) return;
                                deleteQuestion(q.id);
                              }
                            }}
                            disabled={deletingId === q.id}
                            className="px-2 py-1 bg-red-600/80 text-white rounded-md hover:opacity-90 disabled:opacity-50 text-sm"
                          >
                            {deletingId === q.id ? "Өшірілуде..." : "Өшіру"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* If answered — show answer */}
                  {q.answered ? (
                    <div className="mt-3 bg-white/5 p-3 rounded-md">
                      <div className="text-white/90 font-medium">Апайдың жауабы:</div>
                      <div className="text-white/80 mt-2">{q.answer}</div>
                      <div className="text-white/60 text-sm mt-2">{formatTimestamp(q.answeredAt)} — {q.answeredBy}</div>
                    </div>
                  ) : role === "teacher" ? (
                    // Teacher answer form
                    <div className="mt-3">
                      <textarea
                        rows={3}
                        placeholder="Жауапты осында жазыңыз..."
                        value={editing[q.id] ?? ""}
                        onChange={(e) => setEditing((s) => ({ ...s, [q.id]: e.target.value }))}
                        className="w-full p-3 rounded-lg bg-white/5 text-white"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => sendAnswer(q.id)}
                          disabled={!editing[q.id]?.trim() || savingId === q.id}
                          className="px-3 py-2 bg-indigo-500 text-white rounded-md disabled:opacity-50"
                        >
                          {savingId === q.id ? "Жіберілуде..." : "Жауап беру"}
                        </button>
                        <button onClick={() => setEditing((s) => ({ ...s, [q.id]: "" }))} className="px-3 py-2 bg-white/5 text-white rounded-md">Болдырмау</button>
                      </div>
                    </div>
                  ) : (
                    // Student owner: allow edit if owner and not answered
                    canEditOrDelete && (
                      <div className="mt-3">
                        <textarea
                          rows={3}
                          value={editing[q.id] ?? q.question}
                          onChange={(e) => setEditing((s) => ({ ...s, [q.id]: e.target.value }))}
                          className="w-full p-3 rounded-lg bg-white/5 text-white"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => editQuestion(q.id)}
                            disabled={!editing[q.id]?.trim() || savingId === q.id}
                            className="px-3 py-2 bg-amber-500 text-white rounded-md disabled:opacity-50"
                          >
                            {savingId === q.id ? "Сақталуда..." : "Сақтау"}
                          </button>
                          <button onClick={() => setEditing((s) => ({ ...s, [q.id]: q.question }))} className="px-3 py-2 bg-white/5 text-white rounded-md">Болдырмау</button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
