import { algodClient } from "@/src/algod";
import { useState } from "react";
import * as algosdk from "algosdk";
import { useWallet } from "@txnlab/use-wallet";

export default function ConfigureContract({ addToHistory }) {
  const { activeAddress, signTransactions, sendTransactions } = useWallet()

  const [appIndex, setAppIndex] = useState("")
  const [nftId, setNftId] = useState("")
  const [strikePrice, setStrikePrice] = useState("")
  const [daysToExpiry, setDaysToExpiry] = useState("")
  const [premium, setPremium] = useState("")

  if (!activeAddress) {
    return (
      <div>
        <p>No account connected.</p>
      </div>
    )
  }
  async function configureContract() {
    const sp = await algodClient.getTransactionParams().do()

    const seconds = Math.floor(parseFloat(daysToExpiry) * 24 * 60 * 60)
    const strike_parsed = algosdk.algosToMicroalgos(parseFloat(strikePrice))
    const premium_parsed = algosdk.algosToMicroalgos(0.01)

    const encoder = new TextEncoder()

    const txnParams = {
      from: activeAddress,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: sp,
      appIndex: parseInt(appIndex),
      appArgs: [
        encoder.encode("params"),
        algosdk.encodeUint64(seconds),
        algosdk.encodeUint64(strike_parsed),
        algosdk.encodeUint64(premium_parsed)
      ],
      foreignAssets: [parseInt(nftId)]
    }

    const txn = algosdk.makeApplicationCallTxnFromObject(txnParams)


    const encodedTxn = algosdk.encodeUnsignedTransaction(txn)

    const signedTxns = await signTransactions([encodedTxn])

    const { id } = await sendTransactions(signedTxns, 4)

    const result = await algosdk.waitForConfirmation(algodClient, id, 4)

    addToHistory('Configured contract at index ' + appIndex + ', with NFT ' + nftId + ', strike price ' + strikePrice + ', premium ' + premium + ', and expiry ' + daysToExpiry + ' days.')
  }

  return (
    <div>
      <p>Contract Index:</p>
      <input type="text" value={appIndex} onChange={(e) => setAppIndex(e.target.value)}
        className="border-2 border-gray-300 bg-white p-2 mt-2 rounded focus:outline-none" />
      <p className="mt-2">NFT Index:</p>
      <input type="text" value={nftId} onChange={(e) => setNftId(e.target.value)}
        className="border-2 border-gray-300 bg-white p-2 mt-2 rounded focus:outline-none" />
      <p className="mt-2">Strike Price:</p>
      <input type="text" value={strikePrice} onChange={(e) => setStrikePrice(e.target.value)}
        className="border-2 border-gray-300 bg-white p-2 mt-2 rounded focus:outline-none" />
      <p className="mt-2">Premium Requested:</p>
      <input type="text" value={premium} onChange={(e) => setPremium(e.target.value)}
        className="border-2 border-gray-300 bg-white p-2 mt-2 rounded focus:outline-none" />
      <p className="mt-2">Days to Expiry:</p>
      <input type="text" value={daysToExpiry} onChange={(e) => setDaysToExpiry(e.target.value)}
        className="border-2 border-gray-300 bg-white p-2 mt-2 rounded focus:outline-none" />
      <div className="mt-4">
        <button
          onClick={() => {
            configureContract()
          }}
          className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
        >
          Configure Contract
        </button>
      </div>

    </div>
  )
}
