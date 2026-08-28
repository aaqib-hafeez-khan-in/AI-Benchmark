"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface LiveBenchRow {
  model: string
  overall: string
  reasoning: string
  coding: string
  agenticCoding: string
  mathematics: string
  dataAnalysis: string
  language: string
  instructionFollowing: string
}

const LIVEBENCH_CSV = "https://livebench.ai/table_2026_06_25.csv"

function parseCsv(text: string): LiveBenchRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((value) => value.trim().toLowerCase())
  const findIndex = (...names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1
  const indexes = {
    model: findIndex("model"),
    overall: findIndex("overall"),
    reasoning: findIndex("reasoning"),
    coding: findIndex("coding"),
    agenticCoding: findIndex("agentic coding", "agentic_coding"),
    mathematics: findIndex("mathematics", "math"),
    dataAnalysis: findIndex("data analysis", "data_analysis"),
    language: findIndex("language"),
    instructionFollowing: findIndex("instruction following", "instruction_following"),
  }

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim())
    const value = (index: number) => index >= 0 ? values[index] ?? "—" : "—"
    return {
      model: value(indexes.model),
      overall: value(indexes.overall),
      reasoning: value(indexes.reasoning),
      coding: value(indexes.coding),
      agenticCoding: value(indexes.agenticCoding),
      mathematics: value(indexes.mathematics),
      dataAnalysis: value(indexes.dataAnalysis),
      language: value(indexes.language),
      instructionFollowing: value(indexes.instructionFollowing),
    }
  }).filter((row) => row.model !== "—").slice(0, 10)
}

export function LiveBenchPanel() {
  const [rows, setRows] = useState<LiveBenchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${LIVEBENCH_CSV}?t=${Date.now()}`, { cache: "no-store" })
      if (!response.ok) throw new Error(`LiveBench returned ${response.status}`)
      const data = parseCsv(await response.text())
      if (!data.length) throw new Error("LiveBench returned no model rows")
      setRows(data)
      setUpdatedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load LiveBench")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 300000)
    return () => window.clearInterval(interval)
  }, [load])

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-zinc-200">LiveBench leaderboard</h2>
            <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-400">LIVE</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Release 2026-06-25 · 23 objective tasks · 7 categories</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-xs text-red-400">
          {error}. The model comparison still works independently.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-500">
              <tr className="border-b border-zinc-800">
                <th className="px-2 py-2 font-normal">Model</th>
                <th className="px-2 py-2 font-normal">Overall</th>
                <th className="px-2 py-2 font-normal">Reasoning</th>
                <th className="px-2 py-2 font-normal">Coding</th>
                <th className="px-2 py-2 font-normal">Agentic</th>
                <th className="px-2 py-2 font-normal">Math</th>
                <th className="px-2 py-2 font-normal">Data</th>
                <th className="px-2 py-2 font-normal">Language</th>
                <th className="px-2 py-2 font-normal">IF</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.model} className="border-b border-zinc-900 last:border-0">
                  <td className="px-2 py-2 text-zinc-200 whitespace-nowrap">{row.model}</td>
                  <td className="px-2 py-2 text-zinc-100">{row.overall}</td>
                  <td className="px-2 py-2 text-zinc-400">{row.reasoning}</td>
                  <td className="px-2 py-2 text-zinc-400">{row.coding}</td>
                  <td className="px-2 py-2 text-zinc-400">{row.agenticCoding}</td>
                  <td className="px-2 py-2 text-zinc-400">{row.mathematics}</td>
                  <td className="px-2 py-2 text-zinc-400">{row.dataAnalysis}</td>
                  <td className="px-2 py-2 text-zinc-400">{row.language}</td>
                  <td className="px-2 py-2 text-zinc-400">{row.instructionFollowing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {updatedAt && <p className="text-[10px] text-zinc-600">Fetched {updatedAt.toLocaleTimeString()}</p>}
    </section>
  )
}
