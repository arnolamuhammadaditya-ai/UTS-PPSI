export default function Footer() {
  const studentName = process.env.NEXT_PUBLIC_STUDENT_NAME || 'Arnol Muhammad Aditya';

  return (
    <footer className="bg-[#111827] text-gray-400 py-4 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-xs sm:text-sm text-gray-300">
          Copyright &copy; 2026 by {studentName} dan Dr. Erliyan Redy Susanto, M.Kom
        </p>
      </div>
    </footer>
  );
}
