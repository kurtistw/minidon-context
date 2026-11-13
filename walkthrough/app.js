/* Millwright walkthrough page. Reads the data that build.mjs embedded and renders it. */
(() => {
  'use strict';

  const D = JSON.parse(document.getElementById('wt-data').textContent);
  const stages = D.stages;
  const pages = [{ id: 'start', type: 'start' }, ...stages.map((s, i) => ({ id: s.id, type: 'stage', stage: s, index: i })), { id: 'end', type: 'end' }];
  const byId = Object.fromEntries(pages.map((p, i) => [p.id, i]));
  const app = document.getElementById('app');

  const state = { cmdOpen: new Set(), vsOpen: new Set(), detail: false, page: 0, layer: 'story', artifact: {}, artView: {}, openFiles: new Set(), overlay: null, ide: {}, scrollTree: false, treeMode: 'changes' };

  // ---------------------------------------------------------------- helpers

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const icon = {
    person: '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="5" r="3"/><path d="M2 15c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5z"/></svg>',
    agent: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="4.5" width="11" height="9" rx="2"/><path d="M8 1.5v3M5.5 9h.01M10.5 9h.01" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3.5 8.5l3 3 6-7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pause: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><rect x="4" y="3" width="3" height="10" rx="1"/><rect x="9" y="3" width="3" height="10" rx="1"/></svg>',
    chev: (o) => `<svg class="cv" viewBox="0 0 16 16" width="10" height="10" style="transform:rotate(${o ? 90 : 0}deg)"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
    folder: '<svg class="fi" viewBox="0 0 16 16" width="13" height="13"><path d="M1.5 3.5h4l1.5 1.5h7.5v8h-13z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    file: '<svg class="fi" viewBox="0 0 16 16" width="13" height="13"><path d="M3.5 1.5h6l3 3v10h-9z M9.5 1.5v3h3" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    commit: '<svg viewBox="0 0 16 16" width="13" height="13"><circle cx="8" cy="8" r="2.6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M1 8h4.4M10.6 8H15" stroke="currentColor" stroke-width="1.3"/></svg>',
    info: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.2v4M8 4.9v.1" stroke-linecap="round"/></svg>',
    mark: '<svg viewBox="0 0 22 22" width="20" height="20"><rect x="1.5" y="1.5" width="19" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6 15.5V6.5l5 5 5-5v9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  };
  const isHuman = (w) => w === 'human' || w === 'kurtis' || /@/.test(w);
  const relPath = (a) => a.repo === 'minidon-rust' ? `file://${D.rustRepo.path}/${a.path}` : `../${a.path}`;

  function stateOf(s) {
    const t = D.tracks[s.track];
    const st = s.runState?.state;
    return t.parallel?.[st] ?? st;
  }


  // ---------------------------------------------------------------- frame

  const pad2 = (n) => String(n).padStart(2, '0');

  function frame() {
    app.innerHTML = `
      <header class="top">
        <div class="brand" data-go="start"><span class="mark">${icon.mark}</span><span class="word">Millwright</span></div>
        <div class="crumbs" id="crumbs"></div>
        <div class="spacer"></div>
        <button class="tbtn" data-act="steps" title="Every step on one page. Press G.">All steps</button>
        <button class="tbtn" data-act="detail" id="detailbtn" title="Show or hide the file tree, commits and commands"><span>Full detail</span></button>
        <button class="tbtn q" data-act="help" title="How this page works">?</button>
      </header>
      <nav class="navA" id="timeline"></nav>
      <main class="main" id="main"></main>
      <footer class="foot" id="foot"></footer>`;
  }

  function renderCrumbs() {
    document.getElementById('crumbs').innerHTML = `<span>minidon to Rust</span>${state.detail ? `<span class="dot">·</span><span class="mono">built from minidon-context @ ${esc(D.repo.head)}</span>` : ''}`;
    const b = document.getElementById('detailbtn');
    if (b) { b.classList.toggle('on', state.detail); b.firstElementChild.textContent = state.detail ? 'Hide full detail' : 'Full detail'; }
  }

  // Two rows. The first groups the nine stages into three acts, with a person icon for each human
  // gate in a stage. The second shows the current stage: one tick per step, and the steps either side.
  function renderTimeline() {
    const cur = pages[state.page];
    const curStage = cur.type === 'stage' ? cur.stage : null;
    const curIdx = curStage ? stages.indexOf(curStage) : cur.type === 'end' ? stages.length : -1;
    const dia = (on, st) => `<i class="dia ${on ? 'f' : ''}" data-tip="Human gate ${ORDER.indexOf(st) + 1} of ${ORDER.length}${on ? ' · approved' : ''}|${esc(D.gatePlain[st].q)}"></i>`;
    const chip = (ci) => {
      const c = D.chapters[ci];
      const ss = stages.filter((s) => s.chapter === ci);
      if (!ss.length) return '';
      const reached = ss.filter((s) => stages.indexOf(s) <= curIdx).length;
      const st = curStage?.chapter === ci ? 'cur' : reached === ss.length ? 'done' : '';
      const ds = ss.filter((s) => s.kind === 'gate').map((s) => dia(stages.indexOf(s) <= curIdx, s.gate.state)).join('');
      return `<button class="c ${st}" data-go="${ss[0].id}" data-tip="Stage ${ci + 1} · steps ${esc(ss[0].num)} to ${esc(ss[ss.length - 1].num)}|${esc(c.blurb)}">${esc(c.short ?? c.title)}${ds ? `<span class="ds">${ds}</span>` : ''}</button>`;
    };
    const acts = [];
    D.chapters.forEach((c, ci) => {
      const a = acts[acts.length - 1];
      if (a && a.title === c.act) a.chs.push(ci); else acts.push({ title: c.act, chs: [ci] });
    });
    const end = `<button class="c ${cur.type === 'end' ? 'cur' : ''}" data-go="end" data-tip="Where the run ends|Two human approvals are still ahead: merging the pull request, then the release.">Where it ends<span class="ds">${dia(false, 'MERGE')}${dia(false, 'GATE_C')}</span></button>`;
    const r1 = acts.map((a, k) => `<div class="act"><span class="al">${esc(a.title)}</span><div class="chs">${a.chs.map(chip).join('')}${k === acts.length - 1 ? end : ''}</div></div>`).join('');

    let r2;
    if (curStage) {
      const ss = stages.filter((s) => s.chapter === curStage.chapter);
      const at = ss.indexOf(curStage) + 1;
      const ticks = ss.map((s) => {
        const i = stages.indexOf(s);
        const cls = i === curIdx ? 'cur' : i < curIdx ? 'past' : '';
        return `<button class="tk ${cls}${s.kind === 'gate' ? ' g' : ''}" data-go="${s.id}" data-tip="Step ${esc(s.num)}${s.kind === 'gate' ? ' · human gate' : ''}|${esc(s.title)}"><i></i><span>${esc(s.num)}</span></button>`;
      }).join('');
      const p = stages[curIdx - 1], n = stages[curIdx + 1];
      r2 = `<span class="lab"><b>${esc(D.chapters[curStage.chapter].title)}</b> · step ${at} of ${ss.length}</span><span class="ticks">${ticks}</span><span class="spacer"></span>
        <span class="pn">${p ? `<button data-go="${p.id}">← <b>${esc(p.num)}</b> ${esc(p.title)}</button>` : '<button data-go="start">← Start</button>'}<span class="dot">·</span>${n ? `<button data-go="${n.id}"><b>${esc(n.num)}</b> ${esc(n.title)} →</button>` : '<button data-go="end">Where it ends →</button>'}</span>`;
    } else if (cur.type === 'start') {
      r2 = '<span class="lab"><b>Start here</b> · press → or pick any stage above</span>';
    } else {
      r2 = `<span class="lab"><b>Where it ends</b> · after step ${esc(stages[stages.length - 1].num)}</span><span class="hint">The run stops here. A person has to open the pull request, review it and merge it.</span>`;
    }
    document.getElementById('timeline').innerHTML = `<div class="r1">${r1}<span class="spacer"></span>${cur.type === 'start' ? '' : gateCount(cur)}</div><div class="r2">${r2}</div>`;
    renderCrumbs();
  }

  function renderFoot() {
    const p = pages[state.page];
    const prev = pages[state.page - 1];
    const next = pages[state.page + 1];
    const label = (x) => x.type === 'start' ? ['', 'Start'] : x.type === 'end' ? ['', 'Where the run ends'] : [x.stage.num, x.stage.title];
    const btn = (x, dir) => {
      if (!x) return '<span class="nav empty"></span>';
      const [n, t] = label(x);
      return `<button class="nav ${dir}" data-go="${x.id}">${dir === 'prev' ? '← ' : ''}${n ? `<b>${esc(n)}</b> ` : ''}${esc(t)}${dir === 'next' ? ' →' : ''}</button>`;
    };
    let mid = '<span class="mid"></span>';
    if (p.type === 'stage' && state.detail) {
      const s = p.stage;
      mid = `<span class="commit" title="The git commit this step made in minidon-context"><span class="cl">workspace commit</span><code class="sha">${esc(s.commit.short)}</code><span class="cmsg">${esc(s.subject)}</span><button class="mini" data-copy="git checkout ${esc(s.commit.short)}">Copy checkout</button></span>`;
    }
    document.getElementById('foot').innerHTML = `${btn(prev, 'prev')}${mid}${btn(next, 'next')}`;
  }

  // ---------------------------------------------------------------- plain language

  // Highlights the first use of each glossary word in a block of text; hovering shows the definition.
  function gloss(text, used = new Set()) {
    let html = esc(text);
    const tokens = [];
    for (const g of D.glossary) {
      if (used.has(g.term)) continue;
      for (const w of g.words) {
        const cs = w === w.toUpperCase() ? '' : 'i';
        const re = new RegExp(`\\b(${w.replace(/ /g, '\\s')})\\b`, cs);
        if (re.test(html)) {
          html = html.replace(re, (m) => { tokens.push(`<span class="gl" data-def="${esc(g.def)}" data-term="${esc(g.term)}">${m}</span>`); return `\u0000${tokens.length - 1}\u0000`; });
          used.add(g.term);
          break;
        }
      }
    }
    return html.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[+i]);
  }

  const plainState = (st) => D.stateWords[st] ?? st;

  function checkpoints(index, runState) {
    const order = ['BASELINE_REVIEW', 'RESEARCH_REVIEW', 'PRD_REVIEW', 'READY_FOR_DEV', 'GATE_A', 'GATE_B', 'MERGE', 'GATE_C'];
    const passed = {};
    stages.slice(0, index + 1).forEach((s) => { if (s.gate) passed[s.gate.state] = s.gate.ts; });
    const cur = runState?.state;
    const letter = {};
    const items = order.map((g) => {
      const st = passed[g] ? 'passed' : g === cur || (g === 'MERGE' && cur === 'PR_RAISED') ? 'waiting' : 'next';
      const sub = st === 'passed' ? 'approved' : st === 'waiting' ? (g === 'MERGE' && index < stages.length - 1 ? 'next up' : 'waiting now') : 'not yet';
      return `<li class="cp ${st} " data-def="${esc(D.gatePlain[g].q)}" data-term="${esc(D.gatePlain[g].name)}"><i></i><b class="serif">${esc(D.gatePlain[g].name)}</b>${letter[g] ? `<span class="label sm faint">${letter[g]}</span>` : ''}<span class="label sm">${sub}</span></li>`;
    }).join('');
    const n = order.filter((g) => passed[g]).length;
    const now = runState ? plainState(runState.state) : 'Workspace set up. No run has started yet.';
    return `<div class="cps">
      <div class="cps-head"><span class="label">The human gates</span><span class="label">Human gates: ${n} of ${order.length} passed</span></div>
      <div class="cps-key label sm faint"><i class="dia"></i> a person must approve here. <i class="dia f"></i> approved. Agents cannot pass these.</div>
      <ol class="cps-row">${items}</ol>
      <div class="now"><span class="label">Right now</span><span class="nw">${esc(now)}</span>${runState ? `<code title="Millwright's name for this state">${esc(runState.state)}</code>` : ''}</div>
    </div>`;
  }

  // ---------------------------------------------------------------- the repo panel

  // The panel on the right is the repository as it was right after this step: its file tree, a
  // file, the commands that were run, and the diff. New files are green (A), changed ones yellow (M).
  const rustFiles = {};
  stages.forEach((s) => s.rust?.commits?.forEach((c) => c.files.forEach((f) => { rustFiles[f.path] = { ...f, commit: c.short }; })));
  const statusWord = { A: 'new', M: 'changed', D: 'deleted' };

  function treeData(s, repo) {
    if (repo === 'minidon-rust') return { paths: D.rustTree.paths, status: D.rustTree.status, at: D.facts.rust?.head ?? '' };
    const status = Object.fromEntries(s.files.filter((f) => !f.path.startsWith('walkthrough/')).map((f) => [f.path, f.status]));
    const paths = s.tree.map((i) => D.paths[i]);
    for (const [p, st] of Object.entries(status)) if (st === 'D') paths.push(p);
    return { paths, status, at: s.commit.short };
  }

  function defaultSel(s) {
    if (s.focus) return { repo: s.focus.repo, path: s.focus.path };
    const src = s.gate?.source && s.artifacts.find((x) => x.path === s.gate.source);
    const a = src ?? s.artifacts.find((x) => x.changed) ?? s.artifacts[0];
    if (a) return { repo: a.repo, path: a.path };
    const f = s.files.find((x) => !x.skipped && x.status !== 'D' && !x.path.endsWith('ledger.jsonl')) ?? s.files[0];
    return f ? { repo: 'minidon-context', path: f.path } : null;
  }

  function ideState(s) {
    if (!state.ide[s.id]) {
      const sel = defaultSel(s);
      state.ide[s.id] = { repo: s.rust?.commits?.length && D.rustTree ? 'minidon-rust' : 'minidon-context', sel, tab: sel ? 'file' : 'terminal', open: {} };
      if (s.rust?.commits?.length && D.rustTree) state.ide[s.id].sel = { repo: 'minidon-rust', path: 'src/accounts/validate.rs' };
    }
    return state.ide[s.id];
  }

  function buildTree(paths, status) {
    const root = { dirs: new Map(), files: [], chg: 0, add: 0 };
    for (const p of paths) {
      const parts = p.split('/');
      let n = root;
      const st = status[p];
      const bump = (x) => { if (st) x.chg++; if (st === 'A') x.add++; };
      bump(n);
      for (const d of parts.slice(0, -1)) {
        if (!n.dirs.has(d)) n.dirs.set(d, { dirs: new Map(), files: [], chg: 0, add: 0 });
        n = n.dirs.get(d);
        bump(n);
      }
      n.files.push({ name: parts[parts.length - 1], path: p, st });
    }
    return root;
  }

  function treeRows(node, depth, prefix, st, status) {
    let out = '';
    const dirs = [...node.dirs.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (let [name, d] of dirs) {
      // Show single-folder chains on one row, as editors do: runs/REBUILD-MINIDON.
      while (d.files.length === 0 && d.dirs.size === 1) { const [n2, d2] = [...d.dirs.entries()][0]; name += `/${n2}`; d = d2; }
      const key = `${prefix}${name}`;
      const auto = d.chg > 0 && !/(^|\/)(history|graph|target)$/.test(name) && (depth <= 1 || d.chg <= 30);
      const open = st.open[key] ?? auto;
      const badge = !open && d.add ? `<span class="cnt">+${d.add}</span>` : !open && d.chg ? `<span class="cnt m">${d.chg} changed</span>` : '';
      out += `<div class="tr dir${d.chg ? ' hasch' : ''}" data-tree="${esc(key)}" data-open="${open ? 1 : 0}" style="--d:${depth}">${icon.chev(open)}${icon.folder}<span class="tn">${esc(name)}</span>${badge}</div>`;
      if (open) out += treeRows(d, depth + 1, `${key}/`, st, status);
    }
    for (const f of node.files.sort((a, b) => a.name.localeCompare(b.name))) {
      const cls = f.st === 'A' ? 'new' : f.st === 'M' ? 'mod' : f.st === 'D' ? 'del' : '';
      const sel = st.sel && st.sel.path === f.path && st.sel.repo === st.repo ? ' sel' : '';
      out += `<div class="tr file ${cls}${sel}" data-pick="${esc(f.path)}" style="--d:${depth}" title="${esc(f.path)}"><span class="cv"></span>${icon.file}<span class="tn">${esc(f.name)}</span>${f.st ? `<span class="m ${cls}">${f.st}</span>` : ''}</div>`;
    }
    return out;
  }

  // The documents a person reads in this step: what it wrote, or on an approval step, what was approved.
  function reviewDocs(s) {
    return s.artifacts.filter((x) => x.repo === 'minidon-context' && (s.kind === 'gate' || x.changed));
  }

  function reviewRows(s, st) {
    const docs = reviewDocs(s);
    if (!docs.length) return '';
    const gate = s.kind === 'gate';
    return `<div class="grp">${gate ? 'What was approved' : 'For review'}</div>${docs.map((x) => {
      const sel = st.sel && st.sel.path === x.path && st.sel.repo === 'minidon-context' ? ' sel' : '';
      const badge = x.changed ? `<span class="m ${x.changed === 'A' ? 'new' : 'mod'}">${x.changed}</span>` : '';
      return `<div class="tr rv${sel}${x.changed === 'A' ? ' new' : x.changed === 'M' ? ' mod' : ''}" data-pick="${esc(x.path)}" title="${esc(x.path)}">${icon.file}<span class="tn">${esc(prettyName(x))}</span><span class="dir">${esc(x.path.split('/').slice(-3, -1).join('/'))}</span>${badge}</div>`;
    }).join('')}`;
  }

  function ideHtml(s) {
    const st = ideState(s);
    if (!state.detail) {
      if (st.tab !== 'file') st.tab = 'file';
      const chips = s.artifacts.map((a) => `<button class="${st.sel && st.sel.repo === a.repo && st.sel.path === a.path ? 'on' : ''}" data-ide-open="${esc(a.repo)}|${esc(a.path)}" title="${esc(a.path)}">${esc(plainName(a))}</button>`).join('');
      return `<div class="pane bt learn">
        <div class="ph chips"><span class="lbl">${s.kind === 'gate' ? 'What was approved' : s.artifacts.some((a) => a.changed) ? 'What this step wrote' : 'What this step used'}</span>${chips}<span class="spacer"></span>${st.sel ? vscodeLink(s, st) : ''}</div>
        <div class="bt-body">${preview(s, st)}</div>
      </div>`;
    }
    const hasRust = !!(s.rust && D.rustTree);
    if (!hasRust) st.repo = 'minidon-context';
    const t = treeData(s, st.repo);
    const vals = Object.values(t.status);
    const nNew = vals.filter((x) => x === 'A').length;
    const nMod = vals.filter((x) => x === 'M').length;
    const nDel = vals.filter((x) => x === 'D').length;
    const i = stages.indexOf(s);
    const before = i > 0 ? stages[i - 1].tree.length : 0;
    const count = st.repo === 'minidon-rust' ? t.paths.length : s.tree.length;
    const repoTabs = hasRust
      ? ['minidon-context', 'minidon-rust'].map((r) => `<button class="${st.repo === r ? 'on' : ''}" data-repo="${r}">${r}</button>`).join('')
      : '<span class="on">minidon-context</span>';
    const allChanged = vals.length === count;
    const mode = allChanged ? 'all' : state.treeMode;
    const toggle = allChanged
      ? `<span class="meta">all ${count} files are new</span>`
      : `<span class="seg tm">${[['changes', `Changed ${vals.length}`], ['all', `All ${count}`]].map(([k, l]) => `<button class="${mode === k ? 'on' : ''}" data-tree-mode="${k}">${l}</button>`).join('')}</span>`;
    const legend = `${nNew ? `<span class="add"><b>A</b> ${nNew} new</span>` : ''}${nMod ? `<span class="modt"><b>M</b> ${nMod} changed</span>` : ''}${nDel ? `<span class="delt"><b>D</b> ${nDel} deleted</span>` : ''}`;
    const growth = st.repo === 'minidon-rust'
      ? `${legend}<span>on branch ${esc(D.facts.rust?.branch ?? '')}, not merged</span><span class="spacer"></span><code title="The head of the Rust branch, not the workspace commit">branch head ${esc(t.at)}</code>`
      : `${legend}<span>${before} → ${count} files</span>`;

    let tree;
    if (mode === 'changes' && st.repo === 'minidon-context') {
      const changed = t.paths.filter((p) => t.status[p]);
      const machine = s.kind === 'gate' ? 'The run record' : 'Every file this step changed';
      tree = reviewRows(s, st) + `<div class="grp">${machine} <span>${changed.length}</span></div>` + treeRows(buildTree(changed, t.status), 0, `${st.repo}:changes:`, st, t.status);
    } else {
      tree = treeRows(buildTree(t.paths, t.status), 0, `${st.repo}:all:`, st, t.status);
    }

    const f = selFile(s, st);
    const canDiff = !!(st.sel?.repo === 'minidon-context' && f && f.status === 'M' && (f.diff || f.skipped));
    if (st.tab === 'diff' && !canDiff) st.tab = 'file';
    const tabName = st.sel ? st.sel.path.split('/').pop() : 'File';
    const tabs = [['file', tabName], ['terminal', 'Terminal'], ...(canDiff ? [['diff', 'What changed']] : [])].map(([k, l]) => `<button class="${st.tab === k ? 'on' : ''}" data-ide-tab="${k}">${esc(l)}</button>`).join('');
    const body = st.tab === 'terminal' ? terminal(s) : st.tab === 'diff' ? diffPane(s, st) : preview(s, st);
    return `<div class="pane ex">
        <div class="ph">${repoTabs}<span class="spacer"></span>${toggle}</div>
        <div class="ex-body" id="exbody">${tree}</div>
        <div class="tfoot">${growth}</div>
      </div>
      <div class="pane bt">
        <div class="ph">${tabs}<span class="spacer"></span>${st.tab === 'file' && st.sel ? vscodeLink(s, st) : ''}${st.tab === 'file' && st.sel ? `<button class="mini" data-copy="git show ${esc(st.repo === 'minidon-rust' ? D.facts.rust?.head : s.commit.short)}:${esc(st.sel.path)}" title="Copy a git command that prints this file as it was">Copy git show</button>` : ''}</div>
        <div class="bt-body">${body}</div>
      </div>`;
  }

  // Opens the whole repository in VS Code first, so the explorer shows every file. Once that
  // repository is open, the same button opens this file in that window, at the passage this step is
  // about. It is the file in your checkout now, which may be newer than this step.
  // windowId=_blank: without it VS Code reuses the last window and swaps its folder, so opening
  // minidon-rust would replace an open minidon-context window. A file URL lands in its folder's window.
  function vscodeLink(s, st) {
    const root = st.sel.repo === 'minidon-rust' ? D.rustRepo?.path : D.repo.path;
    if (!root) return '';
    if (!state.vsOpen.has(st.sel.repo)) {
      return `<a class="mini vs" data-vs="${esc(st.sel.repo)}" href="vscode://file${encodeURI(root)}?windowId=_blank" title="Opens the whole ${esc(st.sel.repo)} repository in VS Code">Open repo in VS Code</a>`;
    }
    const line = s.focus && s.focus.repo === st.sel.repo && s.focus.path === st.sel.path ? s.focus.line : 1;
    return `<a class="mini vs" href="vscode://file${encodeURI(`${root}/${st.sel.path}`)}:${line}" title="Opens ${esc(st.sel.path)} at line ${line} in the ${esc(st.sel.repo)} window">Open file in VS Code</a>`;
  }


  // A pull request record read as the pull request a reviewer would see, not as JSON.
  function prSummary(a) {
    let j; try { j = JSON.parse(a.text); } catch { return docBody(a); }
    const pr = j.pullRequest ?? {};
    const body = j.description?.body ?? pr.body ?? '';
    const blocks = body.split(/\n\n+/).map((b) => {
      const lines = b.split('\n');
      if (lines.length > 1 && lines.slice(1).every((l) => l.startsWith('- '))) return `<p>${esc(lines[0])}</p><ul>${lines.slice(1).map((l) => `<li>${esc(l.slice(2))}</li>`).join('')}</ul>`;
      return `<p>${esc(b).replace(/\n/g, '<br>')}</p>`;
    }).join('');
    const facts = [pr.head && pr.base ? `${esc(pr.head)} into ${esc(pr.base)}` : '', j.merged ? 'merged' : 'not merged', j.hostedPr?.opened ? 'opened on GitHub' : 'a local record, not opened on GitHub'].filter(Boolean);
    return `<div class="doc"><h1>${esc(pr.title ?? 'Pull request')}</h1><dl class="fm"><dt>Status</dt><dd>${facts.join(' · ')}</dd></dl>${blocks}</div>`;
  }

  function selFile(s, st) {
    if (!st.sel) return null;
    if (st.sel.repo === 'minidon-rust') return rustFiles[st.sel.path] ?? null;
    return s.files.find((f) => f.path === st.sel.path) ?? null;
  }

  function preview(s, st) {
    if (!st.sel) return '<div class="empty">Pick a file in the tree above.</div>';
    const a = s.artifacts.find((x) => x.repo === st.sel.repo && x.path === st.sel.path);
    const f = selFile(s, st);
    const stc = st.sel.repo === 'minidon-rust' ? D.rustTree.status[st.sel.path] : f?.status;
    const stWord = st.sel.repo === 'minidon-rust' ? `${statusWord[stc] ?? 'unchanged'} on ${D.facts.rust?.branch ?? 'the branch'}` : statusWord[stc];
    const isFocus = s.focus && s.focus.repo === st.sel.repo && s.focus.path === st.sel.path;
    const head = `<div class="fpath"><code>${esc(st.sel.path)}</code>${isFocus ? '<span class="st focus">jumped to the part this step is about</span>' : ''}${stc ? `<span class="st ${stc}">${esc(stWord)}</span>` : `<span class="st ref">${s.kind === 'gate' && a ? 'approved in this step' : 'unchanged in this step'}</span>`}</div>`;
    if (a && a.name === 'pr.json' && !state.detail) return head + `<div class="pv">${prSummary(a)}</div>`;
    if (a) return head + `<div class="pv">${docBody(a)}</div>`;
    if (st.sel.repo === 'minidon-rust' && D.rustTree.content[st.sel.path] != null) return head + `<div class="pv code-pv">${codeView(D.rustTree.content[st.sel.path])}</div>`;
    if (f?.skipped) return head + `<div class="empty">Not shown here: ${esc(f.skipped)}.</div>`;
    if (f?.diff && f.status === 'A') {
      const lines = f.diff.split('\n').filter((l) => l.startsWith('+')).map((l) => l.slice(1)).join('\n');
      return head + `<div class="pv code-pv">${codeView(lines)}${f.truncated ? `<div class="more">${f.truncated} more lines not shown.</div>` : ''}</div>`;
    }
    if (f?.diff) return head + `<div class="diff">${diffRows(f)}</div>`;
    return head + '<div class="empty">This file did not change in this step. Copy the git show command to see it as it was.</div>';
  }

  function diffPane(s, st) {
    const f = selFile(s, st);
    if (f && (f.diff || f.skipped)) return `<div class="fpath"><code>${esc(st.sel.path)}</code><span class="plus">+${f.add}</span><span class="minus">−${f.del}</span></div><div class="diff">${diffRows(f)}</div>`;
    return `<div class="fpath"><span>Every file this step changed. Click one to open its diff.</span></div>${fileList(s.files, s.id)}`;
  }

  function terminal(s) {
    const lines = [`<div class="c"># minidon-context, the commands behind step ${esc(s.num)}</div>`];
    const agents = s.who.filter((w) => !isHuman(w));
    const made = s.files.filter((f) => f.status === 'A' && !/\/history\//.test(f.path)).length;
    const kept = s.files.filter((f) => f.status === 'A' && /\/history\//.test(f.path)).length;
    if (agents.length && made) lines.push(`<div class="c" style="margin-top:8px"># ${esc(agents.join(', '))} wrote ${made} new file${made > 1 ? 's' : ''} in an agent session${kept ? `, and Millwright kept ${kept} earlier version${kept > 1 ? 's' : ''} in history/` : ''}; the CLI records the result</div>`);
    const cmd = (c) => `<div class="tl"><span class="pr">$</span> ${esc(c)}<button class="tcopy" data-copy="${esc(c)}" title="Copy">copy</button></div>`;
    for (const x of s.commands) {
      lines.push(cmd(x.cmd));
      if (x.source === 'ledger') {
        const moved = x.from === x.to ? `stays at ${x.to}` : `${x.from} → ${x.to}`;
        lines.push(`<div class="to ok">✓ ${esc(moved)}${x.checks?.length ? ` · ${x.checks.length} check${x.checks.length > 1 ? 's' : ''} passed` : ''}</div>`);
        lines.push(`<div class="to dim">ledger #${esc(x.seq)} · ${esc(x.actor ?? '')}</div>`);
      } else if (x.source === 'review') {
        lines.push(`<div class="to dim">recorded in the baseline review · ${esc(x.actor ?? '')}</div>`);
      } else {
        lines.push('<div class="to dim">from the run notes</div>');
      }
    }
    if (s.rust?.commits?.length) {
      lines.push(cmd(`git -C ../minidon-rust log --oneline ${D.facts.rust?.base ?? 'main'}..${D.facts.rust?.branch ?? 'HEAD'}`));
      s.rust.commits.slice(0, 8).forEach((c) => lines.push(`<div class="to"><span class="sha">${esc(c.short)}</span> ${esc(c.subject)}</div>`));
      if (s.rust.commits.length > 8) lines.push(`<div class="to dim">… ${s.rust.commits.length - 8} more commits</div>`);
    }
    const add = s.files.reduce((n, f) => n + (f.add ?? 0), 0);
    const del = s.files.reduce((n, f) => n + (f.del ?? 0), 0);
    lines.push(cmd(`git commit -m "${s.subject}"`));
    lines.push(`<div class="to dim">[${esc(D.repo.branch)} ${esc(s.commit.short)}] ${s.files.length} file${s.files.length === 1 ? '' : 's'} changed, ${add} insertions(+), ${del} deletions(-)</div>`);
    return `<div class="tty">${lines.join('')}</div>`;
  }



  // ---------------------------------------------------------------- pages

  function renderStart() {
    const first = stages[0];
    return `<div class="wrap start-s">
      <h1 class="display hero-title">A legacy rebuild, <em>run through</em> Millwright</h1>
      <p class="start-lede">AI agents rebuilt a small Python app in Rust. A person approved every key decision.</p>
      <ol class="start-3">
        <li><span class="n">1</span>Agents do the work.</li>
        <li><span class="n">2</span>A person decides at every gate. Agents cannot pass one.</li>
        <li><span class="n">3</span>Every step is a real commit you can open.</li>
      </ol>
      <button class="cta" data-go="${first.id}">Start →</button>
      ${state.detail ? startMore() : ''}
    </div>`;
  }

  // The rest of the start page (repositories, words, stages), only with full detail on.
  function startMore() {
    const i = D.intro;
    return `<div class="start-more">
      <section class="sec"><div class="label">Three repositories</div>
        <div class="cols3">${i.cast.map((c, k) => `<div class="col"><div class="label sm">${pad2(k + 1)} · ${esc(c.role)}</div><div class="repo-n">${esc(c.name)}</div><p>${esc(c.text)}</p></div>`).join('')}</div>
      </section>


      <section class="sec"><div class="label">Words you will hear</div>
        <dl class="gloss">${D.glossary.map((g) => `<div><dt class="serif">${esc(g.term)}</dt><dd>${esc(g.def)}</dd></div>`).join('')}</dl>
        <p class="faint small">On every page, words with a dotted underline show this definition when you point at them.</p>
      </section>

      <section class="sec"><div class="label">The nine stages</div>
        <div class="rows">${D.chapters.map((c, ci) => {
          const ss = stages.filter((x) => x.chapter === ci);
          const g = ss.filter((x) => x.kind === 'gate').length;
          return `<button class="row" data-go="${ss[0]?.id}"><span class="row-l label">Stage ${pad2(ci + 1)}<br><span class="faint">Steps ${ss[0]?.num}–${ss[ss.length - 1]?.num}${g ? ` · ${g} approval${g > 1 ? 's' : ''}` : ''}</span></span><span class="row-r"><span class="serif row-t">${esc(c.title)}</span><span class="row-b">${esc(c.blurb)}</span></span></button>`;
        }).join('')}</div>
      </section>

      <section class="sec"><div class="label">Getting around</div>
        <div class="howto">
          <div><b class="serif">The bar at the top</b><p>The nine stages, each with how far it has got. Under it, the steps of the stage you are in. Each <i class="dia f"></i> is an approval by a person. Click anything to jump there.</p></div>
          <div><b class="serif">The document on the right</b><p>Each step opens the document that matters, at the passage that matters. <b>Full detail</b> adds the file tree, the commits and the commands.</p></div>
          <div><b class="serif">Go deeper</b><p><b>Documents</b>: every document a step wrote, with where each fact comes from. With full detail on, <b>Commands</b> has the commit and commands to replay it.</p></div>
          <div><b class="serif">The ? button</b><p>At the top right: how the page works and the keyboard shortcuts.</p></div>
        </div>
      </section>
    </div>`;
  }

  function renderEnd() {
    const o = D.outro;
    const f = D.facts;
    const last = stages[stages.length - 1];
    const caps = ['Accounts', 'Following', 'Posting', 'Timelines', 'Notifications', 'Moderation'];
    const r = f.rust;
    return `<div class="wrap">
      <div class="label">After step ${esc(last.num)} <span class="sl">//</span> <span class="accent">not finished yet</span></div>
      <h1 class="display">${esc(o.title)}</h1>
      <div class="lede">${o.story.map((p) => `<p>${gloss(p)}</p>`).join('')}</div>

      <div class="panel">
        <div class="label inv">Next decision, by a person</div>
        <div class="panel-t serif">Open, review and merge the pull request</div>
        <p>Agents may write a pull request but are never allowed to merge it. A person reads it and merges it. The release approval, the last human gate, comes later, after user testing.</p>
      </div>

      ${checkpoints(stages.length - 1, { state: f.finalState })}

      <section class="sec"><div class="label">The six parts of the rebuild</div>
        <div class="stories">${caps.map((c, k) => `<div class="story-cell ${k === 0 ? 'done' : ''}"><span class="label sm">${k === 0 ? 'Part 1 · built, awaiting merge' : `Part ${k + 1} · not started`}</span><span class="serif">${esc(c)}</span></div>`).join('')}</div>
      </section>

      <section class="sec two">
        <div><div class="label">What the repositories say</div>
          <dl class="kv">
            <dt>Run state</dt><dd>${esc(f.finalState ?? 'unknown')}</dd>
            ${r ? `<dt>Rust branch</dt><dd>${esc(r.branch)} · ${r.commits} commits · head ${esc(r.head)}</dd>
            <dt>Rust remote</dt><dd>${r.remoteUrl ? esc(r.remoteUrl) : 'none'}</dd>` : ''}
            ${f.pr ? `<dt>Pull request</dt><dd>${f.pr.url ? `<a href="${esc(f.pr.url)}" target="_blank" rel="noopener">${esc(f.pr.url)}</a>` : 'written in pr.json, not opened on GitHub yet'}</dd>
            <dt>PR range</dt><dd>${esc(f.pr.head)} into ${esc(f.pr.base)} · ${esc(f.pr.commits)} commits · ${esc(f.pr.files)} files</dd>
            <dt>Merged</dt><dd>${f.pr.merged ? 'yes' : 'no, waiting for a person'}</dd>` : ''}
            <dt>Context remote</dt><dd>${f.contextRemote ? esc(f.contextRemote) : 'none'}</dd>
          </dl>
          <p class="faint small">Read from git when this page was built.</p>
        </div>
        <div><div class="label">Not reached yet</div><ul class="list no">${o.notReached.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><div class="label">Be honest about</div><ul class="list warn">${o.caveats.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><div class="label">What happens next</div><ul class="list next">${o.next.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </section>
    </div>`;
  }

  // The full state machine, for developers (Commands tab).
  function rail(s) {
    const t = D.tracks[s.track];
    const cur = stateOf(s);
    const all = t.groups.flatMap((g) => g.states);
    const ci = all.indexOf(cur);
    const groups = t.groups.map((g) => {
      const n = g.states.length;
      const pos = (k) => (n === 1 ? 0.5 : k / (n - 1));
      const dots = g.states.map((st, k) => {
        const i = all.indexOf(st);
        const cls = ['rd', t.gates.includes(st) ? 'gate' : '', ci >= 0 && i < ci ? 'done' : '', i === ci ? 'cur' : ''].join(' ');
        return `<span class="${cls}" style="left:${pos(k) * 100}%" data-tip="${esc(st)}|${esc(plainState(st))}"></span>`;
      }).join('');
      const labels = g.states.map((st, k) => {
        const isGate = t.gates.includes(st);
        if (!isGate && st !== cur) return '';
        const text = st === cur ? st : D.gatePlain[st]?.name ?? st;
        return `<span class="${st === cur ? 'cur' : 'gate'}" style="left:${pos(k) * 100}%">${esc(text)}</span>`;
      }).join('');
      const doneIn = g.states.filter((st) => all.indexOf(st) < ci).length;
      const lastDone = g.states.includes(cur) ? g.states.indexOf(cur) : doneIn === n ? n - 1 : doneIn > 0 ? doneIn - 1 : -1;
      const fill = lastDone > 0 ? `<span class="fill" style="width:${(lastDone / (n - 1)) * 100}%"></span>` : '';
      return `<div class="rail-group" style="--n:${n}"><div class="label sm">${esc(g.label)}</div><div class="rail-dots"><span class="base"></span>${fill}${dots}</div><div class="rail-labels">${labels}</div></div>`;
    }).join('');
    const head = s.runState
      ? `<span>${esc(t.label)} <b>${esc(s.runState.run)}</b></span><span>State <b class="accent">${esc(s.runState.state)}</b></span>`
      : `<span>${esc(t.label)}</span><span>Not opened yet</span>`;
    return `<div class="rail"><div class="rail-head label">${head}</div><div class="rail-groups">${groups}</div>
      ${!s.runState ? '<div class="faint small">No run yet. The first run starts in step 02.</div>' : ''}</div>`;
  }


  const LAYERS = [
    ['story', 'Story', 'S', 'What happened'],
    ['evidence', 'Documents', 'D', 'What it wrote, as readable pages'],
    ['hood', 'Commands', 'C', 'Commit, commands and every changed file'],
  ];
  const INTROS = {
    evidence: 'The documents this step wrote or used, as readable pages. “Changes in this step” shows exactly what was added.',
    hood: 'The commit and commands, so you can replay this step. Copy a git checkout line, run it, and open the repo in VS Code to see it as it was at this moment.',
  };

  function renderStage(s) {
    return `<div class="stage"><section class="left" id="left">${leftHtml(s)}</section><section class="ide${state.detail ? '' : ' learn'}" id="ide">${ideHtml(s)}</section></div>`;
  }

  // ---------------------------------------------------------------- the story column
  const ORDER = ['BASELINE_REVIEW', 'RESEARCH_REVIEW', 'PRD_REVIEW', 'READY_FOR_DEV', 'GATE_A', 'GATE_B', 'MERGE', 'GATE_C'];

  // Where this step sits: which stage, which step of that stage, which step of the run.
  function where(s) {
    const ss = stages.filter((x) => x.chapter === s.chapter);
    return `Stage ${s.chapter + 1}: ${esc(D.chapters[s.chapter]?.title ?? '')}<span class="sep">·</span>step ${ss.indexOf(s) + 1} of ${ss.length}${scopePill(s)}`;
  }
  // Whether this step works on the whole rebuild or on story 1 only.
  function scopePill(s) {
    const k = D.chapters[s.chapter]?.scope;
    const sc = D.scopes?.[k];
    return sc ? `<span class="scope ${k}" data-tip="${esc(sc.tip)}"><i></i>${esc(sc.label)}</span>` : '';
  }

  // How many of the eight human gates are passed, in words, for the step bar.
  function gateCount(cur) {
    const idx = cur.type === 'stage' ? stages.indexOf(cur.stage) : cur.type === 'end' ? stages.length - 1 : -1;
    const passed = stages.slice(0, idx + 1).filter((x) => x.kind === 'gate').length;
    return `<span class="gcount" data-tip="Human gates|A person must approve at each one. Agents cannot pass a gate.">Human gates <b>${passed} of ${ORDER.length}</b> passed</span>`;
  }

  // The full-detail switch: file tree, commits, commands and source labels. Off by default.
  function toggleDetail() {
    state.detail = !state.detail;
    try { localStorage.setItem('wt-detail', state.detail ? '1' : '0'); } catch {}
    document.body.classList.toggle('detail', state.detail);
    if (!state.detail && state.layer === 'hood') state.layer = 'story';
    render();
  }

  const HOW = [
    ['Agents do the work', 'They read the old code, write the documents, plan and write the new code. Each step says which agent did it.'],
    ['A person decides at every gate', 'There are 8 human gates, from the map to the release. Agents stop at each one and cannot pass it. Only a person can let the run through.'],
    ['Every step is a real commit', `Each of the ${stages.length} steps is one git commit in minidon-context, numbered the same as the step, that you can open, check out, or read in VS Code. Full detail shows the files.`],
  ];

  function nextGate(s) {
    const i = stages.indexOf(s);
    return stages.slice(i + 1).find((x) => x.kind === 'gate') ?? null;
  }





  const nums = (s, n = 2) => s.numbers.length ? `<div class="vb-nums">${s.numbers.slice(0, n).map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : '';
  const moreLinks = () => `<div class="vb-links"><span>Go deeper</span><button data-layer="evidence">Documents</button>${state.detail ? '<button data-layer="hood">Commands</button>' : ''}</div>`;

  // Plain names for what a step read or wrote, so nobody has to decode file names.
  const PLAIN = {
    'millwright.config.yaml': 'Millwright settings', 'CLAUDE.md': 'Agent instructions', 'run.json': 'Run state',
    'ingest-report.json': 'Ingest report', 'baseline-review-report.json': 'Map approval record', 'outcome.json': 'Research questions',
    'inputs.json': 'Input check', 'impact.json': 'Scope of story 1', 'risks.json': 'Risk list', 'estimate.json': 'Time estimate',
    'traceability.json': 'Rule-to-test trace', 'coverage-delta.json': 'Test coverage', 'flake.nix': 'Nix environment',
    'validate.rs': 'Username and password rules (Rust)', 'CRATES.md': 'Approved Rust libraries',
    'transcript-2026-10-01-moderation.md': 'Meeting transcript', 'ADR-001-edit-window.md': 'Old decision record',
    'capability.md': 'Accounts area', 'pr.json': 'Pull request', 'REBUILD-MINIDON.md': 'The ticket', 'ticket.md': 'The ticket, copied into the run',
  };
  function plainName(a) {
    if (a.name === 'pr.json' || a.name === 'plan.md') return `${a.name === 'pr.json' ? 'PR description' : 'Code plan'}: ${a.path.split('/').slice(-2, -1)[0]}`;
    if (PLAIN[a.name]) return PLAIN[a.name];
    return prettyName(a).replace(/:\s*REBUILD-MINIDON\b[^]*$/, '').replace(/\s*\((?:story|RESEARCH)[^)]*\)\s*$/i, '').replace(/^Build log:\s*/, 'Build log, ').trim();
  }

  const fmtK = (n) => n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n);
  // The size of the step, read from git, so it can be checked with git show --stat.
  // One line of proof on every step: the real commit, its size, and a command to see it.
  function proofLine(s) {
    const sum = (fs) => fs.reduce((t, f) => t + (f.add ?? 0), 0);
    const rc = s.rust?.commits ?? [];
    const which = `Real commit <code>${esc(s.commit.short)}</code>`;
    return `<div class="vb-size">${icon.file}<span>${which} · ${s.files.length} files, +${fmtK(sum(s.files))} lines${rc.length ? ` · ${rc.length} commits on <code>story-1-accounts</code>` : ''}</span><button class="mini" data-copy="git show --stat ${esc(s.commit.short)}" title="Copy a git command that lists this commit">Copy git show</button>${state.detail ? '<button data-layer="hood">commands</button>' : '<button data-layer="evidence">all documents</button>'}</div>`;
  }


  // What ran at this step, as the commands themselves. Consecutive runs of the same command are
  // grouped (seven "baseline resolve", six "transition"), with the full lines one click away.
  // Split a command at its flags (outside quotes), so a long one reads as a terminal shows it
  // with line continuations, and nothing is cut off.
  function flags(cmd) {
    const parts = []; let cur = '', q = null;
    for (let k = 0; k < cmd.length; k++) {
      const ch = cmd[k];
      if (q) { if (ch === q) q = null; cur += ch; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (ch === ' ' && cmd.startsWith('--', k + 1) && cur.includes('--')) { parts.push(cur); cur = ''; continue; }
      cur += ch;
    }
    parts.push(cur);
    return parts;
  }
  const shellLines = (cmd) => flags(cmd).map((x, k, xs) => `<span class="${k ? 'ln2' : 'ln1'}">${esc(x)}${k < xs.length - 1 ? ' \\' : ''}</span>`).join('');
  // For a group of the same command: the short flag value that differs, such as "--conflict CF-001 to CF-007".
  function differs(cmds) {
    const vals = cmds.map((c) => Object.fromEntries(flags(c).slice(1).map((x) => { const m = x.match(/^(--\S+)\s+(.*)$/); return m ? [m[1], m[2]] : [x, '']; })));
    const key = Object.keys(vals[0]).find((k) => vals.every((v) => v[k] != null && v[k].length <= 24) && new Set(vals.map((v) => v[k])).size === vals.length);
    return key ? `${esc(key)} ${esc(vals[0][key])} to ${esc(vals[vals.length - 1][key])}` : null;
  }

  // What ran at this step, split by who ran it: the person, or the agents. A run of the same command
  // by several agents (each one "transition" as it finished) shows as one line that opens into a
  // table of who ran it and where it moved the run. The ledger records the actor and the move, not
  // the typed text, so those command lines are rebuilt in the CLAUDE.md form.
  // The slash command Kurtis typed in Claude Code to start this stage's agents. A later agent step
  // of the same stage names the step where it was typed, because nothing new was typed there.
  function launchRow(s) {
    if (s.launch) return `<div class="rb"><div class="rbl"><b>Kurtis</b> typed in Claude Code${s.launch.startsWith('/mw ') ? '<span class="cch"> · /mw starts the right agent for the run\'s current state</span>' : ''}</div><div class="ran cc"><div class="cl"><code><span class="ln1">${esc(s.launch)}</span></code><button class="tcopy" data-copy="${esc(s.launch)}" title="Copy this command">copy</button></div></div></div>`;
    if (s.kind === 'gate' || s.who.some(isHuman)) return '';
    const ss = stages.filter((x) => x.chapter === s.chapter);
    const from = ss.slice(0, ss.indexOf(s)).reverse().find((x) => x.launch);
    return from ? `<div class="rb"><div class="rbl">Nothing new typed. <code class="ccx">${esc(from.launch.split(' ')[0])}</code>, typed at <button class="fc-go" data-go="${from.id}">step ${esc(from.num)}</button>, started this agent too.</div></div>` : '';
  }

  function ranRow(s) {
    const human = s.who.some(isHuman) || s.kind === 'gate';
    const launch = launchRow(s);
    if (!s.commands.length) {
      if (launch) return launch;
      return human ? 'No command. Kurtis wrote his answers into the documents below.' : 'No command. The agent worked in its own session and wrote the files directly. Millwright records them at the next command.';
    }
    const stepAgents = s.who.filter((w) => !isHuman(w));
    const whoOf = (c) => {
      if (c.actorType === 'human' || (c.actor && isHuman(c.actor))) return { person: true, name: 'Kurtis' };
      if (c.actor) return { person: false, name: c.actor };
      if (human) return { person: true, name: 'Kurtis' };
      return { person: false, name: stepAgents.length === 1 ? stepAgents[0] : 'the agents' };
    };
    // The command without its flags and ids: "millwright research waive GAP-003 --reason ..." is "millwright research waive".
    const verb = (c) => c.split(/\s+/).filter((w, k, ws) => !ws.slice(0, k + 1).some((x) => x.startsWith('--')) && !/[A-Z0-9]/.test(w)).join(' ');
    // Consecutive commands by the person, or by agents, form one block.
    const blocks = [];
    s.commands.forEach((c, i) => {
      const w = whoOf(c);
      const b = blocks[blocks.length - 1];
      if (b && b.person === w.person) b.items.push({ c, w, i }); else blocks.push({ person: w.person, items: [{ c, w, i }] });
    });
    const line = (c) => `<div class="cl"><code>${shellLines(c.cmd)}</code><button class="tcopy" data-copy="${esc(c.cmd)}" title="Copy this command">copy</button></div>`;
    const body = (b) => {
      const groups = [];
      b.items.forEach((x) => {
        const v = verb(x.c.cmd);
        const g = groups[groups.length - 1];
        if (g && g.v === v && v.startsWith('millwright ')) g.items.push(x); else groups.push({ v, items: [x], i: x.i });
      });
      return groups.map((g) => {
        if (g.items.length === 1) return line(g.items[0].c);
        const key = `${s.id}:${g.i}`;
        const open = state.cmdOpen.has(key);
        const names = new Set(g.items.map((x) => x.w.name));
        const head = (what) => `<button class="cgh" data-cmd="${esc(key)}"><code>${esc(g.v)}</code><span>×${g.items.length} · ${what}</span><i>${open ? 'hide' : 'show all'}</i></button>`;
        if (!b.person && names.size > 1) {
          const rows = g.items.map((x) => `<tr><td class="who">${esc(x.w.name)}</td><td>${x.c.from && x.c.to ? `${esc(x.c.from)} → <b>${esc(x.c.to)}</b>` : ''}</td><td><button class="tcopy" data-copy="${esc(x.c.cmd)}" title="Copy this command">copy</button></td></tr>`).join('');
          return `<div class="cg">${head('once per agent')}${open ? `<table class="cgt"><thead><tr><th>Who ran it</th><th>The run moved</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : ''}</div>`;
        }
        const to = g.items.map((x) => x.c.to).filter(Boolean);
        const moves = g.v === 'millwright transition' && new Set(to).size === to.length && to.length === g.items.length;
        const what = moves ? `the run moves ${[g.items[0].c.from, ...to].filter(Boolean).map(esc).join(' → ')}` : differs(g.items.map((x) => x.c.cmd)) ?? `${g.items.length} times`;
        return `<div class="cg">${head(what)}${open ? g.items.map((x) => line(x.c)).join('') : ''}</div>`;
      }).join('');
    };
    const label = (b, k) => {
      if (b.person) return launch && s.launch ? `Then Claude ran, as <b>Kurtis</b>` : `${k ? 'Then ' : ''}<b>Kurtis</b> ran`;
      const names = [...new Set(b.items.map((x) => x.w.name))];
      if (names.length === 1) return `${k ? 'Then ' : ''}<b>${esc(names[0])}</b> ran`;
      return `${k ? 'Then each' : 'Each'} agent ran this as it finished its work`;
    };
    return launch + blocks.map((b, k) => `<div class="rb"><div class="rbl">${label(b, k + (launch ? 1 : 0))}</div><div class="ran">${body(b)}</div></div>`).join('');
  }


  // The step as one card that reads like a sentence: who did it, what they read and wrote, and
  // what happens next. On a gate step: who decided, what they looked at, what they decided.
  function flow(s) {
    const used = s.artifacts.filter((a) => !a.changed);
    // Code first: on the build step the Rust files are what matters, the build logs come after.
    const made = s.artifacts.filter((a) => a.changed).sort((a, b) => (b.repo === 'minidon-rust') - (a.repo === 'minidon-rust'));
    const human = s.kind === 'gate' || s.who.some(isHuman);
    const agents = s.who.filter((w) => !isHuman(w));
    const ng = nextGate(s);
    const chips = (xs) => xs.length ? `<div class="fchips">${xs.map((a) => `<button class="fchip" data-ide-open="${esc(a.repo)}|${esc(a.path)}" title="${esc(a.path)}">${esc(plainName(a))}</button>`).join('')}</div>` : '';
    const row = (k, v) => `<div class="fc-row"><span class="k">${k}</span><div class="v">${v}</div></div>`;
    const go = (x, text) => `<button class="fc-go" data-go="${x.id}">${text} →</button>`;
    let who, rows = '', next;
    if (s.kind === 'gate') {
      const g = s.gate;
      const ev = s.artifacts.filter((a) => a.kind === 'md').length ? s.artifacts.filter((a) => a.kind === 'md') : s.artifacts;
      who = `<div class="fc-who p"><span class="av">${icon.person}</span><b>${esc(g.by === 'kurtis' ? 'Kurtis' : g.by)}</b><span>a person</span></div>`;
      rows += row('Commands', ranRow(s));
      rows += row('Looked at', chips(ev));
      if (g.decided?.length) rows += row('Decided', `<ul>${g.decided.map((d) => `<li>${gloss(d)}</li>`).join('')}</ul>`);
      rows += row('Checked', `${g.checks.length} checks passed${g.checks.includes('policy:gate-requires-human') ? ', including that a person made this decision' : ''}.${g.demo ? ' <span class="faint">Demo run: one person played every role.</span>' : ''}`);
      next = `<div class="fc-next"><span>Unlocks: <b>${esc(plainState(g.to))}</b></span>${ng ? go(ng, `Next gate: ${esc(D.gatePlain[ng.gate.state].name)} approval, step ${esc(ng.num)}`) : '<span>Next: a person opens the pull request, reviews it and merges it.</span>'}</div>`;
    } else {
      const name = human ? 'Kurtis' : agents.length === 1 ? agents[0] : `${agents.length} agents`;
      const role = human ? 'a person' : agents.length === 1 ? 'an agent' : 'agents';
      who = `<div class="fc-who ${human ? 'p' : 'a'}"><span class="av">${human ? icon.person : icon.agent}</span><b>${esc(name)}</b>${agents.length > 1 && !human ? '' : `<span>${role}</span>`}${agents.length > 1 ? `<span class="names">${esc(agents.join(', '))}</span>` : ''}</div>`;
      rows += row('Commands', ranRow(s));
      if (s.reads || used.length) rows += row('Read', `${s.reads ? esc(s.reads) : ''}${chips(used)}`);
      const rc = s.rust?.commits?.length;
      if (s.writes || made.length) rows += row('Wrote', `${s.writes ? `${esc(s.writes)}${rc ? `, in ${rc} commits on story-1-accounts` : ''}` : ''}${chips(made)}`);
      if (s.kind === 'arrive' || s.kind === 'atgate' || (ng && D.chapters[s.chapter]?.loop?.nodes.some((n) => n.id === ng.id))) {
        next = '';
      } else {
        next = `<div class="fc-next"><span>Next human gate</span>${ng ? go(ng, `${esc(D.gatePlain[ng.gate.state].name)} approval, step ${esc(ng.num)}`) : '<b>A person opens the pull request, reviews it and merges it</b>'}</div>`;
      }
    }
    return `<div class="fcard">${who}<div class="fc-body">${rows}</div>${next}</div>`;
  }

  // A human gate, in three bands: what the agents did, the one question a person answers, and
  // what Millwright checks. The person's part is kept small and clear on purpose.
  const gateNo = (st) => ORDER.indexOf(st) + 1;
  const question = (st) => D.gatePlain[st].q.replace(/^[^:]*:\s*/, '').replace(/^./, (c) => c.toUpperCase());
  const docChips = (xs) => xs.map((a) => `<button class="fchip" data-ide-open="${esc(a.repo)}|${esc(a.path)}" title="${esc(a.path)}">${esc(plainName(a))}</button>`).join('');
  const band = (cls, label, body) => `<div class="band ${cls}"><span class="bt">${label}</span><div class="bb">${body}</div></div>`;

  function gateBands(s) {
    const g = s.gate;
    const i = stages.indexOf(s);
    const prev = stages.slice(0, i).reverse().find((x) => x.kind === 'gate');
    const span = stages.slice(prev ? stages.indexOf(prev) + 1 : 0, i);
    const ags = [...new Set(span.flatMap((x) => [...x.who.filter((w) => !isHuman(w)), ...x.commands.filter((c) => c.actorType === 'agent' && c.actor).map((c) => c.actor)]))];
    const person = span.some((x) => x.who.some(isHuman) || x.commands.some((c) => c.actorType === 'human'));
    const stop = [...span].reverse().find((x) => x.kind === 'arrive' || x.kind === 'atgate');
    const ev = s.artifacts.filter((a) => a.kind === 'md').length ? s.artifacts.filter((a) => a.kind === 'md') : s.artifacts;
    const ng = nextGate(s);
    const who = ags.length === 1 ? `<b>${esc(ags[0])}</b>` : `<b class="names" data-tip="The agents|${esc(ags.join(', '))}">${ags.length || ''} agents</b>`;
    const did = `${person ? '<b>Kurtis</b> and ' : ''}${who} did steps ${esc(span[0]?.num)} to ${esc(span[span.length - 1]?.num)}, then stopped${stop ? ` at <button class="fc-go" data-go="${stop.id}">step ${esc(stop.num)}</button>` : ''}.`;
    const cmd = `<div class="ran-in">${ranRow(s)}</div>`;
    const you = `<b class="q">${esc(question(g.state))}</b>
      ${ev.length ? `<div class="brow"><span>Read</span>${docChips(ev)}</div>` : ''}
      <div class="ans">${icon.check}<b>${esc(g.by === 'kurtis' ? 'Kurtis' : g.by)} approved</b></div>
      ${g.decided?.length ? `<ul>${g.decided.map((d) => `<li>${gloss(d)}</li>`).join('')}</ul>` : ''}${state.detail ? '' : cmd}`;
    const human = g.checks.includes('policy:gate-requires-human');
    const mw = `${g.checks.length} checks${human ? ', including <b>that a person decided</b>, not an agent' : ''}. Then the run moved on: ${esc(plainState(g.to).replace(/^./, (c) => c.toLowerCase()))}.${g.demo ? ' <span class="faint">Demo run: one person played every role.</span>' : ''}
      ${ng ? ` <button class="fc-go" data-go="${ng.id}">Next human gate: ${esc(D.gatePlain[ng.gate.state].name)}, step ${esc(ng.num)} →</button>` : ' Next: a person opens the pull request, reviews it and merges it.'}`;
    return `<div class="bands">${band('ag', person ? 'Work so far' : 'Agents did', did)}${band('you', 'You decide', you)}${band('mw', 'Millwright checks', mw)}</div>`;
  }

  // Full detail on a gate step: the approval as it ran in the terminal, with every check.
  function gateTerm(s) {
    const c = s.commands.find((x) => x.trigger === 'gate.approve') ?? s.commands[0];
    if (!c) return '';
    const who = c.actor ?? s.gate.by;
    return `<div class="gterm"><div class="gt-h">What ran <button class="tcopy" data-copy="${esc(c.cmd)}">copy</button></div><div class="gt-b"><span class="pr">${esc(who)} $</span> ${esc(c.cmd)}
${(c.checks.length ? c.checks : s.gate.checks).map((k) => `<span class="ck">✓</span> ${k === 'policy:gate-requires-human' ? `<span class="hi">${esc(k)}</span>` : esc(k)}`).join('\n')}
<span class="c">→ ${esc(c.to ?? s.gate.to)}${c.seq != null ? ` · ledger #${esc(c.seq)}` : ''}${c.digest ? ` · ${esc(c.digest.slice(0, 7))}…${esc(c.digest.slice(-6))}` : ''}</span></div></div>`;
  }

  // On a step where the run waits at a gate: the same "You decide" band, still open.
  function waitBand(s) {
    const st = s.runState?.state;
    if (!D.gatePlain[st]) return '';
    const ng = nextGate(s);
    return `<div class="bands">${band('you wait', 'You decide', `<b class="q">${esc(question(st))}</b>
      <div class="ans w">${icon.pause}<b>Waiting for a person.</b><span>Agents can't approve it.</span>${ng ? `<button class="fc-go" data-go="${ng.id}">See the decision, step ${esc(ng.num)} →</button>` : ''}</div>`)}</div>`;
  }

  // The research loop as two lanes, agents above and Kurtis below, so the back and forth can be
  // pointed at. Each node is a step; the current one is lit, and a step that waits lights the next.
  function loopVis(s) {
    const loop = D.chapters[s.chapter]?.loop;
    if (!loop) return '';
    const st = loop.nodes.map((n) => ({ ...n, s: stages.find((x) => x.id === n.id) })).filter((n) => n.s);
    const si = stages.indexOf(s);
    let cur = st.findIndex((n) => n.s === s);
    const wait = cur < 0;
    if (wait) cur = st.findIndex((n) => stages.indexOf(n.s) > si);
    const x0 = 118, dx = (628 - x0) / (st.length - 1), ya = 38, yk = 100;
    const P = (n, i) => ({ x: x0 + i * dx, y: n.s.kind === 'gate' || n.s.who.some(isHuman) ? yk : ya });
    const pts = st.map(P);
    const lines = pts.slice(1).map((b, i) => {
      const a = pts[i]; const ang = Math.atan2(b.y - a.y, b.x - a.x); const r = 17;
      return `<line x1="${a.x + r * Math.cos(ang)}" y1="${a.y + r * Math.sin(ang)}" x2="${b.x - (r + 3) * Math.cos(ang)}" y2="${b.y - (r + 3) * Math.sin(ang)}" class="${i < cur ? 'on' : ''}" marker-end="url(#lp-ar${i < cur ? '-on' : ''})"/>`;
    }).join('');
    const person = (x, y) => `<g transform="translate(${x - 8} ${y - 8})"><circle cx="8" cy="5" r="3"/><path d="M2 15c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5z"/></g>`;
    const nodes = st.map((n, i) => {
      const { x, y } = pts[i]; const k = y === yk;
      const cls = `${k ? 'k' : 'a'} ${i < cur ? 'done' : i === cur ? (wait ? 'wait' : 'cur') : 'todo'}`;
      const ly = k ? y + 33 : y - 23;
      return `<g class="nd ${cls}" data-go="${n.s.id}"><title>Step ${esc(n.s.num)}: ${esc(n.s.title)}</title>${i === cur && !wait ? `<circle cx="${x}" cy="${y}" r="21" class="ring"/>` : ''}<circle cx="${x}" cy="${y}" r="15" class="c"/>${k ? person(x, y) : `<text x="${x}" y="${y + 4}" class="lt">A</text>`}<text x="${x}" y="${ly}" class="lb">${esc(n.label)}</text></g>`;
    }).join('');
    const r = loop.rounds ? loop.rounds.filter((k) => k <= cur).length : 0;
    const status = wait ? 'Waiting for Kurtis' : r ? `Round ${r} of ${loop.rounds.length}` : '';
    const [af, at] = [pts[loop.again.from], pts[loop.again.to]];
    return `<div class="loop"><div class="lp-h"><span>${esc(loop.title)}</span><span>${status}</span></div>
      <svg viewBox="0 -38 690 176" role="img" aria-label="The research loop">
      <defs><marker id="lp-ar" viewBox="0 0 8 8" refX="5" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" class="ah"/></marker><marker id="lp-again" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" class="ah again"/></marker><marker id="lp-ar-on" viewBox="0 0 8 8" refX="5" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" class="ah on"/></marker></defs>
      <rect x="0" y="0" width="690" height="64" rx="7" class="lane a"/><rect x="0" y="70" width="690" height="68" rx="7" class="lane k"/>
      <text x="14" y="${ya + 4}" class="ln a">AGENTS</text><text x="14" y="${yk + 4}" class="ln k">KURTIS</text>
      <path d="M${af.x} ${af.y === yk ? yk - 17 : -4} V-10 Q${af.x} -18 ${af.x - 8} -18 H${at.x + 8} Q${at.x} -18 ${at.x} -10 V-7" class="again" marker-end="url(#lp-again)"/>
      <text x="${(at.x + af.x) / 2}" y="-26" class="again-t">${esc(loop.again.label)}</text>
      ${lines}${nodes}</svg>
      ${loop.foot ? `<div class="lp-f">${esc(loop.foot)}</div>` : ''}</div>`;
  }

  // What happens to the pull request next: merged, or back round the review loop with fixes.
  function afterPr(s) {
    if (!s.after) return '';
    return `<div class="after"><div class="af-h">What happens to the PR next</div>${s.after.map(([k, v], i) => `<div class="af-r ${i ? 'back' : 'ok'}"><b>${i ? '↺' : '✓'} ${esc(k)}</b><span>${v.split(/(\/mw[\w-]* \w+)/).map((x, k) => k % 2 ? `<code class="ccx">${esc(x)}</code>` : gloss(x)).join('')}</span></div>`).join('')}</div>`;
  }

  function focusLeft(s) {
    const gate = s.kind === 'gate';
    const waiting = s.kind === 'arrive' || s.kind === 'atgate';
    const eyebrow = gate ? `<span class="gi">${'<i class="dia f"></i>'}Human gate ${gateNo(s.gate.state)} of ${ORDER.length} · ${esc(D.gatePlain[s.gate.state]?.name ?? s.gate.name)} approval</span>${scopePill(s)}` : where(s);
    const body = gate ? `${gateBands(s)}${state.detail ? gateTerm(s) + nums(s, 3) : ''}` : `${flow(s)}${waiting ? waitBand(s) : ''}`;
    return `<div class="vA">
      <div class="vb-top"><div class="eyebrow">${eyebrow}</div>
      <h1 class="h1">${esc(s.title)}</h1>
      ${gate ? '' : `<div class="vb-story">${s.story.map((p) => `<p>${gloss(p)}</p>`).join('')}</div>`}
      ${gate ? '' : nums(s, 3)}${afterPr(s)}${loopVis(s)}${body}${s.aside ? `<div class="vb-aside"><b>Worth knowing</b><span>${esc(s.aside)}</span></div>` : ''}${proofLine(s)}</div>
      <div class="vb-bottom">${state.detail ? `<div class="vb-row"><span></span>${moreLinks()}</div>` : ''}</div></div>`;
  }

  function leftHtml(s) {
    if (state.layer === 'story') return focusLeft(s);
    const tabs = LAYERS.filter(([k]) => state.detail || k !== 'hood').map(([k, l, key, sub]) => `<button class="tab ${state.layer === k ? 'on' : ''}" data-layer="${k}" title="${esc(sub)}">${l}</button>`).join('');
    const body = state.layer === 'evidence' ? evidenceLayer(s) : hoodLayer(s);
    return `<div class="lwrap">
      <div class="eyebrow">${where(s)}</div>
      <h1 class="h1">${esc(s.title)}</h1>
      <div class="tabs" role="tablist">${tabs}</div>
      ${INTROS[state.layer] ? `<p class="layer-intro">${INTROS[state.layer]}</p>` : ''}
      <div id="layer">${body}</div>
    </div>`;
  }

  function evidenceLayer(s) {
    let out = '';
    if (s.gate) {
      const g = s.gate;
      out += `<div class="decision"><div class="label accent"><i class="dia f"></i> ${esc(g.name)}</div><h3 class="serif">What was decided</h3>
        <div class="meta"><span class="prov">from the run log</span> Approved by ${esc(g.by)}. The run moved to <code>${esc(g.to)}</code>.</div>${g.decided ? '<div class="meta"><span class="prov n">narration</span> The list below is a plain-words summary written for this walkthrough, from the record named under it.</div>' : ''}
        ${g.decided ? `<ul>${g.decided.map((d) => `<li>${gloss(d)}</li>`).join('')}</ul>` : ''}
        <div class="foot">${g.source ? `<span>Recorded in <code>${esc(g.source)}</code></span>` : ''}${g.demo ? '<span class="badge wait">Demo assumption</span>' : ''}</div>
        <div class="foot"><span>Kernel checks passed:</span>${g.checks.map((c) => `<span class="check">${esc(c)}</span>`).join('')}</div></div>`;
    }
    if (s.note) out += `<div class="note"><span class="ni">Note</span><span>${esc(s.note)}</span></div>`;
    if (!s.artifacts.length) return out + '<p class="small">This step only moved the run. See Commands for the ledger entry.</p>';
    const sel = state.artifact[s.id] ?? 0;
    const a = s.artifacts[Math.min(sel, s.artifacts.length - 1)];
    const list = s.artifacts.map((x, k) => {
      const st = x.changed ? `<span class="st ${x.changed}">${x.changed === 'A' ? 'new' : x.changed === 'M' ? 'changed' : 'deleted'}</span>` : `<span class="st ref">${x.repo === 'minidon-rust' ? 'rust' : 'context'}</span>`;
      return `<button class="ev-item ${k === sel ? 'on' : ''}" data-art="${k}"><span class="t"><span>${esc(prettyName(x))}</span>${st}</span><span class="p">${esc(x.path)}</span><span class="prov">from git · ${esc(x.repo)} @ ${esc(x.at)}</span></button>`;
    }).join('');
    return out + `<div class="ev"><div class="ev-list">${list}</div><div class="viewer" id="viewer">${viewer(s, a)}</div></div>`;
  }

  function prettyName(a) {
    if (a.kind === 'md') {
      const m = a.html.match(/<h1[^>]*>(.*?)<\/h1>/);
      if (m) return m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').slice(0, 70);
    }
    const parts = a.path.split('/');
    return a.name === 'pr.json' || a.name === 'plan.md' ? `${a.name} (${parts[parts.length - 2]})` : a.name;
  }

  function viewer(s, a) {
    const diffFile = a.repo === 'minidon-context' ? s.files.find((f) => f.path === a.path && f.diff) : null;
    const key = `${s.id}:${a.path}`;
    const view = diffFile && state.artView[key] === 'diff' ? 'diff' : 'doc';
    const seg = diffFile ? `<span class="seg"><button data-view="doc" class="${view === 'doc' ? 'on' : ''}">Document</button><button data-view="diff" class="${view === 'diff' ? 'on' : ''}">Changes in this step</button></span>` : '';
    const body = view === 'diff' ? `<div class="diff">${diffRows(diffFile)}</div>` : docBody(a);
    return `<div class="vh"><span class="name">${esc(a.name)}</span><span class="path">${esc(a.repo)} @ ${esc(a.at)}</span><span class="spacer"></span>${seg}<a href="${esc(relPath(a))}" target="_blank" rel="noopener" title="Opens the current version of the file">Open file ↗</a></div>
      <div class="vb">${body}</div>`;
  }

  // A file Millwright creates as a blank form for agents to fill in later. Say so, and say when.
  function blankNote(a, j) {
    let n = 0, empty = 0;
    const walk = (v) => {
      if (Array.isArray(v)) { if (!v.length) { n++; empty++; } else v.forEach(walk); }
      else if (v && typeof v === 'object') { const ks = Object.keys(v); if (!ks.length) { n++; empty++; } else ks.forEach((k) => walk(v[k])); }
      else { n++; if (v === '') empty++; }
    };
    walk(j);
    if (n < 6 || empty / n < 0.5) return '';
    const p = pages[state.page];
    const i = p.type === 'stage' ? stages.indexOf(p.stage) : -1;
    const later = stages.slice(i + 1).find((x) => x.files.some((f) => f.path === a.path && f.status === 'M'));
    return `<div class="blank">${icon.info}<span><b>A blank form, on purpose.</b> Millwright creates this file with empty fields (${empty} of ${n}) for the agents to fill in.${later ? ` It is filled in at <button class="fc-go" data-go="${later.id}">step ${esc(later.num)}, ${esc(later.title)} →</button>` : ''}</span></div>`;
  }

  function docBody(a) {
    if (a.kind === 'md') {
      const fm = a.meta ? `<dl class="fm">${a.meta.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '';
      return `<div class="doc">${fm}${a.html.replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, '</table></div>')}</div>`;
    }
    if (a.kind === 'json') {
      let j; try { j = JSON.parse(a.text); } catch { return codeView(a.text); }
      return `${blankNote(a, j)}<div class="jv">${jsonView(j, 0)}</div>`;
    }
    if (a.kind === 'jsonl') return ledgerTable(a.text);
    return codeView(a.text);
  }

  // ---------------------------------------------------------------- json, code, diff

  const isPrim = (v) => v === null || typeof v !== 'object';
  function prim(v) {
    if (v === null) return '<span class="z">null</span>';
    if (typeof v === 'number') return `<span class="n">${v}</span>`;
    if (typeof v === 'boolean') return `<span class="b">${v}</span>`;
    if (v === '') return '<span class="z">empty</span>';
    return `<span class="s">${esc(v)}</span>`;
  }
  function summaryOf(v, i) {
    if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? '' : 's'}`;
    const id = v.id ?? v.ID ?? v.name ?? v.title ?? v.capability ?? v.path;
    const label = v.title ?? v.name ?? v.summary ?? v.statement ?? v.description ?? v.text;
    const bits = [];
    if (id != null && typeof id !== 'object') bits.push(`<b>${esc(id)}</b>`);
    if (label != null && label !== '' && typeof label !== 'object' && label !== id) bits.push(esc(String(label).slice(0, 110)));
    return bits.length ? bits.join(' · ') : i != null ? `<b>#${i + 1}</b>` : `${Object.keys(v).length} fields`;
  }
  function jsonView(v, depth) {
    if (isPrim(v)) return prim(v);
    if (!Array.isArray(v) && !Object.keys(v).length) return '<span class="z">empty</span>';
    if (Array.isArray(v)) {
      if (!v.length) return '<span class="z">none</span>';
      if (v.every(isPrim)) return v.length <= 40 ? `<div class="tags">${v.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : v.map(prim).join('<br>');
      if (v.every((x) => x && typeof x === 'object' && !Array.isArray(x))) {
        const keys = [...new Set(v.flatMap((x) => Object.keys(x)))];
        const flat = v.every((x) => Object.values(x).every((y) => isPrim(y) || (Array.isArray(y) && y.every(isPrim))));
        if (flat && keys.length <= 8) {
          return `<div class="tw"><table><thead><tr>${keys.map((k) => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${v.map((x) => `<tr>${keys.map((k) => `<td>${x[k] === undefined ? '' : Array.isArray(x[k]) ? esc(x[k].join(', ')) : prim(x[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
        }
      }
      return v.map((x, i) => isPrim(x) ? `<div>${prim(x)}</div>` : `<details ${depth < 1 && v.length <= 3 ? 'open' : ''}><summary>${summaryOf(x, i)}</summary><div class="in">${jsonView(x, depth + 1)}</div></details>`).join('');
    }
    const entries = Object.entries(v).filter(([k]) => k !== '$schema');
    return `<dl>${entries.map(([k, x]) => {
      if (isPrim(x) || (Array.isArray(x) && x.every(isPrim)) || (x && !Array.isArray(x) && !Object.keys(x).length)) return `<dt>${esc(k)}</dt><dd>${jsonView(x, depth + 1)}</dd>`;
      const open = depth < 1;
      return `<dt>${esc(k)}</dt><dd><details ${open ? 'open' : ''}><summary>${summaryOf(x)}</summary><div class="in">${jsonView(x, depth + 1)}</div></details></dd>`;
    }).join('')}</dl>`;
  }
  function codeView(text) {
    return `<pre class="code">${text.replace(/\n$/, '').split('\n').map((l) => `<span class="l">${esc(l) || ' '}</span>`).join('')}</pre>`;
  }
  function ledgerTable(text) {
    const rows = text.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    return `<div class="jv"><div class="tw"><table><thead><tr><th>#</th><th>move</th><th>actor</th><th>trigger</th><th>reason</th></tr></thead><tbody>${rows.map((e) => `<tr><td>${e.seq}</td><td><code>${esc(e.from)}</code> → <code>${esc(e.to)}</code></td><td>${esc(e.actor?.id)}</td><td>${esc(e.trigger)}</td><td>${esc(e.reason ?? '')}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function diffRows(f) {
    if (f.skipped) return `<div class="more">Not shown: ${esc(f.skipped)} (${f.add} lines added, ${f.del} removed).</div>`;
    if (!f.diff) return '<div class="more">No text changes.</div>';
    let a = 0, b = 0;
    const rows = f.diff.split('\n').map((l) => {
      const h = l.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)/);
      if (h) { a = +h[1]; b = +h[2]; return `<div class="r h"><span class="ln"></span><span class="tx">${esc(l)}</span></div>`; }
      if (l.startsWith('\\')) return '';
      const c = l[0];
      if (c === '+') return `<div class="r a"><span class="ln">${b++}</span><span class="tx">${esc(l)}</span></div>`;
      if (c === '-') return `<div class="r d"><span class="ln">${a++}</span><span class="tx">${esc(l)}</span></div>`;
      a++;
      return `<div class="r"><span class="ln">${b++}</span><span class="tx">${esc(l)}</span></div>`;
    }).join('');
    return rows + (f.truncated ? `<div class="more">${f.truncated} more lines not shown. Use the git command above to see the full diff.</div>` : '');
  }

  // ---------------------------------------------------------------- under the hood

  function term(cmd, comment) {
    return `<div class="term">${comment ? `<span class="cm"># ${esc(comment)}</span>\n` : ''}<span class="pr">$ </span>${esc(cmd)}<button class="copy" data-copy="${esc(cmd)}">Copy</button></div>`;
  }

  function fileList(files, prefix) {
    return `<div class="files">${files.map((f) => {
      const key = `${prefix}:${f.path}`;
      const open = state.openFiles.has(key);
      return `<div class="frow"><button class="fhead" data-file="${esc(key)}"><span class="car">${open ? '▾' : '▸'}</span><span class="st ${f.status}">${f.status === 'A' ? 'new' : f.status === 'M' ? 'mod' : 'del'}</span><span class="fp" title="${esc(f.path)}">${esc(f.path)}</span>${f.skipped ? `<span class="sk">${esc(f.skipped)}</span>` : ''}<span class="plus">+${f.add}</span><span class="minus">−${f.del}</span></button>
        ${open ? `<div class="fbody"><div class="diff">${diffRows(f)}</div></div>` : ''}</div>`;
    }).join('')}</div>`;
  }

  function hoodLayer(s) {
    const c = s.commit;
    const checkout = [term(`git checkout ${c.short}`, `see the workspace exactly as it was after step ${s.num}`)];
    if (c.tags.length) checkout.push(term(`git checkout ${c.tags[0]}`, 'the same commit, by its stage tag'));
    checkout.push(term(`git switch ${D.repo.branch}`, 'come back afterwards'));
    checkout.push(term(`git show --stat ${c.short}`, 'list what this step changed'));

    const cmds = s.commands.map((x) => {
      let meta = '';
      if (x.source === 'ledger') {
        meta = `<div class="cmd-meta"><span class="prov">from the run log</span><span>Rebuilt from ledger entry <b>#${x.seq}</b> of ${esc(x.run)}</span><span>·</span><span>${esc(x.actor)}</span><span>·</span><span class="tr">${esc(x.from)} → ${esc(x.to)}</span></div>`;
        if (x.checks?.length) meta += `<div class="checks">${x.checks.map((k) => `<span class="check">${esc(k)}</span>`).join('')}</div>`;
      } else if (x.source === 'review') {
        meta = `<div class="cmd-meta"><span class="prov">from the run log</span><span>Rebuilt from the baseline review session log</span><span>·</span><span>${esc(x.actor)}</span></div>`;
      } else {
        meta = '<div class="cmd-meta"><span class="prov n">narration</span><span>From the walkthrough notes, not recorded in a ledger</span></div>';
      }
      return `<div>${meta}${term(x.cmd)}</div>`;
    }).join('');

    const runs = Object.entries(s.runs);
    const chores = s.chores.map((ch) => `<div class="card" style="margin-top:10px"><div class="small">Also in history just before this step</div>
      <div style="margin:4px 0 10px"><code>${esc(ch.short)}</code> ${esc(ch.subject)}</div>${fileList(ch.files, `chore-${ch.short}`)}</div>`).join('');

    let rust = '';
    if (s.rust) {
      const r = s.rust;
      const byShort = Object.fromEntries(r.commits.map((x) => [x.short, x]));
      const waves = r.waves.map((w) => `<div class="wave"><h4>${esc(w.title)} <span class="small">${w.commits.length} commit${w.commits.length === 1 ? '' : 's'}</span></h4>${w.commits.map((sh) => {
        const rc = byShort[sh];
        const key = `rust:${sh}`;
        const open = state.openFiles.has(key);
        const add = rc.files.reduce((n, f) => n + f.add, 0);
        return `<div class="rc"><button class="fhead" data-file="${key}"><span class="car">${open ? '▾' : '▸'}</span><span class="sha">${esc(sh)}</span><span class="subj">${esc(rc.subject)}</span><span class="plus">+${add}</span></button>${open ? fileList(rc.files, key) : ''}</div>`;
      }).join('')}</div>`).join('');
      rust = `<section><h3>minidon-rust</h3>
        ${term(`git -C ../minidon-rust checkout ${r.head}`, 'the Rust code as it was reviewed')}
        ${term('git -C ../minidon-rust log --oneline', 'every build commit')}
        ${waves ? `<div class="small" style="margin-top:12px">Commits grouped by the build log that names them. Click one to see its diff.</div>${waves}` : ''}</section>`;
    }

    return `<div class="hood">
      <section><h3>Where the run is in Millwright's state machine</h3>${rail(s)}</section>
      <section><h3>Commit</h3><div class="card"><dl class="kv">
        <dt>SHA</dt><dd>${esc(c.sha)}</dd><dt>Subject</dt><dd style="font-family:var(--sans)">${esc(s.subject)}</dd>
        <dt>Author</dt><dd>${esc(c.author)}</dd>
        ${c.tags.length ? `<dt>Tag</dt><dd>${esc(c.tags.join(', '))}</dd>` : ''}
        <dt>Runs</dt><dd>${runs.length ? runs.map(([id, st]) => `${esc(id)}: ${esc(st)}`).join('<br>') : 'none yet'}</dd>
      </dl></div>${checkout.join('')}${chores}</section>
      ${cmds ? `<section><h3>Commands</h3><p class="small" style="margin:0 0 4px">Rebuilt from what the run recorded. The kernel checks listed under each move all passed.</p>${cmds}</section>` : ''}
      ${rust}
      <section><h3>Files changed in minidon-context <span class="small" style="text-transform:none;letter-spacing:0">${s.files.length} files, +${s.files.reduce((n, f) => n + f.add, 0)} −${s.files.reduce((n, f) => n + f.del, 0)}</span></h3>${fileList(s.files, s.id)}</section>
    </div>`;
  }

  // ---------------------------------------------------------------- render and routing

  function render() {
    const p = pages[state.page];
    renderTimeline();
    renderFoot();
    const main = document.getElementById('main');
    main.innerHTML = p.type === 'start' ? `<div class="scroll">${renderStart()}</div>` : p.type === 'end' ? `<div class="scroll">${renderEnd()}</div>` : renderStage(p.stage);
    document.title = `${p.type === 'stage' ? `${p.stage.num} ${p.stage.title}` : p.type === 'end' ? 'Where it ends' : 'Start'} · Millwright walkthrough`;
    state.scrollTree = true;
    afterRender();
  }

  // Scroll the open file to the passage this step is about and mark it.
  function focusPassage() {
    const p = pages[state.page];
    const f = p?.stage?.focus;
    const pv = document.querySelector('#ide .bt-body');
    if (!f || !pv || !pv.querySelector('.st.focus')) return;
    const els = [...pv.querySelectorAll('h1,h2,h3,h4,p,li,td,dt,dd,.l,.jv .s,.jv .k')];
    const hits = els.filter((x) => x.textContent.includes(f.find));
    const el = hits.find((x) => !hits.some((y) => y !== x && x.contains(y)));
    if (!el) return;
    el.classList.add('hl');
    pv.scrollTop = 0;
    const top = el.getBoundingClientRect().top - pv.getBoundingClientRect().top;
    pv.scrollTop = Math.max(0, top - 96);
  }

  function afterRender() {
    const nodes = [...document.querySelectorAll('pre.mermaid:not([data-processed])')];
    if (nodes.length && window.mermaid) {
      const dark = document.documentElement.classList.contains('dark');
      window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', fontFamily: 'inherit', theme: dark ? 'dark' : 'base',
        themeVariables: dark ? {} : { background: 'transparent', primaryColor: '#fffefb', primaryBorderColor: '#cfc8ba', primaryTextColor: '#1c1a17', lineColor: '#6f6960', secondaryColor: '#f2eee6', tertiaryColor: '#f6f3ed', noteBkgColor: '#fbeee6', noteBorderColor: '#d4572b', noteTextColor: '#1c1a17', actorBkg: '#fffefb', actorBorder: '#cfc8ba', signalColor: '#1c1a17', signalTextColor: '#1c1a17' } });
      window.mermaid.run({ nodes }).catch(() => {});
    }
    document.querySelectorAll('.doc a[href]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
    focusPassage();
    const ex = document.getElementById('exbody');
    if (ex && state.scrollTree && state.treeMode === 'all') {
      const row = ex.querySelector('.tr.sel') ?? ex.querySelector('.tr.new, .tr.mod, .tr.del');
      if (row) ex.scrollTop = Math.max(0, row.offsetTop - ex.clientHeight * 0.3);
    }
    if (ex && state.scrollTree && state.treeMode !== 'all') ex.scrollTop = 0;
    state.scrollTree = false;
  }

  function rerenderLayer() {
    const p = pages[state.page];
    if (p.type !== 'stage') return;
    const left = document.getElementById('left');
    const top = left.scrollTop;
    left.innerHTML = leftHtml(p.stage);
    left.scrollTop = top;
    afterRender();
  }

  function rerenderIde(scrollTree = false) {
    const p = pages[state.page];
    if (p.type !== 'stage') return;
    const ide = document.getElementById('ide');
    const top = document.getElementById('exbody')?.scrollTop ?? 0;
    ide.innerHTML = ideHtml(p.stage);
    const ex = document.getElementById('exbody');
    if (ex) ex.scrollTop = top;
    state.scrollTree = scrollTree;
    afterRender();
  }

  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    let i = byId[h];
    if (i == null && /^\d{1,3}$/.test(h)) i = pages.findIndex((p) => p.stage && +p.stage.num === +h);
    if (i == null || i < 0) i = 0;
    const changed = i !== state.page;
    state.page = i;
    const pending = state.pending;
    state.pending = null;
    if (changed) state.layer = pending?.layer ?? 'story';
    if (location.hash.slice(1) !== pages[i].id && h) history.replaceState(null, '', `#${pages[i].id}`);
    render();
    if (pending) afterGo(pending);
  }

  function go(id, opts = {}) {
    const i = byId[id];
    if (i == null) return;
    if (i === state.page && opts.layer) state.layer = opts.layer;
    if (i === state.page) { if (opts.layer) rerenderLayer(); afterGo(opts); return; }
    state.pending = opts;
    location.hash = id;
  }
  function afterGo(opts) {
    if (opts.file) {
      const el = [...document.querySelectorAll('#left .fhead[data-file]')].find((x) => x.dataset.file === opts.file);
      if (el) el.scrollIntoView({ block: 'center' });
    }
  }
  const step = (d) => { const i = Math.max(0, Math.min(pages.length - 1, state.page + d)); if (i !== state.page) location.hash = pages[i].id; };
  const setLayer = (l) => { if (pages[state.page].type === 'stage' && state.layer !== l) { state.layer = l; rerenderLayer(); } };

  // ---------------------------------------------------------------- all steps

  // Every step on one sheet, grouped by stage, for getting anywhere in one click.
  function openSteps() {
    closeOverlay();
    const cur = pages[state.page];
    const curId = cur.id;
    const acts = [];
    D.chapters.forEach((c, ci) => {
      const a = acts[acts.length - 1];
      if (a && a.title === c.act) a.chs.push(ci); else acts.push({ title: c.act, chs: [ci] });
    });
    const stepBtn = (s) => `<button class="sm-s ${s.id === curId ? 'on' : ''}${s.kind === 'gate' ? ' g' : ''}" data-go="${s.id}"><b>${esc(s.num)}</b><span>${esc(s.title)}</span>${s.kind === 'gate' ? '<i class="dia f"></i>' : ''}</button>`;
    const chapter = (ci) => {
      const ss = stages.filter((s) => s.chapter === ci);
      return ss.length ? `<div class="sm-c ${ss.some((s) => s.id === curId) ? 'cur' : ''}"><div class="sm-ct">${ci + 1}. ${esc(D.chapters[ci].short ?? D.chapters[ci].title)}</div>${ss.map(stepBtn).join('')}</div>` : '';
    };
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="stepmap" role="dialog" aria-label="All steps">
      <div class="sm-h"><b>All steps</b><span><i class="dia"></i> a person approves</span><span class="spacer"></span><button class="sm-e ${curId === 'start' ? 'on' : ''}" data-go="start">Start</button><button class="sm-e ${curId === 'end' ? 'on' : ''}" data-go="end">Where it ends</button></div>
      <div class="sm-b">${acts.map((a) => `<div class="sm-a"><div class="sm-at">${esc(a.title)}</div>${a.chs.map(chapter).join('')}</div>`).join('')}</div></div>`;
    document.body.appendChild(ov);
    state.overlay = { el: ov, kind: 'steps' };
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeOverlay(); });
    ov.addEventListener('click', (e) => { if (e.target.closest('[data-go]')) closeOverlay(); });
    ov.querySelector('.sm-s.on')?.scrollIntoView({ block: 'nearest' });
  }

  function pick(x) {
    closeOverlay();
    if (x.art != null) state.artifact[x.go] = x.art;
    if (x.file) state.openFiles.add(x.file);
    go(x.go, { layer: x.layer, file: x.file });
  }

  function openHelp() {
    closeOverlay();
    const ov = document.createElement('div');
    ov.className = 'overlay';
    const rows = [
      ['<kbd>→</kbd> <kbd>PageDown</kbd>', 'Next step'], ['<kbd>←</kbd> <kbd>PageUp</kbd>', 'Previous step'], ['<kbd>Home</kbd> / <kbd>End</kbd>', 'Start page / where the run ends'],
      ['<kbd>1</kbd> to <kbd>9</kbd>', 'First step of that stage'], ['<kbd>0</kbd>', 'Start page'], ['<kbd>G</kbd>', 'All steps, to go to any one'],
      ['<kbd>S</kbd> <kbd>D</kbd> <kbd>C</kbd>', 'Story, Documents, Commands'], ['<kbd>Esc</kbd>', 'Close this, or go back to the Story'], ['<kbd>R</kbd>', 'Show or hide full detail: file tree, commits, commands'],
      ['<kbd>T</kbd>', 'Light or dark theme (for projectors)'], ['<kbd>F</kbd>', 'Full screen'], ['Browser Back', 'Previous place you visited. Every step has its own link.'],
    ];
    ov.innerHTML = `<div class="help" role="dialog" aria-label="How this page works"><h2>How it works</h2>${HOW.map(([h, x], k) => `<div class="how-i"><span class="n">${k + 1}</span><div><b>${h}</b><p>${x}</p></div></div>`).join('')}<h2 class="keys">Keys</h2><table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table></div>`;
    document.body.appendChild(ov);
    state.overlay = { el: ov, kind: 'help' };
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeOverlay(); });
  }

  function closeOverlay() {
    if (state.overlay) { state.overlay.el.remove(); state.overlay = null; }
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1400);
  }

  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    if (btn) { btn.textContent = 'Copied'; btn.classList.add('done'); setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1200); }
  }

  // ---------------------------------------------------------------- events

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cmd],[data-go],[data-act],[data-layer],[data-art],[data-view],[data-file],[data-copy],[data-tree],[data-pick],[data-repo],[data-ide-tab],[data-ide-open],[data-tree-mode]');
    if (!t) return;
    if (t.dataset.copy != null) return copy(t.dataset.copy, t);
    if (t.dataset.cmd) { state.cmdOpen.has(t.dataset.cmd) ? state.cmdOpen.delete(t.dataset.cmd) : state.cmdOpen.add(t.dataset.cmd); return rerenderLayer(); }
    if (t.dataset.go) return go(t.dataset.go);
    if (t.dataset.layer) return setLayer(t.dataset.layer);
    const p = pages[state.page];
    if (p.type === 'stage') {
      const st = ideState(p.stage);
      if (t.dataset.treeMode) { state.treeMode = t.dataset.treeMode; return rerenderIde(true); }
      if (t.dataset.tree) { st.open[t.dataset.tree] = t.dataset.open !== '1'; return rerenderIde(); }
      if (t.dataset.pick) { st.sel = { repo: st.repo, path: t.dataset.pick }; st.tab = 'file'; return rerenderIde(); }
      if (t.dataset.repo) { st.repo = t.dataset.repo; return rerenderIde(true); }
      if (t.dataset.ideTab) { st.tab = t.dataset.ideTab; return rerenderIde(); }
      if (t.dataset.ideOpen) {
        const [repo, path] = t.dataset.ideOpen.split('|');
        if (repo === 'minidon-rust' && !(p.stage.rust && D.rustTree)) return;
        st.repo = repo; st.sel = { repo, path }; st.tab = 'file';
        return rerenderIde(true);
      }
      if (t.dataset.file && t.closest('#ide')) {
        const k = t.dataset.file;
        state.openFiles.has(k) ? state.openFiles.delete(k) : state.openFiles.add(k);
        return rerenderIde();
      }
    }
    if (t.dataset.art != null) { state.artifact[p.id] = +t.dataset.art; return rerenderLayer(); }
    if (t.dataset.view) {
      const s = p.stage; const a = s.artifacts[state.artifact[s.id] ?? 0];
      state.artView[`${s.id}:${a.path}`] = t.dataset.view;
      return rerenderLayer();
    }
    if (t.dataset.file) {
      const k = t.dataset.file;
      state.openFiles.has(k) ? state.openFiles.delete(k) : state.openFiles.add(k);
      return rerenderLayer();
    }
    const act = t.dataset.act;
    if (act === 'steps') openSteps();
    if (act === 'help') openHelp();
    if (act === 'theme') toggleTheme();
    if (act === 'detail') toggleDetail();
  });

  function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('wt-theme', dark ? 'dark' : 'light'); } catch {}
    document.querySelectorAll('pre.mermaid[data-processed]').forEach((n) => { n.removeAttribute('data-processed'); });
    render();
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest('input, textarea')) return;
    if (state.overlay) {
      if (e.key === 'Escape') { closeOverlay(); e.preventDefault(); }
      return;
    }
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown') step(1);
    else if (k === 'ArrowLeft' || k === 'PageUp') step(-1);
    else if (k === 'Home') location.hash = 'start';
    else if (k === 'End') location.hash = 'end';
    else if (k === 'g' || k === 'G' || k === '/') openSteps();
    else if (k === '?') openHelp();
    else if (k === 'Escape') setLayer('story');
    else if (k === 's' || k === 'S') setLayer('story');
    else if ('dDeE'.includes(k)) setLayer('evidence');
    else if ('cCuUhH'.includes(k)) setLayer('hood');
    else if (k === 't' || k === 'T') toggleTheme();
    else if (k === 'r' || k === 'R') toggleDetail();
    else if (k === 'f' || k === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); }
    else if (k === '0') location.hash = 'start';
    else if (/^[1-9]$/.test(k)) { const s = stages.find((x) => x.chapter === +k - 1); if (s) location.hash = s.id; else return; }
    else return;
    e.preventDefault();
  });

  // Tooltips on the timeline.
  let tip = null;
  document.addEventListener('mouseover', (e) => {
    const m = e.target.closest('[data-tip],[data-def]');
    if (!m) { tip?.remove(); tip = null; return; }
    const [n, t] = m.dataset.def != null ? [m.dataset.term ?? m.textContent, m.dataset.def] : m.dataset.tip.split('|');
    tip?.remove();
    tip = document.createElement('div');
    tip.className = 'tip';
    tip.innerHTML = `<span class="n">${esc(n)}</span>${esc(t)}`;
    document.body.appendChild(tip);
    const r = m.getBoundingClientRect();
    const w = tip.offsetWidth;
    tip.style.left = `${Math.min(window.innerWidth - w / 2 - 8, Math.max(w / 2 + 8, r.left + r.width / 2))}px`;
    tip.style.top = `${r.bottom}px`;
  });


  try { if (localStorage.getItem('wt-theme') === 'dark') document.documentElement.classList.add('dark'); } catch {}
  try { state.detail = localStorage.getItem('wt-detail') === '1'; } catch {}
  try { JSON.parse(sessionStorage.getItem('wt-vs') ?? '[]').forEach((r) => state.vsOpen.add(r)); } catch {}
  // After the repo opens in VS Code, offer the file itself. The link navigates first, then the label changes.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-vs]');
    if (!a) return;
    state.vsOpen.add(a.dataset.vs);
    try { sessionStorage.setItem('wt-vs', JSON.stringify([...state.vsOpen])); } catch {}
    setTimeout(() => rerenderIde(), 300);
  });
  document.body.classList.toggle('detail', state.detail);
  frame();
  window.addEventListener('hashchange', fromHash);
  state.page = -1;
  fromHash();
})();
