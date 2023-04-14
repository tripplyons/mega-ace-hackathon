import { algodClient } from "@/src/algod";
import { useState } from "react";
import * as algosdk from "algosdk";
import { useWallet } from "@txnlab/use-wallet";

export default function ExerciseOption({ addToHistory }) {
  const { activeAddress, signTransactions, sendTransactions } = useWallet()

  const [appIndex, setAppIndex] = useState("")

  if (!activeAddress) {
    return (
      <div>
        <p>No account connected.</p>
      </div>
    )
  }
  async function exerciseOption() {
    const sp = await algodClient.getTransactionParams().do()


    const appInfo = await algodClient.getApplicationByID(appIndex).do();
    let strike = 0;
    let creator = "";
    let asa = 0;

    for (const globalState of appInfo.params['global-state']) {
      // decode b64 string key with Buffer
      const globalKey = Buffer.from(globalState.key, 'base64').toString();
      // decode b64 address value with encodeAddress and Buffer
      const globalValue = algosdk.encodeAddress(
        Buffer.from(globalState.value.bytes, 'base64')
      );
      console.log(`Decoded global state - ${globalKey}: ${globalValue}`);

      if (globalKey == 'strike') {
        strike = globalState.value.uint;
      }
      if (globalKey == 'creator') {
        creator = globalValue;
      }
      if (globalKey == 'asa') {
        asa = globalState.value.uint;
      }
    }

    console.log(strike);


    const encoder = new TextEncoder()

    const txn0Params = {
      from: activeAddress,
      suggestedParams: sp,
      to: creator,
      amount: strike,
    }

    const txn0 = algosdk.makePaymentTxnWithSuggestedParamsFromObject(txn0Params)

    let sp2 = await algodClient.getTransactionParams().do()
    sp2.fee = 2000;

    const txn1Params = {
      from: activeAddress,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: sp2,
      appIndex: parseInt(appIndex),
      appArgs: [
        encoder.encode("exercise")
      ],
      foreignAssets: [asa]
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

    addToHistory('Exercised option with contract index ' + appIndex + '.')
  }

  async function optIn() {
    const sp = await algodClient.getTransactionParams().do()
    const appInfo = await algodClient.getApplicationByID(appIndex).do();
    let asa = 0;

    for (const globalState of appInfo.params['global-state']) {
      // decode b64 string key with Buffer
      const globalKey = Buffer.from(globalState.key, 'base64').toString();
      // decode b64 address value with encodeAddress and Buffer
      const globalValue = algosdk.encodeAddress(
        Buffer.from(globalState.value.bytes, 'base64')
      );
      if (globalKey == 'asa') {
        asa = globalState.value.uint;
      }
    }

    const txnParams = {
      from: activeAddress,
      suggestedParams: sp,
      assetIndex: asa,
      to: activeAddress,
      amount: 0,
    }

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(txnParams)

    const txnEncoded = algosdk.encodeUnsignedTransaction(txn);

    const signedTxn = await signTransactions(
      [txnEncoded]
    );

    const { id } = await sendTransactions(signedTxn, 4)

    const result = await algosdk.waitForConfirmation(algodClient, id, 4)

    addToHistory('Opted in to receiving NFT with index ' + asa + '.')
  }

  return (
    <div>
      If you bough an option, you can pay an amount of ALGO equal to the strike price to the seller of an option and receive the NFT before the expiration date.

      <h3 className="text-2xl font-bold mt-4 mb-2">Settings</h3>

      <p>Contract Index:</p>
      <input type="text" value={appIndex} onChange={(e) => setAppIndex(e.target.value)}
        className="border-2 border-gray-300 bg-white p-2 mt-2 rounded focus:outline-none" />
      <div className="mt-4">
        <button
          onClick={() => {
            optIn()
          }}
          className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
        >
          Opt In to Receiving NFT
        </button>
      </div>
      <div className="mt-4">
        <button
          onClick={() => {
            exerciseOption()
          }}
          className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
        >
          Exercise Option
        </button>
      </div>
    </div>
  )
}
