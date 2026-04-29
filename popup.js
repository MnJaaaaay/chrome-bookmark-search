let bookmarks = [];
let historyItems = [];
let clipboardHistory = [];
let favoriteSnippets = [];
let isLoading = false;
let editingFavoriteId = null;

let searchInput, resultsContainer, bookmarkRadio, historyRadio, clipboardRadio, favoritesRadio;
let clipboardControls, clearBtn, favoritesControls, addFavoriteBtn;
let editDialog, dialogTitle, favoriteTitle, favoriteContent, saveFavoriteBtn, cancelFavoriteBtn;

document.addEventListener('DOMContentLoaded', function () {
  searchInput = document.getElementById('search-input');
  resultsContainer = document.getElementById('search-results');
  bookmarkRadio = document.getElementById('bookmark-radio');
  historyRadio = document.getElementById('history-radio');
  clipboardRadio = document.getElementById('clipboard-radio');
  favoritesRadio = document.getElementById('favorites-radio');
  clipboardControls = document.getElementById('clipboard-controls');
  clearBtn = document.getElementById('clear-clipboard-btn');
  favoritesControls = document.getElementById('favorites-controls');
  addFavoriteBtn = document.getElementById('add-favorite-btn');
  editDialog = document.getElementById('edit-dialog');
  dialogTitle = document.getElementById('dialog-title');
  favoriteTitle = document.getElementById('favorite-title');
  favoriteContent = document.getElementById('favorite-content');
  saveFavoriteBtn = document.getElementById('save-favorite-btn');
  cancelFavoriteBtn = document.getElementById('cancel-favorite-btn');

  if (bookmarkRadio) bookmarkRadio.checked = true;
  if (resultsContainer) {
    resultsContainer.innerHTML = '<div class="no-results">正在加载数据，请稍候...</div>';
  }

  initEventListeners();
  loadAllData();
});

function initEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') handleSearch();
    });
  }

  if (bookmarkRadio) bookmarkRadio.addEventListener('change', handleSearch);
  if (historyRadio) historyRadio.addEventListener('change', handleSearch);

  if (clipboardRadio) {
    clipboardRadio.addEventListener('change', function () {
      if (clipboardControls) clipboardControls.style.display = clipboardRadio.checked ? 'flex' : 'none';
      if (favoritesControls) favoritesControls.style.display = 'none';
      handleSearch();
    });
  }

  if (favoritesRadio) {
    favoritesRadio.addEventListener('change', function () {
      if (favoritesControls) favoritesControls.style.display = favoritesRadio.checked ? 'flex' : 'none';
      if (clipboardControls) clipboardControls.style.display = 'none';
      handleSearch();
    });
  }

  if (clearBtn) clearBtn.addEventListener('click', clearClipboardHistory);
  if (addFavoriteBtn) addFavoriteBtn.addEventListener('click', openAddFavoriteDialog);
  if (saveFavoriteBtn) saveFavoriteBtn.addEventListener('click', saveFavorite);
  if (cancelFavoriteBtn) cancelFavoriteBtn.addEventListener('click', closeEditDialog);

  if (editDialog) {
    editDialog.addEventListener('click', function (e) {
      if (e.target === editDialog) closeEditDialog();
    });
  }
}

function loadAllData() {
  loadBookmarksSimple();
  loadHistorySimple();
  loadClipboardHistory();
  loadFavoriteSnippets();

  setTimeout(function () {
    if (resultsContainer && bookmarks.length === 0 && historyItems.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">数据加载中...请检查插件权限设置</div>';
    }
  }, 3000);
}

function loadClipboardHistory() {
  if (!chrome.storage || !chrome.storage.local) return;
  chrome.storage.local.get(['clipboardHistory'], function (result) {
    if (result.clipboardHistory) clipboardHistory = result.clipboardHistory;
  });
}

function clearClipboardHistory() {
  if (!confirm('确定要清空所有剪贴板历史吗？')) return;
  clipboardHistory = [];
  chrome.storage.local.set({ clipboardHistory });
  if (resultsContainer) {
    resultsContainer.innerHTML = '<div class="no-results">剪贴板历史已清空</div>';
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
  }
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function loadBookmarksSimple() {
  if (!chrome.bookmarks || !chrome.bookmarks.getTree) return;
  chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    if (bookmarkTreeNodes && bookmarkTreeNodes.length > 0) {
      bookmarks = [];
      processBookmarkTree(bookmarkTreeNodes);
      updateStatus();
    }
  });
}

function processBookmarkTree(bookmarkNodes) {
  for (let i = 0; i < bookmarkNodes.length; i++) {
    const node = bookmarkNodes[i];
    if (node.children && node.children.length > 0) {
      bookmarks.push({
        id: node.id,
        title: node.title || '未命名文件夹',
        type: 'folder',
        url: null
      });
      processBookmarkTree(node.children);
    } else if (node.url) {
      bookmarks.push({
        id: node.id,
        title: node.title || node.url,
        url: node.url,
        type: 'bookmark'
      });
    }
  }
}

