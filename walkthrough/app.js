/* Millwright walkthrough page. Reads the data that build.mjs embedded and renders it. */
(() => {
  'use strict';

  const D = JSON.parse(document.getElementById('wt-data').textContent);
  const stages = D.stages;
  const pages = [{ id: 'start', type: 'start' }, ...stages.map((s, i) => ({ id: s.id, type: 'stage', stage: s, index: i })), { id: 'end', type: 'end' }];
  const byId = Object.fromEntries(pages.map((p, i) => [p.id, i]));
  const app = document.getElementById('app');

  const state = { page: 0, layer: 'story', artifact: {}, artView: {}, openFiles: new Set(), overlay: null };

  // ---------------------------------------------------------------- helpers

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const fmtTime = (iso) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  };
  const icon = {
    person: '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="5" r="3"/><path d="M2 15c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5z"/></svg>',
    agent: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="4.5" width="11" height="9" rx="2"/><path d="M8 1.5v3M5.5 9h.01M10.5 9h.01" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3.5 8.5l3 3 6-7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pause: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><rect x="4" y="3" width="3" height="10" rx="1"/><rect x="9" y="3" width="3" height="10" rx="1"/></svg>',
    search: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14" stroke-linecap="round"/></svg>',
    mark: '<svg viewBox="0 0 22 22" width="22" height="22"><rect x="1" y="1" width="20" height="20" rx="6" fill="var(--accent)"/><path d="M6 15V7l5 5 5-5v8" fill="none" stroke="var(--bg)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  };
  const isHuman = (w) => w === 'human' || w === 'kurtis' || /@/.test(w);
  const whoChip = (w) => isHuman(w)
    ? `<span class="chip human">${icon.person}Human (Kurtis)</span>`
    : `<span class="chip agent">${icon.agent}${esc(w)}</span>`;
  const kindBadge = (s) => ({
    gate: `<span class="badge gate">◆ Human gate passed</span>`,
    arrive: `<span class="badge wait">◇ Stops at a gate</span>`,
    atgate: `<span class="badge wait">◇ Human work at the gate</span>`,
    step: s.who.some(isHuman) ? `<span class="badge human">Human step</span>` : `<span class="badge agent">Agent step</span>`,
  }[s.kind]);
  const relPath = (a) => a.repo === 'minidon-rust' ? `file://${D.rustRepo.path}/${a.path}` : `../${a.path}`;

  function stateOf(s) {
    const t = D.tracks[s.track];
    const st = s.runState?.state;
    return t.parallel?.[st] ?? st;
  }

  function priorMilestones(index) {
    const out = [];
    for (let i = 0; i < index; i++) if (stages[i].milestone) out.push({ text: stages[i].milestone, id: stages[i].id, gate: stages[i].kind === 'gate' });
    return out;
  }

  // ---------------------------------------------------------------- frame

  function frame() {
    app.innerHTML = `
      <header class="top">
        <div class="brand" data-go="start"><span class="mark">${icon.mark}</span>Millwright walkthrough <span class="sub">minidon to minidon-rust</span></div>
        <div class="spacer"></div>
        <button class="tbtn" data-act="search">${icon.search} Jump to <kbd>G</kbd></button>
        <button class="tbtn" data-act="theme" title="Light or dark (T)">Theme <kbd>T</kbd></button>
        <button class="tbtn" data-act="help" title="Keyboard shortcuts">Keys <kbd>?</kbd></button>
      </header>
      <nav class="timeline" id="timeline"></nav>
      <main class="main" id="main"></main>
      <footer class="foot" id="foot"></footer>`;
  }

  function renderTimeline() {
    const cur = pages[state.page];
    const curStage = cur.type === 'stage' ? cur.stage : null;
    const chapters = D.chapters.map((c, ci) => {
      const ss = stages.filter((s) => s.chapter === ci);
      const isCur = curStage && curStage.chapter === ci;
      const marks = ss.map((s) => {
        const idx = stages.indexOf(s);
        const done = curStage ? idx < stages.indexOf(curStage) : cur.type === 'end';
        const cls = ['tl-mark', s.kind, done ? 'done' : '', curStage === s ? 'current' : ''].join(' ');
        return `<button class="${cls}" data-go="${s.id}" data-tip="${esc(s.num)}|${esc(s.title)}" aria-label="Step ${s.num}: ${esc(s.title)}"><i></i></button>`;
      }).join('');
      return `<div class="tl-chapter ${isCur ? 'current' : ''}" style="flex-grow:${Math.max(ss.length, 3.2)}">
        <div class="tl-label" data-go="${ss[0]?.id}"><b>${ci + 1}</b>${esc(c.title)}</div>
        <div class="tl-track">${marks}</div></div>`;
    }).join('');
    document.getElementById('timeline').innerHTML = `<div class="tl-row">
      <div class="tl-end"><span class="cap">.</span><span class="tl-pill ${cur.type === 'start' ? 'current' : ''}" data-go="start">Start</span></div>
      ${chapters}
      <div class="tl-end"><span class="cap">.</span><span class="tl-pill ${cur.type === 'end' ? 'current' : ''}" data-go="end">Where it ends</span></div>
    </div>`;
  }

  function renderFoot() {
    const prev = pages[state.page - 1];
    const next = pages[state.page + 1];
    const label = (p) => p.type === 'start' ? ['', 'Start'] : p.type === 'end' ? ['', 'Where it ends'] : [p.stage.num, p.stage.title];
    const btn = (p, dir) => {
      if (!p) return `<button class="nav" disabled>${dir === 'prev' ? '←' : '→'}</button>`;
      const [n, t] = label(p);
      return dir === 'prev'
        ? `<button class="nav" data-go="${p.id}"><span>←</span>${n ? `<span class="nn">${n}</span>` : ''}<span class="nt">${esc(t)}</span></button>`
        : `<button class="nav" data-go="${p.id}">${n ? `<span class="nn">${n}</span>` : ''}<span class="nt">${esc(t)}</span><span>→</span></button>`;
    };
    document.getElementById('foot').innerHTML = `${btn(prev, 'prev')}
      <div class="mid"><span><kbd>←</kbd><kbd>→</kbd> step</span><span><kbd>1</kbd>–<kbd>9</kbd> chapter</span><span><kbd>G</kbd> jump</span><span><kbd>S</kbd><kbd>E</kbd><kbd>U</kbd> layer</span><span><kbd>Esc</kbd> story</span></div>
      ${btn(next, 'next')}`;
  }

  // ---------------------------------------------------------------- pages

  function renderStart() {
    const i = D.intro;
    const first = stages[0];
    return `<div class="wrap">
      <div class="eyebrow"><span>Workshop</span><span class="dot">·</span><span>${stages.length} steps, ${stages.filter((s) => s.kind === 'gate').length} human gates</span><span class="dot">·</span><span>Built from <code>${esc(D.repo.ref)}@${esc(D.repo.head)}</code></span></div>
      <h1 class="title">${esc(i.title)}</h1>
      <div class="hero">${i.story.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="section"><h2>Three repositories</h2>
        <div class="flowline">${i.cast.map((c, k) => `${k ? '<span class="arrow">→</span>' : ''}<div class="repo" style="flex:1"><div class="rn">${esc(c.name)}</div><div class="rr">${esc(c.role)}</div><div class="rt">${esc(c.text)}</div></div>`).join('')}</div>
      </div>
      <div class="section"><h2>Four ideas to hold on to</h2>
        <div class="grid g4">${i.ideas.map((x) => `<div class="idea"><b>${esc(x.title)}</b><span>${esc(x.text)}</span></div>`).join('')}</div>
      </div>
      <div class="section"><h2>Chapters</h2>
        <div class="chap-list">${D.chapters.map((c, ci) => {
          const s = stages.find((x) => x.chapter === ci);
          return `<button class="chap" data-go="${s?.id}"><kbd>${ci + 1}</kbd><div><b>${esc(c.title)}</b><span>${esc(c.blurb)}</span></div></button>`;
        }).join('')}</div>
      </div>
      <div class="section"><h2>Getting around</h2>
        <div class="keys">
          <div><kbd>→</kbd> next step</div><div><kbd>←</kbd> previous step</div><div><kbd>Home</kbd> <kbd>End</kbd> first and last</div><div><kbd>1</kbd>–<kbd>9</kbd> jump to a chapter</div>
          <div><kbd>G</kbd> or <kbd>/</kbd> search anything</div><div><kbd>S</kbd> <kbd>E</kbd> <kbd>U</kbd> story, evidence, hood</div><div><kbd>Esc</kbd> back to the story</div><div><kbd>T</kbd> light or dark</div>
        </div>
      </div>
      <div class="section"><button class="nav" data-go="${first.id}" style="max-width:none"><span class="nn">${first.num}</span><span class="nt">Begin: ${esc(first.title)}</span><span>→</span></button></div>
    </div>`;
  }

  function renderEnd() {
    const o = D.outro;
    const f = D.facts;
    const last = stages[stages.length - 1];
    const fake = { track: 'feature', runState: { run: 'REBUILD-MINIDON', state: f.finalState }, kind: 'end' };
    const caps = ['Accounts', 'Following', 'Posting', 'Timelines', 'Notifications', 'Moderation'];
    const r = f.rust;
    return `<div class="wrap">
      <div class="eyebrow"><span>After step ${esc(last.num)}</span><span class="dot">·</span><span class="badge wait">Run is not finished</span></div>
      <h1 class="title">${esc(o.title)}</h1>
      <div class="story">${o.story.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      ${rail(fake)}
      <div class="section"><h2>Stories in the epic</h2>
        <div class="stories">${caps.map((c, k) => `<div class="story-cell ${k === 0 ? 'done' : ''}"><b>${k === 0 ? 'Built, at PR_RAISED' : `Story ${k + 1}, not started`}</b>${esc(c)}</div>`).join('')}</div>
      </div>
      <div class="section grid g2">
        <div class="card"><h3 style="margin-top:0">What the repositories say</h3>
          <dl class="kv">
            <dt>Run state</dt><dd>${esc(f.finalState ?? 'unknown')}</dd>
            ${r ? `<dt>Rust branch</dt><dd>${esc(r.branch)} (${r.commits} commits, head ${esc(r.head)})</dd>
            <dt>Branches</dt><dd>${esc(r.branches.join(', '))}</dd>
            <dt>Rust remote</dt><dd>${r.remote ? esc(r.remote) : 'none, so no pull request can exist yet'}</dd>` : ''}
            <dt>Context remote</dt><dd>${f.contextRemote ? esc(f.contextRemote) : 'none'}</dd>
          </dl>
          <p class="small" style="margin-bottom:0">Read from git when this page was built (${fmtDate(D.generated)}).</p>
        </div>
        <div class="card"><h3 style="margin-top:0">Not reached yet</h3><ul class="list no">${o.notReached.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="card"><h3 style="margin-top:0">Be honest about</h3><ul class="list warn">${o.caveats.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="card"><h3 style="margin-top:0">What would happen next</h3><ul class="list next">${o.next.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
    </div>`;
  }

  function rail(s) {
    const t = D.tracks[s.track];
    const cur = stateOf(s);
    const all = t.groups.flatMap((g) => g.states);
    const ci = all.indexOf(cur);
    const groups = t.groups.map((g) => {
      const dots = g.states.map((st) => {
        const i = all.indexOf(st);
        const cls = ['rd', t.gates.includes(st) ? 'gate' : '', ci >= 0 && i < ci ? 'done' : '', i === ci ? 'cur' : ''].join(' ');
        return `<span class="${cls}" title="${esc(st)}"></span>`;
      }).join('');
      const n = g.states.length;
      const pos = (k) => n === 1 ? 50 : (k / (n - 1)) * 100;
      const labels = g.states.map((st, k) => {
        const isGate = t.gates.includes(st);
        const isCur = st === cur;
        if (!isGate && !isCur) return '';
        const left = `calc(4px + (100% - 8px) * ${pos(k) / 100})`;
        const text = isCur ? st : (D.gateNames[st] || st).replace(/ \(.*\)$/, '');
        return `<span class="${isCur ? 'cur' : 'gate'}" style="left:${left}">${esc(text)}</span>`;
      }).join('');
      const doneIn = g.states.filter((st) => all.indexOf(st) < ci).length;
      const lastDone = g.states.includes(cur) ? g.states.indexOf(cur) : doneIn === n ? n - 1 : doneIn > 0 ? doneIn - 1 : -1;
      const fill = lastDone > 0 ? `<span class="fill" style="width:calc((100% - 8px) * ${lastDone / (n - 1)})"></span>` : '';
      return `<div class="rail-group" style="--n:${n}"><div class="gl">${esc(g.label)}</div><div class="rail-dots">${fill}${dots}</div><div class="rail-labels">${labels}</div></div>`;
    }).join('');
    const head = s.runState
      ? `<span>${esc(t.label)} <b>${esc(s.runState.run)}</b></span><span>State <b>${esc(s.runState.state)}</b></span>`
      : `<span>${esc(t.label)}</span><span>Not opened yet</span>`;
    return `<div class="rail"><div class="rail-head">${head}</div><div class="rail-groups">${groups}</div>
      ${!s.runState ? '<div class="rail-note">The story run is opened in step 05.</div>' : ''}</div>`;
  }

  function renderStage(s) {
    const i = stages.indexOf(s);
    const ch = D.chapters[s.chapter];
    const ms = priorMilestones(i);
    const recap = ms.length
      ? `<div class="recap">So far: ${ms.slice(-4).map((m) => `<b>${esc(m.text)}</b>`).join('<span class="arrow">→</span>')}</div>`
      : `<div class="recap">So far: nothing yet. This is the first step.</div>`;
    const tabs = [['story', 'Story', 'S'], ['evidence', 'Evidence', 'E'], ['hood', 'Under the hood', 'U']]
      .map(([k, l, key]) => `<button class="tab ${state.layer === k ? 'on' : ''}" data-layer="${k}">${l} <kbd>${key}</kbd></button>`).join('');
    const body = state.layer === 'story' ? storyLayer(s) : state.layer === 'evidence' ? evidenceLayer(s) : hoodLayer(s);
    return `<div class="wrap">
      <div class="eyebrow"><span>Chapter ${s.chapter + 1} · ${esc(ch?.title ?? '')}</span><span class="dot">·</span><span>Step ${esc(s.num)} of ${stages.length}</span>${kindBadge(s)}</div>
      ${recap}
      <h1 class="title">${esc(s.title)}</h1>
      <div class="tabs" role="tablist">${tabs}</div>
      <div id="layer">${body}</div>
    </div>`;
  }

  function storyLayer(s) {
    let banner = '';
    if (s.kind === 'gate') {
      banner = `<div class="banner gate"><span class="icon">${icon.check}</span><div><b>Human checkpoint: ${esc(s.gate.name)}</b><div class="sub">Approved by ${esc(s.gate.by)} on ${fmtTime(s.gate.ts)}. The kernel ran ${s.gate.checks.length} checks before it allowed the move.</div></div></div>`;
    } else if (s.kind === 'arrive' || s.kind === 'atgate') {
      const g = D.gateNames[s.runState.state] || s.runState.state;
      banner = `<div class="banner wait"><span class="icon">${icon.pause}</span><div><b>Waiting at the ${esc(g)}</b><div class="sub">${s.kind === 'arrive' ? 'Agents cannot pass a gate. The run stays here until a person decides.' : 'The run is still held at the gate while a person settles open questions.'}</div></div></div>`;
    }
    return `<div class="story">${s.story.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      ${s.numbers.length ? `<div class="numbers">${s.numbers.map(([v, l]) => `<div class="num"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join('')}</div>` : ''}
      <div class="who">Done by ${s.who.map(whoChip).join('')}</div>
      ${banner}
      ${rail(s)}`;
  }

  function evidenceLayer(s) {
    let out = '';
    if (s.gate) {
      const g = s.gate;
      out += `<div class="decision"><h3><span class="badge gate">◆ ${esc(g.name)}</span> What was decided</h3>
        <div class="meta">Approved by ${esc(g.by)} on ${fmtTime(g.ts)}. The run moved to <code>${esc(g.to)}</code>.</div>
        ${g.decided ? `<ul>${g.decided.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
        <div class="foot">${g.source ? `<span>Recorded in <code>${esc(g.source)}</code></span>` : ''}${g.demo ? '<span class="badge wait">Demo assumption</span>' : ''}</div>
        <div class="foot"><span>Kernel checks passed:</span>${g.checks.map((c) => `<span class="check">${esc(c)}</span>`).join('')}</div></div>`;
    }
    if (s.note) out += `<div class="note"><span class="ni">Note</span><span>${esc(s.note)}</span></div>`;
    if (!s.artifacts.length) return out + '<p class="small">This step only moved the run. See Under the hood for the ledger entry.</p>';
    const sel = state.artifact[s.id] ?? 0;
    const a = s.artifacts[Math.min(sel, s.artifacts.length - 1)];
    const list = s.artifacts.map((x, k) => {
      const st = x.changed ? `<span class="st ${x.changed}">${x.changed === 'A' ? 'new' : x.changed === 'M' ? 'changed' : 'deleted'}</span>` : `<span class="st ref">${x.repo === 'minidon-rust' ? 'rust' : 'context'}</span>`;
      return `<button class="ev-item ${k === sel ? 'on' : ''}" data-art="${k}"><span class="t"><span>${esc(prettyName(x))}</span>${st}</span><span class="p">${esc(x.path)}</span></button>`;
    }).join('');
    return out + `<div class="ev"><div class="ev-list">${list}</div><div class="viewer" id="viewer">${viewer(s, a)}</div></div>`;
  }

  function prettyName(a) {
    if (a.kind === 'md') {
      const m = a.html.match(/<h1[^>]*>(.*?)<\/h1>/);
      if (m) return m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').slice(0, 70);
    }
    return a.name;
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

  function docBody(a) {
    if (a.kind === 'md') {
      const fm = a.meta ? `<dl class="fm">${a.meta.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '';
      return `<div class="doc">${fm}${a.html.replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, '</table></div>')}</div>`;
    }
    if (a.kind === 'json') {
      try { return `<div class="jv">${jsonView(JSON.parse(a.text), 0)}</div>`; } catch { return codeView(a.text); }
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
    return `<span class="s">${esc(v)}</span>`;
  }
  function summaryOf(v, i) {
    if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? '' : 's'}`;
    const id = v.id ?? v.ID ?? v.name ?? v.title ?? v.capability ?? v.path;
    const label = v.title ?? v.name ?? v.summary ?? v.statement ?? v.description ?? v.text;
    const bits = [];
    if (id != null && typeof id !== 'object') bits.push(`<b>${esc(id)}</b>`);
    if (label != null && typeof label !== 'object' && label !== id) bits.push(esc(String(label).slice(0, 110)));
    return bits.length ? bits.join(' · ') : i != null ? `<b>#${i + 1}</b>` : `${Object.keys(v).length} fields`;
  }
  function jsonView(v, depth) {
    if (isPrim(v)) return prim(v);
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
      if (isPrim(x) || (Array.isArray(x) && x.every(isPrim))) return `<dt>${esc(k)}</dt><dd>${jsonView(x, depth + 1)}</dd>`;
      const open = depth < 1;
      return `<dt>${esc(k)}</dt><dd><details ${open ? 'open' : ''}><summary>${summaryOf(x)}</summary><div class="in">${jsonView(x, depth + 1)}</div></details></dd>`;
    }).join('')}</dl>`;
  }
  function codeView(text) {
    return `<pre class="code">${text.replace(/\n$/, '').split('\n').map((l) => `<span class="l">${esc(l) || ' '}</span>`).join('')}</pre>`;
  }
  function ledgerTable(text) {
    const rows = text.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    return `<div class="jv"><div class="tw"><table><thead><tr><th>#</th><th>time</th><th>move</th><th>actor</th><th>trigger</th><th>reason</th></tr></thead><tbody>${rows.map((e) => `<tr><td>${e.seq}</td><td>${fmtTime(e.ts)}</td><td><code>${esc(e.from)}</code> → <code>${esc(e.to)}</code></td><td>${esc(e.actor?.id)}</td><td>${esc(e.trigger)}</td><td>${esc(e.reason ?? '')}</td></tr>`).join('')}</tbody></table></div></div>`;
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
    checkout.push(term('git switch master', 'come back afterwards'));
    checkout.push(term(`git show --stat ${c.short}`, 'list what this step changed'));

    const cmds = s.commands.map((x) => {
      let meta = '';
      if (x.source === 'ledger') {
        meta = `<div class="cmd-meta"><span>Rebuilt from ledger entry <b>#${x.seq}</b> of ${esc(x.run)}</span><span>·</span><span>${esc(x.actor)}</span><span>·</span><span>${fmtTime(x.ts)}</span><span>·</span><span class="tr">${esc(x.from)} → ${esc(x.to)}</span></div>`;
        if (x.checks?.length) meta += `<div class="checks">${x.checks.map((k) => `<span class="check">${esc(k)}</span>`).join('')}</div>`;
      } else if (x.source === 'review') {
        meta = `<div class="cmd-meta"><span>Rebuilt from the baseline review session log</span><span>·</span><span>${esc(x.actor)}</span><span>·</span><span>${fmtTime(x.ts)}</span></div>`;
      } else {
        meta = '<div class="cmd-meta"><span>From the walkthrough notes (not recorded in a ledger)</span></div>';
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
      <section><h3>Commit</h3><div class="card"><dl class="kv">
        <dt>SHA</dt><dd>${esc(c.sha)}</dd><dt>Subject</dt><dd style="font-family:var(--sans)">${esc(s.subject)}</dd>
        <dt>Date</dt><dd>${fmtTime(c.date)}</dd><dt>Author</dt><dd>${esc(c.author)}</dd>
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
    main.innerHTML = p.type === 'start' ? renderStart() : p.type === 'end' ? renderEnd() : renderStage(p.stage);
    document.title = `${p.type === 'stage' ? `${p.stage.num} ${p.stage.title}` : p.type === 'end' ? 'Where it ends' : 'Start'} · Millwright walkthrough`;
    afterRender();
  }

  function afterRender() {
    const nodes = [...document.querySelectorAll('pre.mermaid:not([data-processed])')];
    if (nodes.length && window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false, theme: document.documentElement.classList.contains('light') ? 'neutral' : 'dark', securityLevel: 'strict', fontFamily: 'inherit' });
      window.mermaid.run({ nodes }).catch(() => {});
    }
    document.querySelectorAll('.doc a[href]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
  }

  function rerenderLayer() {
    const p = pages[state.page];
    if (p.type !== 'stage') return;
    const main = document.getElementById('main');
    const top = main.scrollTop;
    main.innerHTML = renderStage(p.stage);
    main.scrollTop = top;
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
    if (changed) document.getElementById('main').scrollTop = 0;
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
      const el = [...document.querySelectorAll('.fhead[data-file]')].find((x) => x.dataset.file === opts.file);
      if (el) el.scrollIntoView({ block: 'center' });
    }
  }
  const step = (d) => { const i = Math.max(0, Math.min(pages.length - 1, state.page + d)); if (i !== state.page) location.hash = pages[i].id; };
  const setLayer = (l) => { if (pages[state.page].type === 'stage' && state.layer !== l) { state.layer = l; rerenderLayer(); } };

  // ---------------------------------------------------------------- search

  const index = [];
  D.chapters.forEach((c, ci) => { const s = stages.find((x) => x.chapter === ci); if (s) index.push({ type: 'chapter', title: `${ci + 1}. ${c.title}`, sub: c.blurb, go: s.id }); });
  index.push({ type: 'page', title: 'Start here', sub: 'The three repositories and how to get around', go: 'start' });
  stages.forEach((s) => {
    index.push({ type: s.kind === 'gate' ? 'gate' : 'step', title: s.kind === 'gate' ? `${s.gate.name}: ${s.title}` : s.title, sub: `${s.num} · ${s.subject}`, num: s.num, go: s.id, text: s.story.join(' ') });
  });
  index.push({ type: 'page', title: 'Where the run ends', sub: 'PR_RAISED, story 1 of 6, no pull request yet', go: 'end' });
  stages.forEach((s) => s.artifacts.forEach((a, k) => index.push({ type: 'artifact', title: prettyName(a), sub: `${s.num} · ${a.path}`, num: s.num, go: s.id, layer: 'evidence', art: k })));
  const seenFile = new Set();
  stages.forEach((s) => s.files.forEach((f) => {
    if (/\/history\//.test(f.path)) return;
    const k = `${s.id}:${f.path}`;
    if (seenFile.has(k)) return;
    seenFile.add(k);
    index.push({ type: 'file', title: f.path.split('/').pop(), sub: `${s.num} · ${f.path}`, num: s.num, go: s.id, layer: 'hood', file: `${s.id}:${f.path}` });
  }));
  const typeRank = { chapter: 0, page: 1, gate: 1, step: 2, artifact: 3, file: 4 };

  function search(qs) {
    const q = qs.trim().toLowerCase();
    if (!q) return index.filter((x) => x.type === 'chapter' || x.type === 'gate' || x.type === 'page').slice(0, 30);
    const terms = q.split(/\s+/);
    const scored = [];
    for (const x of index) {
      const hay = `${x.title} ${x.sub} ${x.text ?? ''}`.toLowerCase();
      if (!terms.every((t) => hay.includes(t))) continue;
      let sc = typeRank[x.type] * 10;
      if (x.num && (+x.num === +q)) sc -= x.type === 'step' || x.type === 'gate' ? 100 : 20;
      if (x.title.toLowerCase().includes(q)) sc -= 5;
      scored.push([sc, x]);
    }
    return scored.sort((a, b) => a[0] - b[0]).slice(0, 50).map((x) => x[1]);
  }

  function openSearch() {
    closeOverlay();
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="palette" role="dialog" aria-label="Jump to"><input id="q" placeholder="Jump to a step, gate, artifact or file. Try 16, gate, adr, impact" autocomplete="off" spellcheck="false"><div class="results" id="results"></div></div>`;
    document.body.appendChild(ov);
    state.overlay = { el: ov, kind: 'search', sel: 0, items: [] };
    const input = ov.querySelector('#q');
    const draw = () => {
      const o = state.overlay;
      o.items = search(input.value);
      o.sel = Math.min(o.sel, Math.max(0, o.items.length - 1));
      ov.querySelector('#results').innerHTML = o.items.length ? o.items.map((x, i) => `<div class="res ${i === o.sel ? 'on' : ''}" data-i="${i}"><span class="ty">${x.type}</span><span class="rt2"><b>${esc(x.title)}</b><span>${esc(x.sub)}</span></span></div>`).join('') : '<div class="empty">Nothing matches.</div>';
      ov.querySelector('.res.on')?.scrollIntoView({ block: 'nearest' });
    };
    input.addEventListener('input', () => { state.overlay.sel = 0; draw(); });
    input.addEventListener('keydown', (e) => {
      const o = state.overlay;
      if (e.key === 'ArrowDown') { o.sel = Math.min(o.items.length - 1, o.sel + 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { o.sel = Math.max(0, o.sel - 1); draw(); e.preventDefault(); }
      else if (e.key === 'Enter') { const x = o.items[o.sel]; if (x) pick(x); e.preventDefault(); }
      else if (e.key === 'Escape') { closeOverlay(); e.preventDefault(); }
      e.stopPropagation();
    });
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeOverlay(); });
    ov.addEventListener('click', (e) => { const r = e.target.closest('.res'); if (r) pick(state.overlay.items[+r.dataset.i]); });
    draw();
    input.focus();
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
      ['<kbd>1</kbd> to <kbd>9</kbd>', 'First step of that chapter'], ['<kbd>0</kbd>', 'Start page'], ['<kbd>G</kbd> or <kbd>/</kbd>', 'Jump to any step, gate, artifact or file. Type a number for a step.'],
      ['<kbd>S</kbd> <kbd>E</kbd> <kbd>U</kbd>', 'Story, Evidence, Under the hood'], ['<kbd>Esc</kbd>', 'Close this, or go back to the Story layer'],
      ['<kbd>T</kbd>', 'Light or dark theme (for projectors)'], ['<kbd>F</kbd>', 'Full screen'], ['Browser Back', 'Previous place you visited. Every step has its own link.'],
    ];
    ov.innerHTML = `<div class="help" role="dialog" aria-label="Keyboard shortcuts"><h2>Keys</h2><table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table></div>`;
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
    const t = e.target.closest('[data-go],[data-act],[data-layer],[data-art],[data-view],[data-file],[data-copy]');
    if (!t) return;
    if (t.dataset.copy != null) return copy(t.dataset.copy, t);
    if (t.dataset.go) return go(t.dataset.go);
    if (t.dataset.layer) return setLayer(t.dataset.layer);
    const p = pages[state.page];
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
    if (act === 'search') openSearch();
    if (act === 'help') openHelp();
    if (act === 'theme') toggleTheme();
  });

  function toggleTheme() {
    const light = document.documentElement.classList.toggle('light');
    try { localStorage.setItem('wt-theme', light ? 'light' : 'dark'); } catch {}
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
    else if (k === 'g' || k === 'G' || k === '/') openSearch();
    else if (k === '?') openHelp();
    else if (k === 'Escape') setLayer('story');
    else if (k === 's' || k === 'S') setLayer('story');
    else if (k === 'e' || k === 'E') setLayer('evidence');
    else if (k === 'u' || k === 'U' || k === 'h' || k === 'H') setLayer('hood');
    else if (k === 't' || k === 'T') toggleTheme();
    else if (k === 'f' || k === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); }
    else if (k === '0') location.hash = 'start';
    else if (/^[1-9]$/.test(k)) { const s = stages.find((x) => x.chapter === +k - 1); if (s) location.hash = s.id; else return; }
    else return;
    e.preventDefault();
  });

  // Tooltips on the timeline.
  let tip = null;
  document.addEventListener('mouseover', (e) => {
    const m = e.target.closest('[data-tip]');
    if (!m) { tip?.remove(); tip = null; return; }
    const [n, t] = m.dataset.tip.split('|');
    tip?.remove();
    tip = document.createElement('div');
    tip.className = 'tip';
    tip.innerHTML = `<span class="n">Step ${esc(n)}</span>${esc(t)}`;
    document.body.appendChild(tip);
    const r = m.getBoundingClientRect();
    const w = tip.offsetWidth;
    tip.style.left = `${Math.min(window.innerWidth - w / 2 - 8, Math.max(w / 2 + 8, r.left + r.width / 2))}px`;
    tip.style.top = `${r.bottom}px`;
  });

  try { if (localStorage.getItem('wt-theme') === 'light') document.documentElement.classList.add('light'); } catch {}
  frame();
  window.addEventListener('hashchange', fromHash);
  state.page = -1;
  fromHash();
})();
