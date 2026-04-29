const MAX_CLIPBOARD_ITEMS = 100;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'CLIPBOARD_COPY') return;

  const text = message.text;
  if (!text || !text.trim()) {
    sendResponse({ success: false, error: 'empty' });
    return;
  }

  chrome.storage.local.get(['clipboardHistory'], (result) => {
    let clipboardHistory = result.clipboardHistory || [];
    const timestamp = Date.now();

    const existingIndex = clipboardHistory.findIndex(item => item.text === text);
    if (existingIndex !== -1) {
      clipboardHistory.splice(existingIndex, 1);
    }

    clipboardHistory.unshift({
      id: timestamp,
      text: text,
      timestamp: timestamp,
      preview: text.substring(0, 100)
    });

    if (clipboardHistory.length > MAX_CLIPBOARD_ITEMS) {
      clipboardHistory = clipboardHistory.slice(0, MAX_CLIPBOARD_ITEMS);
    }

    chrome.storage.local.set({ clipboardHistory }, () => {
      sendResponse({ success: true, count: clipboardHistory.length });
    });
  });

  return true;
});
