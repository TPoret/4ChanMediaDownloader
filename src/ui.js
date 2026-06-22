export function addDownloadButtons(initiateDownload) {
  document.querySelectorAll(".file > .fileThumb").forEach((fileThumb) => {
    const element = fileThumb.parentElement.querySelector(".fileText > a");
    const filename = element.title || element.parentElement.title || element.textContent;

    const downloadButton = document.createElement("button");

    downloadButton.textContent = "Download";
    downloadButton.onclick = () => initiateDownload(fileThumb.href, filename);
    downloadButton.type = "button";
    downloadButton.id = fileThumb.href;

    fileThumb.parentElement.querySelector(".fileText").appendChild(downloadButton);
  });
}

export function addDownloadAllButton(downloadAll) {
  const downloadAllButton = document.createElement("button");

  downloadAllButton.textContent = "Download All";
  downloadAllButton.type = "button";
  downloadAllButton.onclick = () => downloadAll();

  document.querySelector(".file .fileText").appendChild(downloadAllButton);
}
