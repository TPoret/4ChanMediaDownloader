import { addDownloadButtons, addDownloadAllButton } from "./ui";

const channel = browser.runtime.connect({ name: "port-from-cs" });

function initiateDownload(url, filename) {
  channel.postMessage({ url, filename });
}

function onMessage(message) {
  console.log(message.message);
}

function downloadItemChanged(message) {
  const item = message.item;
  const button = document.getElementById(item.url);

  if (item.state === "in_progress") {
    button.disabled = true;
    button.textContent = "In progress...";
  } else if (item.state === "interrupted") {
    button.disabled = false;
    button.textContent = "Download";
  } else if (item.state === "complete") {
    button.disabled = true;
    button.textContent = "Done";
  } else if (item.state === "pending") {
    button.disabled = true;
    button.textContent = "Pending...";
  }
}

const messageHandler = {
  message: onMessage,
  downloadItemChanged,
};

channel.onMessage.addListener(function (message) {
  console.log(message);
  messageHandler[message.event](message);
});

function downloadAll() {
  document.querySelectorAll(".file > .fileThumb").forEach((fileThumb) => {
    const element = fileThumb.parentElement.querySelector(".fileText > a");
    const filename = element.title || element.parentElement.title || element.textContent;

    initiateDownload(fileThumb.href, filename);
  });
}

addDownloadButtons(initiateDownload);
addDownloadAllButton(downloadAll);
