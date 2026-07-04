const Table = require('../models/Table');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

// @route  GET /api/tables
// @access Private (any authenticated user – customers need this to book)
const getTables = asyncHandler(async (req, res) => {
  const tables = await Table.find({ isActive: true }).sort({ label: 1 });
  res.status(200).json({ success: true, count: tables.length, tables });
});

// @route  POST /api/tables
// @access Private/Admin
const createTable = asyncHandler(async (req, res) => {
  const { label, capacity } = req.body;
  if (!label || !capacity) {
    throw new ApiError(400, 'Table label and capacity are required');
  }

  const table = await Table.create({ label, capacity });
  res.status(201).json({ success: true, table });
});

// @route  PUT /api/tables/:id
// @access Private/Admin
const updateTable = asyncHandler(async (req, res) => {
  const { label, capacity, isActive } = req.body;

  const table = await Table.findById(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');

  if (label !== undefined) table.label = label;
  if (capacity !== undefined) table.capacity = capacity;
  if (isActive !== undefined) table.isActive = isActive;

  await table.save();
  res.status(200).json({ success: true, table });
});

// @route  DELETE /api/tables/:id
// @access Private/Admin
// Soft delete: keeps historical reservations pointing at a valid table.
const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');

  table.isActive = false;
  await table.save();
  res.status(200).json({ success: true, message: 'Table deactivated' });
});

module.exports = { getTables, createTable, updateTable, deleteTable };
