import { useEffect, useState } from "react";

export default function App() {
  const [files, setFiles] = useState([]);
  const [name, setName] = useState("");
  const [size, setSize] = useState("");

  async function loadFiles() {
    const response = await fetch("/files");
    const data = await response.json();
    setFiles(data);
  }

  useEffect(() => {
    loadFiles();
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    await fetch("/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, sizeBytes: Number(size) }),
    });
    setName("");
    setSize("");
    loadFiles();
  }

  async function handleRename(file) {
    const newName = prompt("New name:", file.name);
    if (!newName) return;
    await fetch(`/files/${file.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    loadFiles();
  }

  async function handleDelete(id) {
    await fetch(`/files/${id}`, { method: "DELETE" });
    loadFiles();
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "40px auto" }}>
      <h1>Files</h1>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          placeholder="File name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Size in bytes"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          required
        />
        <button type="submit">Add</button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {files.map((file) => (
          <li key={file.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <span style={{ flex: 1 }}>
              {file.name} ({file.sizeBytes} bytes)
            </span>
            <button onClick={() => handleRename(file)}>Rename</button>
            <button onClick={() => handleDelete(file.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}