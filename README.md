# ISAAC – DeFi Terminal

Live demo: https://2omsnmby.pinit.eth.limo/

**defi-terminal** (codename ISAAC) is an open‑source developer tool built on top of the 1inch stack. It provides a command‑line interface in the browser for interacting with Ethereum and other EVM chains: swapping, pricing, charting, tracing, and calling arbitrary RPC methods. Think of it as a programmable shell for DeFi — built for developers, researchers, and power users who want a fast, composable alternative to fragmented dashboards.



## Features

- **Terminal‑style UI**: Command line in the browser for fast DeFi workflows (with wallet integration).
- **Rich command set**: Run commands like `swap`, `price`, `chart`, `trace`, `rpc`, `tokens`, and more.
- **Multi‑chain**: Supports Ethereum, Optimism, Arbitrum, Base, Polygon, and other EVM networks.
- **Deep token coverage**: Fetch data for thousands of tokens via 1inch APIs and helper maps.
- **Charts & analytics**: Pull OHLCV candles and price data for pairs and render lightweight charts.
- **Orderbook support**: Create/submit 1inch limit orders (where supported by the backend).
- **Extensible plugins**: Add new protocol integrations and commands without touching core UI.



## Use Cases

- **Instant swaps & limit orders**  
	Examples: `swap classic 1 eth usdc`, `swap limit 1 eth usdc --rate 4000 --expiration 7d`.
- **On‑chain investigation**  
	Trace transactions, inspect balances, and call RPC methods directly from the terminal.
- **Scripting & research**  
	Open multiple terminals/tabs to compare markets, monitor positions, and compose complex flows.
- **Power‑user DeFi ops**  
	Use the latest 1inch and ecosystem features via a consistent, keyboard‑focused interface.
- **Protocol integrations**  
	Contribute plugins and hooks for your favorite dapps or internal tooling.



## Architecture Overview

ISAAC uses a **frontend + backend** architecture designed to avoid CORS issues and keep API keys secure:

- **Frontend**
	- Next.js App Router UI, exported as a static site.
	- Hosted on IPFS / gateway (e.g. `*.eth.limo`).
	- Contains the terminal UI, command parsing, and chart rendering.

- **Backend**
	- Next.js API routes under `src/app/api/**` deployed as serverless functions (e.g. on Vercel).
	- Proxies all calls to 1inch and other external APIs.
	- Holds the `ONEINCH_API_KEY` and any other secrets.

**Data flow**

1. User types a command in the browser terminal.
2. `src/components/Terminal.tsx` parses the command and dispatches to handlers in `src/components/commands.ts`.
3. Command handlers call backend routes (e.g. `/api/prices/price_by_token`, `/api/swap/classic/quote`).
4. Backend routes (under `src/app/api/**`) validate inputs and proxy to 1inch or other APIs.
5. Responses are formatted and printed back into the terminal UI or visualized in modals (e.g. charts).



## Tech Stack

- **Core**
	- TypeScript
	- Node.js
	- Next.js App Router (15.x)

- **Ethereum / DeFi**
	- **1inch API**: prices, swaps, approvals, orderbook, gas, NFTs, tokens, traces, RPC.
	- **viem**: Ethereum client utilities and low‑level contract / RPC interactions.
	- **wagmi**: React hooks for wallet connection, chain switching, and transaction flow.

- **Frontend / UI**
	- React (App Router, server + client components).
	- Tailwind CSS for styling (see `src/app/globals.css`).
	- `lightweight-charts` for price/market charts.
	- `recharts` for additional visualizations.

- **Backend / API routes** (all under `src/app/api/`)
	- `prices/price_by_token` – token price lookup.
	- `charts/candle`, `charts/line` – OHLCV and line chart data.
	- `swap/classic/*` – quotes, approvals, and swap execution payloads.
	- `orderbook/limit/*` – limit order quoting, creation, and submission.
	- `tokens/*` – balances, token details, token resolution.
	- `gas` – gas price estimates.
	- `nft/byaddress` – NFT data.
	- `eth_rpc` – generic RPC proxy.
	- `traces` – transaction trace utilities.
	- `domains/reverse-lookup` – reverse ENS/domain lookups.



## Project Structure

High‑level layout (simplified):

```bash
src/
	app/
		api/                  # Backend API routes (serverless on Vercel)
			charts/
			domains/
			eth_rpc/
			gas/
			nft/
			orderbook/
			prices/
			swap/
			tokens/
			traces/
		globals.css           # Global styles (Tailwind)
		layout.tsx            # Root layout
		page.tsx              # Main ISAAC terminal page
		providers.tsx         # Wagmi / RainbowKit / React Query providers
	components/
		Terminal.tsx          # Core terminal UI + input handling
		TabbedTerminal.tsx    # Multiple terminal tabs
		commands.ts           # Command registry & implementations
		ChartModal.tsx        # Chart window for price data
		Window.tsx            # Generic draggable/resizable window
	hooks/
		useDomainName.ts      # ENS / domain resolution helper
```



## Prerequisites

