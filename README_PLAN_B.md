# DeFi Terminal - Plan B Architecture

## Overview
This DeFi terminal uses a **frontend + backend** architecture to avoid CORS issues:
- **Frontend**: Static site hosted on IPFS
- **Backend**: Vercel serverless functions that handle 1inch API calls

## Architecture Benefits
- ✅ **No CORS Issues**: Frontend calls backend, backend calls external APIs
- ✅ **Secure API Keys**: 1inch API key stored securely on backend
- ✅ **Scalable**: Vercel handles scaling automatically
- ✅ **IPFS Ready**: Static frontend perfect for decentralized hosting

## Setup Instructions

### 1. Environment Variables

Create `.env.local` for development:
```bash
ONE_INCH_API_KEY=your_1inch_api_key_here
```

For Vercel deployment, add the environment variable in your Vercel dashboard.

### 2. Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### 3. Build for Production

#### Frontend Build (IPFS)
```bash
# Build static export for IPFS
npm run build:frontend

# The out/ directory contains your static frontend
# Upload the contents of out/ to IPFS
# Or use a service like Fleek, Pinata, etc.
```

#### Backend Build (Vercel)
```bash
# Build backend with API routes for Vercel
npm run build:backend
```

### 4. Deploy to Vercel

#### Backend Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (will auto-detect Next.js and create API routes)
vercel

# Set environment variable
vercel env add ONE_INCH_API_KEY
```

#### Frontend Deployment to IPFS
```bash
# The out/ directory contains your static frontend
# Upload the contents of out/ to IPFS
# Or use a service like Fleek, Pinata, etc.
```

### 5. Update Frontend Configuration

After deploying the backend, update the Vercel URL in these files:

**src/components/commands.ts:**
```typescript
const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://your-vercel-app.vercel.app' // Replace with your actual Vercel URL
  : '';
```

**src/components/ChartModal.tsx:**
```typescript
const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://your-vercel-app.vercel.app' // Replace with your actual Vercel URL
  : '';
```

## API Routes

The backend provides comprehensive DeFi API endpoints:

### Prices

- **Route**: `POST /api/prices/price_by_token`
- **Body**: `{ "tokens": ["0xA0b86a33E6441e88C5F2712C3E9b74F5b8b6b8b8"], "currency": "USD", "chainId": 1 }`

### Charts

- **Route**: `GET /api/charts/candle?token0=ETH&token1=USDT&seconds=3600&chainId=1`

### Swaps

- **Route**: `GET /api/swap/classic/quote`
- **Route**: `POST /api/swap/classic/swap`
- **Route**: `POST /api/swap/classic/approve/allowance`

### Orderbook

- **Route**: `GET /api/orderbook/limit/quote`
- **Route**: `POST /api/orderbook/limit/order`

### Gas

- **Route**: `GET /api/gas/price`

### Tokens

- **Route**: `GET /api/tokens`

### NFTs

- **Route**: `GET /api/nft`

### Traces

- **Route**: `GET /api/traces`

### RPC

- **Route**: `POST /api/eth_rpc`

### Domains

- **Route**: `GET /api/domains`

## File Structure

```bash
src/
├── app/
│   ├── api/
│   │   ├── prices/
│   │   │   └── price_by_token/
│   │   │       └── route.ts     # Price API endpoint
│   │   ├── charts/
│   │   │   └── candle/
│   │   │       └── route.ts     # Chart API endpoint
│   │   ├── swap/
│   │   ├── orderbook/
│   │   ├── gas/
│   │   ├── tokens/
│   │   ├── nft/
│   │   ├── traces/
│   │   ├── eth_rpc/
│   │   └── domains/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── commands.ts          # Updated to call backend APIs
│   ├── ChartModal.tsx       # Updated to call backend APIs
│   └── ...
└── ...
```

## Security Notes

- 1inch API key is stored securely on the backend
- Frontend never sees the API key
- All external API calls go through your backend
- Perfect for IPFS hosting without exposing credentials
