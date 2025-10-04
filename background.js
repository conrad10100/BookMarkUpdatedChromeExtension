
import { bookmarkOrUpdateCurrentTab } from "./bookmarkLogic.js";

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "activate-extension") {
    bookmarkOrUpdateCurrentTab();
  }
});
