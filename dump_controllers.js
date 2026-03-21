const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.controller.js'));

console.log("=== CONTROLLER EXPORTS ===");
files.forEach(file => {
  try {
    const filePath = path.join(controllersDir, file);
    const mod = require(filePath);
    console.log(`\n[${file}]`);
    console.log(Object.keys(mod).map(key => `  - ${key}`).join('\n'));
  } catch (err) {
    console.log(`\n[${file}] ERROR loading: ` + err.message);
  }
});
