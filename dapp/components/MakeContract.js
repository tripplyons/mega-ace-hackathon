import { algodClient } from "@/src/algod";
import { useEffect, useState } from "react";
import * as algosdk from "algosdk";
import option from "@/src/option.json";
import { useWallet } from "@txnlab/use-wallet";

export default function MakeContract({ addToHistory, setLoading }) {
  const { activeAddress, signTransactions, sendTransactions } = useWallet()

  const [appIndex, setAppIndex] = useState(0)

  useEffect(() => {
    if (appIndex != 0) {
      addToHistory("Contract created at index " + appIndex + ".")
    }
  }, [appIndex])

  if (!activeAddress) {
    return (
      <div>
        <p>No account connected.</p>
      </div>
    )
  }

  async function makeContract() {
    const approvalProgram = Uint8Array.from(
      Buffer.from(
        option.approval,
        'base64'
      )
    )
    const clearStateProgram = Uint8Array.from(
      Buffer.from(
        option.clear,
        'base64'
      )
    )

    // create the contract

    const sp = await algodClient.getTransactionParams().do()

    const txnParams = {
      from: activeAddress,
      numLocalByteSlices: option.state.local.num_byte_slices,
      numLocalInts: option.state.local.num_uints,
      numGlobalByteSlices: option.state.global.num_byte_slices,
      numGlobalInts: option.state.global.num_uints,
      approvalProgram: approvalProgram,
      clearProgram: clearStateProgram,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: sp,
    }

    const txn = algosdk.makeApplicationCreateTxnFromObject(txnParams)


    const encodedTxn = algosdk.encodeUnsignedTransaction(txn)

    const signedTxns = await signTransactions([encodedTxn])

    const { id } = await sendTransactions(signedTxns, 4)

    const result = await algosdk.waitForConfirmation(algodClient, id, 4)

    setAppIndex(result['application-index'])

    console.log(result)
  }

  return (
    <div>
      Create a smart contract representing a call option you wish to sell.

      <h3 className="text-2xl font-bold mt-4 mb-2">Settings</h3>

      <button onClick={async () => {
        setLoading(true)
        try {
          await makeContract()
        } catch (e) {
          console.log(e)
          alert("Please confirm the transaction in your wallet, and confirm that you are using the right parameters.")
        } finally {
          setLoading(false)
        }
      }}
        className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
      >Make Option Contract</button>
      <div className="mt-2">
        {
          (appIndex == 0) ? (
            <p>Contract is not created yet.</p>
          ) : (
            <p>Contract created at index {appIndex}.</p>
          )
        }
      </div>
    </div>
  )
}
