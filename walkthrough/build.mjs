#!/usr/bin/env node
// Builds walkthrough/index.html, a self-contained replay of the Millwright run in this repo.
//
//   node walkthrough/build.mjs [--ref main] [--rust ../minidon-rust]
//
// It reads the numbered commits on the first-parent history of --ref (default: main, or master
// in older clones, so backup branches are ignored), the stage-NN tags, the files and ledgers each commit changed,
// and the minidon-rust history for the build stages. The narrative comes from stages.mjs.
// No npm install is needed: Node 18+ and git are enough.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as N from './stages.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const { marked } = require('./vendor/marked.umd.js');

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const warnings = [];
const warn = (msg) => { warnings.push(msg); console.warn(`warning: ${msg}`); };

function git(dir, gitArgs, { allowFail = false } = {}) {
  try {
    return execFileSync('git', ['-C', dir, ...gitArgs], { encoding: 'utf8', maxBuffer: 1 << 29, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    if (allowFail) return null;
    throw err;
  }
}

// ---------------------------------------------------------------- repositories

const configText = readFileSync(path.join(repo, 'millwright.config.yaml'), 'utf8');
const configRepos = [...configText.matchAll(/- name:\s*(\S+)\s*\n\s*path:\s*(\S+)\s*\n\s*role:\s*(\S+)/g)]
  .map(([, name, p, role]) => ({ name, path: p, role }));
const rustDir = path.resolve(opt('rust', configRepos.find((r) => r.name === 'minidon-rust')?.path ?? path.join(repo, '..', 'minidon-rust')));
const hasRust = existsSync(path.join(rustDir, '.git'));
if (!hasRust) warn(`minidon-rust not found at ${rustDir}; code stages will have no Rust commits`);

const hasBranch = (b) => git(repo, ['rev-parse', '--verify', '--quiet', `refs/heads/${b}`], { allowFail: true });
const ref = opt('ref', hasBranch('main') ? 'main' : hasBranch('master') ? 'master' : 'HEAD');

// ---------------------------------------------------------------- commits

const SEP = '\x1f';
const log = git(repo, ['log', '--first-parent', '--reverse', `--format=%H${SEP}%h${SEP}%s${SEP}%aI${SEP}%an${SEP}%ae`, ref])
  .trim().split('\n').map((line) => {
    const [sha, short, subject, date, author, email] = line.split(SEP);
    return { sha, short, subject, date, author, email };
  });

const tagsBySha = {};
for (const name of git(repo, ['tag']).trim().split('\n').filter(Boolean)) {
  const target = git(repo, ['rev-list', '-n', '1', name]).trim();
  (tagsBySha[target] ??= []).push(name);
}

const numbered = /^(\d{2,3}) - ([^:]+): (.*)$/;
const chore = /^chore - ([^:]+): (.*)$/;

// ---------------------------------------------------------------- diffs

const SKIP_CONTENT = [
  [/\/history\//, 'archived snapshot of an earlier version'],
  [/\/graph\/(nodes|edges)\.json$/, 'machine-generated code graph'],
  [/(^|\/)(Cargo|flake|uv)\.lock$/, 'lock file'],
  [/\.mw\/manifests\//, 'generated host manifest'],
];
const MAX_DIFF_LINES = 320;

function changedFiles(dir, sha) {
  const status = {};
  for (const line of git(dir, ['show', '--format=', '--no-renames', '--name-status', sha]).trim().split('\n').filter(Boolean)) {
    const [s, p] = line.split('\t');
    status[p] = s;
  }
  const stats = {};
  for (const line of git(dir, ['show', '--format=', '--no-renames', '--numstat', sha]).trim().split('\n').filter(Boolean)) {
    const [a, d, p] = line.split('\t');
    stats[p] = { add: a === '-' ? 0 : +a, del: d === '-' ? 0 : +d, binary: a === '-' };
  }
  const patch = git(dir, ['show', '--format=', '--no-renames', '--no-color', '-p', sha]);
  const chunks = {};
  for (const part of patch.split(/^(?=diff --git )/m)) {
    const m = part.match(/^diff --git a\/(.+?) b\/(.+)$/m);
    if (m) chunks[m[2]] = part;
  }
  return Object.keys(status).sort().map((p) => {
    const file = { path: p, status: status[p], ...stats[p] };
    const skip = SKIP_CONTENT.find(([re]) => re.test(p));
    const body = (chunks[p] ?? '').split('\n');
    const start = body.findIndex((l) => l.startsWith('@@'));
    const hunks = start >= 0 ? body.slice(start) : [];
    if (file.binary) file.skipped = 'binary file';
    else if (skip) file.skipped = skip[1];
    else {
      file.diff = hunks.slice(0, MAX_DIFF_LINES).join('\n');
      if (hunks.length > MAX_DIFF_LINES) file.truncated = hunks.length - MAX_DIFF_LINES;
    }
    return { file, added: hunks.filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1)) };
  });
}

// ---------------------------------------------------------------- artifacts

marked.use({
  gfm: true,
  renderer: {
    code({ text, lang }) {
      if (lang === 'mermaid') return `<div class="mermaid-box"><pre class="mermaid">${esc(text)}</pre></div>`;
      return false;
    },
  },
});

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderMarkdown(text) {
  let meta = null;
  const fm = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    meta = fm[1].split('\n').map((l) => l.match(/^([\w-]+):\s*(.*)$/)).filter(Boolean).map(([, k, v]) => [k, v]);
    text = text.slice(fm[0].length);
  }
  return { html: marked.parse(text), meta };
}

function expandPath(p) {
  if (p.startsWith('@run/')) return `.mw/runs/${N.RUN_ID}/${p.slice(5)}`;
  return p;
}

// The PR record the pr-agent wrote says which Rust branch is reviewed and what it merges into.
const prRecordPath = `.mw/runs/${N.RUN_ID}/repos/minidon-rust/pr.json`;
const prRaw = git(repo, ['show', `${ref}:${prRecordPath}`], { allowFail: true });
const prRecord = prRaw ? JSON.parse(prRaw) : null;
const rustBranchOk = (b) => hasRust && b && git(rustDir, ['rev-parse', '--verify', '--quiet', `refs/heads/${b}`], { allowFail: true });
const rustHeadRef = rustBranchOk(prRecord?.pullRequest?.head) ? prRecord.pullRequest.head : 'HEAD';
const rustBaseRef = rustBranchOk(prRecord?.pullRequest?.base) ? prRecord.pullRequest.base : null;
const rustHead = hasRust ? git(rustDir, ['rev-parse', rustHeadRef]).trim() : null;

function readArtifact(p, sha) {
  const isRust = p.startsWith('rust:');
  const rel = isRust ? p.slice(5) : expandPath(p);
  const at = isRust ? rustHead : sha;
  if (isRust && !hasRust) return null;
  const content = git(isRust ? rustDir : repo, ['show', `${at}:${rel}`], { allowFail: true });
  if (content == null) { warn(`artifact ${rel} not found at ${at.slice(0, 7)}`); return null; }
  const ext = path.extname(rel).toLowerCase();
  const a = { path: rel, repo: isRust ? 'minidon-rust' : 'minidon-context', at: at.slice(0, 7), name: path.basename(rel), lines: content.split('\n').length };
  if (ext === '.md') Object.assign(a, { kind: 'md' }, renderMarkdown(content));
  else if (ext === '.json') a.kind = 'json', a.text = content;
  else if (ext === '.jsonl') a.kind = 'jsonl', a.text = content;
  else if (ext === '.yaml' || ext === '.yml') a.kind = 'code', a.lang = 'yaml', a.text = content;
  else a.kind = 'code', a.lang = ext.slice(1) || 'text', a.text = content;
  return a;
}

// ---------------------------------------------------------------- run state and commands

function runsAt(sha) {
  const out = {};
  const list = git(repo, ['ls-tree', '--name-only', `${sha}:.mw/runs`], { allowFail: true });
  for (const id of (list ?? '').trim().split('\n').filter(Boolean)) {
    const raw = git(repo, ['show', `${sha}:.mw/runs/${id}/run.json`], { allowFail: true });
    if (raw) try { out[id] = JSON.parse(raw); } catch { warn(`bad run.json for ${id} at ${sha.slice(0, 7)}`); }
  }
  return out;
}

const q = (s) => `"${String(s).replace(/(["\\$`])/g, '\\$1')}"`;

