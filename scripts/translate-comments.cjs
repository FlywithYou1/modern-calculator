// 注释翻译脚本（CommonJS 版本）
// - 扫描指定目录下的 .ts .tsx .js .rs 文件
// - 替换单行注释 (//) 与块注释 (不直接写成 /* */ 字符串) 的内容为中文翻译（使用简单映射）
// - 建议在 git 下运行以便回滚

const fs = require('fs');
const path = require('path');

const targetDirs = ['src', 'scripts', 'src-tauri/src', 'src/tests'];
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
  let out = text;
  Object.keys(glossary).forEach(k => {
    const re = new RegExp('\\b' + k + '\\b', 'gi');
    out = out.replace(re, glossary[k]);
  });
  return out;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 替换单行注释（注意避开 URL 中的 //）
  content = content.replace(/(^|[^:\\])\/\/([^\n\r]*)/g, function(m, p1, p2) {
    const text = p2.trim();
    if (!text) return m;
    const t = translateText(text);
    return p1 + '// ' + t;
  });

  // 替换块注释 /* ... */
  content = content.replace(/\/\*([\s\S]*?)\*\//g, function(m, p1) {
    const text = p1.trim();
    if (!text) return m;
    const t = translateText(text);
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
  (function walk(dir) {
    fs.readdirSync(dir).forEach(name => {
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        if (name === 'node_modules' || name === 'dist' || name === 'target') return;
        walk(p);
      } else {
        if (p.match(/\.(ts|tsx|js|rs)$/)) files.push(p);
      }
    });
  })(fullRoot);

  let changed = 0;
  files.forEach(f => { if (processFile(f)) changed++; });
  return changed;
}

let totalChanged = 0;
for (const d of targetDirs) {
  totalChanged += walkAndProcess(d);
}
console.log('MODIFIED_FILES=' + totalChanged);
