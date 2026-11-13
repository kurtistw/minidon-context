// Hand-written narrative for the walkthrough. build.mjs joins it with what it reads from git.
//
// Everything that can be read from the repository (SHAs, dates, files, diffs, ledger entries,
// run states, kernel checks, commands) is read by build.mjs. This file only holds what git
// cannot say: the plain-language story, the chapter a step belongs to, which artifacts matter
// most, and what a human decided at a gate.
//
// Steps are keyed by the two-digit number at the start of the commit subject ("17 - ...").
// A numbered commit with no entry here still appears, using its commit subject as the story.
//
// Artifact paths are relative to the minidon-context root. "@run/" is short for
// ".mw/runs/REBUILD-MINIDON/" and "rust:" reads a file from minidon-rust at the end of the build.

export const RUN_ID = 'REBUILD-MINIDON';

export const intro = {
  title: 'A legacy rebuild, run through Millwright',
  story: [
    'We took a small Python app, minidon, and rebuilt its first slice in Rust.',
    'Agents did the work. A named person approved every important step.',
  ],
  cast: [
    { name: 'minidon', role: 'The legacy system', text: 'A small Mastodon-style app in Python. Read only, never changed.' },
    { name: 'minidon-context', role: 'The Millwright workspace', text: 'Where every map, plan, review and decision is written down, one commit per step.' },
    { name: 'minidon-rust', role: 'The new system', text: 'The Rust rebuild. Story 1 (Accounts) is built here.' },
  ],
  ideas: [
    { title: 'Runs and states', text: 'A run is one unit of work. It moves through fixed states, and the CLI refuses illegal moves.' },
    { title: 'Agents do, people decide', text: 'Agents write the artifacts. Only a human passes a gate.' },
    { title: 'Everything is a file', text: 'State, history and decisions live in git. Nothing is hidden in a server.' },
    { title: 'STATED or DERIVED', text: 'Every rule says where it came from: a person or a document, or an inference from code.' },
  ],
};

export const chapters = [
  { id: 'setup', title: 'Set up', blurb: 'Install Millwright into a workspace next to the legacy code.', steps: ['01'] },
  { id: 'discover', title: 'Discover', blurb: 'Agents map the legacy system; a human signs off the map.', steps: ['02', '03'] },
  { id: 'ticket', title: 'Open the work', blurb: 'Write the ticket and open a run for it.', steps: ['04', '05'] },
  { id: 'inputs', title: 'Research inputs', blurb: 'Check what we know against what research needs.', steps: ['06', '07', '08', '09'] },
  { id: 'scope', title: 'Scope the story', blurb: 'Pin the work to one capability and start research.', steps: ['10', '11', '12', '13'] },
  { id: 'research', title: 'Research pack', blurb: 'Draft, review, fix and approve the research.', steps: ['14', '15', '16', '17', '18', '19', '20', '21', '22'] },
  { id: 'plan', title: 'Plan and spec', blurb: 'Turn research into a plan, a spec and design decisions.', steps: ['23', '24', '25', '26', '27', '28'] },
  { id: 'build', title: 'Build', blurb: 'Plan the code, review the plan, build test-first.', steps: ['29', '30', '31', '32', '33', '34'] },
  { id: 'review', title: 'Review and stop', blurb: 'Independent review, the last human gate, and where the run ends.', steps: ['35', '36', '37'] },
];

