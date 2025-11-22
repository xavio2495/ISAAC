// All command logic is now wrapped in createCommands
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createCommands(ctx: any) {
// Helper function for API calls to our backend
const fetchBackend = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://your-vercel-app.vercel.app' // Replace with your actual Vercel URL
    : ''; // Use relative URLs in development

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};  // Helper function to parse network from args
  const parseNetwork = (args: string[], defaultNetwork: string): { network: string; networkIndex: number } => {
    const networkMap: { [key: string]: string } = {
      'ethereum': '1',
      'mainnet': '1',
      'polygon': '137',
      'matic': '137',
      'optimism': '10',
      'arbitrum': '42161',
      'arb': '42161',
      'base': '8453',
      'bsc': '56',
      'binance': '56',
      'avalanche': '43114',
      'zksync': '324',
    };
    let networkIndex = -1;
    let network = defaultNetwork;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i].toLowerCase();
      if (arg === '--network' && i + 1 < args.length) {
        network = networkMap[args[i + 1].toLowerCase()] || args[i + 1];
        networkIndex = i;
        break;
      } else if (arg.startsWith('--') && networkMap[arg.slice(2)]) {
        network = networkMap[arg.slice(2)];
        networkIndex = i;
        break;
      }
    }
    return { network, networkIndex };
  };

  // Destructure context
  const {
    addLine,
    setLines,
    isConnected,
    hasDomain,
    domain,
    address,
    balance,
    setCommandHistory,
    commandHistory,
    openChartModal,
    chainId,
    signMessageAsync,
    TOKENS,
    set1inchApiKey,
    parseSwapCommand,
    handleClassicSwap,
    parseLimitOrderCommand,
    handleLimitOrder,
    // ...other context as needed
  } = ctx;

  return {
    help: () => [
      'help - Show commands', 
      'clear - Clear terminal', 
      'date - Show date', 
      'whoami - Show user', 
      'history - Command history', 
      'history clear - Clear command history',
      'set1inchkey <key> - Set 1inch API key (stored locally for development)',
      'rpc <method> [params...] [--network <chain>] - Execute Ethereum RPC calls',
      'trace <txHash> [blockNumber] [--network <chain>] - Get transaction execution trace', 
      'gas [amount] [--network <chain>] - Get current gas prices with optional ETH cost calculation',
      'networkinfo [chain] - Get network information and statistics',
      'wallet - Show wallet info', 
      'balance - Show native token balance',
      'nft_balance [address] - Show NFT holdings across all chains (defaults to connected wallet)', 
      'message <text> - Sign message (requires wallet)', 
      'price <symbol|address> [--network <name>] - Get token price', 
      'chart <token0> [token1] [--type candle|line] [--interval <time>] [--network <name>] - Show price chart (defaults to /USDC)',
      'Intervals: 5m, 15m, 1h, 4h, 1d, 1w (default: 1h for candles)',
      'Networks: ethereum, optimism, arbitrum, polygon, base, bsc, avalanche',
      'swap classic <amount> <from> <to> [--network <name>] [--slippage <percent>] - Interactive swap', 
      'swap limit <amount> <from> <to> [--rate <rate>] [--network <name>] - Create limit order'
    ].forEach(cmd => addLine(cmd)),
    // ...existing code (all command implementations)...
    clear: () => setLines([]),
    date: () => addLine(new Date().toString()),
    whoami: () => {
      if (!isConnected) {
        addLine('defi-user');
      } else {
        const displayText = hasDomain && domain 
          ? `${domain} (${address})` 
          : address || 'Unknown address';
        addLine(displayText);
      }
    },
    history: (args: string[]) => {
      if (args[0] === 'clear') {
        setCommandHistory([]);
        addLine('Command history cleared');
      } else {
        if (commandHistory.length === 0) {
          addLine('No command history available');
        } else {
          addLine(`Command history (${commandHistory.length} entries):`);
          commandHistory.forEach((cmd: string, i: number) => addLine(`${i + 1}  ${cmd}`));
        }
      }
    },
    // ...existing code (all other command implementations)...
    nft_balance: async (args: string[]) => {
      const targetAddress = args[0] || address;
      if (!targetAddress) {
        addLine('❌ No address provided and no wallet connected', 'error');
        return;
      }
      const supportedChains = ['1', '137', '10', '42161', '8453', '56', '43114'];
      addLine(`🖼️  Fetching NFT holdings for ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`);
      addLine(`🌐 Checking chains: Ethereum, Polygon, Optimism, Arbitrum, Base, BSC, Avalanche`);
      addLine('');
      const chainNames: { [key: string]: string } = {
        '1': 'Ethereum',
        '137': 'Polygon',
        '10': 'Optimism',
        '42161': 'Arbitrum',
        '8453': 'Base',
        '56': 'BSC',
        '43114': 'Avalanche'
      };
      const covalentChains: { [key: string]: string } = {
        '1': 'eth-mainnet',
        '137': 'matic-mainnet',
        '10': 'optimism-mainnet',
        '42161': 'arbitrum-mainnet',
        '8453': 'base-mainnet',
        '56': 'bsc-mainnet',
        '43114': 'avalanche-mainnet'
      };
      let allNFTs: any[] = [];
      await Promise.all(supportedChains.map(async (chainId) => {
        const covalentChain = covalentChains[chainId];
        if (!covalentChain) return;
        const url = `https://api.covalenthq.com/v1/${chainId}/address/${targetAddress}/balances_v2/?nft=true&no-nft-fetch=false`;
        try {
          const response = await fetch(url);
          if (!response.ok) return;
          const json = await response.json();
          const items = json.data?.items || [];
          const nfts = items.filter((item: any) => item.type === 'nft' && item.nft_data && item.nft_data.length > 0)
            .flatMap((item: any) => item.nft_data.map((nft: any) => ({
              chainId,
              name: nft.external_data?.name || item.contract_name || 'Unknown',
              token_id: nft.token_id,
              collection_name: item.contract_name,
            })));
          allNFTs = allNFTs.concat(nfts);
        } catch (e) {
          // Ignore errors for individual chains
        }
      }));
      if (allNFTs.length === 0) {
        addLine('📭 No NFTs found across all supported chains');
        return;
      }
      const nftsByChain: { [key: string]: any[] } = {};
      allNFTs.forEach((nft: any) => {
        const chainId = nft.chainId?.toString();
        if (chainId) {
          if (!nftsByChain[chainId]) {
            nftsByChain[chainId] = [];
          }
          nftsByChain[chainId].push(nft);
        }
      });
      Object.keys(nftsByChain).forEach(chainId => {
        const chainNFTs = nftsByChain[chainId];
        const chainName = chainNames[chainId] || `Chain ${chainId}`;
        addLine(`📱 ${chainName}: ${chainNFTs.length} NFT${chainNFTs.length > 1 ? 's' : ''}`);
        chainNFTs.forEach((nft: any) => {
          const name = nft.name || nft.collection_name || 'Unknown';
          const tokenId = nft.token_id || nft.id || 'N/A';
          addLine(`   • ${name} #${tokenId}`);
        });
        addLine('');
      });
      addLine(`🎨 Total NFTs: ${allNFTs.length}`);
    },
    wallet: () => {
      if (!isConnected) {
        addLine('No wallet connected', 'error');
        return;
      }
      addLine(`Address: ${address}`);
      if (balance) {
        addLine(`Balance: ${balance.formatted} ${balance.symbol}`);
      }
      if (hasDomain) {
        addLine(`ENS: ${domain}`);
      }
    },
    balance: () => {
      if (!isConnected) {
        addLine('No wallet connected', 'error');
        return;
      }
      if (balance) {
        addLine(`Balance: ${balance.formatted} ${balance.symbol}`);
      } else {
        addLine('Balance not available');
      }
    },
    message: async (args: string[]) => {
      const text = args.join(' ');
      if (!text) {
        addLine('Usage: message <text>', 'error');
        return;
      }
      if (!isConnected) {
        addLine('Wallet not connected', 'error');
        return;
      }
      try {
        const signature = await signMessageAsync({ message: text });
        addLine(`Message signed: ${signature}`);
      } catch {
        addLine('Failed to sign message', 'error');
      }
    },
    price: async (args: string[]) => {
      const symbol = args[0];
      if (!symbol) {
        addLine('Usage: price <symbol|address> [--network <name>]', 'error');
        return;
      }
      const { network } = parseNetwork(args, chainId.toString());
      let tokenAddress = symbol;
      if (!symbol.startsWith('0x')) {
        const tokens = TOKENS[parseInt(network) as keyof typeof TOKENS];
        if (tokens && tokens[symbol.toUpperCase() as keyof typeof tokens]) {
          tokenAddress = tokens[symbol.toUpperCase() as keyof typeof tokens].address;
        } else {
          addLine('❌ Token not found. Only common tokens are supported.', 'error');
          addLine('💡 Try using the contract address directly instead of symbol.', 'error');
          return;
        }
      }
      try {
        const data = await fetchBackend(`/api/prices/price_by_token?chainId=${network}`, {
          method: 'POST',
          body: JSON.stringify({ token: tokenAddress })
        });
        
        if (data.price) {
          addLine(`💰 Price of ${symbol.toUpperCase()}: $${parseFloat(data.price).toFixed(4)}`);
        } else {
          addLine('❌ Price not available', 'error');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        addLine(`❌ Failed to fetch price: ${errorMessage}`, 'error');
      }
    },
    chart: (args: string[]) => {
      const token0 = args[0];
      if (!token0) {
        addLine('Usage: chart <token0> [token1] [--type candle|line] [--interval <time>] [--network <name>]', 'error');
        return;
      }
      const token1 = args[1] || 'USDC';
      let chartType: 'candle' | 'line' = 'candle';
      let interval = '1h';
      const { network } = parseNetwork(args, chainId.toString());
      // Parse additional args
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--type' && args[i+1]) {
          chartType = args[i+1] as 'candle' | 'line';
          i++;
        } else if (args[i] === '--interval' && args[i+1]) {
          interval = args[i+1];
          i++;
        }
      }
      openChartModal(token0, token1, network, chartType, interval);
    },
    swap: (args: string[]) => {
      const type = args[0];
      if (type === 'classic') {
        const parsed = parseSwapCommand(args.slice(1));
        if (parsed) {
          handleClassicSwap(parsed.amount, parsed.fromToken, parsed.toToken, parsed.network, parsed.slippage);
        } else {
          addLine('Invalid swap command', 'error');
        }
      } else if (type === 'limit') {
        const parsed = parseLimitOrderCommand(args.slice(1));
        if (parsed) {
          handleLimitOrder(parsed.amount, parsed.fromToken, parsed.toToken, parsed.network, parsed.rate);
        } else {
          addLine('Invalid limit order command', 'error');
        }
      } else {
        addLine('Usage: swap classic|limit ...', 'error');
      }
    },
    rpc: async (args: string[]) => {
      const method = args[0];
      if (!method) {
        addLine('Usage: rpc <method> [params...] [--network <chain>]', 'error');
        return;
      }
      const { network, networkIndex } = parseNetwork(args, chainId.toString());
      const params = args.slice(1, networkIndex !== -1 ? networkIndex : undefined);
      const rpcUrls: { [key: string]: string } = {
        '1': 'https://cloudflare-eth.com',
        '10': 'https://mainnet.optimism.io',
        '42161': 'https://arb1.arbitrum.io/rpc',
        '137': 'https://polygon-rpc.com',
        '8453': 'https://mainnet.base.org',
        '56': 'https://bsc-dataseed.binance.org',
        '43114': 'https://api.avax.network/ext/bc/C/rpc'
      };
      const rpcUrl = rpcUrls[network];
      if (!rpcUrl) {
        addLine('RPC not available for this network', 'error');
        return;
      }
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method,
            params
          })
        });
        const data = await response.json();
        if (data.result) {
          addLine(JSON.stringify(data.result, null, 2));
        } else if (data.error) {
          addLine(`RPC Error: ${data.error.message}`, 'error');
        }
      } catch {
        addLine('RPC call failed', 'error');
      }
    },
    trace: async (args: string[]) => {
      const txHash = args[0];
      if (!txHash) {
        addLine('Usage: trace <txHash> [blockNumber] [--network <chain>]', 'error');
        return;
      }
      const { network } = parseNetwork(args, chainId.toString());
      const blockscoutUrls: { [key: string]: string } = {
        '1': 'https://api.etherscan.io/api',
        '10': 'https://api-optimistic.etherscan.io/api',
        '42161': 'https://api.arbiscan.io/api',
        '137': 'https://api.polygonscan.com/api',
        '8453': 'https://api.basescan.org/api',
        '56': 'https://api.bscscan.com/api',
        '43114': 'https://api.snowtrace.io/api'
      };
      const apiUrl = blockscoutUrls[network];
      if (!apiUrl) {
        addLine('Trace not available for this network', 'error');
        return;
      }
      try {
        const url = `${apiUrl}?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=YourApiKeyToken`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === '1') {
          addLine('Transaction trace: ' + JSON.stringify(data.result, null, 2));
        } else {
          addLine('Trace not available', 'error');
        }
      } catch {
        addLine('Failed to get trace', 'error');
      }
    },
    gas: async (args: string[]) => {
      const amount = args[0];
      const { network } = parseNetwork(args, chainId.toString());
      const rpcUrls: { [key: string]: string } = {
        '1': 'https://cloudflare-eth.com',
        '10': 'https://mainnet.optimism.io',
        '42161': 'https://arb1.arbitrum.io/rpc',
        '137': 'https://polygon-rpc.com',
        '8453': 'https://mainnet.base.org',
        '56': 'https://bsc-dataseed.binance.org',
        '43114': 'https://api.avax.network/ext/bc/C/rpc'
      };
      const rpcUrl = rpcUrls[network];
      if (!rpcUrl) {
        addLine('Gas info not available for this network', 'error');
        return;
      }
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_gasPrice',
            params: []
          })
        });
        const data = await response.json();
        if (data.result) {
          const gasPrice = parseInt(data.result, 16) / 1e9;
          addLine(`Gas Price: ${gasPrice} gwei`);
          if (amount) {
            const ethCost = (parseFloat(amount) * 21000 * gasPrice) / 1e9;
            addLine(`Estimated cost for ${amount} ETH transfer: ${ethCost.toFixed(6)} ETH`);
          }
        } else {
          addLine('Gas price not available', 'error');
        }
      } catch {
        addLine('Failed to get gas price', 'error');
      }
    },
    networkinfo: (args: string[]) => {
      const chain = args[0] || chainId.toString();
      const networkNames: { [key: string]: string } = {
        '1': 'Ethereum Mainnet',
        '10': 'Optimism',
        '42161': 'Arbitrum One',
        '137': 'Polygon',
        '8453': 'Base',
        '56': 'BSC',
        '43114': 'Avalanche'
      };
      const name = networkNames[chain] || `Chain ${chain}`;
      addLine(`Network: ${name} (ID: ${chain})`);
      addLine(`Current chain ID: ${chainId}`);
    },
    set1inchkey: async (args: string[]) => {
      if (args.length === 1) {
        set1inchApiKey(args[0]);
      } else {
        addLine('Usage: set1inchkey <key>', 'error');
      }
    }
  };
}

// Command registry with all available commands
export const COMMAND_LIST = [
  'help', 'clear', 'date', 'whoami', 'history', 'wallet', 'balance', 'nft_balance', 'message', 
  'price', 'chart', 'swap', 'rpc', 'trace', 'gas', 'networkinfo', 'set1inchkey'
];