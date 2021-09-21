import { DownloadStore } from "./downloads"

describe("DownloadStore", () => {
  it("creates new downloads", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1"})
    store.createDownload({url: "url2"})

    expect(store.downloads.length).toBe(2)
    expect(store.downloads[0].url).toBe("url1")
    expect(store.downloads[1].url).toBe("url2")
  })

  it("ensure no duplicate downloads", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1"})
    store.createDownload({url: "url1"})

    expect(store.downloads.length).toBe(1)
    expect(store.downloads[0].url).toBe("url1")
  })

  it("get pending downloads", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1"})
    store.createDownload({url: "url2", state: "pending"})
    store.createDownload({url: "url3"})

    const notStartedDownloads = store.pending;

    expect(notStartedDownloads.length).toBe(1)
    expect(notStartedDownloads[0].url).toBe("url2")
  })

  it("get interrupted downloads", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1"})
    store.createDownload({url: "url2", state: "interrupted"})
    store.createDownload({url: "url3"})

    const notStartedDownloads = store.interrupted;

    expect(notStartedDownloads.length).toBe(1)
    expect(notStartedDownloads[0].url).toBe("url2")
  })

  it("get complete downloads", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1"})
    store.createDownload({url: "url2", state: "complete"})
    store.createDownload({url: "url3"})

    const notStartedDownloads = store.complete;

    expect(notStartedDownloads.length).toBe(1)
    expect(notStartedDownloads[0].url).toBe("url2")
  })

  it("get in_progress downloads", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1"})
    store.createDownload({url: "url2", state: "in_progress"})
    store.createDownload({url: "url3"})

    const notStartedDownloads = store.inProgress;

    expect(notStartedDownloads.length).toBe(1)
    expect(notStartedDownloads[0].url).toBe("url2")
  })

  it("updateByUrl download", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1"})
    store.createDownload({url: "url2", state: "in_progress"})
    store.createDownload({url: "url3"})

    store.updateDownloadByUrl("url2", {state: "complete"})

    expect(store.downloads.length).toBe(3)
    expect(store.downloads[1].state).toBe("complete")
  })

  it("get does nothing when trying to update a non existing download", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1", state: "in_progress"})

    store.updateDownloadByUrl("url2", {state: "complete"})

    expect(store.downloads.length).toBe(1)
    expect(store.downloads[0].url).toBe("url1")
    expect(store.downloads[0].state).toBe("in_progress")
  })

  it("return next download when no more than 3 concurrent download", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1", state: "pending"})

    expect(store.nextDownload.url).toBe("url1")
  })

  it("return null when more than 3 concurrent download", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1", state: "in_progress"})
    store.createDownload({url: "url2", state: "in_progress"})
    store.createDownload({url: "url3", state: "in_progress"})
    store.createDownload({url: "url4", state: "pending"})

    expect(store.nextDownload).toBeNull()
  })

  it("return next download when no more than 3 concurrent download", () => {
    const store = new DownloadStore

    store.createDownload({url: "url1", state: "inProgress"})
    store.createDownload({url: "url2", state: "inProgress"})
    store.createDownload({url: "url4", state: "pending"})

    expect(store.nextDownload.url).toBe("url4")
  })

  it("return null when no more download", () => {
    const store = new DownloadStore

    expect(store.nextDownload).toBeNull()
  })
})