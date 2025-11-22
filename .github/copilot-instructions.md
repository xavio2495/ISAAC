# Copilot Instructions for AI Coding Agents

## Project Overview
- **defi-terminal** is a browser-based command-line interface for DeFi, built on 1inch, supporting EVM chains (Ethereum, Optimism, Arbitrum, Base, Polygon, etc.).
- The app is a Next.js project (TypeScript) with modular plugin architecture for protocol integrations.
- Key features: command-based DeFi actions (swap, price, chart, trace, rpc), multi-chain support, and extensibility for new dapps.

## Architecture & Key Patterns
- **API routes**: All backend logic is in `src/app/api/`, organized by domain (e.g., `swap/classic/approve/allowance/route.ts`, `orderbook/limit/quote/route.ts`). Each subfolder represents a protocol or feature. Routes are Next.js API handlers that proxy requests to 1inch API endpoints.
- **Frontend**: Main UI components are in `src/components/` (e.g., `TabbedTerminal.tsx`, `ChartModal.tsx`). The command interface is implemented in `commands.ts` and `Terminal.tsx`.
- **Data flows**: User inputs commands in terminal, parsed in `Terminal.tsx`, dispatched to functions in `commands.ts`. Commands either call API routes via fetch or open modals (e.g., `openChartModal`). API routes handle external API calls and return JSON responses.
- **Multi-chain support**: Commands parse network flags (e.g., `--network arbitrum`), switch chains using wagmi's `switchChainAsync`, and route to chain-specific endpoints.
- **Hooks**: Custom React hooks are in `src/hooks/` (e.g., `useDomainName.ts` for ENS resolution).
- **Global styles**: `src/app/globals.css`.
- **Helpers**: Shared logic in `src/app/helper.ts` (token definitions, resolution) and `src/app/api/helper.ts`.

## Developer Workflows
- **Build**: `npm run build` (Next.js build)
- **Dev**: `npm run dev` (local development server with Turbopack)
- **Lint**: `npm run lint` (uses ESLint config in `eslint.config.mjs`)
- **Type-check**: No dedicated script; TypeScript checked during build
- **Test**: No explicit test scripts; add tests as needed (e.g., via Jest or Vitest).

## Project-Specific Conventions
- **API route structure**: Use nested folders to represent protocol and action hierarchy (e.g., `swap/classic/quote/route.ts`). Each `route.ts` exports GET/POST functions that handle requests, validate params, and proxy to external APIs like 1inch.
- **Command pattern**: Commands are defined in `createCommands` function in `commands.ts`, which takes a context object and returns an object with command functions. Add new commands to `COMMAND_LIST` array. Commands use `addLine` for output, handle async operations, and integrate with wallet (wagmi hooks).
- **Token resolution**: Use static `TOKENS` map in `src/app/helper.ts` for common tokens; fallback to contract addresses. Supports major tokens across EVM chains.
- **Network parsing**: Commands parse network from args (e.g., `--network arbitrum` or `--arbitrum`); defaults to current chain. Use `parseNetwork` helper.
- **Confirmation flows**: For destructive actions (swaps, limit orders), prompt user with yes/no confirmation before execution.
- **Error handling**: Use `addLine(message, 'error')` for errors; handle user rejections (e.g., wallet cancellations).
- **Plugin architecture**: Integrate new protocols by adding new folders under `src/app/api/` with `route.ts` files, and corresponding commands in `commands.ts`.
- **TypeScript**: Use strict typing; types defined inline or in relevant files. Avoid `any` where possible.
- **Environment**: Set `ONEINCH_API_KEY` in `.env.local` for API access.

## Integration & External Dependencies
- **1inch API**: Core DeFi data source; endpoints for swaps, prices, approvals, etc. Auth via Bearer token.
- **viem / wagmi**: Ethereum interactions - wallet connection (RainbowKit), transactions, contract calls, chain switching.
- **Next.js**: Routing, API routes, SSR. Use App Router.
- **Charts**: Lightweight-charts for price charts; Recharts for other visualizations.
- **UI**: Tailwind CSS for styling; custom terminal UI with timestamps.

## Examples
- **Adding a new command**: In `commands.ts`, add function to `createCommands` return object (e.g., `newcmd: (args) => { addLine('Hello'); }`), and add 'newcmd' to `COMMAND_LIST`.
- **Adding API route**: Create `src/app/api/newfeature/route.ts` with `export async function GET(request) { ... }`; proxy to external API.
- **Token integration**: Add to `TOKENS` map in `helper.ts` with address, symbol, decimals.
- **Chart modal**: Use `openChartModal(token0, token1, network, type, interval)` to open draggable chart windows.
- **Swap flow**: Parse args in command, get quote via API, prompt confirmation, handle approval if needed, execute transaction.

## References
- See `README.md` for high-level project goals and tech stack.
- See `src/app/api/` for backend/API patterns (e.g., `swap/classic/quote/route.ts`).
- See `src/components/` for UI/command patterns (e.g., `Terminal.tsx`, `commands.ts`).
- See `src/app/helper.ts` for token and utility functions.

---
For questions, follow the structure and conventions in this file and the codebase. When in doubt, prefer modularity and composability.
