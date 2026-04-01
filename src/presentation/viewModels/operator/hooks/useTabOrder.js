import { useState, useEffect } from 'react';
import { TAB_ORDER_STORAGE_KEY, DEFAULT_TAB_ORDER } from '@/presentation/views/operator/utils/constants';

const isValidTabOrder = (value) => Array.isArray(value)
  && value.length === DEFAULT_TAB_ORDER.length
  && DEFAULT_TAB_ORDER.every((tab) => value.includes(tab));

export const useTabOrder = () => {
  const [tabOrder, setTabOrder] = useState(() => {
    try {
      const raw = window.localStorage.getItem(TAB_ORDER_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_TAB_ORDER;
      }
      const parsed = JSON.parse(raw);
      return isValidTabOrder(parsed) ? parsed : DEFAULT_TAB_ORDER;
    }
    catch {
      return DEFAULT_TAB_ORDER;
    }
  });
  const [draggedTab, setDraggedTab] = useState(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(TAB_ORDER_STORAGE_KEY, JSON.stringify(tabOrder));
    }
    catch {
      // ignore storage errors
    }
  }, [tabOrder]);

  const onDropTab = (targetTabKey) => {
    if (!draggedTab || draggedTab === targetTabKey) {
      setDraggedTab(null);
      return;
    }

    setTabOrder((previous) => {
      const next = [...previous];
      const fromIndex = next.indexOf(draggedTab);
      const toIndex = next.indexOf(targetTabKey);

      if (fromIndex === -1 || toIndex === -1) {
        return previous;
      }

      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggedTab);
      return next;
    });

    setDraggedTab(null);
  };

  return { tabOrder, draggedTab, setDraggedTab, onDropTab };
};