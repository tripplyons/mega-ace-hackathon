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

      <h3 className="text-2xl font-bold mt-4 mb-2">Settings</h3>

      {providers?.map((provider) => (
        <div key={'provider-' + provider.metadata.id} className='p-2 b-2'>
          <h4 className='font-semibold text-gray-800'>
            <img width={30} height={30} alt="" src={provider.metadata.icon} />
            {provider.metadata.name} {provider.isActive && '[active]'}
          </h4>
          <div className='flex flex-row space-x-4'>
            <button onClick={provider.connect} disabled={provider.isConnected}>
              Connect
            </button>
            <button onClick={provider.disconnect} disabled={!provider.isConnected}>
              Disconnect
            </button>
            <button
              onClick={provider.setActiveProvider}
              disabled={!provider.isConnected || provider.isActive}
            >
              Set Active
            </button>
            <div>
              {provider.isActive && provider.accounts.length && (
                <select
                  value={activeAccount?.address}
                  onChange={(e) => provider.setActiveAccount(e.target.value)}
                >
                  {provider.accounts.map((account) => (
                    <option key={account.address} value={account.address}>
                      {account.address}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      ))
      }
    </div >
  )
}
