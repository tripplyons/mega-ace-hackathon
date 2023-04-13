import { algodClient } from "@/src/algod";
import { useState } from "react";
import * as algosdk from "algosdk";
import option from "@/src/option.json";
import { useWallet } from "@txnlab/use-wallet";

export default function MakeContract() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet()

  const [appIndex, setAppIndex] = useState(0)

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

    let sp = await algodClient.getTransactionParams().do()

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

    console.log(txnParams)

    const signedTxns = await signTransactions([encodedTxn])

    const { id } = await sendTransactions(signedTxns, 4)

    console.log(id)

    const result = await algosdk.waitForConfirmation(algodClient, id, 4)

    setAppIndex(result['application-index'])
  }

  return (
    <div>
      <button onClick={() => {
        makeContract()
      }}
        className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
      >Deploy Option Contract</button>
      {
        (appIndex == 0) ? (
          <p>Contract not deployed.</p>
        ) : (
          <p>Contract deployed at index {appIndex}.</p>
        )
      }
    </div>
  )
}
