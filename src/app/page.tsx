import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-10 py-12">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Welcome to <span className="text-indigo-600">Immiforum</span>
        </h1>
        <p className="text-gray-500 text-lg">
          A community where immigrants ask questions, share experiences,
          and help each other navigate visas, documents, and life abroad.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <a href="/questions" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700">
            Browse Questions
          </a>
          <a href="/auth/register" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50">
            Join the Community
          </a>
        </div>
      </div>

      <div className="w-full max-w-xl">
        <input
          type="text"
          placeholder="Search questions..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl text-center">
        {[
          { icon: "❓", title: "Ask Questions", desc: "Get answers from people who have been there." },
          { icon: "🌍", title: "Share Experiences", desc: "Help others with your immigration journey." },
          { icon: "🔖", title: "Save & Follow", desc: "Bookmark answers and follow helpful members." },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-gray-800">{f.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
