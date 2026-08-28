# AI Benchmark

AI Benchmark is a Next.js application for comparing LLM responses side by side. It supports mock simulations for offline experimentation and real model calls through supported providers, with streamed responses and manual scoring.

## What you can do

- Compare two models against the same prompt.
- Load built-in benchmark prompts for coding, reasoning, summarization, instruction following and factual QA.
- Use mock models without API keys.
- Use supported real-model providers when you supply your own token.
- Score responses manually and inspect the winner for the current comparison.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

For a production check:

```bash
npm run build
npx serve out
```

## Benchmarks

Built-in benchmark prompts live in `lib/benchmarks.ts`. They are intentionally kept separate from the UI so new prompts can be added without changing the comparison components.

The current benchmark categories are:

- Coding
- Reasoning
- Summarization
- Instruction Following
- Factual QA

These are starting points for repeatable comparisons, not a claim that the application provides a complete scientific evaluation of model quality. Real benchmarking should also control model versions, generation parameters, provider changes and evaluation methodology.

## Model modes

### Mock mode

Models marked as mock use the local simulation engine and do not make network calls. This is the easiest mode for testing the UI or deploying a public demo without asking visitors for credentials.

### Real provider mode

The application can call supported real models through Hugging Face and GitHub Models when the user supplies a token during the session. Tokens are not committed to the repository.

Use provider-specific tokens with the minimum permissions required for inference. Do not place personal access tokens directly in source files or commit them to Git.

## Manual GitHub Pages deployment

The repository uses GitHub Actions only for deployment and the workflow is intentionally manual. It runs only when you trigger it from the GitHub Actions tab with `workflow_dispatch`.

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Go to **Actions** and select **Deploy to GitHub Pages**.
5. Click **Run workflow** and run it from `main`.
6. Wait for the build and deployment jobs to finish.
7. Open the published Pages URL shown by the deployment environment.

The Next.js configuration uses static export mode and the repository path `/AI-Benchmark` as its Pages base path. The workflow publishes the generated `out` directory.

### Local Pages build check

Before triggering deployment, verify the static export locally:

```bash
npm ci
npm run build
npx serve out
```

Then open the local server and verify navigation, benchmark selection, mock-model comparisons and scoring.

## Extending the project

### Add a benchmark

Add a new entry to `BENCHMARK_PROMPTS` in `lib/benchmarks.ts`. Keep prompts focused on one capability so comparisons are easier to interpret.

### Add a mock model

Add an entry to `MOCK_MODELS` in `lib/models.ts` and a corresponding template in `lib/mock-engine.ts`.

### Add a real model

Add the model configuration to the relevant provider list in `lib/models.ts` and update the provider ID mapping. The comparison view routes the selected model to the appropriate response implementation.

## Suggested next step

The strongest next iteration is to turn these individual benchmark prompts into versioned benchmark suites with saved runs and aggregated scores. That would move AI Benchmark closer to a reproducible evaluation tool rather than a one-off comparison interface.
