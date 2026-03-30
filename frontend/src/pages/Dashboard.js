import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', status: 'pending' });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.tasks);
    } catch {
      localStorage.clear();
      navigate('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/tasks/${editId}`, form);
        setMessage('✅ Task updated successfully!');
      } else {
        await api.post('/tasks', form);
        setMessage('✅ Task created successfully!');
      }
      setForm({ title: '', description: '', status: 'pending' });
      setEditId(null);
      fetchTasks();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error saving task.');
    }
  };

  const handleEdit = (task) => {
    setForm({ title: task.title, description: task.description || '', status: task.status });
    setEditId(task._id);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setMessage('🗑️ Task deleted.');
      fetchTasks();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Could not delete task.');
    }
  };

  const statusColor = (s) =>
    s === 'done' ? '#22c55e' : s === 'in-progress' ? '#f59e0b' : '#6b7280';

  const countByStatus = (s) => tasks.filter(t => t.status === s).length;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2>⚡Taskora⚡</h2>
          <p>
            Welcome, <strong>{user?.name}</strong>
            <span className="role-badge">{user?.role}</span>
          </p>
        </div>
        <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <div className="stat-info">
              <p>Total Tasks</p>
              <h3>{tasks.length}</h3>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏳</span>
            <div className="stat-info">
              <p>In Progress</p>
              <h3>{countByStatus('in-progress')}</h3>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-info">
              <p>Completed</p>
              <h3>{countByStatus('done')}</h3>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && <div className="message-banner">{message}</div>}

        {/* Form */}
        <div className="card">
          <h3 className="card-title">
            {editId ? '✏️ Edit Task' : '➕ Add New Task'}
          </h3>
          <form className="task-form" onSubmit={handleSubmit}>
            <input
              placeholder="Task title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="pending">📌 Pending</option>
              <option value="in-progress">⚙️ In Progress</option>
              <option value="done">✅ Done</option>
            </select>
            <div className="form-buttons">
              <button className="submit-btn" type="submit">
                {editId ? 'Update Task' : 'Add Task'}
              </button>
              {editId && (
                <button
                  className="cancel-btn"
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setForm({ title: '', description: '', status: 'pending' });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Task List */}
        <div className="card">
          <h3 className="card-title">📌 Your Tasks ({tasks.length})</h3>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '48px' }}>📭</p>
              <p>No tasks yet. Create your first task above!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task._id} className="task-item">
                <div>
                  <div className="task-title">{task.title}</div>
                  {task.description && (
                    <div className="task-desc">{task.description}</div>
                  )}
                  <div className="task-meta">
                    <span
                      className="status-badge"
                      style={{ background: statusColor(task.status) }}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
                <div className="task-actions">
                  <button className="edit-btn" onClick={() => handleEdit(task)}>
                    ✏️ Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(task._id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}