function commandsFor(entry, runs) {
  const run = entry.run;
  const r = runs[run] ?? {};
  const actor = entry.actor?.id;
  const tr = entry.trigger;
  if (tr === 'run.created') {
    if (r.type === 'baseline') return 'millwright context build --yes';
    return `millwright run new ${run} --type ${r.type ?? 'feature'} --class ${r.classification ?? 'standard'}${r.repos ? ` --repos ${r.repos.join(',')}` : ''}`;
  }
  if (tr?.startsWith('research.')) {
    const verb = tr.split('.')[1];
    if (verb === 'waive') {
      const m = (entry.reason ?? '').match(/^(\S+) waived: (.*)$/);
      return `millwright research waive ${m?.[1] ?? '<target>'} --run ${run} --reason ${q(m?.[2] ?? entry.reason ?? '')}`;
    }
    return `millwright research ${verb} --run ${run}`;
  }
  const parallelFrom = Object.keys(N.tracks.feature.parallel).includes(entry.from);
  let c = `millwright transition --run ${run} --to ${entry.to}`;
  if (parallelFrom) c += ` --from ${entry.from}`;
  if (tr && tr !== 'agent.complete') c += ` --trigger ${tr}`;
  if (actor) c += ` --actor ${actor}`;
  if (entry.reason) c += ` --reason ${q(entry.reason)}`;
  if (entry.category) c += ` --category ${entry.category}`;
  if (entry.artifacts?.length && tr === 'agent.complete') c += ` --artifacts ${entry.artifacts.join(',')}`;
  return c;
}

