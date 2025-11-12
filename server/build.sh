#!/usr/bin/env bash
# This script runs when Render builds your app

# Install dependencies
npm install

# Delete old database if it exists
rm -f library.db

# Create and seed the new database
node seed_database.js

echo "Database seeded successfully!"