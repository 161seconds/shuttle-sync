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

    // 1. Text Colors (Hardcoded light texts that get lost in light mode)
    content = content.replace(/text-gray-[12]00/g, 'text-foreground');

    // 2. Background Colors (Hardcoded dark backgrounds that look bad in light mode)
    content = content.replace(/bg-gray-[89]00(\/\d+)?/g, 'bg-card');
    content = content.replace(/bg-black\/(30|10)/g, 'bg-muted');

    // 3. Specific Edge Cases
    // SearchPage.tsx: bg-black rounded-full animate-pulse
    content = content.replace(/bg-black rounded-full animate-pulse/g, 'bg-foreground rounded-full animate-pulse');
    // AdminDashboard.tsx: hover:bg-black
    content = content.replace(/hover:bg-black/g, 'hover:bg-foreground hover:text-background');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

processDirectory(srcDir);
console.log('Light Mode Polish (Pass 2) Complete.');
