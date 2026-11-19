# minidon-context

A worked example of a real Millwright run, used to onboard teams to the harness. Agents map a
small Python app (minidon), a person approves the map, and part 1 of 6 (Accounts) is rebuilt in
Rust. The walkthrough page replays the run step by step, one step per commit.

## Run the walkthrough

You need git, Node 18 or newer, a browser, and read access to the three repos. VS Code is
optional (for the "Open in VS Code" buttons).

```sh
mkdir millwright-demo && cd millwright-demo
git clone git@github.com:kurtistw/minidon.git
git clone git@github.com:kurtistw/minidon-context.git
git clone git@github.com:kurtistw/minidon-rust.git
git -C minidon-rust switch story-1-accounts
cd minidon-context
node walkthrough/build.mjs
open walkthrough/index.html
```

The build should end with `33 steps ... 28 Rust commits ... 0 warning(s)`. Always build once after
cloning: the committed page points its file links and VS Code buttons at the author's machine,
and the build repoints them at your clones. The page is one self-contained file, so no server is
needed, and it works offline. On Windows or Linux, open the file in a browser instead of using `open`.

## Presenting it

The page opens on a **45-minute workshop**: 11 beats along a story arc, with the core idea on every
beat: *Agents do the work. You make every call. The run proves it.* After the beats come all 33
steps of the run, for showing the evidence.

| Minute | Beat | The room does |
|---|---|---|
| 0 | The promise | |
| 2 | Connect | Pairs share one legacy surprise (2 min) |
| 5 | One ticket, one hard word | |
| 7 | The surprise | Hands up: 30 or 60? Then reveal (1 min) |
| 10 | You decide | Groups of 3 play the person at the gate: approve the map or send it back (4 min) |
| 16 | What the map cannot know | |
| 19 | The loop | |
| 23 | The target moved on | Pairs: what do you ask at the code plan gate? (4 min) |
| 30 | Checked against Python | Shout a number, then reveal (1 min) |
| 35 | New bliss | |
| 39 | Your first step | Write a card, swap, ask one question (3 min) |

Before the session:

- Press `N` (or **Presenter notes**) to check what to say on each beat, then turn the notes off
  again. They show on the projector too, so keep them off while presenting.
- Print `.mw/context/conflicts.md` (7 conflicts), one copy per group of 3, for the "You decide" beat.
- Read [walkthrough/answer-key.md](walkthrough/answer-key.md). The surprise beat says openly
  that the agents only half-found the staff-suspension trap; the key explains it.

| Do this | How |
|---|---|
| Next beat or step, or reveal the answer on a beat | Right arrow or `Space` (a beat with a reveal shows it first) |
| Previous | Left arrow, or the links at the bottom |
| Show the real step behind a beat | Click **See it in the run: step NN** |
| Go back to the workshop from a step | **Workshop**, or `0` for the first beat |
| Presenter notes on a beat | `N`, or **Presenter notes** |
| Jump to a stage | `1` to `9`, or click it in the top bar |
| See every step and pick one | `G`, or **All steps** |
| Show every state the run can be in, and where it is now | `M`, or **Run states** next to the scope label |
| Show the developer view (file tree, Commands tab, every check) | `R`, or **Full detail** |
| Story, Documents and Commands tabs | `S`, `D`, `C` |
| Light or dark theme (dark suits projectors) | `T` |
| Full screen | `F` |
| How the page works, and all keys | `?` |

On each of the 33 steps, the left side tells what happened and the right side shows the
repository right after that step's commit: the file tree, any file as a readable page, and the diff.

- **Who did it**: an agent or a person.
- **Commands**, drawn as the app they happened in: a Claude Code window for the slash command
  that started the agents, a VS Code window for files a person edited, and a Terminal window for
  shell commands. Each title bar says in plain words who did what. Repeated
  `millwright transition` calls collapse into one line; **show all** opens them.
- **Read** and **Wrote**: click a document to open it on the right.
- **The loop** on Research pack, Build, and Review and PR: draft, review, correct, and round
  again until a person approves.
- **Human gates** (person icon in the top bar): what the work was, the one question a person
  answered, and what Millwright checked, including that a person decided.
- **Scope label**: *Whole rebuild* until research is approved, then *Story 1 of 6: Accounts*.
- **Two diagrams.** Step 07 shows where a team adds context the map can't know (research inputs).
  Step 25 shows that every story's code plan reads the target repo as it is today; press **What if
  the target moved on?** to show a mismatch being caught at the code plan gate (an invented example).

If someone asks to see the run behind a beat, use its step links. Good steps to show: **03** (the
first human gate), **07** (adding your own context), **11 to 18** (the research loop), **25** (the
plan reads the target repo), **29** (the build and its comparisons with Python), and **33** (what
happens to the pull request next).

Be clear with the room that this was a demo run: one person (Kurtis) played every role, and some
answers were drafted by an agent in his name. The page marks these as demo assumptions.
Don't show the answer key before the discovery beats.

## The repositories

| Repository | Role |
|---|---|
| [minidon](https://github.com/kurtistw/minidon) | The legacy Python app. Read only. The run never changes it. |
| minidon-context (this repo) | The Millwright workspace: the map, the run, every review and decision. |
| [minidon-rust](https://github.com/kurtistw/minidon-rust) | The Rust rebuild. Part 1 (Accounts) is on branch `story-1-accounts`. |

Where the run stands:

- Run `REBUILD-MINIDON` is at `PR_RAISED`. Part 1 is built, reviewed, and approved at the code
  approval gate.
- The pull request description is in `.mw/runs/REBUILD-MINIDON/repos/minidon-rust/pr.json`. The
  PR itself has not been opened. A person opens, reviews and merges it, then release approval
  follows.

How the history maps to the page:

- Commits `01 - ...` to `33 - ...` are the steps, and commit N is step N. Tags `stage-01` to
  `stage-03` mark discovery.
- Other commits (`chore - ...`, `38 - add walkthrough site`, `Walkthrough: ...`) change tooling or
  this page, and are not steps.
- `git checkout <sha>` shows the workspace after that step. Old snapshots have no
  `walkthrough/` folder, so run `git checkout main` to come back.

## Changing the walkthrough

| File | Holds |
|---|---|
| `walkthrough/stages.mjs` | All the wording: the workshop beats (`workshop`), with presenter notes and room activities; stages and loops; and for each step its story, window summaries (`sum`), edited files (`edits`), slash command (`launch`) and gate decisions |
| `walkthrough/build.mjs` | Reads git and the run ledger, writes `index.html` |
| `walkthrough/app.js`, `app.css` | How the page renders |

After any change, run `node walkthrough/build.mjs` and commit `index.html` with it. The build warns
when the wording disagrees with git, for example a step that claims to edit a file its commit
never touched, or a beat that quotes text no longer in the run. Keep it at 0 warnings. Use `--rust <path>` if minidon-rust is not next to this
repo.
