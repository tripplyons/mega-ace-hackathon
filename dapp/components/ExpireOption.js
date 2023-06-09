import { algodClient } from "@/src/algod";
import { useState } from "react";
import * as algosdk from "algosdk";
import { useWallet } from "@txnlab/use-wallet";

export default function ExpireOption({ addToHistory, setLoading }) {
  const { activeAddress, signTransactions, sendTransactions } = useWallet()

  const [appIndex, setAppIndex] = useState("")

  if (!activeAddress) {
    return (
      <div>
        <p>No account connected.</p>
      </div>
    )
  }

  async function expireOption() {
    // load info from the contract

    const appInfo = await algodClient.getApplicationByID(appIndex).do();
    let asa = 0;

    for (const globalState of appInfo.params['global-state']) {
      // decode b64 string key with Buffer
      const globalKey = Buffer.from(globalState.key, 'base64').toString();
      // decode b64 address value with encodeAddress and Buffer
      const globalValue = algosdk.encodeAddress(
        Buffer.from(globalState.value.bytes, 'base64')
      );
      console.log(`Decoded global state - ${globalKey}: ${globalValue}`);

      if (globalKey == 'asa') {
        asa = globalState.value.uint;
      }
    }

    // call the expire method

    let sp = await algodClient.getTransactionParams().do()

    // extra fee for internal transactions
    sp.fee = 2000;

    const encoder = new TextEncoder()

    const txnParams = {
      from: activeAddress,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: sp,
      appIndex: parseInt(appIndex),
      appArgs: [
        encoder.encode("expire")
      ],
      foreignAssets: [asa]
    }

    const txn = algosdk.makeApplicationCallTxnFromObject(txnParams)



    const signedTxns = await signTransactions([
      algosdk.encodeUnsignedTransaction(txn)
    ]);

    const { id } = await sendTransactions(signedTxns, 4)

    const result = await algosdk.waitForConfirmation(algodClient, id, 4)

    addToHistory('Expired option with contract index ' + appIndex + '.')
  }

  return (
    <div>
      If you sold an option, and it was not exercised before it expired, you can use this button to expire the option and get your NFT back.

      <h3 className="text-2xl font-bold mt-4 mb-2">Settings</h3>

      <p>Contract Index:</p>
      <input type="text" value={appIndex} onChange={(e) => setAppIndex(e.target.value)}
        className="border-2 border-gray-300 bg-white p-2 mt-2 rounded focus:outline-none" />
      <div className="mt-4">
        <button
          onClick={() => async () => {
            setLoading(true)
            try {
              await expireOption()
            } catch (e) {
              console.log(e)
              alert("Please confirm the transaction in your wallet, and confirm that you are using the right parameters.")
            } finally {
              setLoading(false)
            }
          }}
          className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
        >
          Expire Option
        </button>
      </div>
    </div>
  )
}
