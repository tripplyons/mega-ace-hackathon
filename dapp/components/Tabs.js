import { useEffect, useState } from "react";
import Connect from '@/components/Connect'
import MakeContract from '@/components/MakeContract'
import ConfigureContract from '@/components/ConfigureContract'
import MakeNFT from "./MakeNFT";
import BuyOption from "./BuyOption";
import ExerciseOption from "./ExerciseOption";
import CancelOption from "./CancelOption";
import ExpireOption from "./ExpireOption";

// switch between functions for user to interact with
// and keep track of history of transactions
export default function Tabs() {
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  function saveHistory() {
    if (history.length > 0) {
      localStorage.setItem("history", JSON.stringify(history));
    }
  }

  function loadHistory() {
    const savedHistory = localStorage.getItem("history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }

  function clearHistory() {
    localStorage.removeItem("history");
    setHistory([]);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    saveHistory();
  }, [history]);

  function addToHistory(newHistory) {
    setHistory([...history, newHistory]);
  }

  // wrapper to send to children
  function _setLoading(newValue) {
    console.log("setting loading to " + newValue)
    setLoading(newValue);
  }

  const tabs = [
    {
      name: "Connect Wallet",
      content: <Connect addToHistory={addToHistory} />
    },
    {
      name: "Make NFT",
      content: <MakeNFT addToHistory={addToHistory} setLoading={_setLoading} />
    },
    {
      name: "Make Contract",
      content: <MakeContract addToHistory={addToHistory} setLoading={_setLoading} />
    },
    {
      name: "Configure Contract",
      content: <ConfigureContract addToHistory={addToHistory} setLoading={_setLoading} />
    },
    {
      name: "Buy Option",
      content: <BuyOption addToHistory={addToHistory} setLoading={_setLoading} />
    },
    {
      name: "Exercise Option",
      content: <ExerciseOption addToHistory={addToHistory} setLoading={_setLoading} />
    },
    {
      name: "Expire Option",
      content: <ExpireOption addToHistory={addToHistory} setLoading={_setLoading} />
    },
    {
      name: "Cancel Option",
      content: <CancelOption addToHistory={addToHistory} setLoading={_setLoading} />
    }
  ]

  return (
    <div>
      <div className="flex flex-row flex-wrap">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => {
              if (loading) {
                alert("Please wait for the current transaction to complete.")
              } else {
                setActiveTab(index)
              }
            }}
            className={`${activeTab === index
              ? "bg-gray-100"
              : "bg-gray-300"
              } py-2 px-4`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <div className="bg-gray-100 p-10">
        <h2 className="text-4xl font-bold mb-4">{tabs[activeTab].name}</h2>
        {tabs.map((tab, index) => (
          <div key={index} className={`${activeTab === index ? "" : "hidden"}`}>
            {tab.content}
          </div>
        ))}
      </div>
      <div className="mt-10 bg-gray-100 p-10">
        <h2 className="text-4xl font-bold mb-4">Transaction History</h2>
        {history.map((h, index) => (
          <div key={index} className="mt-4 p-4 bg-white">
            <p>{h}</p>
          </div>
        ))}
        <div className="mt-4">
          <button
            onClick={() => {
              clearHistory()
            }}
            className="bg-blue-500 hover:bg-blue-300 text-white font-bold py-2 px-4 rounded"
          >
            Clear History
          </button>
        </div>
      </div>
    </div>
  );
}
