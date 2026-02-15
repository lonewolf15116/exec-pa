import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:8000";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | done

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
      body: JSON.stringify({ title: title.trim(), notes: "", priority: 2 }),
    });

    setTitle("");
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

  const visibleTasks = useMemo(() => {
    if (filter === "pending") return tasks.filter((t) => !t.done);
    if (filter === "done") return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, filter]);

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Executive Personal Assistant</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task..."
          onKeyDown={(e) => {
            if (e.key === "Enter") createTask();
          }}
        />
        <button onClick={createTask} style={{ marginLeft: 8 }}>
          Add
        </button>
      </div>

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

      <ul>
        {visibleTasks.map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            {t.done ? "✅" : "⬜"} {t.title}

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