function loadHistorySimple() {
  if (!chrome.history || !chrome.history.search) return;
  chrome.history.search({ text: '', startTime: 0, maxResults: 500 }, function (items) {
    historyItems = items || [];
    updateStatus();
  });
}

function updateStatus() {
  if (resultsContainer && (bookmarks.length > 0 || historyItems.length > 0)) {
    resultsContainer.innerHTML = '<div class="no-results">请输入关键词开始搜索</div>';
  }
}

function handleSearch() {
  const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const isBookmarkSearch = bookmarkRadio && bookmarkRadio.checked;
  const isClipboardSearch = clipboardRadio && clipboardRadio.checked;
  const isFavoritesSearch = favoritesRadio && favoritesRadio.checked;

  if (!isLoading && resultsContainer) {
    isLoading = true;
    resultsContainer.innerHTML = '<div class="loading">搜索中...</div>';
  }

  setTimeout(() => {
    try {
      if (!searchText && !isClipboardSearch && !isFavoritesSearch) {
        if (resultsContainer) {
          resultsContainer.innerHTML = '<div class="no-results">请输入关键词开始搜索</div>';
        }
        isLoading = false;
        return;
      }

      let results = [];
      if (isBookmarkSearch) {
        results = filterItems(bookmarks, searchText);
      } else if (isClipboardSearch) {
        results = filterClipboardItems(clipboardHistory, searchText);
      } else if (isFavoritesSearch) {
        results = filterFavoriteSnippets(favoriteSnippets, searchText);
      } else {
        results = filterItems(historyItems, searchText);
      }

      renderResults(results, isBookmarkSearch, isClipboardSearch, isFavoritesSearch);
    } catch (_) {
      if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="no-results">搜索出错，请重试</div>';
      }
    } finally {
      isLoading = false;
    }
  }, 100);
}

function filterItems(items, searchText) {
  return items.filter(item => {
    const titleMatch = item.title && item.title.toLowerCase().includes(searchText);
    const urlMatch = item.url && item.url.toLowerCase().includes(searchText);
    return titleMatch || urlMatch;
  });
}

function filterClipboardItems(items, searchText) {
  if (!searchText) return items;
  return items.filter(item => item.text && item.text.toLowerCase().includes(searchText));
}

function filterFavoriteSnippets(items, searchText) {
  if (!searchText) return items;
  return items.filter(item =>
    (item.title && item.title.toLowerCase().includes(searchText)) ||
    (item.content && item.content.toLowerCase().includes(searchText))
  );
}

function renderResults(results, isBookmarkSearch, isClipboardSearch, isFavoritesSearch) {
  if (!resultsContainer) return;
  resultsContainer.innerHTML = '';

  if ((isBookmarkSearch && bookmarks.length === 0) ||
      (isClipboardSearch && clipboardHistory.length === 0) ||
      (isFavoritesSearch && favoriteSnippets.length === 0) ||
      (!isBookmarkSearch && !isClipboardSearch && !isFavoritesSearch && historyItems.length === 0)) {
    let sourceType = '历史记录';
    if (isBookmarkSearch) sourceType = '书签';
    if (isClipboardSearch) sourceType = '剪贴板';
    if (isFavoritesSearch) sourceType = '常用片段';

    if (isClipboardSearch) {
      resultsContainer.innerHTML = '<div class="no-results">暂无剪贴板历史<br>复制任何内容后会自动记录</div>';
    } else if (isFavoritesSearch) {
      resultsContainer.innerHTML = '<div class="no-results">暂无常用片段<br>点击"新建"按钮添加</div>';
    } else {
      resultsContainer.innerHTML = `<div class="no-results">${sourceType}数据未加载，请检查Chrome权限设置</div>`;
    }
    return;
  }

  if (!results || results.length === 0) {
    resultsContainer.innerHTML = '<div class="no-results">未找到匹配的结果</div>';
    return;
  }

  const container = document.createElement('div');
  container.className = 'search-results';

  const countDiv = document.createElement('div');
  countDiv.className = 'result-count';
  countDiv.textContent = `找到 ${results.length} 条结果`;
  container.appendChild(countDiv);

  const displayResults = results.slice(0, 50);
  displayResults.forEach(item => {
    container.appendChild(createResultItem(item, isBookmarkSearch, isClipboardSearch, isFavoritesSearch));
  });

  resultsContainer.appendChild(container);
}

