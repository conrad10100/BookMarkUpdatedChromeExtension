import { bookmarkOrUpdateCurrentTab } from "./bookmarkLogic.js";

document.addEventListener("DOMContentLoaded", () => {
  bookmarkOrUpdateCurrentTab(createAndAlert);
});

function createAndAlert(bookmarkData, similarBookmark, error) {
  let message = "";
  if (error) {
    message = `<span style='color:red;'>${error}</span>`;
  } else if (similarBookmark) {
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
  showMessage(message);
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