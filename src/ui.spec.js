/**
 * @jest-environment jsdom
 */

import { addDownloadButtons, addDownloadAllButton } from "./ui";

// Compact HTML (no whitespace nodes) matching real minified 4chan output.
// Image post: .file firstChild is .fileText
const IMAGE_POST_HTML =
  '<div class="file">' +
  '<div class="fileText"><a href="//i.4cdn.org/a/123.jpg" target="_blank">photo.jpg</a></div>' +
  '<a class="fileThumb" href="//i.4cdn.org/a/123.jpg" target="_blank"><img src="//i.4cdn.org/a/123s.jpg"></a>' +
  '</div>';

// mp4 post: 4chan injects Schema.org <meta>/<link> elements that become the FIRST
// children of .file, so .file firstChild is a <meta>, NOT .fileText.
const MP4_POST_HTML =
  '<div class="file" itemprop="video" itemscope itemtype="https://schema.org/VideoObject">' +
  '<meta itemprop="name" content="original.mp4">' +
  '<meta itemprop="uploadDate" content="2026-05-09T20:04:28-04:00">' +
  '<link itemprop="contentUrl" href="//i.4cdn.org/wsg/456.mp4">' +
  '<meta itemprop="description" content="thread title">' +
  '<div class="fileText"><a href="//i.4cdn.org/wsg/456.mp4" target="_blank">original.mp4</a></div>' +
  '<a class="fileThumb" href="//i.4cdn.org/wsg/456.mp4" target="_blank"><img src="//i.4cdn.org/wsg/456s.jpg"></a>' +
  '</div>';

describe("addDownloadButtons", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("adds one Download button per media file", () => {
    document.body.innerHTML = IMAGE_POST_HTML + MP4_POST_HTML;

    addDownloadButtons(() => {});

    const buttons = document.querySelectorAll("button");
    expect(buttons.length).toBe(2);
  });

  it("adds Download buttons for all files even when mp4 posts precede image posts", () => {
    document.body.innerHTML = MP4_POST_HTML + IMAGE_POST_HTML;

    addDownloadButtons(() => {});

    const buttons = document.querySelectorAll("button");
    expect(buttons.length).toBe(2);
  });

  it("places the Download button inside .fileText for an mp4 post", () => {
    document.body.innerHTML = MP4_POST_HTML;

    addDownloadButtons(() => {});

    const fileText = document.querySelector(".fileText");
    const button = fileText.querySelector("button");
    expect(button).not.toBeNull();
    expect(button.textContent).toBe("Download");
  });

  it("places the Download button inside .fileText for an image post", () => {
    document.body.innerHTML = IMAGE_POST_HTML;

    addDownloadButtons(() => {});

    const fileText = document.querySelector(".fileText");
    const button = fileText.querySelector("button");
    expect(button).not.toBeNull();
    expect(button.textContent).toBe("Download");
  });

  it("calls initiateDownload with the correct url and filename on click", () => {
    document.body.innerHTML = MP4_POST_HTML;
    const calls = [];
    addDownloadButtons((url, filename) => calls.push({ url, filename }));

    document.querySelector(".fileText button").click();

    expect(calls.length).toBe(1);
    expect(calls[0].filename).toBe("original.mp4");
  });
});

describe("addDownloadAllButton", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("adds the Download All button when the first post is an mp4", () => {
    document.body.innerHTML = MP4_POST_HTML + IMAGE_POST_HTML;

    addDownloadAllButton(() => {});

    const btn = document.querySelector("button");
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe("Download All");
  });

  it("places the Download All button inside .fileText of the first post", () => {
    document.body.innerHTML = MP4_POST_HTML + IMAGE_POST_HTML;

    addDownloadAllButton(() => {});

    const firstFileText = document.querySelector(".file .fileText");
    const btn = firstFileText.querySelector("button");
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe("Download All");
  });

  it("calls downloadAll when the Download All button is clicked", () => {
    document.body.innerHTML = IMAGE_POST_HTML;
    let called = false;
    addDownloadAllButton(() => { called = true; });

    document.querySelector("button").click();

    expect(called).toBe(true);
  });
});
