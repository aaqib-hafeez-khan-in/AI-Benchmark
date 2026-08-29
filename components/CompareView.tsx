"use client"

import { useReducer, useRef, useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PromptInput } from "./PromptInput"
import { ModelPane } from "./ModelPane"
import { Scorecard } from "./Scorecard"
import { WinnerBar } from "./WinnerBar"
import { streamResponse, Personality } from "@/lib/mock-engine"
import { AVAILABLE_MODELS, DEFAULT_PAIR, getModelEngine, getHFModelId, getGitHubModelId } from "@/lib/models"
import {
  CompareState,
  CompareAction,
  ModelConfig,
  ScoreEntry,
} from "@/lib/types"

function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case "SET_PROMPT":
      return { ...state, prompt: action.payload }
    case "SET_MODEL":
      const newSelected = [...state.selectedModels] as [string, string]
      newSelected[action.payload.slot] = action.payload.modelId
      return { ...state, selectedModels: newSelected }
    case "START_STREAM":
      return {
        ...state,
        responses: { ...state.responses, [action.payload.modelId]: "" },
        streaming: { ...state.streaming, [action.payload.modelId]: true },
      }
    case "APPEND_CHUNK":
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.payload.modelId]:
            state.responses[action.payload.modelId] + action.payload.chunk,
        },
      }
    case "END_STREAM":
      return {
        ...state,
        streaming: { ...state.streaming, [action.payload.modelId]: false },
      }
    case "SET_SCORE":
      return {
        ...state,
        scores: {
          ...state.scores,
          [action.payload.modelId]: {
            ...state.scores[action.payload.modelId],
            [action.payload.field]: action.payload.value,
          },
        },
      }
    case "RESET_RESPONSES":
      return {
        ...state,
        responses: {},
        streaming: {},
      }
    default:
      return state
  }
}

const initialState: CompareState = {
  prompt: "",
  selectedModels: DEFAULT_PAIR,
  responses: {},
  scores: {},
  streaming: {},
}

async function* streamHuggingFaceResponse(
  prompt: string,
  modelId: string,
  token: string,
  signal: AbortSignal
): AsyncGenerator<string> {
  const hfModelId = getHFModelId(modelId)
  
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${hfModelId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1024,
          return_full_text: false,
        },
      }),
      signal,
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HF API error: ${response.status} ${error}`)
  }

  const result = await response.json()
  const fullText = Array.isArray(result) ? result[0]?.generated_text : result.generated_text

  if (!fullText) {
    throw new Error("No response generated")
  }

  for (const char of fullText) {
    if (signal.aborted) return
    yield char
    await new Promise((r) => setTimeout(r, 15 + Math.random() * 10))
  }
}

async function* streamGitHubModelResponse(
  prompt: string,
  modelId: string,
  token: string,
  signal: AbortSignal
): AsyncGenerator<string> {
  const ghModelId = getGitHubModelId(modelId)
  
  const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: ghModelId,
      messages: [{ role: "user", content: prompt }],
      stream: true,
      max_tokens: 1024,
    }),
    signal,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub Models error: ${response.status} ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("No response body")

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      if (signal.aborted) {
        reader.cancel()
        return
      }

      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.trim().startsWith("data: ")) {
          const data = line.slice(6).trim()
          if (data === "[DONE]") return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) yield content
          } catch {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function downloadFile(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function getExportData(state: CompareState, models: ModelConfig[]) {
  const modelResults = models.map((model) => ({
    model: model.label,
    modelId: model.id,
    response: state.responses[model.id] ?? "",
    score: state.scores[model.id] ?? null,
  }))
  const averages = modelResults.map((result) => ({
    model: result.model,
    average: result.score
      ? (result.score.accuracy + result.score.tone + result.score.speed) / 3
      : 0,
  }))
  const maxAverage = Math.max(...averages.map((item) => item.average))
  const winner = maxAverage > 0
    ? averages.filter((item) => item.average === maxAverage).map((item) => item.model)
    : []

  return {
    exportedAt: new Date().toISOString(),
    prompt: state.prompt,
    models: modelResults,
    winner: winner.length === 1 ? winner[0] : winner.length > 1 ? "Draw" : null,
  }
}

function toMarkdown(data: ReturnType<typeof getExportData>) {
  const sections = data.models.map((model) => {
    const score = model.score
      ? `Accuracy: ${model.score.accuracy}, Tone: ${model.score.tone}, Speed: ${model.score.speed}`
      : "Not scored"
    return `## ${model.model}\n\n**Scores:** ${score}\n\n**Response:**\n\n${model.response || "No response"}`
  })

  return `# AI Benchmark Run\n\n**Exported:** ${data.exportedAt}\n\n**Winner:** ${data.winner ?? "Not scored"}\n\n## Prompt\n\n${data.prompt}\n\n${sections.join("\n\n")}`
}

