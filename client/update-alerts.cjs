const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'pages/SearchPage.tsx',
    'pages/profile/MyTournaments.tsx',
    'pages/profile/MyGroupPlays.tsx',
    'pages/profile/BookingHistory.tsx',
    'pages/Payment.tsx',
    'pages/MapPage.tsx',
    'pages/GroupPlay.tsx',
    'features/booking/BookingSheet.tsx',
    'features/admin/AdminDashboard.tsx',
    'components/MapView.tsx',
    'components/groups/MatchLeaderboard.tsx'
];

const basePath = path.join(__dirname, 'src');

filesToUpdate.forEach(file => {
    const filePath = path.join(basePath, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        const dirDepth = file.split('/').length - 1;
        const upStr = dirDepth > 0 ? '../'.repeat(dirDepth) : './';
        const importPath = `\nimport { useAlertStore } from '${upStr}stores/useAlertStore';\n`;
        
        let changed = false;

        if (content.includes('alert(') || content.includes('confirm(')) {
            if (!content.includes('useAlertStore')) {
                content = content.replace(/(import.*?from.*?;?\n)/, `$1${importPath}`);
            }
            
            // Replace alert(msg) with useAlertStore.getState().showAlert(msg, 'Thông báo')
            content = content.replace(/alert\((.*?)\)/g, (match, p1) => {
                let type = "'info'";
                if (p1.toLowerCase().includes('lỗi') || p1.toLowerCase().includes('không')) type = "'error'";
                if (p1.toLowerCase().includes('thành công')) type = "'success'";
                return `useAlertStore.getState().showAlert(${p1}, 'Thông báo', ${type})`;
            });

            // Replace confirm handling.
            // Old: if (!confirm('msg')) return;
            // New: 
            // We can't do a simple synchronous replacement for `confirm()`, because `showConfirm` takes a callback and is asynchronous!
            
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
});
