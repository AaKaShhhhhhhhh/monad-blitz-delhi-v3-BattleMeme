import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { monadTestnet } from 'wagmi/chains'
import { http } from 'wagmi'

const rpcUrl = import.meta.env.VITE_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'

export const config = getDefaultConfig({
  appName: 'MemeWar',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(rpcUrl, {
      batch: true,
      retryCount: 3,
      retryDelay: 500,
      timeout: 20_000,
    }),
  },
})
