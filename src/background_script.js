import { autorun } from "mobx"
import { DownloadStore, DownloadItem } from "./downloads"

const downloadStore = new DownloadStore

function sanitizeInput(input) {
    return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function sanitizeMessage(message) {
    return {
        url: sanitizeInput(message.url),
        filename: sanitizeInput(message.filename),
    };
}

autorun(() => {
    const nextDownload = downloadStore.nextDownload
    if (nextDownload !== null) {
        browser
        .downloads
        .download({
            url: nextDownload.url,
            filename: nextDownload.filename,
            conflictAction: "uniquify",
        })
        .then(
            id => {
                downloadStore.updateDownloadByUrl(nextDownload.url, {id, state: "in_progress"})
            },
            id => {
                downloadStore.updateDownloadByUrl(nextDownload.url, {id, state: "pending"})
            }
        );
    }
})

function connected(channel) {
    channel.onMessage.addListener(function (message) {
        message = sanitizeMessage(message);

        downloadStore.createDownload(new DownloadItem(message.url, message.filename, "pending", (json) => channel.postMessage({event: "downloadItemChanged", item: json})));
    });
}

function onDownloadChange(downloadItem) {
    if (downloadItem.state === undefined || downloadItem.state === null) return;

    const state = typeof downloadItem.state === "string" ? downloadItem.state : downloadItem.state.current;

    downloadStore.updateDownloadById(downloadItem.id, {state})
}

browser.runtime.onConnect.addListener(connected);
browser.downloads.onChanged.addListener(onDownloadChange);
