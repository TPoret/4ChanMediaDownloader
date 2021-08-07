// Put all the javascript code here, that you want to execute in background.
// background-script.js

const downloads = {};

function connected(channel) {
    channel.onMessage.addListener(function (message) {
        browser.downloads
            .download({
                url: message.url,
                filename: message.filename,
                conflictAction: "uniquify",
            })
            .then(
                (id) => {
                    downloads[id] = { channel };
                    channel.postMessage({ event: "downloadStarted", url: message.url, id });
                },
                (id) => channel.postMessage({ event: "message", message: `Failed downloading ${id}` })
            );
    });
}

function onDownloadChange(downloadItem) {
    if (!downloadItem.state) return;

    downloads[downloadItem.id].channel.postMessage({
        event: "downloadChanged",
        id: downloadItem.id,
        state: typeof downloadItem.state === "string" ? downloadItem.state : downloadItem.state.current,
    });

    if (downloadItem.state === "interrupted" || downloadItem.state === "complete") delete downloads[downloadItem.id];
}

browser.runtime.onConnect.addListener(connected);
browser.downloads.onChanged.addListener(onDownloadChange);
