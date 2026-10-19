const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const pageCache = new Map();

const nodeTags = {
  complexity: [110], array: [1], prefix: [254], sort: [113], twoptr: [345],
  recursion: [54], 'binary-search': [45], greedy: [7], backtrack: [4, 128],
  'divide-conquer': [112], stack: [287], queue: [288], 'mono-queue': [56],
  'linked-list': [360], hash: [473, 235], heap: [51], 'binary-tree': [208],
  bst: [50], 'union-find': [47], 'rollback-dsu': [47], 'li-chao': [377],
  trie: [300], 'sparse-table': [290], fenwick: [53], 'segment-tree': [42],
  treap: [50], 'persistent-segtree': [233], 'graph-model': [155],
  'dfs-bfs': [158], components: [175], 'tree-basics': [208], topo: [159],
  bipartite: [187], dijkstra: [160], 'bellman-ford': [174], floyd: [476],
  mst: [166], kruskal: [166], prim: [166], lowlink: [180], 'tarjan-scc': [180],
  bridges: [181], 'vertex-bcc': [181], 'edge-bcc': [181], euler: [182],
  lca: [211], 'tree-diameter': [213], 'scc-dag': [179], matching: [187],
  flow: [79], 'min-cost-flow': [204], 'tree-tour': [208], hld: [228],
  centroid: [49], 'dp-intro': [3], 'linear-dp': [444], lis: [3, 444],
  lcs: [2, 3], 'knapsack-01': [139], 'knapsack-complete': [139],
  'knapsack-multi': [139], 'knapsack-group': [139], 'digit-dp': [141],
  'interval-dp': [144], 'tree-dp': [152], 'bitmask-dp': [464],
  'dag-dp': [3], 'prob-dp': [266], 'monotone-dp': [56, 146],
  'divide-dp': [146], 'reroot-dp': [152], 'sos-dp': [464],
  'cht-dp': [150], modular: [72], gcd: [241], prime: [239], inverse: [276],
  comb: [253], 'sieve-func': [475], 'linear-basis': [277], matrix: [272],
  crt: [250], ntt: [324], gaussian: [274], 'game-theory': [445],
  'string-basics': [2], kmp: [302], 'z-function': [474], 'string-hash': [235],
  manacher: [329], ac: [301], 'suffix-array': [303], sam: [101],
  eertree: [325], 'geometry-basic': [286], 'segment-intersection': [293],
  'convex-hull': [291], 'rotating-calipers': [299], mo: [41],
  'sqrt-decomp': [289, 371], offline: [447], bitmask: [314],
  randomized: [309], 'offline-connectivity': [446], 'divide-conquer-tree': [49]
};
const categoryTags = {
  '基础与技巧': [110, 1], '数据结构': [44, 11], '搜索与图论': [6],
  '动态规划': [3], '数学与数论': [5], '字符串': [2],
  '计算几何': [8], '高级专题': [308]
};
const difficultyCaps = { '入门': 2, '基础': 3, '进阶': 4, '挑战': 5 };
const difficultyNames = ['未评定', '入门', '普及-', '普及/提高-', '普及+/提高', '提高+/省选-', '省选/NOI-', 'NOI/NOI+/CTSC'];

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

