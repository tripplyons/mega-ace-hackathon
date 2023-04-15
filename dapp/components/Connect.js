import React from 'react'
import { useWallet } from '@txnlab/use-wallet'

export default function Connect() {
  const { providers, activeAccount } = useWallet()

  // Map through the providers.
  // Render account information and "connect", "set active", and "disconnect" buttons.
  // Finally, map through the `accounts` property to render a dropdown for each connected account.
  return (
    <div>
      Connect one of the support wallets to get started with the dapp.

      <h3 className="text-2xl font-bold mt-4 mb-2">Wallets</h3>

      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {providers?.map((provider) => (
          <div key={'provider-' + provider.metadata.id} className='p-2 b-2'>
            <div className='flex flex-col space-y-4'>
              <h4 className='text-xl font-semibold'>
                <img width={32} height={32} alt="" src={provider.metadata.icon} className='inline mr-2' />
                {provider.metadata.name} {provider.isActive && (
                  <span className="text-green-500">[Active]</span>
                )}
              </h4>
              <div className={provider.isConnected ? "hidden" : ""}>
                <button onClick={provider.connect} className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded">
                  Connect
                </button>
              </div>
              <div className={!provider.isConnected ? "hidden" : ""}>
                <button onClick={provider.disconnect} className="bg-red-500 hover:bg-red-300 text-white font-bold py-2 px-4 rounded">
                  Disconnect
                </button>
              </div>
              <div className={!provider.isConnected || provider.isActive ? "hidden" : ""}>
                <button
                  onClick={provider.setActiveProvider}
                  className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
                >
                  Set Active
                </button>
              </div>
              <div>
                {provider.isActive && provider.accounts.length && (
                  <select
                    value={activeAccount?.address}
                    onChange={(e) => provider.setActiveAccount(e.target.value)}
                  >
                    {provider.accounts.map((account) => (
                      <option key={account.address} value={account.address}>
                        {activeAccount?.address ? activeAccount.address.slice(0, 4) + '...' + activeAccount.address.slice(-4) : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))
        }
      </div>
    </div >
  )
}
