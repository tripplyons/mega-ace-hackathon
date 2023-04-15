import { algodClient } from "@/src/algod";
import { useState } from "react";
import * as algosdk from "algosdk";
import { useWallet } from "@txnlab/use-wallet";

export default function ConfigureContract({ addToHistory, setLoading }) {
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
    // load info from the contract

    const seconds = Math.floor(parseFloat(daysToExpiry) * 24 * 60 * 60)
    const strike_parsed = algosdk.algosToMicroalgos(parseFloat(strikePrice))
    const premium_parsed = algosdk.algosToMicroalgos(parseFloat(premium))

    const encoder = new TextEncoder()

    // 1st transaction - set the params on the contract
    const sp0 = await algodClient.getTransactionParams().do()
    const txn0Params = {
      from: activeAddress,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: sp0,
      appIndex: parseInt(appIndex),
      appArgs: [
        encoder.encode("params"),
        algosdk.encodeUint64(seconds),
        algosdk.encodeUint64(strike_parsed),
        algosdk.encodeUint64(premium_parsed)
      ],
      foreignAssets: [parseInt(nftId)]
    }

    const txn0 = algosdk.makeApplicationCallTxnFromObject(txn0Params)


    // 2nd transaction - fund the contract with 0.5 ALGO for fees

    const appAddress = algosdk.getApplicationAddress(parseInt(appIndex))
    const sp1 = await algodClient.getTransactionParams().do()
    const txn1Params = {
      from: activeAddress,
      to: appAddress,
      suggestedParams: sp1,
      amount: algosdk.algosToMicroalgos(0.5)
    }

    const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject(txn1Params)

    // 3rd transaction - opt in the contract into the NFT

    let sp2 = await algodClient.getTransactionParams().do()
    sp2.fee *= 2
    const encoder2 = new TextEncoder()
    const txn2Params = {
      from: activeAddress,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: sp2,
      appIndex: parseInt(appIndex),
      appArgs: [
        encoder2.encode("opt_in")
      ],
      foreignAssets: [parseInt(nftId)]
    }
    const txn2 = algosdk.makeApplicationCallTxnFromObject(txn2Params)

    // 4th transaction - transfer the NFT to the contract

    const sp3 = await algodClient.getTransactionParams().do()

    const encoder3 = new TextEncoder()

    const txn3Params = {
      from: activeAddress,
      suggestedParams: sp3,
      assetIndex: parseInt(nftId),
      to: appAddress,
      amount: 1
    }

    const txn3 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(txn3Params)

    // 5th transaction - set the contract to custody the NFT

    const sp4 = await algodClient.getTransactionParams().do()
    const txn4Params = {
      from: activeAddress,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: sp4,
      appIndex: parseInt(appIndex),
      appArgs: [
        encoder3.encode("custody")
      ],
      foreignAssets: [parseInt(nftId)]
    }

    const txn4 = algosdk.makeApplicationCallTxnFromObject(txn4Params)

    // group and sign

    const transactions = [txn0, txn1, txn2, txn3, txn4]
    const txnGroup = algosdk.assignGroupID(transactions);

    const txnGroupEncoded = txnGroup.map((txn, index) => {
      return algosdk.encodeUnsignedTransaction(txn);
    });

    const signedTxns = await signTransactions(
      txnGroupEncoded
    );

    const { id } = await sendTransactions(signedTxns, 4)

    const result = await algosdk.waitForConfirmation(algodClient, id, 4)

    addToHistory('Configured contract at index ' + appIndex + ', with NFT ' + nftId + ', strike price ' + strikePrice + ', premium ' + premium + ', and expiry in ' + daysToExpiry + ' days.')
  }

  return (
    <div>
      Set up a smart contract with the settings you want and fund it with 0.5 ALGO and 1 NFT.

      <h3 className="text-2xl font-bold mt-4 mb-2">Settings</h3>

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
          onClick={async () => {
            setLoading(true)
            try {
              await configureContract()
            } catch (e) {
              console.log(e)
              alert("Please confirm the transaction in your wallet, and confirm that you are using the right parameters.")
            } finally {
              setLoading(false)
            }
          }}
          className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
        >
          Configure and Fund Contract
        </button>
      </div>
    </div>
  )
}
