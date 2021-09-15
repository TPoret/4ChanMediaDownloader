// TODO : fix bug when multiple tab are opened (one cannot trigger download)
// TODO : add a cancel all download when bulk is launched

function sanitizeInput(input) {
    return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function sanitizeMessage(message) {
    return {
        url: sanitizeInput(message.url),
        filename: sanitizeInput(message.filename),
    };
}

function is4chanCdnUrl(url) {
    return url.match(/(https:){0,1}\/\/i\.4cdn\.org\/.+\/.+/g) !== null;
}

const downloads = {};
const downloadQueue = [];
const MAX_CONCURRENT_DOWNLOAD = 3;
let currentConcurrentDownload = 0;

function addToDownloadQueue({url, filename, channel}) {
    downloadQueue.push({url, filename, channel});
}

function getNextDownloadItem() {
    return downloadQueue.shift();
}

function triggerNewDownload() {
    if (currentConcurrentDownload >= MAX_CONCURRENT_DOWNLOAD) return;

    const nextDownload = getNextDownloadItem();

    if (nextDownload === undefined) return;

    // Optimist incrementation is essential as it keeps calling this part before triggering the 'then()' code in another JS eventloop
    currentConcurrentDownload++;

    browser
    .downloads
    .download({
        url: nextDownload.url,
        filename: nextDownload.filename,
        conflictAction: "uniquify",
    })
    .then(
        (id) => {
            downloads[id] = { channel: nextDownload.channel };
            nextDownload.channel.postMessage({ event: "downloadStarted", url: nextDownload.url, id });
        },
        (id) => {
            nextDownload.channel.postMessage({ event: "message", message: `Failed downloading ${id}` })
            addToDownloadQueue(nextDownload);
            triggerNewDownload();
            // Should we decrement or does it also trigger a download state changed ?
        }
    );
}

function connected(channel) {
    channel.postMessage({ event: "message", message: `connected` })
    channel.onMessage.addListener(function (message) {
        message = sanitizeMessage(message);

        if (!is4chanCdnUrl(message.url)) return;

        addToDownloadQueue({ ...message, channel });
        triggerNewDownload();
    });
}

function onDownloadChange(downloadItem) {
    triggerNewDownload();

    if (downloadItem.state === undefined || downloadItem.state === null) return;

    const state = typeof downloadItem.state === "string" ? downloadItem.state : downloadItem.state.current;
    downloads[downloadItem.id].channel.postMessage({
        event: "downloadChanged",
        id: downloadItem.id,
        state,
    });

    if (state === "interrupted" || state === "complete") {
        delete downloads[downloadItem.id];
        currentConcurrentDownload--;
        if (currentConcurrentDownload < 0) currentConcurrentDownload = 0;
    }
    
    triggerNewDownload();
}

browser.runtime.onConnect.addListener(connected);
browser.downloads.onChanged.addListener(onDownloadChange);
