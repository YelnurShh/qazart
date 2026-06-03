import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "QAZART",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kk">
      <body className="flex flex-col min-h-screen bg-slate-950 bg-[url('/background.png')] bg-cover bg-center text-slate-950">
        {/* 🔹 Жоғарғы меню */}
        <Header />

        {/* 🔹 Негізгі контент */}
        <main className="flex-1 bg-transparent">
          {children}
        </main>

        {/* 🔹 Footer */}
        <Footer />
      </body>
    </html>
  );
}
