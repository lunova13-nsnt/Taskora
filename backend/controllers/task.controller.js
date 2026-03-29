const Task = require('../models/Task.model');
const { taskSchema } = require('../utils/validators');

exports.createTask = async (req, res) => {
  const { error } = taskSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const task = await Task.create({ ...req.body, owner: req.user.id });
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not create task.' });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { owner: req.user.id };
    const tasks = await Task.find(filter).populate('owner', 'name email');
    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch tasks.' });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('owner', 'name email');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.owner._id.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied.' });

    res.status(200).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch task.' });
  }
};

exports.updateTask = async (req, res) => {
  const { error } = taskSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.owner.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    res.status(200).json({ success: true, task: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update task.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    if (task.owner.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied.' });

    await task.deleteOne();
    res.status(200).json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete task.' });
  }
};