function baselineReviewCommands(report) {
  const resolutions = Object.fromEntries((report.conflictsResolution ?? []).map((c) => [c.id, c.resolution]));
  return (report.sessionLog ?? []).map((s) => {
    const run = report.runId;
    let cmd;
    if (s.action === 'review_started') cmd = `millwright baseline review --run ${run}`;
    else if (s.action === 'conflict_resolved') {
      const id = s.details.split(':')[0];
      cmd = `millwright baseline resolve --run ${run} --conflict ${id} --resolution ${q(resolutions[id] ?? s.details)}`;
    } else if (s.action === 'domain_signoff') {
      const d = report.domains?.find((x) => s.details.startsWith(x.id));
      cmd = `millwright baseline signoff --run ${run} --domain ${d?.id ?? s.details.split(':')[0]} --status ${d?.status ?? 'approved'}${d?.comments ? ` --comment ${q(d.comments)}` : ''}`;
    } else if (s.action === 'decision_submitted') cmd = `millwright baseline submit --run ${run} --decision approve --rationale ${q(report.decisionRationale ?? '')}`;
    else return null;
    return { cmd, source: 'review', ts: s.timestamp, actor: s.actor };
  }).filter(Boolean);
}

// ---------------------------------------------------------------- rust history

function rustCommits() {
  if (!hasRust) return [];
  const lines = git(rustDir, ['log', '--reverse', `--format=%H${SEP}%h${SEP}%s${SEP}%aI`, rustBaseRef ? `${rustBaseRef}..${rustHeadRef}` : rustHeadRef]).trim().split('\n');
  return lines.map((line) => {
    const [sha, short, subject, date] = line.split(SEP);
    return { sha, short, subject, date, files: changedFiles(rustDir, sha).map((x) => x.file) };
  });
}

