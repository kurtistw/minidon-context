# minidon-context

A worked example of a Millwright run, for onboarding teams to the harness. A small Python app,
minidon, is mapped by agents, approved by a human, and the first of its six parts (Accounts) is
rebuilt in Rust.

**Start here: open [walkthrough/index.html](walkthrough/index.html) in a browser.** It is one
self-contained file and needs no server. Each of the 33 steps is one real commit in this repo, with
the same number (`10 - ...` is step 10). The
left side tells the story of the step and draws it as a flow: what was read, who did the work
(an agent or a person), what was written, and the next human decision. The right side shows the repository right after that
commit: the file tree with new files in green and changed ones in yellow, any file as a readable
page, the commands that were run, and the diff.

The page opens in a calm view: each step's story, who did it, the exact commands that
ran (copyable) split by who ran them, including the slash command Kurtis typed in Claude Code
to start each stage's agents, what it read and wrote, the next human gate, and one line with the real commit. The top bar groups the nine stages into three
acts, with a person icon for each human gate (filled once approved); the row under it shows the steps of the current stage. Every step carries a scope label: **Whole rebuild** up to the
research approval, then **Story 1 of 6: Accounts**. Research pack, Build, and Review and PR steps draw their loop
in two lanes, agents and Kurtis, with the current step lit and a dashed arc for the way back
(another review round, or a rejection at the gate). The last step also shows what happens to the pull request next: merged, or
back round the review loop with fixes. A human gate step shows three bands: the work done
since the last gate (by agents and by Kurtis), the one question a person answers (with what they read and what they decided), and what Millwright checks. **Full detail**
(top bar, or `R`) adds the file tree, the commit footer, the gate as it ran in the terminal with every check, and the Commands tab for developers. Each step that points at a document opens it at the passage that matters, with an Open repo in VS
Code button: it opens the whole repository first, then the file at that passage.

Keys: arrows to step, `1`-`9` to jump to a stage, `G` (or the All steps button) to see every step and click one, `S` / `D` / `C` for the Story,
Documents and Commands tabs, `R` for full detail, `T` for the theme, `F` for full screen, and `?` for how the page works and all keys.

## The three repositories

| Repository | Role |
|---|---|
| [minidon](https://github.com/kurtistw/minidon) | The legacy Python app. Read only, never changed by the run. |
| minidon-context (this repo) | The Millwright workspace: the map, the run, every review and decision, one commit per step. |
| [minidon-rust](https://github.com/kurtistw/minidon-rust) | The Rust rebuild. Part 1 (Accounts) is on branch `story-1-accounts`, ready to raise as a PR into `main`. |

Clone all three side by side, in one folder. The walkthrough reads `../minidon-rust` for the
build stages, and `millwright.config.yaml` lists the repo paths.

## Where the run is

- Run `REBUILD-MINIDON` is at `PR_RAISED`: part 1 of 6 is built, reviewed and approved at the code approval gate.
- Millwright wrote the pull request description in
  `.mw/runs/REBUILD-MINIDON/repos/minidon-rust/pr.json`. No pull request has been opened yet.
  Reviewing and merging it is a human decision, and the release approval comes after that.
- Every step commit is named `NN - activity: what happened` (`01 - ...` to `33 - ...`). Tags
  `stage-01` to `stage-03` mark discovery. Commits without that pattern, such as
  `38 - add walkthrough site` and `add walkthrough`, only add the walkthrough and are not steps.
- `git checkout <sha>` shows the workspace as it was after that step. Older snapshots do not
  contain `walkthrough/`, so run `git checkout main` to come back.

## Rebuilding the walkthrough

```sh
node walkthrough/build.mjs
```

Needs Node 18+ and git, nothing else. It reads the git history of this repo and of
`../minidon-rust` (or `--rust <path>`). The plain-language text and the gate decisions are in
`walkthrough/stages.mjs`. Facilitator notes on the planted discovery traps are in
`walkthrough/answer-key.md`.
