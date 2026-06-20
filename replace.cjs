const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/rounded-\[3rem\]/g, 'rounded-[2rem] sm:rounded-[3rem]');
content = content.replace(/text-4xl/g, 'text-3xl sm:text-4xl');
content = content.replace(/text-3xl font-black/g, 'text-2xl sm:text-3xl font-black');
content = content.replace(/grid grid-cols-3 gap-4/g, 'grid grid-cols-3 gap-2 sm:gap-4');
content = content.replace(/p-6 rounded-\[2rem\]/g, 'p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem]');
content = content.replace(/py-6 rounded-\[2rem\] font-black text-xl/g, 'py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl');
content = content.replace(/text-2xl font-black/g, 'text-xl sm:text-2xl font-black');

fs.writeFileSync('src/App.tsx', content);
console.log('Mobile padding and font sizes updated.');
