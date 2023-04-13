import { useState } from "react";
import Connect from '@/components/Connect'
import MakeContract from '@/components/MakeContract'
import ConfigureContract from '@/components/ConfigureContract'
import MakeNFT from "./MakeNFT";

export default function Tabs() {
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState([]);

  function addToHistory(newHistory) {
    setHistory([...history, newHistory]);
  }

  const tabs = [
    {
      name: "Connect Wallet",
      content: <Connect addToHistory={addToHistory} />
    },
    {
      name: "Make NFT",
      content: <MakeNFT addToHistory={addToHistory} />
    },
    {
      name: "Make Contract",
      content: <MakeContract addToHistory={addToHistory} />
    },
    {
      name: "Configure Contract",
      content: <ConfigureContract addToHistory={addToHistory} />
    },
  ]

  return (
    <div>
      <div className="flex flex-row">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
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
        {tabs[activeTab].content}
      </div>
      <div className="mt-4 bg-gray-100 p-10">
        <h2 className="text-4xl font-bold">History</h2>
        {history.map((h, index) => (
          <div key={index} className="mt-4 p-4 bg-white">
            <p>{h}</p>
          </div>
        ))}
      </div>
    </div >
  );
}
