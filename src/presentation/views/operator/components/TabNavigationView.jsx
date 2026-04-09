import React from 'react';
import { TAB_LABELS } from '@/presentation/views/operator/utils/constants';

export const TabNavigationView = ({ 
  tabOrder, 
  activeTab, 
  setActiveTab, 
  draggedTab, 
  setDraggedTab, 
  onDropTab, 
  labels 
}) => {
  const labelMap = labels || TAB_LABELS;

  const handleDrop = (targetKey) => {
    // Only trigger drop if dragging a different tab
    if (draggedTab && draggedTab !== targetKey) {
      onDropTab(targetKey);
    }
  };

  return (
    <div className="border-b border-[#f3f3f3]">
      <div className="flex" role="tablist">
        {tabOrder.map((tabKey) => (
          <button
            key={tabKey}
            role="tab"
            aria-selected={activeTab === tabKey}
            draggable
            onDragStart={() => setDraggedTab(tabKey)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(tabKey)}
            onDragEnd={() => setDraggedTab(null)}
            onClick={() => setActiveTab(tabKey)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-move ${
              activeTab === tabKey
                ? 'border-[#1f1f1f] text-[#1f1f1f]'
                : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'
            } ${draggedTab === tabKey ? 'opacity-70' : ''}`}
          >
            {labelMap[tabKey] || tabKey}
          </button>
        ))}
      </div>
    </div>
  );
};