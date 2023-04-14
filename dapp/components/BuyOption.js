import { algodClient } from "@/src/algod";
import { useState } from "react";
import * as algosdk from "algosdk";
import { useWallet } from "@txnlab/use-wallet";

export default function BuyOption({ addToHistory }) {
  const { activeAddress, signTransactions, sendTransactions } = useWallet()

  const [appIndex, setAppIndex] = useState("")

  if (!activeAddress) {
    return (
      <div>
        <p>No account connected.</p>
      </div>
    )
  }
  async function buyOption() {
    const sp = await algodClient.getTransactionParams().do()


    const appInfo = await algodClient.getApplicationByID(appIndex).do();
    let premium = 0;
    let creator = "";

    for (const globalState of appInfo.params['global-state']) {
      // decode b64 string key with Buffer
      const globalKey = Buffer.from(globalState.key, 'base64').toString();
      // decode b64 address value with encodeAddress and Buffer
      const globalValue = algosdk.encodeAddress(
        Buffer.from(globalState.value.bytes, 'base64')
      );
      console.log(`Decoded global state - ${globalKey}: ${globalValue}`);

      if (globalKey == 'premium') {
        premium = globalState.value.uint;
      }
      if (globalKey == 'creator') {
        creator = globalValue;
      }
    }

    console.log(premium);


    const encoder = new TextEncoder()

    const txn0Params = {
      from: activeAddress,
      suggestedParams: sp,
      to: creator,
      amount: premium,
    }

    const txn0 = algosdk.makePaymentTxnWithSuggestedParamsFromObject(txn0Params)

    const txn1Params = {
      from: activeAddress,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: sp,
      appIndex: parseInt(appIndex),
      appArgs: [
        encoder.encode("buy")
      ]
    }

    const txn1 = algosdk.makeApplicationCallTxnFromObject(txn1Params)

    const transactions = [txn0, txn1]
    const txnGroup = algosdk.assignGroupID(transactions);

    const txnGroupEncoded = txnGroup.map((txn, index) => {
      return algosdk.encodeUnsignedTransaction(txn);
    });

    const signedTxns = await signTransactions(
      txnGroupEncoded
    );

    const { id } = await sendTransactions(signedTxns, 4)

    const result = await algosdk.waitForConfirmation(algodClient, id, 4)

    addToHistory('Bought option with contract index ' + appIndex + '.')
  }

  return (
    <div>
      Buy an option contract from another user who is selling it.

      <h3 className="text-2xl font-bold mt-4 mb-2">Settings</h3>

      <p>Contract Index:</p>
      <input type="text" value={appIndex} onChange={(e) => setAppIndex(e.target.value)}
        className="border-2 border-gray-300 bg-white p-2 mt-2 rounded focus:outline-none" />
      <div className="mt-4">
        <button
          onClick={() => {
            buyOption()
          }}
          className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
        >
          Buy Option
        </button>
      </div>
    </div>
  )
}
