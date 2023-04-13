import Tabs from '@/components/Tabs'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main className={`${inter.className} min-h-screen container mx-auto p-24 mt-4`}>
      <header className='mb-4'>
        <h1 className="text-6xl font-bold">NFT Call Options</h1>
      </header>
      <Tabs />
    </main>
  )
}
