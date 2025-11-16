# Demo Sync Architecture

Visual guide to understanding how the demo sync system works.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEMO SYNC SYSTEM                             │
│                  AI-Powered Main → Demo Synchronization              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐                              ┌──────────────────┐
│   main-app       │                              │   demo-app       │
│  (Production)    │                              │    (Demo)        │
│                  │                              │                  │
│  app.apploye.com │                              │ demo.apploye.com │
└──────────────────┘                              └──────────────────┘
         │                                                  ▲
         │ Push to main                                    │ PR to dev
         ▼                                                  │
┌─────────────────────────────────────────────────────────┴─────────┐
│                    GitHub Actions Workflow                         │
│                                                                    │
│  1. Detect Changes  →  2. Filter  →  3. AI Analyze  →  4. Apply  │
└────────────────────────────────────────────────────────────────────┘
```

## Workflow Steps

```
                    DEMO SYNC WORKFLOW EXECUTION
                            
Step 1: TRIGGER
┌──────────────────────────────────────────────────────────┐
│  Event: Push to main branch OR Manual trigger            │
│  Triggers: demo-sync.yml workflow                        │
└──────────────────────────────────────────────────────────┘
                            ↓
Step 2: CHECKOUT
┌──────────────────────────────────────────────────────────┐
│  ✓ Checkout main-app (with full history)                 │
│  ✓ Checkout demo-app (with full history)                 │
│  ✓ Setup Node.js 18                                      │
└──────────────────────────────────────────────────────────┘
                            ↓
Step 3: DETECT CHANGES
┌──────────────────────────────────────────────────────────┐
│  Git Diff: HEAD~1 → HEAD (in main-app/src/)              │
│                                                          │
│  Added:    src/components/NewFeature.js                 │
│  Modified: src/components/Button.js                     │
│  Deleted:  src/components/OldWidget.js                  │
└──────────────────────────────────────────────────────────┘
                            ↓
Step 4: APPLY FILTERS
┌──────────────────────────────────────────────────────────┐
│  Load: .github/sync-config.yml                          │
│                                                          │
│  Check ignore_patterns:                                 │
│  ✓ src/components/NewFeature.js    → Sync              │
│  ✓ src/components/Button.js        → Sync              │
│  ✗ src/config/demo-config.js       → IGNORE            │
└──────────────────────────────────────────────────────────┘
                            ↓
Step 5: AI ANALYSIS
┌──────────────────────────────────────────────────────────┐
│  copilot-sync.js → Analyzes each file                   │
│                                                          │
│  Detect demo patterns:                                  │
│  • disabled={true}                                      │
│  • mockData references                                  │
│  • INTENTIONAL-START/END blocks                         │
│  • isDemoMode conditions                                │
└──────────────────────────────────────────────────────────┘
                            ↓
Step 6: SMART MERGE
┌──────────────────────────────────────────────────────────┐
│  For each file, choose strategy:                        │
│                                                          │
│  ┌─────────────┬──────────────┬──────────────┐          │
│  │ Full Copy   │ Smart Merge  │   Ignore     │          │
│  │─────────────│──────────────│──────────────│          │
│  │ CSS files   │ Components   │ Demo config  │          │
│  │ Utilities   │ Pages        │ Mock APIs    │          │
│  │ Types       │ Layouts      │ Workflows    │          │
│  └─────────────┴──────────────┴──────────────┘          │
│                                                          │
│  Extract INTENTIONAL blocks from demo                   │
│  Copy latest from main                                  │
│  Restore INTENTIONAL blocks                             │
└──────────────────────────────────────────────────────────┘
                            ↓
Step 7: VALIDATION
┌──────────────────────────────────────────────────────────┐
│  validate-sync.js checks:                               │
│                                                          │
│  ✓ Protected blocks properly closed                     │
│  ✓ No syntax errors                                     │
│  ✓ Imports valid                                        │
│  ⚠ Found 2 warnings (console.log statements)            │
└──────────────────────────────────────────────────────────┘
                            ↓
