import React, { useEffect, useState } from "react";
import api, { setAuthToken } from "../api.js";
import "./Dashboard.css";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
  });
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const loadTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data.tasks || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load tasks");
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/tasks", form);
      setForm({ title: "", description: "", status: "todo" });
      await loadTasks();
      setMessage("Task created");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create task");
    }
  };

  const handleUpdate = async (taskId, updates) => {
    setMessage("");
    try {
      await api.put(`/tasks/${taskId}`, updates);
      await loadTasks();
      setMessage("Task updated");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update task");
    }
  };

  const handleDelete = async (taskId) => {
    setMessage("");
    try {
      await api.delete(`/tasks/${taskId}`);
      await loadTasks();
      setMessage("Task deleted");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete task");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h2>Task Dashboard</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {message && <div className="message">{message}</div>}

      <form className="task-form" onSubmit={handleCreate}>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Task title"
          required
        />
        <input
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
        />
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <button type="submit">Create</button>
      </form>

      <div className="task-list">
        {tasks.map((task) => (
          <div className="task-card" key={task._id}>
            <div className="task-info">
              <h4>{task.title}</h4>
              <p>{task.description || "No description"}</p>
            </div>
            <select
              value={task.status}
              onChange={(e) =>
                handleUpdate(task._id, {
                  title: task.title,
                  description: task.description,
                  status: e.target.value,
                })
              }
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button
              className="delete-btn"
              onClick={() => handleDelete(task._id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
