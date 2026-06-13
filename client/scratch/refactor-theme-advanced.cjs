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

    // Backgrounds
    content = content.replace(/bg-\[#0[a-fA-F0-9]{5}\](\/\d+)?/g, 'bg-background$1');
    content = content.replace(/bg-\[#1[a-fA-F0-9]{5}\](\/\d+)?/g, 'bg-card$1');
    content = content.replace(/bg-\[#[2-3][a-fA-F0-9]{5}\](\/\d+)?/g, 'bg-surface$1');
    content = content.replace(/bg-\[#(111|222|333)\](\/\d+)?/g, 'bg-surface$2');

    // Hover backgrounds
    content = content.replace(/hover:bg-\[#1[a-fA-F0-9]{5}\](\/\d+)?/g, 'hover:bg-muted$1');
    content = content.replace(/hover:bg-\[#[2-4][a-fA-F0-9]{5}\](\/\d+)?/g, 'hover:bg-muted$1');
    content = content.replace(/hover:bg-\[#(111|222|333)\](\/\d+)?/g, 'hover:bg-muted$2');
    content = content.replace(/hover:bg-white\/?(\[[0-9.]+\]|\d+)?/g, 'hover:bg-muted');

    // Borders
    content = content.replace(/border-white\/?(\[[0-9.]+\]|\d+)?/g, 'border-border');
    content = content.replace(/border-\[#[1-4][a-fA-F0-9]{5}\](\/\d+)?/g, 'border-border');
    content = content.replace(/border-\[#(111|222|333|444)\]/g, 'border-border');

    // Text colors
    content = content.replace(/text-white(\/\d+)?/g, 'text-foreground$1');
    content = content.replace(/text-\[#eaeaea\]/g, 'text-foreground');
    content = content.replace(/text-gray-[34568]00(\/\d+)?/g, 'text-muted-foreground$1');
    content = content.replace(/text-\[#(999|555|777|888|aaa|bbb|ccc|ddd|eee)\]/g, 'text-muted-foreground');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

processDirectory(srcDir);
console.log('Advanced refactoring complete.');
