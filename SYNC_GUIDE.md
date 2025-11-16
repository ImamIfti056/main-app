# Demo Sync Guide

This guide explains how the automated demo sync workflow works and how to use it effectively.

## Overview

The demo sync workflow automatically synchronizes changes from `main-app` to `demo-app` using AI-powered intelligent merging. When you push to the `main` branch, the workflow:

1. Detects what changed in your commit
2. Filters changes based on ignore patterns
3. Uses AI to analyze and preserve demo-specific code
4. Applies changes intelligently to demo-app
5. Creates a PR to `demo-app`'s `dev` branch with detailed description

## How It Works

### Sync Strategies

The workflow uses three different strategies based on the file:

#### 1. **Full Copy** (Files should be identical)
Files like CSS, utilities, and type definitions are copied as-is from main-app to demo-app.

**Example files:**
- `src/styles/**/*.css`
- `src/utils/formatters.js`
- `src/types/**/*.ts`

#### 2. **Smart Merge** (Preserve demo-specific code)
Component files and pages that have demo-specific modifications use smart merge. The workflow:
- Copies the latest version from main-app
- Preserves code blocks marked with `INTENTIONAL-START` and `INTENTIONAL-END`
- Auto-detects demo patterns like disabled buttons and mock data

**Example files:**
- `src/components/**/*.js`
- `src/pages/**/*.jsx`

#### 3. **Ignore** (Never touch these files)
Demo-specific files are completely ignored and never modified.

**Example files:**
- `src/config/demo-config.js`
- `src/utils/mock-api.js`
- `.github/workflows/**`

## Using Protected Code Blocks

### What are INTENTIONAL blocks?

INTENTIONAL blocks are special markers that tell the sync workflow "don't touch this code, it's demo-specific."

### Syntax

```javascript
// INTENTIONAL-START
// This code will NEVER be overwritten during sync
const isDemoMode = true;
const apiEndpoint = 'https://demo.apploye.com/api';
// INTENTIONAL-END
```

### Supported Markers

The workflow supports multiple comment styles:

**JavaScript/TypeScript:**
```javascript
// INTENTIONAL-START
const demoConfig = { ... };
// INTENTIONAL-END
```

**HTML:**
```html
<!-- INTENTIONAL-START -->
<div class="demo-notice">This is a demo</div>
<!-- INTENTIONAL-END -->
```

**CSS:**
```css
/* INTENTIONAL-START */
.demo-watermark {
  opacity: 0.5;
}
/* INTENTIONAL-END */
```

### When to Use INTENTIONAL Blocks

Use INTENTIONAL blocks for:

✅ **Demo-specific configuration**
```javascript
// INTENTIONAL-START
const config = {
  apiUrl: '/mock-api',
  enableCreate: false,
  enableDelete: false
};
// INTENTIONAL-END
```

✅ **Disabled functionality**
```jsx
// INTENTIONAL-START
<Button 
  disabled={true}
  onClick={() => showDemoNotice()}
>
  Create New (Demo disabled)
</Button>
// INTENTIONAL-END
```

✅ **Mock data injection**
```javascript
// INTENTIONAL-START
const userData = DEMO_USERS_DATA;  // Use mock data instead of API
// INTENTIONAL-END
```

✅ **Demo-specific UI elements**
```jsx
// INTENTIONAL-START
<DemoNotice>
  This is a demo environment. Some features are disabled.
</DemoNotice>
// INTENTIONAL-END
```

❌ **Don't use for:**
- Entire files (use ignore patterns instead)
- Temporary changes (use feature flags)
- Bug fixes that should be in both apps

## Auto-Detection Patterns

The AI automatically detects and preserves these patterns even without INTENTIONAL markers:

### Disabled Buttons
```javascript
<Button disabled={true}>Create</Button>
<Input readOnly={true} />
```

### Mock Data
```javascript
const data = mockData;
const users = dummyData;
const items = DEMO_DATA;
```

### Demo Conditions
```javascript
if (isDemo) {
  return <DemoNotice />;
}

if (process.env.DEMO_MODE) {
  disableFeature();
}
```

### Demo API Endpoints
```javascript
fetch('/api/demo/users');
fetch('https://demo.apploye.com/api');
```

