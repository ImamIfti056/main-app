# Demo App Sync System

Automated AI-powered synchronization between main-app and demo-app using GitHub Copilot.

## 🎯 Overview

This system automatically syncs frontend changes from `app.apploye.com` (main-app) to `demo.apploye.com` (demo-app) while intelligently preserving demo-specific code like disabled buttons, mock data, and demo-only features.

### Key Features

- 🤖 **AI-Powered Sync**: Uses GitHub Copilot to intelligently detect and preserve demo-specific code
- 🛡️ **Protected Code Blocks**: Mark code with `INTENTIONAL-START/END` to prevent overwriting
- 🎯 **Smart Merge Strategies**: Different strategies for different file types (full copy, smart merge, ignore)
- ✅ **Automated Validation**: Checks for broken imports, syntax errors, and unclosed blocks
- 📝 **Detailed PR Descriptions**: AI-generated descriptions explaining what changed and why
- 🔄 **Automatic PR Creation**: Creates PRs to `demo-app`'s `dev` branch for review

## 🚀 Quick Start

### Prerequisites

1. **GitHub Secrets** (configured in main-app repository):
   - `DEMO_REPO_TOKEN`: Personal access token with repo permissions for demo-app
   - `OPENAI_API_KEY`: OpenAI API key for AI-powered analysis (optional but recommended)

2. **Repository Setup**:
   - main-app: Your production application
   - demo-app: Demo version with disabled features and mock data

### How It Works

1. **Push to main-app**: Any commit to `main` branch triggers the workflow
2. **Detect Changes**: Workflow identifies added, modified, and deleted files
3. **Apply Filters**: Ignore patterns filter out demo-specific files
4. **AI Analysis**: Copilot analyzes changes and identifies demo patterns
5. **Smart Sync**: Changes applied using appropriate strategy (copy, merge, ignore)
6. **Validation**: Checks for errors in syntax, imports, and protected blocks
7. **Create PR**: Automated PR created in demo-app's `dev` branch

## 📁 Project Structure

```
.github/
├── sync-config.yml           # Sync configuration (ignore patterns, rules)
├── scripts/
│   ├── copilot-sync.js      # Main AI orchestrator
│   └── validate-sync.js     # Validation utilities
└── workflows/
    └── demo-sync.yml        # GitHub Actions workflow

SYNC_GUIDE.md               # Detailed usage guide
README.md                   # This file
```

## 🔧 Configuration

### Sync Configuration (`.github/sync-config.yml`)

Control all sync behavior:

```yaml
# Files to never sync (demo-specific)
ignore_patterns:
  - "src/config/demo-config.js"
  - "src/utils/mock-api.js"

# Files using smart merge (preserve INTENTIONAL blocks)
smart_merge_files:
  - "src/components/**/*.js"

# Files copied as-is (no demo modifications)
full_copy_files:
  - "src/styles/**/*.css"

# AI configuration
ai_config:
  model: "gpt-4"
  auto_detect_demo_code: true
```

