import { algodClient } from "@/src/algod";
import { useState } from "react";
import * as algosdk from "algosdk";
import option from "@/src/option.json";
import { useWallet } from "@txnlab/use-wallet";

export default function InteractWithContract() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet()

  const [appIndex, setAppIndex] = useState("")

  if (!activeAddress) {
    return (
      <div>
        <p>No account connected.</p>
      </div>
    )
  }

  return (
    <div>
      <p>Contract Application Index:</p>
      <input type="text" value={appIndex} onChange={(e) => setAppIndex(e.target.value)}
        className="border-2 border-gray-300 bg-white p-2 rounded focus:outline-none" />
    </div>
  )
}
