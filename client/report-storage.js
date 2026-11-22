const PHOTO_DB = 'kolikcheck-report-photos'

function photoStorage(mode, operation) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('photos')
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Photo storage is blocked'))
    request.onsuccess = () => {
      const db = request.result
      try {
        const tx = db.transaction('photos', mode)
        const result = operation(tx.objectStore('photos'))
        tx.oncomplete = () => { db.close(); resolve(result.result) }
        tx.onabort = tx.onerror = () => { db.close(); reject(tx.error) }
      } catch (error) {
        db.close()
        reject(error)
      }
    }
  })
}

function displayStorageWarning(report, reason) {
  report.storageWarning = reason
  const alert = document.getElementById('reportStorageWarning')
  if (state.report === report && alert) alert.textContent = reason ? t(reason) : ''
}

function saveCurrentReport() {
  const report = state.report
  if (!report) return false
  try {
    localStorage.setItem(REPORT_STORAGE_KEY, encodeReport(report))
    if (report.storageWarning === 'reportStorageFull') displayStorageWarning(report, '')
    return true
  } catch {
    displayStorageWarning(report, 'reportStorageFull')
    return false
  }
}

let photoWrite = Promise.resolve()
function saveReportPhotos(report, files) {
  photoWrite = photoWrite.then(() => photoStorage('readwrite', store =>
    store.put({ token: report.storageToken, files }, 'last')
  )).catch(() => {
    if (files.length) displayStorageWarning(report, 'photoStorageSaveFailed')
  })
}

function restoreSavedReport() {
  try {
    state.report = decodeReport(localStorage.getItem(REPORT_STORAGE_KEY))
  } catch {
    return
  }
  const report = state.report
  if (!report?.submittedViews.length || report.isExample) return
  photoStorage('readonly', store => store.get('last')).then(entry => {
    if (state.report !== report) return
    if (entry?.token !== report.storageToken || !Array.isArray(entry.files) ||
        entry.files.length !== report.submittedViews.length ||
        !entry.files.every(file => file instanceof Blob && /^image\/(jpeg|png|webp)$/.test(file.type))) {
      displayStorageWarning(report, 'photoStorageUnavailable')
      return
    }
    report.photos = entry.files.map(file => URL.createObjectURL(file))
    renderReport()
  }).catch(() => displayStorageWarning(report, 'photoStorageUnavailable'))
}