async function getProblemPage(tag, difficulty, page) {
  const key = tag + ':' + difficulty + ':' + page;
  const cached = pageCache.get(key);
  if (cached && Date.now() - cached.time < 30 * 60 * 1000) return cached.value;
  const query = new URLSearchParams({ type: 'P', tag: String(tag), difficulty: String(difficulty), page: String(page) });
  const response = await fetch('https://www.luogu.com.cn/problem/list?' + query, {
    headers: { 'Referer': 'https://www.luogu.com.cn/' }
  });
  if (!response.ok) throw new Error('洛谷题库返回 HTTP ' + response.status);
  const html = await response.text();
  const match = html.match(/<script id="lentille-context" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('无法解析洛谷题库响应');
  const context = JSON.parse(match[1]);
  const result = context.data && context.data.problems;
  if (!result || !result.result) throw new Error('洛谷题库暂时不可用');
  const value = { count: result.count, perPage: result.perPage, problems: result.result };
  pageCache.set(key, { time: Date.now(), value });
  return value;
}

async function questionsForNode(id, category, level) {
  const tags = [...new Set([...(nodeTags[id] || []), ...(categoryTags[category] || [110])])];
  const maxDifficulty = difficultyCaps[level] || 4;
  const found = new Map();
  for (const tag of tags) {
    const firstPages = await Promise.all(Array.from({ length: maxDifficulty }, (_, i) => getProblemPage(tag, i + 1, 1)));
    for (let difficulty = 1; difficulty <= maxDifficulty; difficulty++) {
      const first = firstPages[difficulty - 1];
      const pages = Math.ceil(first.count / first.perPage);
      const randomPage = pages > 1 ? 1 + Math.floor(Math.random() * pages) : 1;
      const page = randomPage === 1 ? first : await getProblemPage(tag, difficulty, randomPage);
      page.problems.forEach(problem => {
        if (problem.pid && problem.difficulty > 0 && problem.difficulty <= maxDifficulty && problem.tags.length <= 5) found.set(problem.pid, problem);
      });
    }
    if (found.size >= 10) break;
  }
  if (found.size < 10) throw new Error('该知识点在当前难度范围内题量不足，请稍后重试');
  const problems = [...found.values()];
  const templates = shuffle(problems.filter(p => /模板|template/i.test(p.name)));
  const others = shuffle(problems.filter(p => !/模板|template/i.test(p.name)));
  const templatePick = templates.slice(0, Math.min(4, templates.length));
  const remainder = [...others, ...templates.slice(templatePick.length)];
  const picked = [...templatePick, ...remainder.slice(0, 10 - templatePick.length)];
  return shuffle(picked).map(p => ({
    id: p.pid,
    name: p.name,
    difficulty: p.difficulty,
    difficultyName: difficultyNames[p.difficulty] || '未评定',
    tags: p.tags,
    url: 'https://www.luogu.com.cn/problem/' + encodeURIComponent(p.pid)
  }));
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + host + ':' + port);
  if (url.pathname === '/api/problems') {
    try {
      const problems = await questionsForNode(
        url.searchParams.get('node') || '',
        url.searchParams.get('category') || '',
        url.searchParams.get('level') || '进阶'
      );
      return json(res, 200, { source: '洛谷', problems });
    } catch (error) {
      return json(res, 502, { error: error.message });
    }
  }
  if (url.pathname === '/api/luogu/passed') {
    const uid = (url.searchParams.get('uid') || '').trim();
    if (!/^[1-9]\d{0,11}$/.test(uid)) return json(res, 400, { error: '请输入有效的洛谷用户 UID。' });
    try {
      const response = await fetch('https://www.luogu.com.cn/user/' + uid + '/practice?_contentOnly=1', {
        headers: { 'Referer': 'https://www.luogu.com.cn/' }
      });
      if (!response.ok) return json(res, response.status, { error: '洛谷用户练习页返回 HTTP ' + response.status });
      const html = await response.text();
      const match = html.match(/<script id="lentille-context" type="application\/json">([\s\S]*?)<\/script>/);
      if (!match) return json(res, 502, { error: '无法解析洛谷用户练习页。' });
      const context = JSON.parse(match[1]);
      const user = context.data && context.data.user;
      if (!user || !user.uid) return json(res, 404, { error: '没有找到该洛谷 UID。' });
      const passed = context.data.passed || [];
      return json(res, 200, { uid: user.uid, name: user.name, passed: passed.map(problem => problem.pid), count: passed.length });
    } catch (error) {
      return json(res, 502, { error: error.message });
    }
  }
  if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'API not found' });
  const target = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  const file = path.resolve(__dirname, target);
  if (!file.startsWith(path.resolve(__dirname) + path.sep) && file !== path.resolve(__dirname, 'index.html')) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.readFile(file, (error, contents) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    const type = file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type }); res.end(contents);
  });
});

server.listen(port, host, () => console.log('Algorithm map running at http://' + host + ':' + port));
