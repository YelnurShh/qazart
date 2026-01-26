"use client";


import React from "react";

const UnpaidPage: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>❌ Төленбеген</h1>
        <p style={styles.text}>
          Сіздің төлеміңіз сәтті аяқталған жоқ.
        </p>
        <p style={styles.subtext}>
          Қызметті жалғастыру үшін төлем жасауыңызды сұраймыз.
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#7f1d1d", // қою қызыл фон
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    maxWidth: "420px",
    width: "100%",
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
  },
  title: {
    color: "#dc2626",
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "16px",
  },
  text: {
    fontSize: "18px",
    color: "#111827",
    marginBottom: "8px",
  },
  subtext: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "24px",
  },
  button: {
    backgroundColor: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default UnpaidPage;
