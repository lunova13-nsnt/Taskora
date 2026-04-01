import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', status: 'pending',
    priority: 'medium', dueDate: '', tag: '', notes: ''
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.tasks);
    } catch {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

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
      setForm({ title: '', description: '', status: 'pending', priority: 'medium', dueDate: '', tag: '', notes: '' });
      setEditId(null);
      fetchTasks();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error saving task.');
    }
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      tag: task.tag || '',
      notes: task.notes || ''
    });
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

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date() ;
  const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    const diff = new Date(dueDate) - new Date();
    return diff > 0 && diff < 86400000 * 2;
  };

  const formatDate = (dueDate) => {
    if (!dueDate) return null;
    return new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredTasks = tasks.filter(task => {
    const matchSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const overdueCount = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done').length;
  const streak = user?.streak || 1;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const quotes = [
    "You got this! 💪",
    "Small steps daily 🚀",
    "Stay focused! 🎯",
    "Make it happen ⚡",
    "You're crushing it! 🔥"
  ];
  const quote = quotes[today.getDay() % quotes.length];

  return (
    <div className="dashboard-page">
      {/* Floating doodles */}
      <div className="doodle-container">
        <span className="doodle">⏰</span>
        <span className="doodle">✅</span>
        <span className="doodle">📝</span>
        <span className="doodle">🎯</span>
        <span className="doodle">⭐</span>
        <span className="doodle">🚀</span>
        <span className="doodle">💡</span>
        <span className="doodle">📌</span>
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2>⚡ Taskora</h2>
          <p>Welcome back, <strong style={{color:'#f1f5f9'}}>{user?.name}</strong>
            <span className="role-badge">{user?.role}</span>
          </p>
        </div>
        <div className="header-right">
          <div className="streak-badge">🔥 {streak} day streak</div>
          <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Date banner */}
        <div className="date-banner">
          <div>
            <div className="date-text">Today is</div>
            <div className="date-main">{dateStr}</div>
          </div>
          <div className="quote">"{quote}"</div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <div className="stat-info"><p>Total</p><h3>{tasks.length}</h3></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⚙️</span>
            <div className="stat-info"><p>In Progress</p><h3>{tasks.filter(t=>t.status==='in-progress').length}</h3></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-info"><p>Done</p><h3>{completedCount}</h3></div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔥</span>
            <div className="stat-info">
              <p>Overdue</p>
              <h3 style={{color: overdueCount > 0 ? '#ff6b6b' : '#f1f5f9'}}>{overdueCount}</h3>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-section">
          <div className="progress-header">
            <span>🎯 Overall completion</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{width: `${progressPercent}%`}}/>
          </div>
        </div>

        {overdueCount > 0 && (
          <div className="overdue-alert">
            ⚠️ You have <strong style={{margin:'0 4px'}}>{overdueCount}</strong> overdue task{overdueCount > 1 ? 's' : ''}!
          </div>
        )}

        {message && <div className="message-banner">{message}</div>}

        {/* Form */}
        <div className="card">
          <h3 className="card-title">{editId ? '✏️ Edit Task' : '➕ Add New Task'}</h3>
          <form className="task-form" onSubmit={handleSubmit}>
            <input
              placeholder="Task title *"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              required
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
            />
            <div className="form-row">
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                <option value="pending">📌 Pending</option>
                <option value="in-progress">⚙️ In Progress</option>
                <option value="done">✅ Done</option>
              </select>
              <select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})}>
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>
            <div className="form-row">
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({...form, dueDate: e.target.value})}
                style={{colorScheme: 'dark'}}
              />
              <input
                placeholder="🏷️ Tag (e.g. work, personal)"
                value={form.tag}
                onChange={(e) => setForm({...form, tag: e.target.value})}
              />
            </div>
            <textarea
              placeholder="📝 Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
            />
            <div className="form-buttons">
              <button className="submit-btn" type="submit">
                {editId ? '✨ Update Task' : '🚀 Add Task'}
              </button>
              {editId && (
                <button className="cancel-btn" type="button"
                  onClick={() => { setEditId(null); setForm({ title: '', description: '', status: 'pending', priority: 'medium', dueDate: '', tag: '', notes: '' }); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Search & Filter */}
        <div className="search-filter-row">
          <input
            className="search-box"
            placeholder="🔍 Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select className="filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>

        {/* Task List */}
        <div className="card">
          <h3 className="card-title">📌 Tasks ({filteredTasks.length})</h3>
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p style={{fontSize:'52px'}}>🎉</p>
              <p>No tasks here! You're all clear 🚀</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task._id}
                className={`task-item ${isOverdue(task.dueDate) && task.status !== 'done' ? 'overdue' : ''} ${task.status === 'done' ? 'done-item' : ''}`}>
                <div style={{flex:1}}>
                  <div className="task-title">{task.title}</div>
                  {task.description && <div className="task-desc">{task.description}</div>}
                  {task.notes && <div className="task-notes">{task.notes}</div>}
                  <div className="task-meta">
                    <span className="status-badge" style={{background: statusColor(task.status)}}>
                      {task.status}
                    </span>
                    <span className={`priority-badge priority-${task.priority || 'medium'}`}>
                      {task.priority || 'medium'}
                    </span>
                    {task.tag && <span className="tag-pill">🏷️ {task.tag}</span>}
                    {task.dueDate && (
                      <span className={`due-date ${isOverdue(task.dueDate) && task.status !== 'done' ? 'overdue' : isDueSoon(task.dueDate) ? 'soon' : ''}`}>
                        📅 {formatDate(task.dueDate)}
                        {isOverdue(task.dueDate) && task.status !== 'done' && ' ⚠️ Overdue!'}
                        {isDueSoon(task.dueDate) && ' ⏰ Due soon!'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="edit-btn" onClick={() => handleEdit(task)}>✏️ Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(task._id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}