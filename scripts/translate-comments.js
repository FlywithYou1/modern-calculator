/* 简单注释翻译脚本：
  - 会把指定目录下的文件中注释（// , /* */, /* * */）翻译为中文（使用简易规则/人工映射），
  - 仅作自动化初步替换，复杂或含代码块的注释需要人工复核。
  注意：运行前请备份或使用 git 来跟踪变更。
*/

const fs = require('fs');
const path = require('path');

// 需要扫描的相对目录
const targetDirs = ['src', 'scripts', 'src-tauri/src', 'src/tests'];

// 简单的翻译映射（示例），用于常见短语；更复杂的翻译应使用在线翻译或人工复核
const glossary = {
  'calculator': '计算器 (calculator)',
  'performance': '性能 (performance)',
  'debug': '调试 (debug)',
  'settings': '配置 (settings)',
  'history': '历史 (history)',
  'keyboard': '键盘 (keyboard)',
  'evaluator': '求值器 (evaluator)',
  'component': '组件 (component)'
};

function translateText(text) {
  // 先替换短语
  let out = text;
  Object.keys(glossary).forEach(k => {
    const re = new RegExp('\\b' + k + '\\b', 'gi');
    out = out.replace(re, glossary[k]);
  });
  // 若仍然是英文，标记为 TODO（供人工复核）
  return out;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 替换单行注释
  content = content.replace(/(^|[^:\\])\/\/([^\n\r]*)/g, (m, p1, p2) => {
    const t = translateText(p2.trim());
    return p1 + '// ' + t;
  });

  // 替换多行注释 /* */
  content = content.replace(/\/\*([\s\S]*?)\*\//g, (m, p1) => {
    const t = translateText(p1.trim());
    return '/* ' + t + ' */';
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function walkAndProcess(root) {
  const fullRoot = path.join(process.cwd(), root);
  if (!fs.existsSync(fullRoot)) return 0;
  const files = [];
  function walk(dir) {
    fs.readdirSync(dir).forEach(name => {
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        // 跳过 node_modules 和目标编译目录
        if (name === 'node_modules' || name === 'dist' || name === 'target') return;
        walk(p);
      } else {
        if (p.match(/\.(ts|tsx|js|rs)$/)) files.push(p);
      }
    });
  }
  walk(fullRoot);
  let changed = 0;
  files.forEach(f => { if (processFile(f)) changed++; });
  return changed;
}

let totalChanged = 0;
for (const d of targetDirs) {
  totalChanged += walkAndProcess(d);
}
console.log('MODIFIED_FILES=' + totalChanged);
