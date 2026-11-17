import { useEffect, useState } from 'react'
import './App.css'

const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

async function fileRequest(path = '/files', options) {
  const response = await fetch(path, options)
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return response
}

async function getFiles(signal) {
  const response = await fileRequest('/files', { signal })
  return response.json()
}

export default function App() {
  const [files, setFiles] = useState(null)
  const [name, setName] = useState('')
  const [size, setSize] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getFiles(controller.signal)
      .then(setFiles)
      .catch(() => {
        if (!controller.signal.aborted) setError('Couldn’t load files. Check that the API is running and reload the page.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  async function updateFiles(path, method, body, onSaved) {
    setSaving(true)
    setError('')
    try {
      await fileRequest(path, {
        method,
        ...(body && {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      })
    } catch {
      setError('Couldn’t save the change. Please try again.')
      setSaving(false)
      return
    }

    onSaved?.()
    try {
      setFiles(await getFiles())
    } catch {
      setError('Change saved. Reload the page to see the updated list.')
    } finally {
      setSaving(false)
    }
  }

  function handleAdd(event) {
    event.preventDefault()
    updateFiles('/files', 'POST', { name, sizeBytes: Number(size) }, () => {
      setName('')
      setSize('')
    })
  }

  function handleRename(file) {
    const newName = window.prompt('New name:', file.name)
    if (newName) updateFiles(`/files/${file.id}`, 'PUT', { name: newName })
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>File Manager</span>
        </div>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <h1>Files</h1>
          <p>Add, rename, and manage your file records.</p>
        </div>

        <section className="panel create-panel" aria-labelledby="add-heading">
          <h2 id="add-heading">Add a file</h2>
          <form onSubmit={handleAdd}>
            <label>
              File name
              <input placeholder="e.g. notes.txt" value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Size in bytes
              <input type="number" placeholder="e.g. 120" value={size} onChange={(event) => setSize(event.target.value)} required />
            </label>
            <button className="primary-button" type="submit" disabled={loading || saving}>
              <span aria-hidden="true">+</span> Add file
            </button>
          </form>
        </section>

        {error && <p className="error" role="alert">{error}</p>}

        <section className="panel files-panel" aria-labelledby="files-heading" aria-busy={loading || saving}>
          <div className="section-heading">
            <h2 id="files-heading">All files</h2>
            {files && (
              <span className="file-count">{files.length} {files.length === 1 ? 'file' : 'files'}</span>
            )}
          </div>
          {files?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th scope="col">File name</th>
                  <th scope="col">Size</th>
                  <th scope="col" className="date-column">Date added</th>
                  <th scope="col" className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div className="file-entry">
                        <span className="file-icon" aria-hidden="true"><i /></span>
                        <div className="file-details">
                          <strong>{file.name}</strong>
                          <small>#{file.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{file.sizeBytes} bytes</td>
                    <td className="date-column">{file.createdAt ? dateFormat.format(new Date(file.createdAt.endsWith('Z') ? file.createdAt : file.createdAt + 'Z')) : '—'}</td>
                    <td className="actions-column">
                      <div className="row-actions">
                        <button type="button" disabled={saving} onClick={() => handleRename(file)} aria-label={`Rename ${file.name}, file ${file.id}`}>Rename</button>
                        <button type="button" disabled={saving} onClick={() => updateFiles(`/files/${file.id}`, 'DELETE')} aria-label={`Delete ${file.name}, file ${file.id}`}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="list-message">{loading ? 'Loading files…' : files ? 'No files yet.' : 'File list unavailable.'}</p>
          )}
        </section>
      </main>
    </>
  )
}
