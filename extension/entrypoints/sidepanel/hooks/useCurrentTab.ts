import { useState, useEffect } from 'react';

interface TabInfo {
  url: string;
  title: string;
}

/**
 * Hook that returns the current active browser tab's URL and title.
 * Updates when the user switches tabs or navigates to a new URL.
 * Returns null until the first chrome.tabs.query resolves.
 */
export function useCurrentTab(): TabInfo | null {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);

  useEffect(() => {
    // Initial query for the currently active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url && tab?.title) {
        setTabInfo({ url: tab.url, title: tab.title });
      }
    });

    // Listen for tab activation (user switches tabs)
    const onActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError) return;
        if (tab?.url && tab?.title) {
          setTabInfo({ url: tab.url, title: tab.title });
        }
      });
    };

    // Listen for tab URL changes (navigation within the same tab)
    const onUpdated = (
      _tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) => {
      // Only update when the URL actually changes
      if (!changeInfo.url) return;
      if (tab.active && tab.url && tab.title) {
        setTabInfo({ url: tab.url, title: tab.title });
      }
    };

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);

    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  return tabInfo;
}
