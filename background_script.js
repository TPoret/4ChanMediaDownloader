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

function connected(channel) {
    channel.onMessage.addListener(function (message) {
        message = sanitizeMessage(message);

        if (!is4chanCdnUrl(message.url)) return;

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
    if (downloadItem.state === undefined || downloadItem.state === null) return;

    downloads[downloadItem.id].channel.postMessage({
        event: "downloadChanged",
        id: downloadItem.id,
        state: typeof downloadItem.state === "string" ? downloadItem.state : downloadItem.state.current,
    });

    if (downloadItem.state === "interrupted" || downloadItem.state === "complete") delete downloads[downloadItem.id];
}

browser.runtime.onConnect.addListener(connected);
browser.downloads.onChanged.addListener(onDownloadChange);