## Configuration

All sync behavior is controlled by `.github/sync-config.yml`.

### Adding Files to Ignore List

Edit `.github/sync-config.yml`:

```yaml
ignore_patterns:
  - "src/pages/demo/**"           # Ignore entire directory
  - "src/config/demo-config.js"   # Ignore specific file
  - "**/*-demo.js"                 # Ignore by pattern
```

### Changing Sync Strategy for File Types

```yaml
smart_merge_files:
  - "src/components/**/*.js"      # Use smart merge for components

full_copy_files:
  - "src/styles/**/*.css"         # Full copy for CSS
```

### Customizing AI Behavior

```yaml
ai_config:
  model: "gpt-4"                  # AI model to use
  temperature: 0.2                # Lower = more deterministic
  auto_detect_demo_code: true     # Enable auto-detection
  generate_pr_description: true   # Generate detailed PR descriptions
```

## Manual Sync

### Trigger Workflow Manually

You can manually trigger the sync workflow from GitHub:

1. Go to **Actions** tab in main-app repository
2. Select "Sync Demo with Main via Copilot"
3. Click "Run workflow"
4. Choose options:
   - **Force sync**: Sync even if no changes detected
   - **Skip validation**: Skip validation checks (not recommended)

### Using Workflow Dispatch

```bash
# Trigger via GitHub CLI
gh workflow run demo-sync.yml

# With inputs
gh workflow run demo-sync.yml \
  -f force_sync=true \
  -f skip_validation=false
```

## Understanding the PR

Each sync creates a PR with detailed information:

### PR Title Format
```
🤖 [Auto-Sync] Demo sync from main-app (abc1234)
```

### PR Description Sections

**📊 Summary**: Quick overview of changes
- Number of files added, modified, deleted
- Protected blocks preserved

**📝 Detailed Changes**: Complete file list
- ✅ Added Files
- ✏️ Modified Files
- 🗑️ Deleted Files

**🛡️ Protected Code Blocks**: Which files had demo code preserved

**✅ Validation Results**: Errors and warnings

**🧪 Testing Recommendations**: What to check before merging

## Troubleshooting

### Sync Failed: Validation Errors

**Problem:** Workflow failed with validation errors

**Solution:**
1. Check workflow logs for specific errors
2. Look for unclosed INTENTIONAL blocks:
   ```javascript
   // ❌ Missing INTENTIONAL-END
   // INTENTIONAL-START
   const config = { ... };
   // (file ends without INTENTIONAL-END)
   ```
3. Fix in demo-app and re-run workflow

### Changes Not Syncing

**Problem:** Expected changes didn't appear in demo-app

**Possible causes:**

1. **File is in ignore list**
   - Check `.github/sync-config.yml` → `ignore_patterns`
   - Remove pattern if file should sync

2. **Protected block covering entire change**
   - INTENTIONAL blocks might be too broad
   - Narrow the block to specific demo code

3. **No changes detected**
   - Workflow only syncs changes in last commit
   - Use "Force sync" option to sync anyway

### INTENTIONAL Blocks Not Preserved

**Problem:** Demo code was overwritten despite INTENTIONAL markers

**Check:**

1. **Correct marker syntax**
   ```javascript
   // ✅ Correct
   // INTENTIONAL-START
   code here
   // INTENTIONAL-END
   
   // ❌ Wrong (typo)
   // INTENTIAL-START  
   code here
   // INTENTIAL-END
   ```

2. **Blocks properly closed**
   - Every START must have matching END
   - Can't nest blocks

3. **File in smart_merge list**
   - Only smart merge files preserve blocks
   - Check `sync-config.yml` → `smart_merge_files`

### PR Created to Wrong Branch

**Problem:** PR created to `main` instead of `dev`

**Solution:**
Edit `.github/sync-config.yml`:
```yaml
advanced:
  target_branch: "dev"  # Change to desired branch
```

### Merge Conflicts

**Problem:** PR has merge conflicts

**Solutions:**

1. **Manual resolution** (recommended):
   ```bash
   # In demo-app
   git checkout sync/copilot-XXXXX
   git merge dev
   # Resolve conflicts manually
   git commit
   git push
   ```

