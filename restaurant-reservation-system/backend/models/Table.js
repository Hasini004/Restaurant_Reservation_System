const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Table label is required'],
      unique: true,
      trim: true, // e.g. "T1", "Patio-2"
    },
    capacity: {
      type: Number,
      required: [true, 'Table capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    isActive: {
      // lets an admin retire a table without deleting its reservation history
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
