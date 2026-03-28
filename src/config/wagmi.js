import { http, createConfig } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'

export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
}

export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId: 'YOUR_PROJECT_ID' })
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
})
