const channel = browser.runtime.connect({ name: "port-from-cs" });

const downloads = {};

function initiateDownload(url, filename) {
    channel.postMessage({ url, filename });
}

function onMessage(message) {
    console.log(message.message);
}

function downloadStarted(message) {
    downloads[message.id] = message.url;

    const button = document.getElementById(message.url);

    button.disabled = true;
    button.textContent = "In progress...";
}

function downloadChanged(message) {
    const button = document.getElementById(downloads[message.id]);

    if (message.state === "in_progress") {
        button.disabled = true;
        button.textContent = "In progress...";
    } else if (message.state === "interrupted") {
        button.disabled = false;
        button.textContent = "Download";
        delete downloads[message.id];
    } else if (message.state === "complete") {
        button.disabled = true;
        button.textContent = "Done";
        delete downloads[message.id];
    }
}

const messageHandler = {
    message: onMessage,
    downloadStarted,
    downloadChanged,
};

channel.onMessage.addListener(function (message) {
    messageHandler[message.event](message);
});

document.querySelectorAll(".file > .fileThumb").forEach((fileThumb) => {
    const filename = fileThumb.parentElement.querySelector(".fileText > a").textContent;

    const downloadButton = document.createElement("button");

    downloadButton.textContent = "Download";
    downloadButton.onclick = () => initiateDownload(fileThumb.href, filename);
    downloadButton.type = "button";
    downloadButton.id = fileThumb.href;

    fileThumb.parentElement.firstChild.appendChild(downloadButton);
});

function downloadAll() {
    document.querySelectorAll(".file > .fileThumb").forEach((fileThumb) => {
        const filename = fileThumb.parentElement.querySelector(".fileText > a").textContent;

        initiateDownload(fileThumb.href, filename);
    });
}

const downloadAllButton = document.createElement("button");

downloadAllButton.textContent = "Download All";
downloadAllButton.type = "button";
downloadAllButton.onclick = () => downloadAll();

document.querySelector(".file").firstChild.appendChild(downloadAllButton);

//const urls = Array.from(document.querySelectorAll(".file > .fileThumb").values()).map((v) => v.href);
