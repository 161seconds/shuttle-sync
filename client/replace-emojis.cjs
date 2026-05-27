const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const allFiles = walkSync(srcDir);

const EMOJI_MAP = {
  '🏸': '<EmojiIcon name="badminton" />',
  '🏓': '<EmojiIcon name="pickleball" />',
  '🔥': '<EmojiIcon name="fire" />',
  '🏆': '<EmojiIcon name="trophy" />',
  '🥇': '<EmojiIcon name="medal" />',
  '👥': '<EmojiIcon name="users" />',
  '⭐': '<EmojiIcon name="star" />',
  '📍': '<EmojiIcon name="location" />',
  '📅': '<EmojiIcon name="calendar" />',
  '👋': '<EmojiIcon name="badminton" />', // using badminton for wave as a placeholder or we can use another icon
  '👑': '<EmojiIcon name="trophy" />', // mapping crown to trophy
  '💲': '<EmojiIcon name="shop" />', // dollar sign
  '⚡': '<EmojiIcon name="zap" />',
};

// Also we need to import EmojiIcon
const importStatement = `import { EmojiIcon } from '@/components/EmojiIcon';\n`;
// Wait, path to EmojiIcon depends on file location.
function getRelativeImport(filePath) {
    const depth = filePath.split(path.sep).length - srcDir.split(path.sep).length - 1;
    let prefix = depth === 0 ? './' : '../'.repeat(depth);
    return `import { EmojiIcon } from '${prefix}components/EmojiIcon';\n`;
}

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // specific manual replacements for some files to avoid syntax errors
    if (file.includes('CourtDetail.tsx')) {
        content = content.replace(/wifi: '📶 Wifi', parking: '🅿️ Bãi xe', shower: '🚿 Tắm rửa', ac: '❄️ Máy lạnh',/g, 
        `wifi: <><EmojiIcon name="wifi" className="w-4 h-4 inline-block mr-1"/> Wifi</>, parking: <><EmojiIcon name="parking" className="w-4 h-4 inline-block mr-1"/> Bãi xe</>, shower: <><EmojiIcon name="shower" className="w-4 h-4 inline-block mr-1"/> Tắm rửa</>, ac: <><EmojiIcon name="ac" className="w-4 h-4 inline-block mr-1"/> Máy lạnh</>,`);
        content = content.replace(/water: '💧 Nước uống', shop: '🛒 Shop', coach: '👨‍🏫 HLV', rental: '🎒 Cho thuê',/g,
        `water: <><EmojiIcon name="water" className="w-4 h-4 inline-block mr-1"/> Nước uống</>, shop: <><EmojiIcon name="shop" className="w-4 h-4 inline-block mr-1"/> Shop</>, coach: <><EmojiIcon name="coach" className="w-4 h-4 inline-block mr-1"/> HLV</>, rental: <><EmojiIcon name="rental" className="w-4 h-4 inline-block mr-1"/> Cho thuê</>,`);
        
        content = content.replace(/'🏸 Cầu lông' : '🏓 Pickleball'/g, `(<><EmojiIcon name="badminton" className="w-4 h-4 inline-block mr-1"/> Cầu lông</>) : (<><EmojiIcon name="pickleball" className="w-4 h-4 inline-block mr-1"/> Pickleball</>)`);
        content = content.replace(/<span>💲<\/span>/g, `<EmojiIcon name="shop" className="w-5 h-5 text-emerald-500" />`);
    }

    if (file.includes('GroupPlay.tsx') || file.includes('EditProfile.tsx') || file.includes('theme.ts') || file.includes('data.ts')) {
        content = content.replace(/icon: '⚡'/g, `icon: <EmojiIcon name="zap" className="w-4 h-4 inline-block align-text-bottom" />`);
        content = content.replace(/icon: '🏸'/g, `icon: <EmojiIcon name="badminton" className="w-4 h-4 inline-block align-text-bottom" />`);
        content = content.replace(/icon: '🏓'/g, `icon: <EmojiIcon name="pickleball" className="w-4 h-4 inline-block align-text-bottom" />`);
    }

    if (file.includes('Login.tsx')) {
        content = content.replace(/👋/g, `<EmojiIcon name="badminton" />`);
        content = content.replace(/🏸 Người chơi/g, `<EmojiIcon name="badminton" className="w-4 h-4 inline-block mr-1" /> Người chơi`);
        content = content.replace(/👑 Chủ sân/g, `<EmojiIcon name="trophy" className="w-4 h-4 inline-block mr-1" /> Chủ sân`);
    }

    if (file.includes('HomePage.tsx')) {
        content = content.replace(/Khám phá sân gần bạn 🏸/g, `Khám phá sân gần bạn <EmojiIcon name="badminton" className="w-5 h-5 inline-block ml-1 text-emerald-400" />`);
    }

    if (file.includes('Dashboard.tsx')) {
        content = content.replace(/👋/g, `<EmojiIcon name="badminton" />`);
        content = content.replace(/<span className="text-3xl">🏸<\/span>/g, `<EmojiIcon name="badminton" className="w-8 h-8 text-emerald-400" />`);
        content = content.replace(/<span className="text-3xl">🏆<\/span>/g, `<EmojiIcon name="trophy" className="w-8 h-8 text-amber-400" />`);
    }

    if (file.includes('RulesPage.tsx')) {
        content = content.replace(/<span className="text-lg">🏸<\/span>/g, `<EmojiIcon name="badminton" className="w-5 h-5 inline-block text-emerald-400" />`);
        content = content.replace(/<span className="text-lg">🏓<\/span>/g, `<EmojiIcon name="pickleball" className="w-5 h-5 inline-block text-orange-400" />`);
    }

    if (file.includes('CourtFilter.tsx')) {
        content = content.replace(/📍 Khu vực/g, `Khu vực`);
        content = content.replace(/📍 \$\{d\}/g, `\${d}`);
    }

    if (file.includes('MyGroupPlays.tsx') || file.includes('CourtCard.tsx') || file.includes('MapPage.tsx')) {
        content = content.replace(/'🏓' : '🏸'/g, `(<EmojiIcon name="pickleball" />) : (<EmojiIcon name="badminton" />)`);
    }

    if (file.includes('MapPage.tsx')) {
        content = content.replace(/⭐ \$\{court\.averageRating\?/g, `<EmojiIcon name="star" className="w-3 h-3" /> \${court.averageRating?`);
    }

    if (file.includes('GroupPlay.tsx')) {
        content = content.replace(/MỞ KÈO MỚI 🏸/g, `MỞ KÈO MỚI <EmojiIcon name="badminton" className="w-6 h-6 inline-block ml-2 text-emerald-400" />`);
    }

    if (file.includes('AiCoach.tsx')) {
        content = content.replace(/này\. 🏸/g, `này.`);
    }

    if (file.includes('StepWelcome.tsx')) {
        content = content.replace(/<span className="text-5xl">🏸<\/span>/g, `<EmojiIcon name="badminton" className="w-12 h-12 text-emerald-400" />`);
    }

    if (file.includes('AdminDashboard.tsx')) {
        content = content.replace(/>🏸<\/div>/g, `><EmojiIcon name="badminton" className="w-6 h-6 text-emerald-400" /><\/div>`);
    }

    if (file.includes('MapView.tsx')) {
        content = content.replace(/⭐/g, `★`); // since it's a string html, keep it simple with star char
    }

    if (content !== original) {
        if (!content.includes('EmojiIcon') || content.includes('import { EmojiIcon }')) {
            // it already imports it or we don't need it
        } else {
            // Find the last import and insert after it
            const importMatch = content.match(/^import.*$/gm);
            if (importMatch && importMatch.length > 0) {
                const lastImport = importMatch[importMatch.length - 1];
                content = content.replace(lastImport, lastImport + '\n' + getRelativeImport(file));
            } else {
                content = getRelativeImport(file) + '\n' + content;
            }
        }
        
        // Also if it was a .ts file but now has JSX, we need to rename it to .tsx
        if (file.endsWith('.ts') && content.includes('<EmojiIcon')) {
            fs.writeFileSync(file.replace('.ts', '.tsx'), content, 'utf8');
            fs.unlinkSync(file);
            console.log(`Renamed to .tsx and Modified: ${file}`);
        } else {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Modified: ${file}`);
        }
    }
});
