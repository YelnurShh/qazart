export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-purple-700 to-indigo-700 text-white py-4 ">
      <div className="max-w-6xl mx-auto text-center text-sm">
        <p>© {new Date().getFullYear()} QAZART. Барлық құқықтар қорғалған.</p>
        <p className="mt-1">📞 Байланыс: qazart@gmail.com</p>
      </div>
    </footer>
  );
}