// The states a run passes through, in order, grouped by Millwright activity. Gate states are
// the human checkpoints. Parallel branch states map onto the main state they run under.
export const tracks = {
  baseline: {
    label: 'Baseline run',
    groups: [
      { label: 'Activity 1 - Discover', states: ['CREATED', 'INGEST', 'GRAPH', 'DOMAIN_MAP', 'BRD_DRAFT', 'BASELINE_PREP', 'BASELINE_REVIEW', 'BASELINE_CONFIRMED'] },
    ],
    gates: ['BASELINE_REVIEW'],
    parallel: {},
  },
  feature: {
    label: 'Story run',
    groups: [
      { label: 'Research and plan', states: ['PULLED', 'CONTEXT_READY', 'RESEARCH_INTAKE', 'RESEARCH_DRAFT', 'RESEARCH_READY', 'RESEARCH_REVIEW', 'PLAN_DRAFT', 'PRD_REVIEW', 'SPEC_DRAFT', 'READY_FOR_DEV_PENDING', 'READY_FOR_DEV'] },
      { label: 'Build', states: ['REPO_PLAN', 'PLAN_REVIEW', 'GATE_A', 'BUILD', 'TESTS_LANDED', 'CHANGE_REVIEW', 'GATE_B', 'PR_RAISED', 'MERGED'] },
      { label: 'Release', states: ['SPEC_FOLDBACK', 'ACCEPTANCE_AUTOMATION', 'UAT_DEPLOYED', 'GATE_C', 'RELEASED', 'MONITORING', 'CLOSED'] },
    ],
    gates: ['RESEARCH_REVIEW', 'PRD_REVIEW', 'READY_FOR_DEV', 'GATE_A', 'GATE_B', 'GATE_C'],
    parallel: {
      RESEARCH_ESTIMATE: 'RESEARCH_DRAFT',
      RESEARCH_SECURITY: 'RESEARCH_DRAFT',
      RESEARCH_FLOWS: 'RESEARCH_DRAFT',
      QA_TEST_AUTHOR: 'SPEC_DRAFT',
      ARCH_DECISION: 'SPEC_DRAFT',
    },
  },
};

export const gateNames = {
  BASELINE_REVIEW: 'Baseline gate',
  RESEARCH_REVIEW: 'Research gate',
  PRD_REVIEW: 'PRD gate',
  READY_FOR_DEV: 'Ready for dev',
  GATE_A: 'Gate A (plan)',
  GATE_B: 'Gate B (code)',
  GATE_C: 'Gate C (release)',
};

const DEMO = 'Demo assumption: one person (Kurtis) held every role. Several answers were drafted by an agent in his name, as plausible guesses a real PO, BA or Tech Lead would confirm.';

