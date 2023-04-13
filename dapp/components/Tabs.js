import { useState } from "react";
import Connect from '@/components/Connect'
import MakeContract from '@/components/MakeContract'
import InteractWithContract from '@/components/InteractWithContract'

export default function Tabs() {
  const [activeTab, setActiveTab] = useState(0);
  const tabNames = ["Connect Wallet", "Make Contract", "Interact With Contract"];
  const tabContents = [
    <Connect />,
    <MakeContract />,
    <InteractWithContract />,
  ];

  return (
    <div>
      <div className="flex flex-row">
        {tabNames.map((tabName, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`${activeTab === index
              ? "bg-gray-100"
              : "bg-gray-300"
              } py-2 px-4`}
          >
            {tabName}
          </button>
        ))}
      </div>
      <div className="bg-gray-100 p-10">
        <h1 className="text-4xl font-bold mb-4">{tabNames[activeTab]}</h1>
        {tabContents[activeTab]}
      </div>
    </div>
  );
}
