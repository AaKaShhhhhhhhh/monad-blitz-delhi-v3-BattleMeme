import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { createConfig, http } from 'wagmi'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import { monadTestnet } from 'wagmi/chains'

const appName = 'MemeWar'
const rpcUrl = import.meta.env.VITE_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

const transport = http(rpcUrl, {
  batch: true,
  retryCount: 3,
  retryDelay: 500,
  timeout: 20_000,
})

export const config = projectId
  ? getDefaultConfig({
      appName,
      projectId,
      chains: [monadTestnet],
      transports: {
        [monadTestnet.id]: transport,
      },
    })
  : createConfig({
      chains: [monadTestnet],
      transports: {
        [monadTestnet.id]: transport,
      },
      connectors: [
        injected({ shimDisconnect: true }),
        coinbaseWallet({ appName }),
      ],
    })
