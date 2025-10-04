import { getActiveTabURL } from "./utils.js";

export async function bookmarkOrUpdateCurrentTab(showMessage) {
  let activeTab;
  try {
    activeTab = await getActiveTabURL();
  } catch (e) {
    if (showMessage) showMessage({ url: '', title: '' }, null, 'Unable to access the active tab.');
    return;
  }
  if (!activeTab || !activeTab.url) {
    if (showMessage) showMessage({ url: '', title: '' }, null, 'No active tab or URL found.');
    return;
  }
  const bookmarkData = {
    url: activeTab.url,
    title: activeTab.title,
  };
  chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    const bookmarks = getAllBookmarksWithIds(bookmarkTreeNodes);
    const similarBookmark = bookmarks.find((b) => urlSimilarity(b.url, bookmarkData.url) >= 0.9);
    if (similarBookmark) {
      chrome.bookmarks.get(similarBookmark.id, function (results) {
        const parentId = results[0].parentId;
        const updatedBookmarkData = {
          url: bookmarkData.url,
          title: similarBookmark.title,
          parentId: parentId,
        };
        chrome.bookmarks.remove(similarBookmark.id, function () {
          chrome.bookmarks.create(updatedBookmarkData, function () {
            if (showMessage) showMessage(updatedBookmarkData, similarBookmark);
          });
        });
      });
    } else {
      chrome.bookmarks.create(bookmarkData, function () {
        if (showMessage) showMessage(bookmarkData, null);
      });
    }
  });
}

function getAllBookmarksWithIds(bookmarkNodes) {
  const bookmarks = [];
  function processNodes(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].url) {
        bookmarks.push({ id: nodes[i].id, url: nodes[i].url, title: nodes[i].title });
      }
      if (nodes[i].children) {
        processNodes(nodes[i].children);
      }
    }
  }
  processNodes(bookmarkNodes);
  return bookmarks;
}

function urlSimilarity(url1, url2) {
  if (!url1 || !url2) return 0;
  if (url1.startsWith(url2) || url2.startsWith(url1)) {
    return Math.min(url1.length, url2.length) / Math.max(url1.length, url2.length);
  }
  const minLen = Math.min(url1.length, url2.length);
  let matchCount = 0;
  for (let i = 0; i < minLen; i++) {
    if (url1[i] === url2[i]) matchCount++;
  }
  return matchCount / Math.max(url1.length, url2.length);
}
