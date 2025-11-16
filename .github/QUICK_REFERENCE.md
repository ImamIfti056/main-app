# Demo Sync Quick Reference

Quick reference for developers working with the automated demo sync system.

## 🎯 How It Works

```
main-app (main branch)  →  GitHub Actions  →  demo-app (dev branch)
      ↓                          ↓                      ↓
   Push commit          AI-powered sync          Create PR
```

## 📝 INTENTIONAL Block Syntax

### JavaScript/TypeScript
```javascript
// INTENTIONAL-START
const demoConfig = { readonly: true };
// INTENTIONAL-END
```

### JSX/TSX
```jsx
{/* INTENTIONAL-START */}
<Button disabled={true}>Create (Demo)</Button>
{/* INTENTIONAL-END */}
```

### HTML
```html
<!-- INTENTIONAL-START -->
<div class="demo-notice">Demo Mode</div>
<!-- INTENTIONAL-END -->
```

### CSS
```css
/* INTENTIONAL-START */
.demo-watermark { opacity: 0.3; }
/* INTENTIONAL-END */
```

## 🎨 Sync Strategies

| Strategy | When Used | Example Files |
|----------|-----------|---------------|
| **Full Copy** | Identical files | `src/styles/*.css`, `src/utils/formatters.js` |
| **Smart Merge** | Files with INTENTIONAL blocks | `src/components/*.jsx` |
| **Ignore** | Demo-only files | `src/config/demo-config.js` |

## 🚀 Common Tasks

### Add File to Ignore List

```yaml
# .github/sync-config.yml
ignore_patterns:
  - "src/pages/demo-dashboard.js"
```

### Mark Demo-Specific Code

```javascript
function createUser() {
  // INTENTIONAL-START
  alert('Create disabled in demo');
  return;
  // INTENTIONAL-END
  
  // Main app code here...
}
```

### Trigger Manual Sync

```bash
gh workflow run demo-sync.yml
```

### Check Sync Status

```bash
gh run list --workflow=demo-sync.yml --limit 5
```

## ✅ Before Pushing to Main

- [ ] Test changes in main-app
- [ ] Check if changes affect demo-app
- [ ] Update sync-config.yml if needed
- [ ] Ensure demo-specific files not modified

## 🔍 After Sync PR Created

- [ ] Review PR description
- [ ] Check protected blocks preserved
- [ ] Verify disabled features still disabled
- [ ] Test UI in demo environment
- [ ] Check for validation warnings

## 🛑 Common Mistakes

### ❌ Wrong: Unclosed Block
```javascript
// INTENTIONAL-START
const config = { demo: true };
// (missing INTENTIONAL-END)
```

### ✅ Correct: Properly Closed
```javascript
// INTENTIONAL-START
const config = { demo: true };
// INTENTIONAL-END
```

### ❌ Wrong: Modifying Demo Files in Main
```javascript
// Don't add demo-specific code in main-app
import { DEMO_DATA } from './demo-config'; // ❌
```

### ✅ Correct: Keep Demo Code in Demo
```javascript
// Add demo code only in demo-app
// INTENTIONAL-START
import { DEMO_DATA } from './demo-config'; // ✅
// INTENTIONAL-END
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Changes not syncing | Check ignore patterns in sync-config.yml |
| Demo code overwritten | Ensure INTENTIONAL blocks are closed |
| Validation errors | Check workflow logs, fix syntax errors |
| PR to wrong branch | Update `target_branch` in sync-config.yml |
| Import errors | Check file paths and dependencies |

## 📞 Get Help

- 📖 **Full Guide**: [SYNC_GUIDE.md](SYNC_GUIDE.md)
- 🔧 **Configuration**: [sync-config.yml](.github/sync-config.yml)
- 💬 **Support**: Create issue with `sync` label
- 🚨 **Failed Sync**: Auto-issue created in demo-app

## 🔗 Quick Links

- [View Workflow Runs](../../actions/workflows/demo-sync.yml)
- [Sync Configuration](.github/sync-config.yml)
- [Example Component](.github/EXAMPLE_INTENTIONAL_BLOCKS.jsx)
- [Full Documentation](SYNC_GUIDE.md)

---

💡 **Pro Tip**: Use AI auto-detection! The system automatically preserves:
- `disabled={true}` buttons
- `mockData`, `dummyData` references
- `isDemoMode` conditions
- Demo API endpoints

No INTENTIONAL blocks needed for these common patterns!
