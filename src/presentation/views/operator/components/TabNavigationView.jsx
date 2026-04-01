import React from 'react';
import { TAB_LABELS } from '@/presentation/views/operator/utils/constants';

export const TabNavigationView = ({ tabOrder, activeTab, setActiveTab, draggedTab, setDraggedTab, onDropTab }) => {
  return (
    <div className="border-b border-[#f3f3f3]">
      <div className="flex">
        {tabOrder.map((tabKey) => (
          <button
            key={tabKey}
            draggable
            onDragStart={() => setDraggedTab(tabKey)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onDropTab(tabKey)}
            onDragEnd={() => setDraggedTab(null)}
            onClick={() => setActiveTab(tabKey)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-move ${
              activeTab === tabKey
                ? 'border-[#1f1f1f] text-[#1f1f1f]'
                : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'
            } ${draggedTab === tabKey ? 'opacity-70' : ''}`}
          >
            {TAB_LABELS[tabKey] || tabKey}
          </button>
        ))}
      </div>
    </div>
  );
};