import fs from 'fs';
import path from 'path';

const directory = './'; // or set to your screenshot folder
const extensionsToDelete = ['.png'];

fs.readdir(directory, (err, files) => {
  if (err) {
    return console.error('❌ Failed to list files:', err);
  }

  const toDelete = files.filter(file =>
    extensionsToDelete.includes(path.extname(file).toLowerCase()) &&
    file.toLowerCase().includes('screenshot')
  );

  if (toDelete.length === 0) {
    console.log('🧼 No screenshots to delete.');
    return;
  }

  toDelete.forEach(file => {
    const filePath = path.join(directory, file);
    fs.unlink(filePath, err => {
      if (err) {
        console.error(`❌ Error deleting ${file}:`, err.message);
      } else {
        console.log(`🗑️ Deleted ${file}`);
      }
    });
  });
});
