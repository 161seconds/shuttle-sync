const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile() && /\.(tsx|ts)$/.test(file)) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Shadows - Black/Dark Shadows
    content = content.replace(/shadow-\[0_[^\]]*?rgba\(\s*0\s*,\s*0\s*,\s*0\s*,[^\)]+\)\s*\]/g, 'shadow-card');
    content = content.replace(/shadow-black\/\d+/g, 'shadow-card');
    content = content.replace(/shadow-2xl shadow-card/g, 'shadow-card'); // in case it replaced black/80

    // 2. Shadows - Glows (Emerald)
    content = content.replace(/shadow-\[0_.*?rgba\(\s*16\s*,\s*185\s*,\s*129\s*,\s*0\.(?:1|15)\s*\)\s*\]/g, 'shadow-glow');
    content = content.replace(/shadow-\[0_.*?rgba\(\s*16\s*,\s*185\s*,\s*129\s*,\s*0\.(?:2|25)\s*\)\s*\]/g, 'shadow-glow-md');
    content = content.replace(/shadow-\[0_.*?rgba\(\s*16\s*,\s*185\s*,\s*129\s*,\s*0\.[3456789]\s*\)\s*\]/g, 'shadow-glow-lg');
    
    // Other color glows that look bad in light mode (make them just standard or let them be, but standardizing is safer)
    // Actually we'll leave colored glows (like blue, amber) as they might look okay, except the very heavy ones.
    
    // 3. Borders - Dark Mode White Borders
    content = content.replace(/border-white\/?(\[[0-9.]+\]|\d+)/g, 'border-border');

    // 4. Backgrounds - Dark Mode White Alphas
    content = content.replace(/bg-white\/?(\[[0-9.]+\]|5|10|15|20)/g, 'bg-card');
    content = content.replace(/bg-black\/?(\[[0-9.]+\]|20|40|50|60|80)/g, 'bg-card');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

processDirectory(srcDir);
console.log('Light Mode Refactoring Complete.');
