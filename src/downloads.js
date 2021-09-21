import { makeAutoObservable, reaction } from "mobx"

export class DownloadStore {
    transportLayer
    downloads = []

    constructor() {
        makeAutoObservable(this)
    }

    createDownload(download) {
        const downloadIndex = this.downloads.findIndex((currentDownload) => download.url === currentDownload.url)
        if (downloadIndex === -1)
            this.downloads.push(download)
        else if (this.downloads[downloadIndex].state === "interrupted")
            this.downloads[downloadIndex].state = "pending"
    }

    updateDownloadById(id, partialDownload) {
        const index = this.downloads.findIndex(currentDownload => currentDownload.id === id)
        if (index !== -1) {
            Object.assign(this.downloads[index], partialDownload)
        }
    }

    updateDownloadByUrl(url, partialDownload) {
        const index = this.downloads.findIndex(currentDownload => currentDownload.url === url)
        if (index !== -1) {
            Object.assign(this.downloads[index], partialDownload)
        }
    }

    findById(id) {
        return this.downloads.find(currentDownload => currentDownload.id === id)
    }

    get pending() {
        return this.downloads.filter(download => download.state === "pending")
    }

    get interrupted() {
        return this.downloads.filter(download => download.state === "interrupted")
    }

    get complete() {
        return this.downloads.filter(download => download.state === "complete")
    }

    get inProgress() {
        return this.downloads.filter(download => download.state === "in_progress")
    }

    get nextDownload() {
        const result = this.downloads.find(download => download.state === "pending")
        return result !== undefined && this.inProgress.length < 3 ? result : null
    }
}

export class DownloadItem {
    id = null
    state = ""
    url = ""
    filename = ""
    stateNotifier = null

    constructor(url, filename, state, notifier = null) {
        makeAutoObservable(this, {
            url: false,
            filename: false,
            stateNotifier: false,
        })
        this.url = url
        this.filename = filename
        this.state = state
        this.stateNotifier = reaction(
            () => this.asJson,
            json => {
                if (notifier) {
                    notifier(json)
                }
            }
        )

        if (notifier) {
            notifier(this.asJson)
        }
    }

    get asJson() {
        return {
            id: this.id,
            state: this.state,
            url: this.url,
            filename: this.filename,
        }
    }
}