function rustWaves(commits, sha) {
  const waves = [];
  const assigned = new Set();
  const list = git(repo, ['ls-tree', '--name-only', `${sha}:.mw/runs/${N.RUN_ID}/build`], { allowFail: true });
  for (const name of (list ?? '').trim().split('\n').filter(Boolean).sort()) {
    const text = git(repo, ['show', `${sha}:.mw/runs/${N.RUN_ID}/build/${name}`]);
    const title = (text.match(/^# (.*)$/m)?.[1] ?? name).replace(/^Build log:\s*/i, '');
    // A log names its commits by SHA, or only says how many it added ("9 commits on top of the 7").
    let shas = commits.filter((c) => !assigned.has(c.short) && new RegExp(`\\b${c.short}\\b`).test(text)).map((c) => c.short);
    if (!shas.length) {
      const count = +(text.split('\n').slice(0, 8).join(' ').match(/\b(\d+) (?:new )?commits\b/)?.[1] ?? 0);
      shas = commits.filter((c) => !assigned.has(c.short)).slice(0, count).map((c) => c.short);
      if (!count) warn(`build log ${name} names no commits`);
    }
    shas.forEach((s) => assigned.add(s));
    waves.push({ name, title, commits: shas });
  }
  const rest = commits.filter((c) => !assigned.has(c.short)).map((c) => c.short);
  if (rest.length) waves.push({ name: 'other', title: 'Not named in a build log', commits: rest });
  return waves;
}

// ---------------------------------------------------------------- file trees

// Every path that exists at any step, once; each step lists indexes into it. The walkthrough's
// own files are left out, because they are not part of the run.
const allPaths = [];
const pathIndex = new Map();
function treeAt(dir, sha) {
  return git(dir, ['ls-tree', '-r', '--name-only', sha]).trim().split('\n').filter((p) => p && !p.startsWith('walkthrough/'))
    .map((p) => { if (!pathIndex.has(p)) { pathIndex.set(p, allPaths.length); allPaths.push(p); } return pathIndex.get(p); });
}

// ---------------------------------------------------------------- assemble

const stages = [];
let pendingChores = [];
const allRust = rustCommits();

for (const c of log) {
  const ch = c.subject.match(chore);
  if (ch) { pendingChores.push({ ...c, label: ch[1], text: ch[2], files: changedFiles(repo, c.sha).map((x) => x.file) }); continue; }
  const m = c.subject.match(numbered);
  if (!m) continue;
  const [, num, label, text] = m;
  const n = N.steps[num] ?? {};
  if (!N.steps[num]) warn(`step ${num} has no narrative in stages.mjs; using the commit subject`);

  const changes = changedFiles(repo, c.sha);
  const files = changes.map((x) => x.file);
  const ledger = changes.filter((x) => x.file.path.endsWith('ledger.jsonl'))
    .flatMap((x) => x.added.filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }))
    .filter(Boolean).sort((a, b) => a.ts.localeCompare(b.ts));
  const runs = runsAt(c.sha);

  const commands = (n.commands ?? []).map((cmd) => ({ cmd, source: 'notes' }));
  const reviewFile = changes.find((x) => /BASELINE-[^/]+\/baseline-review-report\.json$/.test(x.file.path) && x.file.status === 'A');
  if (reviewFile) {
    const report = JSON.parse(git(repo, ['show', `${c.sha}:${reviewFile.file.path}`]));
    commands.push(...baselineReviewCommands(report));
  }
  for (const e of ledger) {
    commands.push({ cmd: commandsFor(e, runs), source: 'ledger', seq: e.seq, run: e.run, ts: e.ts, actor: e.actor?.id, actorType: e.actor?.type, from: e.from, to: e.to, trigger: e.trigger, checks: e.context?.checks ?? [], reason: e.reason, digest: e.digest });
  }
  if (num === '02' && commands.some((x) => x.cmd === 'millwright context build --yes' && x.source === 'ledger')) {
    const i = commands.findIndex((x) => x.cmd === 'millwright context build --yes' && x.source === 'notes');
    if (i >= 0) commands.splice(i, 1);
  }

  const feature = runs[N.RUN_ID];
  const baselineId = Object.keys(runs).find((id) => runs[id].type === 'baseline');
  const track = feature ? 'feature' : 'baseline';
  const runState = feature ? { run: N.RUN_ID, state: feature.state } : baselineId ? { run: baselineId, state: runs[baselineId].state } : null;

  const gateEntry = ledger.find((e) => e.trigger?.startsWith('gate.'));
  const gateStates = [...N.tracks.baseline.gates, ...N.tracks.feature.gates];
  let kind = 'step';
  if (gateEntry) kind = 'gate';
  else if (ledger.some((e) => gateStates.includes(e.to) && e.from !== e.to)) kind = 'arrive';
  else if (runState && gateStates.includes(runState.state)) kind = 'atgate';

  const chapter = N.chapters.findIndex((x) => x.steps.includes(num));
  if (chapter < 0) warn(`step ${num} is in no chapter`);

  const stage = {
    id: `${num}-${label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    num, label, kind, chapter,
    title: n.title ?? text,
    subject: c.subject,
    story: n.story ?? [text],
    who: n.who ?? [...new Set(ledger.map((e) => e.actor?.type === 'human' ? 'human' : e.actor?.id))],
    numbers: n.numbers ?? [],
    milestone: n.milestone ?? null,
    note: n.note ?? null,
    aside: n.aside ?? null,
    reads: n.reads ?? null,
    writes: n.writes ?? null,
    commit: { sha: c.sha, short: c.short, date: c.date, author: c.author, tags: tagsBySha[c.sha] ?? [] },
    launch: n.launch ?? null,
    after: n.after ?? null,
    chores: pendingChores,
    track, runState,
    runs: Object.fromEntries(Object.entries(runs).map(([id, r]) => [id, r.state])),
    gate: gateEntry ? { state: gateEntry.from, name: N.gateNames[gateEntry.from] ?? gateEntry.from, to: gateEntry.to, by: gateEntry.actor?.id, ts: gateEntry.ts, checks: gateEntry.context?.checks ?? [], ...n.gate, source: n.gate?.source ? expandPath(n.gate.source) : null } : null,
    commands, files,
    tree: treeAt(repo, c.sha),
    artifacts: (n.artifacts ?? files.filter((f) => /\.(md|json)$/.test(f.path) && !f.skipped && f.status !== 'D').map((f) => f.path).slice(0, 6))
      .map((p) => readArtifact(p, c.sha)).filter(Boolean),
  };
  if (n.rust && hasRust) {
    stage.rust = num === '29'
      ? { head: rustHead.slice(0, 7), commits: allRust, waves: rustWaves(allRust, c.sha) }
      : { head: rustHead.slice(0, 7), commits: [], waves: [] };
  }
  // A file counts as written by this step when this step's commit (or, for minidon-rust, one of
  // this step's Rust commits) changed it. Everything else the step shows is something it read.
  const rustTouched = new Set((stage.rust?.commits ?? []).flatMap((rc) => rc.files.map((f) => f.path)));
  for (const a of stage.artifacts) {
    a.changed = a.repo === 'minidon-context' ? files.find((f) => f.path === a.path)?.status ?? null : rustTouched.has(a.path) ? 'A' : null;
  }
  // The passage this step is about: which file, and the line it starts on (for Open in VS Code).
  if (n.focus) {
    const rel = n.focus.path.startsWith('rust:') ? n.focus.path.slice(5) : expandPath(n.focus.path);
    const r = n.focus.path.startsWith('rust:') ? 'minidon-rust' : 'minidon-context';
    const text = git(r === 'minidon-rust' ? rustDir : repo, ['show', `${r === 'minidon-rust' ? rustHead : c.sha}:${rel}`], { allowFail: true }) ?? '';
    const line = text.split('\n').findIndex((l) => l.includes(n.focus.find)) + 1;
    if (!line) warn(`step ${num}: "${n.focus.find}" not found in ${rel}`);
    if (!stage.artifacts.some((a) => a.path === rel)) warn(`step ${num}: focus file ${rel} is not one of its artifacts`);
    stage.focus = { repo: r, path: rel, find: n.focus.find, line: line || 1 };
  }
  pendingChores = [];
  stages.push(stage);
}

// ---------------------------------------------------------------- late ledger moves

// A ledger move committed with a later step (ledgerTo) goes back to the step whose work it ends.
const byNum = Object.fromEntries(stages.map((s) => [s.num, s]));
for (const s of stages) {
  for (const [to, target] of Object.entries(N.steps[s.num]?.ledgerTo ?? {})) {
    byNum[target].commands.push(...s.commands.filter((x) => x.to === to));
    s.commands = s.commands.filter((x) => x.to !== to);
  }
}
const idOf = (num) => byNum[num]?.id;

// ---------------------------------------------------------------- facts for the last page

const headRuns = runsAt(git(repo, ['rev-parse', ref]).trim());
const facts = {
  contextRemote: (git(repo, ['remote', 'get-url', 'origin'], { allowFail: true }) ?? '').trim() || null,
  finalState: headRuns[N.RUN_ID]?.state ?? null,
  pr: prRecord ? {
    title: prRecord.pullRequest?.title, url: prRecord.pullRequest?.url ?? null, state: prRecord.pullRequest?.state,
    base: prRecord.pullRequest?.base, head: prRecord.pullRequest?.head, range: prRecord.commitRange?.range,
    commits: prRecord.commitRange?.commits, files: prRecord.diffSummary?.filesChanged, insertions: prRecord.diffSummary?.insertions,
    merged: prRecord.merged === true, opened: prRecord.hostedPr?.opened === true,
  } : null,
  rust: hasRust ? {
    path: rustDir,
    branch: rustHeadRef === 'HEAD' ? git(rustDir, ['rev-parse', '--abbrev-ref', 'HEAD']).trim() : rustHeadRef,
    base: rustBaseRef,
    remoteUrl: (git(rustDir, ['remote', 'get-url', 'origin'], { allowFail: true }) ?? '').trim() || null,
    branches: git(rustDir, ['branch', '--format=%(refname:short)']).trim().split('\n'),
    remote: git(rustDir, ['remote']).trim() || null,
    commits: allRust.length,
    head: rustHead.slice(0, 7),
  } : null,
};

const data = {
  generated: new Date().toISOString(),
  repo: { path: repo, ref, branch: ref === 'HEAD' ? git(repo, ['rev-parse', '--abbrev-ref', 'HEAD']).trim() : ref, head: git(repo, ['rev-parse', '--short', ref]).trim() },
  rustRepo: hasRust ? { path: rustDir, head: rustHead.slice(0, 7) } : null,
  intro: N.intro, outro: N.outro, glossary: N.glossary, gatePlain: N.gatePlain, stateWords: N.stateWords, agentRoles: N.agentRoles, chapters: N.chapters.map(({ steps, loop, ...c }) => ({ ...c, loop: loop && { ...loop, nodes: loop.nodes.map(([num, label]) => ({ id: idOf(num), label })) } })), scopes: N.scopes, tracks: N.tracks, gateNames: N.gateNames,
  stages, facts, warnings, paths: allPaths,
  rustTree: hasRust ? {
    paths: git(rustDir, ['ls-tree', '-r', '--name-only', rustHead]).trim().split('\n').filter(Boolean),
    content: Object.fromEntries(git(rustDir, ['ls-tree', '-r', '--name-only', rustHead]).trim().split('\n').filter((f) => f && !/(\.lock|\.png|\.ico)$/.test(f))
      .map((f) => [f, git(rustDir, ['show', `${rustHead}:${f}`], { allowFail: true })]).filter(([, t]) => t != null && t.length < 120000)),
    status: Object.fromEntries((rustBaseRef ? git(rustDir, ['diff', '--no-renames', '--name-status', rustBaseRef, rustHead]) : '').trim().split('\n').filter(Boolean).map((l) => l.split('\t').reverse())),
  } : null,
};

// ---------------------------------------------------------------- write

const inlineJs = (s) => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Millwright walkthrough: minidon to Rust</title>
<style>${readFileSync(path.join(here, 'app.css'), 'utf8')}</style>
</head>
<body>
<div id="app"></div>
<script id="wt-data" type="application/json">${json}</script>
<script>${inlineJs(readFileSync(path.join(here, 'vendor/mermaid.min.js'), 'utf8'))}</script>
<script>${inlineJs(readFileSync(path.join(here, 'app.js'), 'utf8'))}</script>
</body>
</html>
`;
writeFileSync(path.join(here, 'index.html'), html);
console.log(`wrote walkthrough/index.html: ${stages.length} steps from ${ref}@${data.repo.head}, ${allRust.length} Rust commits, ${(html.length / 1e6).toFixed(1)} MB, ${warnings.length} warning(s)`);
