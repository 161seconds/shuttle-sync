const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

const replacements = [
    // Backgrounds
    { regex: /bg-\[#060809\]|bg-\[#0a0a0a\]|bg-\[#060608\]|bg-\[#090b10\]|bg-\[#050505\]|bg-\[#000000\]/g, replacement: 'bg-background' },
    { regex: /bg-\[#111111\]|bg-\[#151515\]|bg-\[#13151a\]|bg-\[#141617\]/g, replacement: 'bg-card' },
    { regex: /bg-\[#1a1a1a\]|bg-\[#1e1e1e\]|bg-\[#0f141a\]|bg-\[#141b22\]|bg-\[#262f3d\]|bg-\[#0a0c10\]|bg-\[#0f1115\]/g, replacement: 'bg-surface' },
    // Hover backgrounds
    { regex: /hover:bg-\[#1e1e1e\]|hover:bg-\[#2a2a2a\]|hover:bg-\[#262f3d\]|hover:bg-\[#333\]|hover:bg-\[#222\]/g, replacement: 'hover:bg-muted' },
    // Borders
    { regex: /border-\[#1e1e1e\]|border-\[#2a2a2a\]|border-\[#262f3d\]|border-\[#333\]/g, replacement: 'border-border' },
    // Text colors
    { regex: /text-\[#eaeaea\]|text-white/g, replacement: 'text-foreground' },
    { regex: /text-\[#999\]|text-\[#555\]|text-gray-400|text-gray-300|text-gray-500|text-gray-600/g, replacement: 'text-muted-foreground' },
];

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
    let modified = false;

    for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

processDirectory(srcDir);
console.log('Refactoring complete.');
