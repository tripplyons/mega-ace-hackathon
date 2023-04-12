import '@/styles/globals.css'
import { reconnectProviders, initializeProviders, WalletProvider } from '@txnlab/use-wallet'
import { useEffect } from 'react'

const walletProviders = initializeProviders()

export default function App({ Component, pageProps }) {
  // Reconnect the session when the user returns to the dApp
  useEffect(() => {
    reconnectProviders(walletProviders)
  }, [])

  return <WalletProvider value={walletProviders}><Component {...pageProps} /></WalletProvider>
}
