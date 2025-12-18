# Project Context: Chronoflux

## Overview
Chronoflux is a historical grand strategy game and simulation platform built with SvelteKit and Convex. It features a persistent world where players control nations through natural language interactions, navigating historical scenarios with AI-driven consequences.

## Tech Stack
*   **Frontend:** SvelteKit (Svelte 5), Vite
*   **Backend & Database:** Convex
*   **Styling:** Shadcn-svelte, Tailwind CSS (v4), Bits UI
*   **Internationalization:** Inlang Paraglide JS
*   **Maps:** MapLibre GL, @openhistoricalmap/maplibre-gl-dates
*   **Testing:** Vitest, Playwright

## Key Directories & Files
*   `src/convex/`: Backend logic and database schema.
    *   `schema.ts`: Defines the database tables (`games`, `scenarios`, `nations`, `turns`, `relationships`).
    *   `games.ts`, `nations.ts`: Server-side query/mutation logic.
*   `src/lib/`: Shared utilities and components.
    *   `components/game/`: Core game UI (Map, NationPanel, EventLog).
    *   `paraglide/`: Internationalization messages.
*   `src/routes/`: SvelteKit pages and routing.
    *   `+page.svelte`: Landing page/Dashboard.
    *   `game/[gameId]/`: Main game interface.
*   `convex.json`: Convex configuration.
*   `project.inlang/`: Translation project settings.

## Prerequisites
*   Node.js 24
*   bun

## Architecture Notes
*   **State Management:** Game state is primarily managed via Convex subscriptions (`useQuery`) ensuring real-time updates.
*   **AI Integration:** The schema suggests AI is used to generate responses (`aiResponse` in `turns` table) and scenario context.
*   **Maps:** The project uses MapLibre with historical date support to render changing borders/territories over time.