export const steps = {
  '01': {
    title: 'Install Millwright into a workspace',
    story: ['Millwright is installed into a new, empty workspace that sits next to the legacy code.', 'It adds agents, commands and templates. It does not touch the legacy code.'],
    who: ['human'],
    numbers: [['78', 'files added'], ['22', 'agents'], ['0', 'legacy files changed']],
    milestone: 'Workspace set up',
    artifacts: ['millwright.config.yaml', 'CLAUDE.md', '.mw/docs/transcript-2026-10-01-moderation.md', '.mw/notes/decisions/ADR-001-edit-window.md'],
    commands: ['millwright init --name minidon', 'millwright sync'],
    note: 'Two documents were added here as discovery inputs: a meeting transcript and a decision record. Both were captured with a broken shell heredoc. The transcript even contains the "what a good run should find" answer key. The discovery agents noticed the broken record (see conflict CF-001), but a clean rerun should fix these files first.',
  },
  '02': {
    title: 'Agents map the legacy system',
    story: ['Five agents read the Python code and the documents, and build a map: domains, capabilities and business rules.', 'Every rule says where it came from, and anything that disagrees becomes a conflict for a human.'],
    who: ['ingestion-agent', 'graph-agent', 'domain-agent', 'ba-agent', 'baseline-review-agent'],
    numbers: [['6', 'capabilities'], ['81', 'business rules'], ['7', 'conflicts'], ['21', 'open questions']],
    milestone: 'Legacy system mapped',
    artifacts: ['.mw/context/domain-map.md', '.mw/context/conflicts.md', '.mw/context/capabilities/accounts/capability.md', '.mw/context/capabilities/accounts/rules-trace.md', '.mw/context/review-findings.md', '.mw/context/ingest-report.json'],
    commands: ['millwright context build --yes'],
    note: 'All three planted traps were found: the 30 versus 60 minute edit window (CF-001), the half-built lists feature (CF-002, unmapped code), and rules that exist only in code (labelled DERIVED).',
  },
  '03': {
    title: 'A human approves the map',
    story: ['A person works through all seven conflicts and the open questions, then signs off the map.', 'From here on, this approved map is what "current behaviour" means.'],
    who: ['human'],
    numbers: [['7 of 7', 'conflicts resolved'], ['21', 'questions answered'], ['1', 'domain signed off']],
    milestone: 'Baseline approved',
    artifacts: ['.mw/runs/BASELINE-2026-10-30/baseline-review-report.json', '.mw/context/baseline-review-report.md'],
    gate: {
      decided: [
        'CF-001: 60 minutes is correct. The README and the decision record are wrong; the 30-minute rule (Posting BR-009) is retired.',
        'CF-002: the half-built lists feature is dead code. It is left out and scheduled for deletion.',
        'CF-004: "find a user by username" becomes a stable identity API owned by Accounts.',
        'CF-007: the code is right. Only public and unlisted posts can be boosted.',
        'Domain L0-minidon signed off: all 6 capabilities approved.',
      ],
      source: '.mw/runs/BASELINE-2026-10-30/baseline-review-report.json',
    },
    note: 'The human-readable report at .mw/context/baseline-review-report.md was never updated after the gate. It still says PENDING. The JSON record is the real decision (and the research phase later said so explicitly).',
  },
  '04': {
    title: 'Write the ticket',
    story: ['A person writes the ticket: rebuild minidon in Rust, same behaviour, same data, no new features.'],
    who: ['human'],
    milestone: 'Ticket written',
    artifacts: ['.mw/tickets/REBUILD-MINIDON.md', 'millwright.config.yaml'],
    commands: ['# edit .mw/tickets/REBUILD-MINIDON.md and add minidon-rust to project.repos'],
  },
  '05': {
    title: 'Open a run for the ticket',
    story: ['Millwright opens a run for the ticket. From now on every move of this work is recorded.'],
    who: ['human'],
    milestone: 'Run opened',
    artifacts: ['@run/ticket.md', '@run/run.json'],
  },
  '06': {
    title: 'Set up research',
    story: ['Millwright creates an empty research folder with the questions research must answer.'],
    who: ['human'],
    artifacts: ['@run/research/outcome.json', '@run/research/inputs/README.md'],
    commands: ['millwright research init --run REBUILD-MINIDON'],
  },
  '07': {
    title: 'Check what we already know',
    story: ['Millwright checks the inputs against the approved map and lists the gaps.', 'It found 2 of 11 inputs and 30 gaps, 2 of them blocking.'],
    who: ['human'],
    numbers: [['2 of 11', 'inputs found'], ['30', 'gaps'], ['2', 'blocking']],
    artifacts: ['@run/research/gaps.md', '@run/research/inputs.json'],
  },
  '08': {
    title: 'Fill the gaps',
    story: ['A person supplies the missing inputs: who decides, and today\'s baseline numbers.', '23 of the 30 gaps are now closed.'],
    who: ['human'],
    numbers: [['23 of 30', 'gaps closed']],
    artifacts: ['@run/research/gaps.md', '@run/research/inputs/decision-makers.md', '@run/research/inputs/baseline-metrics.md'],
  },
  '09': {
    title: 'Waive what does not apply',
    story: ['The last 7 gaps are optional for a lift and shift, so a person waives them, each with a written reason.'],
    who: ['human'],
    numbers: [['0', 'open gaps'], ['7', 'waived with a reason']],
    milestone: 'Research inputs complete',
    artifacts: ['@run/research/gaps.md'],
  },
  '10': {
    title: 'Context is ready',
    story: ['The kernel checks the run against the map and lets it move on.'],
    who: ['planning-agent'],
    artifacts: ['@run/run.json'],
  },
  '11': {
    title: 'Pin the story to one capability',
    story: ['The whole rebuild is too big for one story, so it is split. Story 1 is Accounts: sign-up, sign-in and profiles.', 'One story, one capability, 14 rules.'],
    who: ['planning-agent'],
    numbers: [['1 of 6', 'capabilities'], ['14', 'rules in scope']],
    milestone: 'Story 1 scoped to Accounts',
    artifacts: ['@run/impact.json'],
  },
  '12': {
    title: 'Research starts',
    story: ['The run moves into research.'],
    who: ['planning-agent'],
    artifacts: ['@run/run.json'],
  },
  '13': {
    title: 'Research draft opens',
    story: ['The research agent takes over and starts drafting.'],
    who: ['research-agent'],
    artifacts: ['@run/run.json'],
  },
  '14': {
    title: 'Research agent drafts the pack',
    story: ['An agent writes the research pack: the outcome, risks, an estimate, security notes, the target state and user flows.'],
    who: ['research-agent'],
    numbers: [['7', 'parts in the pack'], ['12-25', 'person-days, agentic (estimate)']],
    artifacts: ['@run/research/outcome-brief.md', '@run/research/risks.json', '@run/research/estimate.json', '@run/research/security.md', '@run/research/target-state/principles.md', '@run/research/flows/journeys.md', '@run/research/flows/value-stream.md'],
  },
  '15': {
    title: 'Pack is complete',
    story: ['The pack has every required part, so the run moves to review.'],
    who: ['research-agent'],
    artifacts: ['@run/run.json'],
  },
  '16': {
    title: 'An independent agent reviews the research',
    story: ['A different agent checks the pack and finds 19 problems, 2 of them critical.', 'The headline number was wrong: 82 rules, when the map has 81 and one is retired.'],
    who: ['research-reviewer-agent'],
    numbers: [['19', 'findings'], ['2', 'critical']],
    artifacts: ['@run/research/reviews/research-review-001.md'],
  },
  '17': {
    title: 'A human corrects the inputs',
    story: ['A person fixes the inputs the review flagged: 81 rules, and the baseline gate record is the authority.'],
    who: ['human'],
    artifacts: ['@run/research/inputs/human-decisions.md', '@run/research/inputs/baseline-metrics.md'],
    note: DEMO,
  },
  '18': {
    title: 'Research agent redrafts',
    story: ['The research agent rewrites the pack from the corrected inputs. The target is now 80 of 80 live rules.'],
    who: ['research-agent'],
    numbers: [['80', 'rules to match'], ['16-34', 'person-days, agentic (estimate)']],
    artifacts: ['@run/research/outcome-brief.md', '@run/research/estimate.json', '@run/research/risks.json'],
  },
  '19': {
    title: 'Second review',
    story: ['The reviewer checks again: 16 of 19 fixed, no critical issues left.', 'It also probes the Python app and finds a surprise: "alice" followed by a newline is a separate, valid username.'],
    who: ['research-reviewer-agent'],
    numbers: [['16 of 19', 'fixed'], ['0', 'critical']],
    artifacts: ['@run/research/reviews/research-review-002.md'],
  },
  '20': {
    title: 'Security and flow findings decided',
    story: ['Security and user-flow reviews are folded into the design.', 'A person decides to copy the newline quirk on purpose, because this is a lift and shift. Fixing it comes later.'],
    who: ['human'],
    artifacts: ['@run/research/inputs/human-decisions.md', '@run/research/lanes/security-lane-review.md', '@run/research/lanes/flows-lane-review.md'],
    note: DEMO,
  },
  '21': {
    title: 'Research waits for a human',
    story: ['The run stops at the research gate. Only a person can let it through.'],
    who: ['research-reviewer-agent'],
    artifacts: ['@run/research/outcome-brief.md'],
  },
  '22': {
    title: 'Research approved',
    story: ['A person approves the research. Planning can start.'],
    who: ['human'],
    milestone: 'Research approved',
    artifacts: ['@run/research/outcome-brief.md', '@run/research/inputs/human-decisions.md'],
    gate: {
      decided: [
        'Parity target: 80 rules (81 in the map, minus the retired 30-minute rule).',
        'The baseline gate record is the authority on current behaviour.',
        'Known weaknesses are copied for parity and listed as follow-ups, not fixed here.',
        'The trailing-newline username is copied on purpose, with a parity test.',
        'Eight major security and flow findings are accepted into design (not fixed yet).',
      ],
      source: '@run/research/inputs/human-decisions.md',
      demo: true,
    },
  },
  '23': {
    title: 'Plan on one page',
    story: ['The planning agent writes a one-page plan for story 1 and lists 10 open points, each with an owner.'],
    who: ['planning-agent'],
    numbers: [['10', 'open points'], ['6', 'stories in the epic']],
    artifacts: ['@run/plan-onepager.md', '@run/open-points.md', '@run/assumptions.md'],
  },
  '24': {
    title: 'Open points answered',
    story: ['A person answers all 10 open points: why Rust, which stack, build order, test data.'],
    who: ['human'],
    numbers: [['10 of 10', 'answered']],
    artifacts: ['@run/open-points.md'],
    note: DEMO,
  },
  '25': {
    title: 'Plan approved',
    story: ['A person approves the plan. The agents can now write the spec.'],
    who: ['human'],
    milestone: 'Plan (PRD) approved',
    artifacts: ['@run/plan-onepager.md', '@run/open-points.md'],
    gate: {
      decided: [
        'Why Rust: one supported runtime, one binary, lower running cost. Parity first.',
        'Stack: stable Rust, axum, tokio, sqlx with SQLite, one container.',
        'Rust reads and writes the existing data exactly and never creates or changes the schema.',
        'Error shapes, the date format and 404 and 405 bodies are part of the contract.',
        'Test data is synthetic. No real user data.',
      ],
      source: '@run/open-points.md',
      demo: true,
    },
  },
  '26': {
    title: 'Spec, tests and design, in parallel',
    story: ['Three agents work side by side: one writes the spec, one plans the tests, one writes the design decisions.', 'Every requirement traces back to a rule in the map.'],
    who: ['spec-agent', 'qa-planning-agent', 'design-agent'],
    numbers: [['19', 'requirements'], ['14', 'rules traced'], ['2', 'design records']],
    artifacts: ['@run/spec/spec.md', '@run/test-plan.md', '@run/scenarios.md', '@run/adr/adr-001.md', '@run/adr/adr-002.md', '@run/traceability.json'],
  },
  '27': {
    title: 'Design questions answered',
    story: ['A person answers the design questions, and every known difference from Python is written into the test plan.'],
    who: ['human'],
    artifacts: ['@run/adr/adr-001.md', '@run/test-plan.md'],
    note: DEMO,
  },
  '28': {
    title: 'Ready for development',
    story: ['A person approves the spec and design. Code planning starts.'],
    who: ['human'],
    milestone: 'Spec and design approved',
    artifacts: ['@run/spec/spec.md', '@run/adr/adr-001.md'],
    gate: {
      decided: [
        'Accept a 4xx where Python crashes with a 500 on bad text input. Recorded as a known difference.',
        'Add a 1 MiB request limit (Python has none). Recorded as a known difference.',
        'Match status codes and error shapes, not every validation message word for word.',
        'Carry known security weaknesses forward as follow-ups.',
        'Approve the crate list and the licence policy.',
      ],
      source: '@run/adr/adr-001.md',
      demo: true,
    },
  },
  '29': {
    title: 'Plan the code, file by file',
    story: ['An agent plans every file to write in the Rust repo, and confirms nothing will change in the Python repo.'],
    who: ['code-plan-agent'],
    artifacts: ['@run/repos/minidon-rust/plan.md', '@run/repos/minidon/plan.md'],
  },
  '30': {
    title: 'Another agent reviews the plan',
    story: ['A separate agent reviews the plan: 9 major and 15 minor issues, such as wrong facts about Python and a bad build order.'],
    who: ['plan-reviewer-agent'],
    numbers: [['9', 'major'], ['15', 'minor'], ['0', 'critical']],
    artifacts: ['@run/reviews/plan-review-001.md'],
  },
  '31': {
    title: 'Plan questions answered',
    story: ['A person answers the two questions only a human can: error shapes for bad text, and which extra libraries are allowed.'],
    who: ['human'],
    artifacts: ['@run/adr/adr-001.md'],
    note: DEMO,
  },
  '32': {
    title: 'Gate A: build can start',
    story: ['A person approves the plan with its known findings. The build starts.'],
    who: ['human'],
    milestone: 'Gate A passed',
    artifacts: ['@run/reviews/plan-review-001.md', '@run/adr/adr-001.md'],
    gate: {
      decided: [
        'Plan approved with its known findings, to be fixed during the build.',
        'Bad text in a username returns Python\'s exact 422 error, not a generic one.',
        'Extra crates approved: serde, serde_json, tower-http, base64, hex and time.',
      ],
      source: '@run/adr/adr-001.md',
      demo: true,
    },
  },
  '33': {
    title: 'One command builds the environment',
    story: ['A person decides the Rust toolchain comes from Nix, so anyone gets the same setup with one command.'],
    who: ['human'],
    artifacts: ['@run/adr/adr-001.md', 'rust:flake.nix'],
    note: 'This one was a direct instruction from Kurtis, not a drafted answer.',
  },
  '34': {
    title: 'Build Accounts in Rust, test first',
    story: ['The coding agent builds Accounts in Rust in 28 small commits, always writing the test first.', 'Every behaviour is checked against the running Python app, and both builds share one database.'],
    who: ['coding-agent'],
    numbers: [['28', 'commits'], ['292', 'tests'], ['576', 'Python vs Rust comparisons']],
    milestone: 'Accounts built in Rust',
    artifacts: ['@run/build/wave-0-1.md', '@run/build/wave-2-3.md', '@run/build/wave-4-5.md', '@run/build/wave-6.md', 'rust:src/accounts/validate.rs', 'rust:CRATES.md'],
    commands: ['nix develop -c cargo test', 'COMPAT_PYTHON_ONLY=1 nix develop -c cargo test --test compat_accounts'],
    rust: true,
  },
  '35': {
    title: 'Test and independent review',
    story: ['Coverage is measured at 97.9 percent. A reviewer that did not write the code approves it, with 1 major and 11 minor findings.'],
    who: ['testing-agent', 'review-agent'],
    numbers: [['97.9%', 'line coverage'], ['1', 'major'], ['11', 'minor']],
    artifacts: ['@run/reviews/review-report-001.md', '@run/coverage-delta.json'],
    commands: ['nix develop -c cargo llvm-cov --summary-only', 'nix develop -c cargo clippy --all-targets -- -D warnings'],
    rust: true,
  },
  '36': {
    title: 'The major finding is decided',
    story: ['The review caught a wrong security claim: a way to guess which usernames exist is still open.', 'A person accepts it, because Python has the same leak, and corrects the record.'],
    who: ['human'],
    artifacts: ['@run/adr/adr-001.md', '@run/reviews/review-report-001.md'],
    note: DEMO,
  },
  '37': {
    title: 'Gate B: code approved',
    story: ['A person approves the reviewed code. The run moves to PR_RAISED.', 'This is where the run stops today.'],
    who: ['human'],
    milestone: 'Gate B passed',
    artifacts: ['@run/reviews/review-report-001.md', '@run/run.json'],
    gate: {
      decided: [
        'Code approved for a pull request.',
        'M-01 accepted: the username-guessing leak stays, as in Python. Fix and sign-in throttling are follow-ups after cutover.',
        'The 11 minor findings go to a clean-up pass. They do not block.',
      ],
      source: '@run/adr/adr-001.md',
      demo: true,
    },
    rust: true,
  },
};

export const outro = {
  title: 'Where the run ends',
  story: ['The run stops at PR_RAISED. Story 1 of 6 is built and approved, but no pull request exists yet.'],
  notReached: [
    'A real pull request, and a human merge (MERGED). Agents may raise PRs but never merge them.',
    'Release: spec fold-back, acceptance tests, UAT, Gate C and monitoring.',
    'Stories 2 to 6: Following, Posting, Timelines, Notifications and Moderation.',
    'The cutover from Python to Rust, which is a separate ticket.',
  ],
  caveats: [
    'One person held every role, and many gate answers were drafted by an agent in his name. A real team splits these between PO, BA, Tech Lead and a security reviewer.',
    'Some records were never tidied: the baseline review report still says PENDING, and the two discovery documents are malformed.',
    'Follow-ups are recorded, not done: admin seeding, a longer minimum password, stronger hashing, sign-in throttling, the username leak and the trailing-newline username.',
  ],
  next: [
    'Push minidon-rust to a remote and raise the pull request for story 1.',
    'A human reviews and merges it, then the release steps run.',
    'Open story 2 (Following) as its own run against the same frozen map.',
  ],
};
