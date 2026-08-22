const { execSync } = require('child_process');
const fs = require('fs');

const config = JSON.parse(
    fs.readFileSync('.claude/ralph.config.json', 'utf8')
);

// Сброс счетчика итераций
fs.writeFileSync('.claude/ralph.iterations.json', JSON.stringify({ count: 0}));

// Запуск первой итерации
const prompt = config.prompt
    .replace('{milestone}', config.phases[0].milestone)
    .replace('{branch}', config.phases[0].branch);
console.log(`Запускает Ralph для milestone: ${config.phases[0].milestone}`);

execSync(
    `claude -p ${JSON.stringify(prompt)} --max-turns ${config.maxTurns}`,
    { stdio: 'inherit' }
);