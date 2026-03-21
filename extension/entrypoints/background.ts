export default defineBackground({
  type: 'module',
  main() {
    // CRITICAL: All listeners MUST be registered synchronously at top level
    // Do NOT place inside async blocks or after await calls
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Message received:', message);
      return true; // Keep channel open for async responses
    });

    chrome.runtime.onInstalled.addListener(() => {
      console.log('bubb extension installed');
    });
  },
});
