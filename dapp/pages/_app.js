import '@/styles/globals.css'
import { reconnectProviders, initializeProviders, WalletProvider } from '@txnlab/use-wallet'
import { useEffect } from 'react'

const walletProviders = initializeProviders([], {
  network: process.env.NEXT_PUBLIC_NODE_NETWORK,
  nodeServer: process.env.NEXT_PUBLIC_NODE_BASE_URL,
  nodeToken: process.env.NEXT_PUBLIC_NODE_TOKEN,
  nodePort: process.env.NEXT_PUBLIC_NODE_PORT
})

export default function App({ Component, pageProps }) {
  // Reconnect the session when the user returns to the dApp
  useEffect(() => {
    reconnectProviders(walletProviders)
  }, [])

  return <WalletProvider value={walletProviders}><Component {...pageProps} /></WalletProvider>
}
