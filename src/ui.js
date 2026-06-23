function resolveFilename(href, element) {
  const raw = element.title || element.parentElement.title || element.textContent;
  const lastDot = raw.lastIndexOf('.');
  // basename is everything before the last dot; empty when the filename starts with the dot (e.g. ".mp4")
  const basename = lastDot > 0 ? raw.slice(0, lastDot) : (lastDot === 0 ? '' : raw);
  if (!basename.trim()) {
    try { return decodeURIComponent(new URL(href).pathname.split('/').pop()); } catch (_) {}
  }
  return raw;
}

export function addDownloadButtons(initiateDownload) {
  document.querySelectorAll(".file > .fileThumb").forEach((fileThumb) => {
    const element = fileThumb.parentElement.querySelector(".fileText > a");
    const filename = resolveFilename(fileThumb.href, element);

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