2. **Re-run sync**:
   - Merge `dev` first
   - Then re-trigger workflow

### Too Many Changes in One PR

**Problem:** Sync PR is too large to review

**Solution:**
1. Commit smaller, focused changes to main-app
2. Each commit triggers a separate sync
3. Review and merge each PR before next commit

## Best Practices

### For Main App Developers

✅ **DO:**
- Make small, focused commits
- Test changes in main-app first
- Document breaking changes in commit message
- Keep UI changes separate from logic changes

❌ **DON'T:**
- Batch multiple unrelated features in one commit
- Push directly to main without PR review
- Change demo-specific files in main-app

### For Demo App Maintainers

✅ **DO:**
- Use INTENTIONAL blocks consistently
- Document why code is demo-specific
- Review sync PRs promptly
- Test UI thoroughly before merging
- Keep sync-config.yml updated

❌ **DON'T:**
- Modify files directly in demo-app that should come from main
- Remove INTENTIONAL markers without updating ignore patterns
- Ignore validation warnings
- Auto-merge sync PRs without review

### For Both Teams

✅ **DO:**
- Communicate about major UI changes
- Update SYNC_GUIDE.md when adding new patterns
- Monitor sync workflow failures
- Keep both repos' dependencies in sync manually

## Examples

### Example 1: Adding a New Component

**Main App** - Create `src/components/TaskList.js`:
```javascript
import React from 'react';

export default function TaskList({ tasks, onDelete }) {
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          {task.name}
          <button onClick={() => onDelete(task.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

**After Sync** - Demo App gets the file, then you add INTENTIONAL block:
```javascript
import React from 'react';

export default function TaskList({ tasks, onDelete }) {
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          {task.name}
          {/* INTENTIONAL-START */}
          <button disabled={true}>Delete (Demo)</button>
          {/* INTENTIONAL-END */}
        </li>
      ))}
    </ul>
  );
}
```

**Next Sync** - Main app changes preserved, demo button stays disabled.

### Example 2: Updating Shared Styles

**Main App** - Update `src/styles/button.css`:
```css
.btn-primary {
  background: blue;
  padding: 10px 20px;
  border-radius: 8px;  /* Changed from 4px */
}
```

**After Sync** - Demo app CSS updated automatically (full copy strategy).

### Example 3: Adding Demo-Specific Configuration

**Demo App Only** - Create `src/config/demo-config.js`:

First, add to ignore list in `.github/sync-config.yml`:
```yaml
ignore_patterns:
  - "src/config/demo-config.js"
```

Then create the file:
```javascript
export const DEMO_CONFIG = {
  readonly: true,
  mockApi: true,
  disabledFeatures: ['create', 'delete', 'export']
};
```

This file will never be touched by sync workflow.

## FAQ

**Q: How often does sync run?**
A: Automatically on every push to main branch. You can also trigger manually.

**Q: Can I rollback a failed sync?**
A: Yes, sync creates PRs, not direct commits. Simply close the PR without merging.

**Q: What if I need to sync a specific commit?**
A: Workflow syncs HEAD~1..HEAD. For older commits, manually trigger with force_sync option or cherry-pick.

**Q: Can I sync from demo to main?**
A: No, sync is one-way: main → demo only. Demo-specific changes should never go to main.

**Q: Does this work with monorepos?**
A: Yes, but you'll need to adjust paths in sync-config.yml and workflow.

**Q: How much does the AI API cost?**
A: Depends on your OpenAI plan. Typical sync uses ~1000 tokens ≈ $0.002 per sync.

**Q: Can I use this without AI?**
A: Yes, set `ai_config.auto_detect_demo_code: false`. It will still use INTENTIONAL blocks.

## Support

- **Issues**: Create issue in main-app repository with `sync` label
- **Failed syncs**: Workflow automatically creates issue in demo-app
- **Questions**: Contact @demo-team

## Related Documentation

- [GitHub Actions Workflow](.github/workflows/demo-sync.yml)
- [Sync Configuration](.github/sync-config.yml)
- [Sync Orchestrator Script](.github/scripts/copilot-sync.js)
