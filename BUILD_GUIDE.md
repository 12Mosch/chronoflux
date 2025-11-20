# ChronoFlux Build Guide

Practical, step-by-step instructions for implementing the ChronoFlux website based on `PROJECT_PLAN.md`.

## 1. Project Foundation ✅

1. **Create/prepare SvelteKit app**
   - If starting fresh: `npm create svelte@latest chronoflux` (skeleton + TypeScript).
   - Otherwise, ensure the existing app builds (`npm run dev` / `bun dev`).
2. **Set up Tailwind CSS**
   - Install Tailwind, PostCSS, Autoprefixer as dev dependencies.
   - Initialize configs and wire Tailwind into `src/app.css` and `svelte.config.js`.
   - Verify a simple `text-red-500` class renders.
3. **Install and configure shadcn-svelte**
   - Follow https://www.shadcn-svelte.com/docs/installation.
   - Generate base UI components: Button, Card, Input, Dialog.
4. **Initialize Convex backend**
   - Run `npx convex dev` in project root.
   - Ensure `convex/` and `src/convex.json` exist.
5. **Create basic routes**
   - `/` → `src/routes/+page.svelte` (landing page).
   - `/scenarios` → scenario selection.
   - `/game/[gameId]` → main game view (with `+layout.svelte` under `/game`).
   - `/history/[gameId]` → timeline view.

---

## 2. Data Model & Convex Schema ✅

1. **Define tables in `convex/schema.ts`**
   - `games`, `scenarios`, `nations`, `turns`, `events`, `relationships`.
   - Use the fields from `PROJECT_PLAN.md` (status, resources, relationshipScore, etc.).
2. **Scenarios API (`convex/scenarios.ts`)**
   - Mutation: `createOrUpdateScenario` (inputs: name, description, period, startYear, initialWorldState, aiContext).
   - Query: `listScenarios` (for scenario selection page).
   - Query: `getScenario` (by id, for game creation).
3. **Games API (`convex/games.ts`)**
   - Mutation: `createGame`:
     - Input: `scenarioId`, `playerNationId`, optional `playerId`.
     - Copy scenario initial state → game-specific nations & relationships.
     - Create game row with `currentTurn = 1`, `status = "active"`.
   - Query: `getGame` (by `gameId`).
   - Optionally, `listGamesForUser`.

---

## 3. Core UI Shell

1. **Landing page (`/+page.svelte`)** ✅
   - Hero section (title, description).
   - "Start New Game" button → navigate to `/scenarios`.
2. **Scenario selection (`/scenarios/+page.svelte`)** ✅
   - Create `src/lib/components/scenarios/ScenarioCard.svelte`.
   - On load, call Convex `listScenarios` and render cards.
   - On "Play": open nation selection (inline or dialog), then call `createGame`, redirect to `/game/[gameId]`.
3. **Game layout (`/game/+layout.svelte`)** ✅
   - Header with nation name/flag, current turn, year.
   - Slot for main game page content.
4. **Main game page (`/game/[gameId]/+page.svelte`)** ✅
   - Layout columns matching the plan:
     - Left: `NationPanel` + `EventLog`.
     - Right: `WorldMap` + `ActionInput` + `TurnSummary` dialog.
   - Create components under `src/lib/components/game`: `NationPanel`, `WorldMap`, `EventLog`, `ActionInput`, `TurnSummary`.
   - Start with static placeholders wired to props.

---

## 4. Turn System Without AI ✅

1. **Turn storage (`convex/turns.ts`)** ✅
   - Mutation: `submitTurn`:
     - Input: `gameId`, `playerAction` (string).
     - Create a `turns` document with placeholder `aiResponse`.
     - Increment `games.currentTurn`.
     - Optionally create a simple `events` entry for testing.
   - Query: `getTurnsForGame(gameId)` to power Event Log and History.
2. **Wire `ActionInput` to Convex** ✅
   - In `ActionInput.svelte`, bind textarea to `playerAction`.
   - On submit, call `submitTurn` via Convex client.
   - After success, show `TurnSummary` with stub data and refresh turns.
3. **Event Log & History** ✅
   - `EventLog.svelte`: display turns/events from `getTurnsForGame`.
   - `/history/[gameId]`: timeline view listing all turns with basic details.

---

## 5. Integrate Ollama & Qwen3 ✅

