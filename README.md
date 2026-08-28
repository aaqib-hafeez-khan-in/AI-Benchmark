# Model Benchmark

## Overview

Model Benchmark is a Next.js 14 application that compares LLM response styles side by side. It supports both mock simulation for offline testing and real API integration with free-tier LLM providers.

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

The application supports three modes of operation:

### Mock Mode (No API Keys)
Select models marked "(Mock)" to use the local simulation engine. This generates realistic responses using templates without any network calls. Ideal for offline testing and UI demonstrations.

### Hugging Face Mode (Free API)
Select "hf-" prefixed models to use real open-source models via Hugging Face Inference API:
- Free tier: 2,000 requests/day per user
- Supports: Mistral, Llama, Gemma, Zephyr, DeepSeek
- Get token at: https://huggingface.co/settings/tokens

### GitHub Models Mode (Free API)
Select "gh-" prefixed models to use models via GitHub's Azure-hosted inference:
- Free tier available for GitHub users
- Supports: GPT-4o, GPT-4o Mini, Phi-3, Mistral Large, Llama 3.3 70B, AI21 Jamba
- Get token at: https://github.com/settings/tokens

## Model Selection

| Model | Source | Description |
|-------|--------|-------------|
| GPT-4o (Mock) | Local | Precise, direct answers with structured summaries |
| Claude 3.5 Sonnet (Mock) | Local | Verbose, thorough multi-section explanations |
| Gemini Pro (Mock) | Local | Structured numbered lists with conclusions |
| Mistral 7B (Mock) | Local | Concise, punchy responses |
| Llama 3 (Mock) | Local | Casual, conversational tone |
| Mistral 7B Instruct | Hugging Face | Real Mistral model inference |
| Llama 3.1 8B | Hugging Face | Real Meta Llama inference |
| Gemma 2 9B | Hugging Face | Google's Gemma model |
| Zephyr 7B | Hugging Face | HuggingFace's Zephyr model |
| DeepSeek R1 | Hugging Face | DeepSeek distilled reasoning |
| GPT-4o | GitHub Models | Real OpenAI GPT-4o via Azure |
| GPT-4o Mini | GitHub Models | Efficient GPT-4o variant |
| Phi-3 | GitHub Models | Microsoft's Phi-3 model |
| Mistral Large | GitHub Models | Full Mistral Large model |
| Llama 3.3 70B | GitHub Models | Full Llama 3.3 70B model |
| AI21 Jamba | GitHub Models | AI21's Jamba model |

## Extending

To add new mock models:
1. Add entry to `MOCK_MODELS` in `lib/models.ts`
2. Define template in `RESPONSE_TEMPLATES` in `lib/mock-engine.ts`

To add new real API models:
1. Add entry to `HF_MODELS` or `GITHUB_MODELS` in `lib/models.ts`
2. Update the ID mapping functions `getHFModelId` or `getGitHubModelId`
3. The CompareView will automatically route to the correct streaming implementation
