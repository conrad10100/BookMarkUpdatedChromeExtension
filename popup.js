import { getActiveTabURL } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();
  const container = document.getElementsByClassName("container")[0];
  container.innerHTML = activeTab.url;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const bookmarkData = {
      url: currentTab.url,
      title: currentTab.title,
    };

    chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
      const bookmarks = getAllBookmarksWithIds(bookmarkTreeNodes);

      // Find most similar bookmark by URL (90%+ match)
      const similarBookmark = bookmarks.find((b) => {
        const sim = urlSimilarity(b.url, bookmarkData.url);
        return sim >= 0.9;
      });

      if (similarBookmark) {
        // Get the parentId before deleting
        chrome.bookmarks.get(similarBookmark.id, function (results) {
          const parentId = results[0].parentId;
          // Remove the similar bookmark
          chrome.bookmarks.remove(similarBookmark.id, function () {
            // Create new bookmark in the same folder
            chrome.bookmarks.create(
              { ...bookmarkData, parentId },
              function () {
                createAndAlert(bookmarkData, similarBookmark);
              }
            );
          });
        });
      } else {
        chrome.bookmarks.create(bookmarkData, function () {
          createAndAlert(bookmarkData, null);
        });
      }
    });

    function createAndAlert(bookmarkData, similarBookmark) {
      let message = "";
      if (similarBookmark) {
        message =
          "A similar bookmark with greater than 90% similarity was found and will now be updated to this current URL.<br><br>" +
          "<strong>Previous URL:</strong> " + similarBookmark.url + "<br>" +
          "<strong>Updated to:</strong> " + bookmarkData.url + "<br><br>" +
          bookmarkData.title;
      } else {
        message =
          "Page bookmarked successfully!<br>" +
          bookmarkData.url + "<br>" +
          bookmarkData.title;
      }
      showMessage(message); // Only show the message, don't create another bookmark
    }

    function showMessage(msg) {
      let messageDiv = document.querySelector('.message');
      if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        document.body.appendChild(messageDiv);
      }
      messageDiv.innerHTML = msg;
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

    // URL similarity: returns a value between 0 and 1
    // if one URL starts with the other, returns the ratio of the shorter to longer URL length
    function urlSimilarity(url1, url2) {
      if (!url1 || !url2) return 0;
      const [longer, shorter] = url1.length > url2.length ? [url1, url2] : [url2, url1];
      if (longer.startsWith(shorter)) {
        return shorter.length / longer.length;
      }
      // fallback to original similarity
      const minLen = Math.min(url1.length, url2.length);
      let matchCount = 0;
      for (let i = 0; i < minLen; i++) {
        if (url1[i] === url2[i]) matchCount++;
      }
      return matchCount / Math.max(url1.length, url2.length);
    }
  });
});