export function CompareView() {
  const [state, dispatch] = useReducer(compareReducer, initialState)
  const abortControllersRef = useRef<Record<string, AbortController>>({})
  const [hfToken, setHfToken] = useState("")
  const [githubToken, setGithubToken] = useState("")
  const [error, setError] = useState<string | null>(null)

  const isStreaming = Object.values(state.streaming).some(Boolean)

  const needsHfToken = state.selectedModels.some(id => getModelEngine(id) === "hf")
  const needsGithubToken = state.selectedModels.some(id => getModelEngine(id) === "github")

  const handleCompare = useCallback(async () => {
    if (!state.prompt.trim() || isStreaming) return
    
    setError(null)

    if (needsHfToken && !hfToken) {
      setError("Hugging Face token required. Get one free at huggingface.co/settings/tokens")
      return
    }
    if (needsGithubToken && !githubToken) {
      setError("GitHub token required. Get one at github.com/settings/tokens")
      return
    }

    Object.values(abortControllersRef.current).forEach((c) => c.abort())
    dispatch({ type: "RESET_RESPONSES" })

    const models = state.selectedModels.map((id) =>
      AVAILABLE_MODELS.find((m) => m.id === id)
    ).filter(Boolean) as ModelConfig[]

    await Promise.all(
      models.map(async (model) => {
        const controller = new AbortController()
        abortControllersRef.current[model.id] = controller

        dispatch({ type: "START_STREAM", payload: { modelId: model.id } })

        try {
          const engine = getModelEngine(model.id)
          let stream: AsyncGenerator<string>
          
          if (engine === "hf") {
            stream = streamHuggingFaceResponse(state.prompt, model.id, hfToken, controller.signal)
          } else if (engine === "github") {
            stream = streamGitHubModelResponse(state.prompt, model.id, githubToken, controller.signal)
          } else {
            stream = streamResponse(state.prompt, model.personality as Personality, controller.signal)
          }

          for await (const chunk of stream) {
            dispatch({
              type: "APPEND_CHUNK",
              payload: { modelId: model.id, chunk },
            })
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error")
        }

        dispatch({ type: "END_STREAM", payload: { modelId: model.id } })
      })
    )
  }, [state.prompt, state.selectedModels, isStreaming, hfToken, githubToken, needsHfToken, needsGithubToken])

  const handleStop = useCallback(() => {
    Object.values(abortControllersRef.current).forEach((c) => c.abort())
    state.selectedModels.forEach((id) => {
      dispatch({ type: "END_STREAM", payload: { modelId: id } })
    })
  }, [state.selectedModels])

  const handleScore = useCallback(
    (modelId: string, field: keyof ScoreEntry, value: number) => {
      dispatch({ type: "SET_SCORE", payload: { modelId, field, value } })
    },
    []
  )

  const models = state.selectedModels.map((id) =>
    AVAILABLE_MODELS.find((m) => m.id === id)
  ).filter(Boolean) as ModelConfig[]

  const canExport = models.some((model) => Boolean(state.responses[model.id]))

  const handleExport = useCallback((format: "json" | "markdown") => {
    if (!canExport) return
    const data = getExportData(state, models)
    if (format === "json") {
      downloadFile(JSON.stringify(data, null, 2), "ai-benchmark-run.json", "application/json")
    } else {
      downloadFile(toMarkdown(data), "ai-benchmark-run.md", "text/markdown")
    }
  }, [canExport, state, models])

  return (
    <div className="space-y-6">
      {(needsHfToken || needsGithubToken) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
          <p className="text-sm text-zinc-400">
            Selected models require API tokens (stored locally in session only):
          </p>
          {needsHfToken && (
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Hugging Face Token (free tier: 2,000 requests/day)</label>
              <Textarea
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
                placeholder="hf_..."
                rows={1}
                className="resize-none font-mono text-xs"
              />
            </div>
          )}
          {needsGithubToken && (
            <div>
              <label className="text-xs text-zinc-500 block mb-1">GitHub Token (free Models API)</label>
              <Textarea
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                rows={1}
                className="resize-none font-mono text-xs"
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-950/50 border border-red-800 text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <PromptInput
        prompt={state.prompt}
        selectedModels={state.selectedModels}
        isStreaming={isStreaming}
        onPromptChange={(v) => dispatch({ type: "SET_PROMPT", payload: v })}
        onModelChange={(slot, modelId) =>
          dispatch({ type: "SET_MODEL", payload: { slot, modelId } })
        }
        onCompare={handleCompare}
      />

      {isStreaming && (
        <Button variant="destructive" onClick={handleStop} className="w-full">
          Stop
        </Button>
      )}

      <div className="flex flex-wrap gap-4">
        {models.map((model) => (
          <ModelPane
            key={model.id}
            model={model}
            response={state.responses[model.id] ?? ""}
            isStreaming={state.streaming[model.id] ?? false}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        {models.map((model) => (
          <Scorecard
            key={model.id}
            modelId={model.id}
            modelLabel={model.label}
            modelColor={model.color}
            score={state.scores[model.id]}
            disabled={!state.responses[model.id]}
            onScore={handleScore}
          />
        ))}
      </div>

      {canExport && (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => handleExport("json")}>
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => handleExport("markdown")}>
            Export Markdown
          </Button>
        </div>
      )}

      <WinnerBar models={models as [ModelConfig, ModelConfig]} scores={state.scores} />
    </div>
  )
}
