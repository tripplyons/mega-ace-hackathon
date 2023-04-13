import { algodClient } from "@/src/algod";
import { useState, useEffect } from "react";
import * as algosdk from "algosdk";
import { useWallet } from "@txnlab/use-wallet";

export default function MakeNFT({ addToHistory }) {
  const { activeAddress, signTransactions, sendTransactions } = useWallet()

  const [asaIndex, setAsaIndex] = useState(0)
  const [name, setName] = useState("")

  useEffect(() => {
    if (asaIndex != 0) {
      addToHistory("NFT created at index " + asaIndex + ".")
    }
  }, [asaIndex])

  if (!activeAddress) {
    return (
      <div>
        <p>No account connected.</p>
      </div>
    )
  }

  async function makeNFT() {
    const sp = await algodClient.getTransactionParams().do()

    const txnParams = {
      from: activeAddress,
      manager: activeAddress,
      reserve: activeAddress,
      freeze: activeAddress,
      clawback: activeAddress,
      total: 1,
      decimals: 0,
      assetName: name,
      unitName: name,
      suggestedParams: sp,
    }

    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(txnParams)


    const encodedTxn = algosdk.encodeUnsignedTransaction(txn)

    console.log(txnParams)

    const signedTxns = await signTransactions([encodedTxn])

    const { id } = await sendTransactions(signedTxns, 4)

    const result = await algosdk.waitForConfirmation(algodClient, id, 4)

    console.log(result)

    setAsaIndex(result['asset-index'])
  }

  return (
    <div>
      <p>NFT Name:</p>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
        className="border-2 border-gray-300 bg-white p-2 mt-2 rounded focus:outline-none" />
      <div className="mt-4 mb-2">
        <button onClick={() => {
          makeNFT()
        }}
          className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
        >Make NFT</button>
      </div>
      {
        (asaIndex == 0) ? (
          <p>NFT is not created yet.</p>
        ) : (
          <p>NFT created at index {asaIndex}</p>
        )
      }
    </div>
  )
}
