/**
 * Seeds the database with:
 *  - one admin account (from ADMIN_EMAIL / ADMIN_PASSWORD in .env)
 *  - a fixed set of restaurant tables
 *
 * Safe to run multiple times: it skips creating records that already exist.
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Table = require('../models/Table');

const TABLES = [
  { label: 'T1', capacity: 2 },
  { label: 'T2', capacity: 2 },
  { label: 'T3', capacity: 4 },
  { label: 'T4', capacity: 4 },
  { label: 'T5', capacity: 6 },
  { label: 'T6', capacity: 8 },
];

const seed = async () => {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@restaurant.com';
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Restaurant Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
    });
    console.log(`Created admin account: ${adminEmail}`);
  } else {
    console.log(`Admin account already exists: ${adminEmail}`);
  }

  for (const t of TABLES) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Table.findOne({ label: t.label });
    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await Table.create(t);
      console.log(`Created table ${t.label} (seats ${t.capacity})`);
    } else {
      console.log(`Table ${t.label} already exists`);
    }
  }

  console.log('Seeding complete.');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
