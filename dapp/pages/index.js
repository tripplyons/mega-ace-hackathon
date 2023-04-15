import Tabs from '@/components/Tabs'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main className={`${inter.className} min-h-screen container mx-auto p-24 mt-4`}>
      <header className='mb-4'>
        <h1 className="text-6xl font-bold">NFT Call Options{
          process.env.NEXT_PUBLIC_NODE_NETWORK === 'testnet' ? ' (Testnet)' : ''
        }</h1>
        <ul className='mt-4'>
          <li><a
            className='text-blue-500 hover:text-blue-300 underline'
            href="https://github.com/tripplyons/mega-ace-hackathon">GitHub</a></li>
        </ul>
      </header>
      <Tabs />
    </main>
  )
}
