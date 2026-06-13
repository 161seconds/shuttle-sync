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

    // --- 1. AdminDashboard.tsx ---
    content = content.replace(/backgroundColor: '#141b22', borderColor: '#262f3d'/g, "backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)'");
    content = content.replace(/color: '#fff'/g, "color: 'var(--color-foreground)'");
    content = content.replace(/divide-\[#262f3d\]/g, 'divide-border');

    // --- 2. MapView.tsx & MapPage.tsx ---
    content = content.replace(/background:\${highlight \? '#10b981' : '#151515'};color:\${highlight \? '#000' : '#eaeaea'};/g, "background:${highlight ? '#10b981' : 'var(--color-card)'};color:${highlight ? '#000' : 'var(--color-foreground)'};");
    content = content.replace(/border:1\.5px solid \${highlight \? '#10b981' : '#2a2a2a'};/g, "border:1.5px solid ${highlight ? '#10b981' : 'var(--color-border)'};");
    content = content.replace(/color:#111;/g, "color:var(--color-foreground);");
    content = content.replace(/color:#6B7280;/g, "color:var(--color-muted-foreground);");
    content = content.replace(/color: \${isActive \? '#fff' : '#e2e8f0'};/g, "color: ${isActive ? 'var(--color-card)' : 'var(--color-foreground)'};");
    content = content.replace(/from-\[#121212\]\/90 via-\[#121212\]\/50/g, 'from-background via-background/50');
    content = content.replace(/from-\[#121212\] via-\[#121212\]\/80/g, 'from-background via-background/80');

    // --- 3. Dark Gradients (from-[#...] to-[#...]) ---
    content = content.replace(/from-\[#1a1c23\] to-\[#111113\]/g, 'from-card to-background');
    content = content.replace(/from-\[#1e2128\] to-\[#14151a\]/g, 'from-card to-background');
    content = content.replace(/from-\[#121417\] to-\[#0a0a0b\]/g, 'from-card to-background');
    content = content.replace(/from-\[#1a1500\] to-\[#0f0c00\]/g, 'from-card to-background');
    content = content.replace(/from-\[#1a1a1a\] via-\[#222\] to-\[#1a1a1a\]/g, 'from-muted via-border to-muted');

    // --- 4. Dashboard (Upcoming Match Box) ---
    content = content.replace(/from-emerald-900\/30 to-\[#0a0d0f\]/g, 'from-emerald-500/10 to-card');

    // --- 5. Support Page ---
    content = content.replace(/from-white via-white\/90 to-white\/30 bg-clip-text text-transparent/g, 'from-foreground via-foreground/90 to-foreground/50 bg-clip-text text-transparent');
    content = content.replace(/bg-purple-600\/15 blur-\[120px\] rounded-full pointer-events-none mix-blend-screen/g, 'bg-purple-600/15 blur-[120px] rounded-full pointer-events-none dark:mix-blend-screen');
    content = content.replace(/bg-fuchsia-600\/10 blur-\[100px\] rounded-full pointer-events-none mix-blend-screen/g, 'bg-fuchsia-600/10 blur-[100px] rounded-full pointer-events-none dark:mix-blend-screen');

    // --- 6. Hardcoded text-[#000] ---
    content = content.replace(/text-\[#000\]/g, 'text-foreground');


    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

processDirectory(srcDir);
console.log('Light Mode Polish (Pass 3) Complete.');
