import Tabs from '@/components/Tabs'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main className={`${inter.className} min-h-screen container mx-auto p-24 mt-4`}>
      <header className='mb-4'>
        <h1 className="text-6xl font-bold">NFT Call Options</h1>
      </header>
      <section className='mb-4'>
        <div className="bg-gray-100 p-10">
          <h2 className="text-4xl font-bold">Functions</h2>
          <ul>
            <li><strong className="font-bold">Connect Wallet:</strong> Connect your Algorand wallet to the interface.</li>
            <li><strong className="font-bold">Make NFT:</strong> Make an NFT for testing</li>
            <li><strong className="font-bold">Make Contract:</strong> Make a contract representing a call option to be sold</li>
            <li><strong className="font-bold">Configure Contract:</strong> Set up the parameters for your option and prepare it for selling</li>
            <li><strong className="font-bold">Buy Option:</strong> Buy another user's option</li>
            <li><strong className="font-bold">Exercise Option:</strong> Exercise an option you bought before it expires</li>
            <li><strong className="font-bold">Expire Option:</strong> Trigger option expiry of an option you sold</li>
            <li><strong className="font-bold">Cancel Option:</strong> Cancel the option if no one has bought it</li>
          </ul>
        </div>
      </section>
      <Tabs />
    </main>
  )
}
