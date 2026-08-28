import { CompareView } from "@/components/CompareView"

export default function Home() {
  return (
    <main className="max-w-screen-xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-100">Model Benchmark</h1>
      <p className="text-sm text-zinc-500 mt-1">
        Simulate and compare LLM response styles side by side
      </p>
      <div className="border-b border-zinc-800 pb-6 mb-8" />
      <CompareView />
    </main>
  )
}
