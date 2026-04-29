document.addEventListener('copy', () => {
  try {
    if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) return;

    const text = window.getSelection().toString();
    if (!text || !text.trim()) return;

    chrome.runtime.sendMessage({ type: 'CLIPBOARD_COPY', text }, () => {
      void chrome.runtime.lastError;
    });
  } catch (_) {
    // Silently ignore — content script must not break host page.
  }
});