Step 8: CREATE PR
┌──────────────────────────────────────────────────────────┐
│  In demo-app:                                           │
│                                                          │
│  1. Create branch: sync/copilot-12345                   │
│  2. Commit changes                                      │
│  3. Push to demo-app                                    │
│  4. Create PR: dev ← sync/copilot-12345                 │
│  5. Add AI-generated description                        │
│  6. Add labels: automated-sync, needs-review            │
└──────────────────────────────────────────────────────────┘
                            ↓
                  ┌─────────────────┐
                  │   SUCCESS ✓     │
                  └─────────────────┘
```

## File Processing Flow

```
                    HOW FILES ARE PROCESSED

                    ┌─────────────────┐
                    │  File Changed   │
                    │   in main-app   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ In ignore list? │
                    └────────┬────────┘
                      Yes ←──┴──→ No
                       │           │
                 ┌─────▼─────┐    │
                 │   SKIP    │    │
                 │  (Ignore) │    │
                 └───────────┘    │
                                  │
                         ┌────────▼────────┐
                         │ In smart_merge  │
                         │   files list?   │
                         └────────┬────────┘
                           Yes ←──┴──→ No
                            │           │
                    ┌───────▼──────┐    │
                    │ SMART MERGE  │    │
                    │ (Preserve    │    │
                    │  INTENTIONAL │    │
                    │   blocks)    │    │
                    └───────┬──────┘    │
                            │           │
                            │      ┌────▼────┐
                            │      │ FULL    │
                            │      │ COPY    │
                            │      │ (As-is) │
                            │      └────┬────┘
                            │           │
                            └─────┬─────┘
                                  │
                          ┌───────▼───────┐
                          │ Write to demo │
                          └───────┬───────┘
                                  │
                            ┌─────▼─────┐
                            │ Validate  │
                            └─────┬─────┘
                                  │
                              ┌───▼───┐
                              │ DONE  │
                              └───────┘
```

## INTENTIONAL Block Processing

```
            SMART MERGE WITH INTENTIONAL BLOCKS

Main-App File:                    Demo-App File (Before):
┌─────────────────────┐          ┌─────────────────────┐
│ function create() { │          │ function create() { │
│   const data = {    │          │   // INTENTIONAL-START
│     name: name,     │          │   alert('Disabled');│
│     email: email    │          │   return;           │
│   };                │          │   // INTENTIONAL-END│
│   saveToAPI(data);  │          │   const data = {    │
│ }                   │          │     name: name,     │
└─────────────────────┘          │     email: email    │
         │                       │   };                │
         │  Sync Process         │   saveToAPI(data);  │
         ▼                       │ }                   │
                                 └─────────────────────┘
         ┌─────────────────────────────┐
         │ 1. Extract INTENTIONAL      │
         │    block from demo          │
         ├─────────────────────────────┤
         │ 2. Copy main-app content    │
         ├─────────────────────────────┤
         │ 3. Restore INTENTIONAL      │
         │    block into result        │
         └─────────────────────────────┘
                    │
                    ▼
         Demo-App File (After):
         ┌─────────────────────┐
         │ function create() { │
         │   // INTENTIONAL-START
         │   alert('Disabled');│
         │   return;           │
         │   // INTENTIONAL-END│
         │   const data = {    │  ← Updated from main
         │     name: name,     │
         │     email: email    │
         │   };                │
         │   saveToAPI(data);  │
         │ }                   │
         └─────────────────────┘
```

## Configuration Hierarchy

```
                  CONFIGURATION PRIORITY

┌────────────────────────────────────────────────────┐
│                  sync-config.yml                   │
│                 (Highest Priority)                 │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. ignore_patterns         → Skip file entirely  │
│  2. smart_merge_files       → Use smart merge     │
│  3. full_copy_files         → Copy as-is          │
│  4. protected_blocks        → Marker definitions  │
│  5. auto_detect_patterns    → AI hints            │
│                                                    │
└────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│              INTENTIONAL Blocks in Code            │
│               (Runtime Protection)                 │
├────────────────────────────────────────────────────┤
│                                                    │
│  Protects specific code sections within files     │
│  Takes precedence during smart merge              │
│                                                    │
└────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│              AI Auto-Detection                     │
│               (Lowest Priority)                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Suggests preservation based on patterns          │
│  Can be overridden by explicit config             │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Data Flow

