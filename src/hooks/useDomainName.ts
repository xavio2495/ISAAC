import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

interface DomainLookup {
  address: string;
  domain: string | null;
  hasDomain: boolean;
  isLoading: boolean;
}

export function useDomainName(address: string | undefined): DomainLookup {
  const [domain, setDomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setDomain(null);
      setIsLoading(false);
      return;
    }

    const lookupDomain = async () => {
      setIsLoading(true);
      try {
        // Use viem to resolve ENS name from address
        const client = createPublicClient({
          chain: mainnet,
          transport: http('https://cloudflare-eth.com'),
        });
        // viem: getEnsName returns null if not found
        // @ts-expect-error viem types may not be fully updated
        const ensName = await client.getEnsName({ address });
        setDomain(ensName || null);
      } catch (error) {
        // Domain lookup failed, set to null
        setDomain(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the lookup to avoid rapid API calls
    const timeoutId = setTimeout(lookupDomain, 500);
    
    return () => clearTimeout(timeoutId);
  }, [address]);

  return {
    address: address || '',
    domain,
    hasDomain: domain !== null,
    isLoading
  };
}