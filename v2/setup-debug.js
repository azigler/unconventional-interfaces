// Move the debug-marbles.js file to public directory
// This ensures it's served by Vite as a static file
const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, 'debug-marbles.js');
const publicDir = path.join(__dirname, 'public');
const destFile = path.join(publicDir, 'debug-marbles.js');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
  console.log('Created public directory');
}

// Copy the file
fs.copyFile(sourceFile, destFile, (err) => {
  if (err) {
    console.error('Error copying debug file:', err);
    return;
  }
  console.log('Debug script copied to public directory');
});