[See full configuration options →](SYNC_GUIDE.md#configuration)

### Protected Code Blocks

Mark demo-specific code that should never be overwritten:

```javascript
// INTENTIONAL-START
const API_URL = '/mock-api';  // Demo uses mock API
const ENABLE_CREATE = false;  // Disable create functionality
// INTENTIONAL-END
```

Supported in JavaScript, HTML, CSS, and more. [See examples →](SYNC_GUIDE.md#using-protected-code-blocks)

## 📖 Usage

### Automatic Sync

Simply push to `main` branch in main-app:

```bash
git add .
git commit -m "feat: add new dashboard widget"
git push origin main
```

The workflow will:
1. Detect your changes
2. Sync them to demo-app
3. Create a PR in demo-app for review

### Manual Sync

Trigger manually from GitHub Actions:

1. Go to **Actions** tab in main-app
2. Select "Sync Demo with Main via Copilot"
3. Click **Run workflow**
4. Choose options:
   - Force sync (even if no changes)
   - Skip validation (not recommended)

Or via CLI:

```bash
gh workflow run demo-sync.yml
```

### Review Sync PR

1. Go to demo-app repository
2. Review the auto-generated PR
3. Check the AI-generated description
4. Verify demo-specific code is preserved
5. Test UI in demo environment
6. Merge when ready

## 🛠️ Development

### Adding New Ignore Patterns

Edit `.github/sync-config.yml`:

```yaml
ignore_patterns:
  - "src/pages/demo/**"        # Ignore directory
  - "**/*-demo.js"             # Ignore by pattern
```

### Creating Protected Blocks

In any file in demo-app:

```javascript
// Regular code (will be synced from main)
function handleClick() {
  // INTENTIONAL-START
  // This block will NEVER be overwritten
  if (isDemoMode) {
    showDemoNotice();
    return;
  }
  // INTENTIONAL-END
  
  // Regular code (will be synced from main)
  performAction();
}
```

### Testing Locally

Run the sync script locally:

```bash
# Install dependencies
npm install js-yaml

# Set environment variables
export MAIN_APP_PATH=/path/to/main-app
export DEMO_APP_PATH=/path/to/demo-app

# Run sync
node .github/scripts/copilot-sync.js
```

Run validation:

```bash
node .github/scripts/validate-sync.js /path/to/demo-app
```

## 🧪 Testing

### Pre-Sync Testing

Before pushing to main:

1. Test changes in main-app locally
2. Run linting and tests
3. Review if changes affect demo-app
4. Update `sync-config.yml` if needed

### Post-Sync Testing

After PR is created in demo-app:

1. ✅ **UI Review**: Check demo-specific elements are intact
2. ✅ **Functionality**: Verify disabled features remain disabled
3. ✅ **Data**: Confirm mock data is still used
4. ✅ **Styling**: Ensure visual appearance matches main-app
5. ✅ **Console**: Check for errors in browser console

## 📊 Monitoring

### Workflow Status

Check workflow runs:

```bash
gh run list --workflow=demo-sync.yml
```

View specific run:

```bash
gh run view <run-id>
```

### Sync Failures

Automatic issue created in demo-app on failure:

- Title: `🚨 Demo sync failed - Run #XXX`
- Contains: Error details, workflow link
- Labels: `sync-failure`, `automated`

### Validation Warnings

Check PR description for validation results:

```markdown
### ✅ Validation Results
- Errors: 0
- Warnings: 2

⚠️ Warnings:
- src/components/Button.js:45 - Console statement detected
```

## 🐛 Troubleshooting

### Common Issues

**Q: Changes not syncing?**

Check if file is in ignore list:
```bash
# View ignore patterns
cat .github/sync-config.yml | grep -A 20 "ignore_patterns:"
```

**Q: Demo code overwritten?**

Ensure INTENTIONAL blocks are properly closed:
```javascript
// ✅ Correct
// INTENTIONAL-START
code
// INTENTIONAL-END

// ❌ Wrong - missing END
// INTENTIONAL-START
code
```

**Q: PR to wrong branch?**

Update target branch in `sync-config.yml`:
```yaml
advanced:
  target_branch: "dev"  # or "main" or "staging"
```

[See full troubleshooting guide →](SYNC_GUIDE.md#troubleshooting)

## 📚 Documentation

- **[SYNC_GUIDE.md](SYNC_GUIDE.md)**: Comprehensive usage guide with examples
- **[sync-config.yml](.github/sync-config.yml)**: Configuration file reference
- **[Workflow File](.github/workflows/demo-sync.yml)**: GitHub Actions workflow

## 🤝 Best Practices

### For Main App Developers

✅ **DO:**
- Make small, focused commits
- Test changes before pushing
- Document breaking changes
- Keep UI and logic changes separate

❌ **DON'T:**
- Batch unrelated features
- Change demo-specific files in main-app
- Push without PR review

### For Demo App Maintainers

✅ **DO:**
- Use INTENTIONAL blocks consistently
- Document why code is demo-specific
- Review sync PRs promptly
- Test thoroughly before merging

❌ **DON'T:**
- Modify synced files directly in demo
- Remove INTENTIONAL markers
- Auto-merge without review
- Ignore validation warnings

## 🔐 Security

- API keys stored as GitHub secrets
- No secrets in code or logs
- Demo repo token has minimal permissions
- PR review required before merging

## 📈 Future Enhancements

Potential improvements:

- [ ] Enhanced AI conflict resolution
- [ ] Visual diff preview in PR comments
- [ ] Automatic screenshot comparison
- [ ] Rollback via PR comments (`/rollback`)
- [ ] Selective file sync via comments (`/sync-only src/components`)
- [ ] Integration with CI/CD for automated testing
- [ ] Support for multiple demo environments

## 📞 Support

- **Issues**: Create issue with `sync` label
- **Failed Syncs**: Check auto-created issue in demo-app
- **Questions**: Contact @demo-team

## 📄 License

Same as main-app repository.

---

**Last Updated**: November 2025  
**Maintained By**: Demo Team  
**Status**: ✅ Production Ready
