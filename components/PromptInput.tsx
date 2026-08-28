"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AVAILABLE_MODELS } from "@/lib/models"

interface PromptInputProps {
  prompt: string
  selectedModels: [string, string]
  isStreaming: boolean
  onPromptChange: (v: string) => void
  onModelChange: (slot: 0 | 1, modelId: string) => void
  onCompare: () => void
}

export function PromptInput({
  prompt,
  selectedModels,
  isStreaming,
  onPromptChange,
  onModelChange,
  onCompare,
}: PromptInputProps) {
  return (
    <div className="space-y-3">
      <Textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        maxLength={2000}
        rows={4}
        placeholder="Enter your prompt here..."
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isStreaming) {
            onCompare()
          }
        }}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {prompt.length} / 2000
        </span>
        <div className="flex items-center gap-3">
          <Select
            value={selectedModels[0]}
            onValueChange={(v) => onModelChange(0, v)}
            disabled={isStreaming}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedModels[1]}
            onValueChange={(v) => onModelChange(1, v)}
            disabled={isStreaming}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onCompare} disabled={isStreaming}>
            {isStreaming ? "Streaming..." : "Compare"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-zinc-600 text-right">
        Press ⌘ Enter to compare
      </p>
    </div>
  )
}