- Node.js 18+ (recommended)
- npm (or a compatible package manager)
- A 1inch API key (`ONEINCH_API_KEY`) for backend deployment



## Getting Started (Local Development)

1. **Install dependencies**

	 ```bash
	 npm install
	 ```

2. **Configure environment**

	 Create `.env.local` in the repo root:

	 ```bash
	 ONEINCH_API_KEY=your_1inch_api_key_here
	 ```

3. **Run the dev server**

	 ```bash
	 npm run dev
	 ```

	 Then open `http://localhost:3000` in your browser.



## Build & Deployment

There are two main build targets: **backend (Vercel)** and **frontend (IPFS)**.

### Backend (Vercel)

Build and (optionally) deploy the backend:

```bash
npm run build:backend

# optional: deploy via Vercel CLI
npm i -g vercel
vercel --prod
```

Make sure to set the environment variable on Vercel:

```bash
vercel env add ONEINCH_API_KEY
```

### Frontend (IPFS or static hosting)

Build the static frontend (terminal UI):

```bash
npm run build:frontend
```

This produces a static site in the `out/` directory, which you can:

- Pin to IPFS directly.
- Upload via services like Fleek, Pinata, or web3.storage.
- Serve from any static hosting provider.

After backend deployment, update the backend base URL used in:

- `src/components/commands.ts`
- `src/components/ChartModal.tsx`

to point to your Vercel domain, e.g. `https://your-vercel-app.vercel.app`.



## Commands Overview

Some example commands supported by `createCommands` in `commands.ts`:

- `price eth usdc --network arbitrum` – fetch current price for a pair on a network.
- `chart eth usdc --interval 1h --network base` – open a chart modal for a pair.
- `swap classic 1 eth usdc` – prepare a classic 1inch swap.
- `swap limit 1 eth usdc --rate 4000 --expiration 7d` – create a limit order.
- `rpc --method eth_getBalance --params 0x...` – call arbitrary RPC via backend.

Use the in‑app `help` command to list all available commands and flags.



## Development Notes

- **Linting**

	```bash
	npm run lint
	```

- **Build only**

	```bash
	npm run build
	```

- **Type safety**
	- Project is written in TypeScript.
	- Avoids `any` where practical; some API‑shaped data uses relaxed typing.



## Contributing

Contributions are welcome. Some good starting points:

- Add new commands to `src/components/commands.ts` and wire them into the terminal.
- Introduce new API routes under `src/app/api/**` for additional DeFi protocols.
- Improve charts, visualizations, or UX for power users.
- Expand documentation and examples for common workflows.

If you open a PR, please:

- Keep changes focused.
- Run `npm run lint` and ensure the app builds locally.
- Add brief docs for any new commands or API routes.



## Security & Disclaimer

- ISAAC is a **power‑user tool**. Always double‑check addresses, amounts, and networks before confirming transactions.
- The backend holds your `ONEINCH_API_KEY` and should be deployed to a trusted environment (e.g. your own Vercel project).
- This repository is experimental and provided "as is". Use at your own risk.



## Project Status

- **Stage**: Early‑stage / experimental, suitable for power users and developers.
- **Stability**: Core commands (price, chart, swap classic, rpc) are expected to work; APIs and UX may still change.
- **Breaking changes**: Possible between minor versions until a stable `v1.0.0` is tagged.



## Roadmap

Planned and potential areas of improvement (not a commitment):

- **Core UX & Commands**
  - Improve command discovery (`help`, `man <command>`, autocomplete).
  - Add richer error messages and suggestions (e.g. token/chain resolution hints).
  - Session history export/import for research and reproducible workflows.

- **DeFi Integrations**
  - Broader 1inch coverage (more chains/endpoints as they ship).
  - Optional integrations with other DEXes/aggregators where compatible.
  - Native support for common DeFi flows (liquidity provision, bridging, etc.).

- **Analytics & Visualization**
  - More chart types and overlays (volume, indicators, multi‑pair comparison).
  - Saved layouts / workspaces for different research profiles.

- **Scripting & Automation**
  - Macro/alias system for frequently used command sequences.
  - Optional “headless” mode for CI‑style research runs.

- **Developer Experience**
  - Formal plugin API for adding commands and API routes.
  - Example plugins for common integrations and internal tools.

If you rely on ISAAC and need a particular feature, please open an issue or PR describing your use case.



## Design Notes & Inspiration

- Inspired by traditional shells (bash/zsh), trading terminals, and DeFi dashboards.
- Prioritizes **keyboard‑first** workflows over point‑and‑click navigation.
- Separates **frontend (IPFS)** and **backend (Vercel)** to:
  - Avoid CORS and browser API‑key exposure.
  - Keep the UI static, cacheable, and easy to mirror.
  - Allow the backend to evolve independently (rate limiting, logging, etc.).

See `SPLIT.md` for more background on the frontend/backend split and deployment model.


## Built by

[Immanuel](https://github.com/xavio2495)



## Boilerplate Code Source

https://github.com/nickmura/defi-terminal

