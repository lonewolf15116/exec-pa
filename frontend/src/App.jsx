import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:8000";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState(2);
  const [filter, setFilter] = useState("all"); // all | pending | done

  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const loadTasks = async () => {
    const res = await fetch(`${API}/tasks`);
    const data = await res.json();
    setTasks(data);
  };

  const createTask = async () => {
    if (!title.trim()) return;

    await fetch(`${API}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        notes: notes.trim() || "",
        priority: Number(priority) || 2,
      }),
    });

    setTitle("");
    setNotes("");
    setPriority(2);
    loadTasks();
  };

  const markDone = async (id) => {
    await fetch(`${API}/tasks/${id}/done`, { method: "PATCH" });
    loadTasks();
  };

  const deleteTask = async (id) => {
    await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
    loadTasks();
  };

  const aiParse = async () => {
    setAiError("");
    if (!aiText.trim()) return;

    try {
      setAiLoading(true);
      const res = await fetch(`${API}/ai/parse-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText.trim() }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `AI parse failed (${res.status})`);
      }

      const data = await res.json(); // {title, notes, priority}
      setTitle(data.title || "");
      setNotes(data.notes || "");
      setPriority(data.priority ?? 2);
    } catch (e) {
      setAiError(e.message || "AI parse failed");
    } finally {
      setAiLoading(false);
    }
  };

  const visibleTasks = useMemo(() => {
    if (filter === "pending") return tasks.filter((t) => !t.done);
    if (filter === "done") return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, filter]);

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: "Arial", maxWidth: 800 }}>
      <h1>Executive Personal Assistant</h1>

      {/* AI Parse box */}
      <div style={{ marginBottom: 18, padding: 12, border: "1px solid #ddd" }}>
        <div style={{ marginBottom: 8, fontWeight: 700 }}>AI Quick Add</div>
        <textarea
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          placeholder='Example: "Tomorrow 6pm: call HSBC about tuition, priority high. Add notes: ask about letter."'
          rows={3}
          style={{ width: "100%", padding: 8 }}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={aiParse} disabled={aiLoading}>
            {aiLoading ? "Parsing..." : "AI Parse"}
          </button>
          {aiError && (
            <span style={{ marginLeft: 10 }}>
              ❌ {aiError}
            </span>
          )}
        </div>
      </div>

      {/* Manual add */}
      <div style={{ marginBottom: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          style={{ width: 420, padding: 6 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") createTask();
          }}
        />
        <button onClick={createTask} style={{ marginLeft: 8 }}>
          Add
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes..."
          style={{ width: 420, padding: 6 }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ marginRight: 8 }}>Priority:</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value={1}>1 (High)</option>
          <option value={2}>2 (Medium)</option>
          <option value={3}>3 (Low)</option>
        </select>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 18 }}>
        <span style={{ marginRight: 8 }}>Filter:</span>
        <button onClick={() => setFilter("all")} disabled={filter === "all"}>
          All
        </button>
        <button
          onClick={() => setFilter("pending")}
          disabled={filter === "pending"}
          style={{ marginLeft: 8 }}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("done")}
          disabled={filter === "done"}
          style={{ marginLeft: 8 }}
        >
          Done
        </button>
      </div>

      {/* Task list */}
      <ul>
        {visibleTasks.map((t) => (
          <li key={t.id} style={{ marginBottom: 10 }}>
            {t.done ? "✅" : "⬜"} <b>{t.title}</b>
            {t.notes ? <span> — {t.notes}</span> : null}
            <span style={{ marginLeft: 10, opacity: 0.7 }}>
              (P{t.priority})
            </span>

            {!t.done && (
              <button onClick={() => markDone(t.id)} style={{ marginLeft: 10 }}>
                Done
              </button>
            )}

            <button onClick={() => deleteTask(t.id)} style={{ marginLeft: 10 }}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 16, opacity: 0.7 }}>
        Total: {tasks.length} | Pending: {tasks.filter((t) => !t.done).length} |
        Done: {tasks.filter((t) => t.done).length}
      </div>
    </div>
  );
}
