import { autorun } from "mobx"
import { DownloadStore, DownloadItem } from "./downloads"

const downloadStore = new DownloadStore

function urlBasename(url) {
    try {
        return decodeURIComponent(new URL(url).pathname.split('/').pop());
    } catch (_) {
        return url.split('/').pop();
    }
}

autorun(() => {
    const nextDownload = downloadStore.nextDownload
    if (nextDownload === null) return;

    const { url, filename } = nextDownload;

    browser.downloads.download({
        url,
        filename,
        conflictAction: "uniquify",
    }).then(
        id => {
            downloadStore.updateDownloadByUrl(url, {id, state: "in_progress"})
        },
        _err => {
            // Some filenames are rejected by Firefox (e.g. filenames with no basename or
            // certain emoji sequences). Prevent re-queuing while we retry with the CDN filename.
            downloadStore.updateDownloadByUrl(url, {state: "in_progress"});
            browser.downloads.download({
                url,
                filename: urlBasename(url),
                conflictAction: "uniquify",
            }).then(
                id => { downloadStore.updateDownloadByUrl(url, {id, state: "in_progress"}) },
                _err2 => { downloadStore.updateDownloadByUrl(url, {state: "interrupted"}) }
            );
        }
    );
})

function connected(channel) {
    channel.onMessage.addListener(function (message) {
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