1. **Verify Ollama locally** ✅
   - Ensure `ollama serve` is running.
   - Test a simple request with Qwen3 from a terminal.
2. **Ollama client (`src/lib/utils/ollama.ts`)** ✅
   - Implement helper to call `http://localhost:11434/api/generate`:
     - Input: `prompt`, optional generation params.
     - Output: response text.
     - Add timeout (~30s) and basic retry (up to 3 times).
   - Test utility created in `src/lib/utils/testOllama.ts`.
3. **Convex AI integration (`src/convex/ai.ts`)** ✅
   - Action: `processTurnWithAI(gameId, playerAction)`:
     - Fetch world state (nations, relationships, recent events).
     - Build Action Interpretation prompt from `PROJECT_PLAN.md`.
     - Call Ollama server-side; parse JSON result.
     - Send Event Generation prompt.
     - Return events, resourceChanges, relationshipChanges, narrative.
   - Internal queries created in `nations.ts`, `relationships.ts`, `scenarios.ts`.
4. **Connect AI to `submitTurn`** ✅
   - Created `submitTurnWithAI` action that:
     - Calls `processTurnWithAI`.
     - Persists `turns` document with full `aiResponse`.
     - Creates `events` documents.
     - Updates nations and relationships per AI output.
     - Returns data for `TurnSummary`.
   - Kept original `submitTurn` for backwards compatibility.

---

## 6. Game State Management ✅

1. **Nation updates (`convex/nations.ts`)** ✅
   - Helpers to apply resource changes with clamping (e.g., 0–100).
   - Queries to fetch nations by `gameId`.
2. **Relationships** ✅
   - Helpers to adjust `relationshipScore` (‑100 to 100) and set `status` (allied, at_war, etc.).
   - Query to fetch relationships by `gameId`.
3. **World state query** ✅
   - `getWorldState(gameId)` combining nations, relationships, maybe global state.
   - Use this in `/game/[gameId]` to populate `NationPanel` and `WorldMap`.

---

## 7. UI/UX Enhancements

1. **NationPanel**
   - Show government, resources (bars or badges), territories.
2. **WorldMap**
   - Start with a static map or schematic; highlight player nation.
3. **EventLog improvements**
   - Add filters by event type (political, military, etc.).
4. **TurnSummary dialog**
   - Use shadcn Dialog to show action recap, events, resource deltas, narrative.
5. **Polish**
   - Loading indicators during AI calls.
   - Responsive layout for mobile.
   - Dark/light theme via Tailwind + shadcn theme.

---

## 8. Scenario System

1. **Scenario editor**
   - Optional internal route (e.g., `/scenarios/editor`).
   - Forms to edit name, description, period, nations, relationships, aiContext.
2. **Seed initial scenarios**
   - World War I (1914), Cold War (1947), Ancient Rome (44 BC), Custom.
   - Use editor or a Convex seeding script.

---

## 9. Testing & QA

1. **Unit tests**
   - Resource/relationship update helpers, prompt builders, JSON parsing.
2. **Integration tests**
   - Convex mutations/queries: game creation, turn submission, state updates.
3. **E2E tests**
   - Flow: landing → new game → scenario select → game → submit turn → history view.
4. **AI quality checks**
   - Curate sample actions, log AI outputs, review for coherence and plausibility.

---

## 10. Security, Deployment & Operations

1. **Security basics**
   - Sanitize and length-limit `playerAction`.
   - Optional Convex Auth to tie games to users.
2. **Deployment**
   - Deploy Convex (`npx convex deploy`).
   - Deploy SvelteKit to Vercel/Netlify; configure Convex + AI endpoint env vars.
   - Ensure Ollama is reachable from wherever AI calls originate.
3. **Monitoring**
   - Log AI latency, error rates, and turn volume.
   - Track engagement metrics: turns per game, session duration, return rate.

---

## 11. Condensed Build Checklist

1. Set up SvelteKit + Tailwind + shadcn-svelte.
2. Define Convex schema and basic queries/mutations.
3. Build landing, scenarios, game, and history routes.
4. Implement non-AI turn submission and display.
5. Integrate Ollama/Qwen3 via Convex and `ollama.ts`.
6. Implement world state updates and UI binding.
7. Enhance UI/UX (map, panels, dialogs, themes).
8. Build scenario editor and seed scenarios.
9. Add tests (unit, integration, E2E, AI quality).
10. Secure, deploy, and monitor the system.