function createResultItem(item, isBookmarkSearch, isClipboardSearch, isFavoritesSearch) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'result-item';

  const iconDiv = document.createElement('div');
  iconDiv.className = 'result-icon';
  if (isClipboardSearch) iconDiv.textContent = '📋';
  else if (isFavoritesSearch) iconDiv.textContent = '⭐';
  else if (item.type === 'folder') iconDiv.textContent = '📁';
  else if (isBookmarkSearch) iconDiv.textContent = '🔖';
  else iconDiv.textContent = '🕐';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'result-content';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'result-title';

  const typeSpan = document.createElement('span');
  typeSpan.className = 'result-type';
  if (isClipboardSearch) typeSpan.textContent = '剪贴板';
  else if (isFavoritesSearch) typeSpan.textContent = '常用';
  else typeSpan.textContent = item.type === 'folder' ? '文件夹' : (isBookmarkSearch ? '书签' : '历史');

  if (isClipboardSearch) {
    titleDiv.textContent = item.preview || item.text.substring(0, 50);
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'clipboard-timestamp';
    timestampDiv.textContent = formatTimestamp(item.timestamp);
    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(timestampDiv);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '复制';
    copyBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      copyToClipboard(item.text);
    });

    itemDiv.appendChild(iconDiv);
    itemDiv.appendChild(contentDiv);
    itemDiv.appendChild(copyBtn);
    itemDiv.appendChild(typeSpan);
  } else if (isFavoritesSearch) {
    titleDiv.textContent = item.title || item.content.substring(0, 30) + '...';
    contentDiv.appendChild(titleDiv);

    const previewDiv = document.createElement('div');
    previewDiv.className = 'clipboard-preview';
    previewDiv.textContent = item.content.substring(0, 100);
    contentDiv.appendChild(previewDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'favorite-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn';
    copyBtn.textContent = '复制';
    copyBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      copyToClipboard(item.content);
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openEditFavoriteDialog(item.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteFavorite(item.id);
    });

    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    itemDiv.appendChild(iconDiv);
    itemDiv.appendChild(contentDiv);
    itemDiv.appendChild(actionsDiv);
    itemDiv.appendChild(typeSpan);
  } else {
    titleDiv.textContent = item.title || getDomainName(item.url) || '未命名';
    contentDiv.appendChild(titleDiv);

    if (item.url) {
      const urlDiv = document.createElement('div');
      urlDiv.className = 'result-url';
      urlDiv.textContent = formatUrl(item.url);
      contentDiv.appendChild(urlDiv);
    }

    itemDiv.appendChild(iconDiv);
    itemDiv.appendChild(contentDiv);
    itemDiv.appendChild(typeSpan);
  }

  if (isClipboardSearch) {
    itemDiv.addEventListener('click', function () {
      copyToClipboard(item.text);
    });
  } else if (isFavoritesSearch) {
    itemDiv.addEventListener('click', function () {
      copyToClipboard(item.content);
    });
  } else if (item.url) {
    itemDiv.addEventListener('click', function () {
      if (chrome.tabs) chrome.tabs.create({ url: item.url });
    });
  }

  return itemDiv;
}

function getDomainName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function formatUrl(url) {
  try {
    const urlObj = new URL(url);
    let formatted = urlObj.hostname;
    if (urlObj.pathname && urlObj.pathname !== '/') {
      const path = urlObj.pathname.length > 30
        ? urlObj.pathname.substring(0, 27) + '...'
        : urlObj.pathname;
      formatted += path;
    }
    return formatted;
  } catch {
    return url.length > 40 ? url.substring(0, 37) + '...' : url;
  }
}

function loadFavoriteSnippets() {
  chrome.storage.local.get(['favoriteSnippets'], (result) => {
    favoriteSnippets = result.favoriteSnippets || [];
  });
}

function openAddFavoriteDialog() {
  editingFavoriteId = null;
  dialogTitle.textContent = '新建常用片段';
  favoriteTitle.value = '';
  favoriteContent.value = '';
  editDialog.style.display = 'flex';
  favoriteContent.focus();
}

function openEditFavoriteDialog(id) {
  const snippet = favoriteSnippets.find(s => s.id === id);
  if (!snippet) return;
  editingFavoriteId = id;
  dialogTitle.textContent = '编辑常用片段';
  favoriteTitle.value = snippet.title || '';
  favoriteContent.value = snippet.content || '';
  editDialog.style.display = 'flex';
  favoriteContent.focus();
}

function closeEditDialog() {
  editDialog.style.display = 'none';
  editingFavoriteId = null;
  favoriteTitle.value = '';
  favoriteContent.value = '';
}

function saveFavorite() {
  const title = favoriteTitle.value.trim();
  const content = favoriteContent.value.trim();
  if (!content) {
    alert('请输入内容');
    return;
  }

  if (editingFavoriteId) {
    const index = favoriteSnippets.findIndex(s => s.id === editingFavoriteId);
    if (index !== -1) {
      favoriteSnippets[index] = {
        id: editingFavoriteId,
        title,
        content,
        timestamp: Date.now()
      };
    }
  } else {
    favoriteSnippets.unshift({
      id: Date.now(),
      title,
      content,
      timestamp: Date.now()
    });
  }

  chrome.storage.local.set({ favoriteSnippets }, () => {
    closeEditDialog();
    handleSearch();
  });
}

function deleteFavorite(id) {
  if (!confirm('确定要删除这个常用片段吗？')) return;
  favoriteSnippets = favoriteSnippets.filter(s => s.id !== id);
  chrome.storage.local.set({ favoriteSnippets }, handleSearch);
}
