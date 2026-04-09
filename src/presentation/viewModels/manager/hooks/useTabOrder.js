import { useState, useEffect } from 'react';
import { fetchSetting, updateSetting } from '@/data/services/backendApi/setting';

const MANAGER_TAB_ORDER_STORAGE_KEY = 'manager-dashboard-tab-order-v1';
const DEFAULT_MANAGER_TAB_ORDER = ['overview', 'sims', 'msisdns', 'transactions', 'operator', 'team'];

const isValidTabOrder = (value) => Array.isArray(value)
  && value.length === DEFAULT_MANAGER_TAB_ORDER.length
  && DEFAULT_MANAGER_TAB_ORDER.every((tab) => value.includes(tab));

/**
 * useManagerTabOrder
 * @param {string} [remoteSettingKey] optional settings key to persist order on server
 */
export const useManagerTabOrder = (remoteSettingKey) => {
  const [tabOrder, setTabOrder] = useState(() => {
    try {
      const raw = window.localStorage.getItem(MANAGER_TAB_ORDER_STORAGE_KEY);
      if (!raw) return DEFAULT_MANAGER_TAB_ORDER;
      const parsed = JSON.parse(raw);
      return isValidTabOrder(parsed) ? parsed : DEFAULT_MANAGER_TAB_ORDER;
    } catch {
      return DEFAULT_MANAGER_TAB_ORDER;
    }
  });

  const [draggedTab, setDraggedTab] = useState(null);

  // If a remote setting key is provided, try to load the persisted order from server
  useEffect(() => {
    let cancelled = false;
    if (!remoteSettingKey) return undefined;

    (async () => {
      try {
        const raw = await fetchSetting(remoteSettingKey);
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw);
        if (isValidTabOrder(parsed)) {
          setTabOrder(parsed);
          try {
            window.localStorage.setItem(MANAGER_TAB_ORDER_STORAGE_KEY, JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore remote load errors
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [remoteSettingKey]);

  // persist to localStorage and remote setting (if provided)
  useEffect(() => {
    try {
      window.localStorage.setItem(MANAGER_TAB_ORDER_STORAGE_KEY, JSON.stringify(tabOrder));
    } catch {
      // ignore storage errors
    }

    if (!remoteSettingKey) return;

    // fire-and-forget save to remote; do not block UI
    (async () => {
      try {
        await updateSetting(remoteSettingKey, JSON.stringify(tabOrder));
      } catch {
        // ignore save errors
      }
    })();
  }, [tabOrder, remoteSettingKey]);

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

export default useManagerTabOrder;