```
         DATA FLOW THROUGH THE SYSTEM

    ┌──────────────────────────────────────┐
    │  Git Push to main-app/main branch    │
    └──────────────────┬───────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────┐
    │   GitHub Actions Event Triggered    │
    └──────────────────┬──────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────┐
    │   Checkout both repositories        │
    │   • main-app  • demo-app            │
    └──────────────────┬──────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────┐
    │    Load sync-config.yml             │
    └──────────────────┬──────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────┐
    │   Run copilot-sync.js               │
    │   ├─ Detect changes                 │
    │   ├─ Filter by patterns             │
    │   ├─ AI analysis                    │
    │   ├─ Apply changes                  │
    │   └─ Generate PR description        │
    └──────────────────┬──────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────┐
    │   Output: sync-results.json         │
    │           pr-description.md         │
    └──────────────────┬──────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────┐
    │   Commit & Push to demo-app         │
    │   Branch: sync/copilot-XXXXX        │
    └──────────────────┬──────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────┐
    │   Create Pull Request               │
    │   Base: dev  Head: sync/copilot-*   │
    └──────────────────┬──────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────┐
    │   Manual Review & Merge             │
    └─────────────────────────────────────┘
```

## Security & Permissions

```
            SECURITY ARCHITECTURE

┌───────────────────────────────────────────┐
│          GitHub Secrets (Encrypted)       │
├───────────────────────────────────────────┤
│  • DEMO_REPO_TOKEN                        │
│  • OPENAI_API_KEY (optional)              │
│  • SLACK_WEBHOOK (optional)               │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────┐
│       Workflow Permissions                │
├───────────────────────────────────────────┤
│  contents: write      → Push changes      │
│  pull-requests: write → Create PRs        │
│  issues: write        → Create issues     │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────┐
│       Repository Access                   │
├───────────────────────────────────────────┤
│  main-app:  Full access (workflow runner) │
│  demo-app:  Via DEMO_REPO_TOKEN           │
└───────────────────────────────────────────┘
```

## Error Handling

```
              ERROR HANDLING FLOW

                 ┌─────────┐
                 │  Start  │
                 └────┬────┘
                      │
              ┌───────▼───────┐
              │ Try operation │
              └───────┬───────┘
                      │
          ┌───────────┴───────────┐
          │                       │
      ┌───▼────┐            ┌────▼────┐
      │Success │            │  Error  │
      └───┬────┘            └────┬────┘
          │                      │
          │          ┌───────────▼──────────┐
          │          │  Log error details   │
          │          └───────────┬──────────┘
          │                      │
          │          ┌───────────▼──────────┐
          │          │ Create GitHub issue  │
          │          └───────────┬──────────┘
          │                      │
          │          ┌───────────▼──────────┐
          │          │ Add to job summary   │
          │          └───────────┬──────────┘
          │                      │
          │          ┌───────────▼──────────┐
          │          │   Exit with code 1   │
          │          └──────────────────────┘
          │
          ▼
    ┌──────────┐
    │ Continue │
    └──────────┘
```

## Components Interaction

```
      SYSTEM COMPONENTS & THEIR INTERACTIONS

┌─────────────────┐
│  demo-sync.yml  │  ← Main orchestrator
│   (Workflow)    │
└────────┬────────┘
         │ executes
         ├────────────┐
         │            │
    ┌────▼──────┐  ┌─▼────────────┐
    │copilot-   │  │validate-     │
    │sync.js    │  │sync.js       │
    └────┬──────┘  └─┬────────────┘
         │           │
         │ reads     │ reads
         │           │
    ┌────▼───────────▼──────┐
    │  sync-config.yml      │
    └───────────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   main-app      │ ──→ │   demo-app      │
│   (source)      │     │ (destination)   │
└─────────────────┘     └─────────────────┘

         Output Files:
    ┌───────────────────┐
    │sync-results.json  │
    │pr-description.md  │
    │validation-*.json  │
    └───────────────────┘
```

---

**Legend:**
- `→` : Data flow direction
- `├─` : Process step
- `┌─┐` : Component/Step
- `✓` : Success/Approved
- `✗` : Skipped/Denied
