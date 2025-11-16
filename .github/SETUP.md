# Demo Sync - Dependencies and Setup

This document lists the dependencies and setup requirements for the demo sync system.

## Required Dependencies

### Workflow Dependencies

The GitHub Actions workflow automatically installs these during execution:

```json
{
  "dependencies": {
    "js-yaml": "^4.1.0"
  }
}
```

**Installation in workflow:**
```bash
npm install js-yaml --no-save
```

### Optional Dependencies (for local development)

If you want to run the sync scripts locally:

```bash
npm install --save-dev js-yaml
```

## GitHub Secrets Configuration

Configure these secrets in your main-app repository:

### Required Secrets

1. **DEMO_REPO_TOKEN**
   - Type: Personal Access Token (Classic)
   - Permissions Required:
     - `repo` (Full control of private repositories)
     - `workflow` (Update GitHub Action workflows)
   - Scope: demo-app repository
   - How to create:
     ```
     1. Go to GitHub Settings → Developer settings → Personal access tokens
     2. Generate new token (classic)
     3. Select required permissions
     4. Copy token and add to main-app secrets
     ```

2. **GITHUB_TOKEN** (Auto-provided)
   - Automatically provided by GitHub Actions
   - No setup required

### Optional Secrets

3. **OPENAI_API_KEY**
   - Type: OpenAI API Key
   - Required for: AI-powered analysis and PR descriptions
   - Can work without it, but with reduced functionality
   - How to get:
     ```
     1. Go to https://platform.openai.com/api-keys
     2. Create new secret key
     3. Copy and add to main-app secrets
     ```

4. **SLACK_SYNC_WEBHOOK** (Optional)
   - Type: Slack Webhook URL
   - Required for: Slack notifications on sync events
   - How to get:
     ```
     1. Create Slack app
     2. Enable Incoming Webhooks
     3. Add webhook URL to secrets
     ```

## Environment Variables

### Workflow Environment Variables

Set in `.github/workflows/demo-sync.yml`:

```yaml
env:
  DEMO_REPO_TOKEN: ${{ secrets.DEMO_REPO_TOKEN }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  MAIN_APP_PATH: ${{ github.workspace }}/main-app
  DEMO_APP_PATH: ${{ github.workspace }}/demo-app
```

### Local Development Environment Variables

For testing locally:

```bash
export MAIN_APP_PATH=/path/to/main-app
export DEMO_APP_PATH=/path/to/demo-app
export OPENAI_API_KEY=sk-...
export GITHUB_TOKEN=ghp_...
```

## System Requirements

### GitHub Actions Runner

- **OS**: Ubuntu Latest (ubuntu-latest)
- **Node.js**: 18.x
- **Git**: Latest version
- **Python**: 3.x (pre-installed, used for INTENTIONAL block merging)

### Local Development

- **Node.js**: >= 14.x
- **npm**: >= 6.x
- **Git**: >= 2.x
- **Python**: >= 3.7 (optional, for testing block preservation)

## Repository Permissions

### Main App Repository

Required permissions for GitHub Actions:

```yaml
permissions:
  contents: write        # Push changes, create branches
  pull-requests: write   # Create and manage PRs
  issues: write          # Create issues on failure
```

### Demo App Repository

The `DEMO_REPO_TOKEN` must have:

- Write access to demo-app repository
- Ability to create branches
- Ability to create pull requests
- Ability to create issues

## Setup Checklist

### Initial Setup

- [ ] Create DEMO_REPO_TOKEN with correct permissions
- [ ] Add DEMO_REPO_TOKEN to main-app secrets
- [ ] (Optional) Add OPENAI_API_KEY to main-app secrets
- [ ] Verify workflow file is in main-app at `.github/workflows/demo-sync.yml`
- [ ] Verify sync config exists at `.github/sync-config.yml`
- [ ] Create demo-app repository if not exists
- [ ] Create `dev` branch in demo-app (or update target_branch in config)

### Configuration

- [ ] Review and customize `.github/sync-config.yml`
- [ ] Add demo-specific files to ignore_patterns
- [ ] Configure smart_merge_files for your components
- [ ] Set appropriate AI configuration
- [ ] Configure target branch (default: `dev`)

### Testing

- [ ] Trigger manual workflow run to test setup
- [ ] Verify PR created in demo-app
- [ ] Check PR description is generated correctly
- [ ] Test INTENTIONAL block preservation
- [ ] Verify validation runs successfully

### Documentation

- [ ] Review SYNC_GUIDE.md
- [ ] Share QUICK_REFERENCE.md with team
- [ ] Update team documentation with sync workflow
- [ ] Train team on INTENTIONAL block usage

## Troubleshooting Setup Issues

### "Permission denied" errors

**Problem**: Workflow can't push to demo-app

**Solution**: 
- Check DEMO_REPO_TOKEN has write permissions
- Verify token hasn't expired
- Ensure token is for correct organization/user

### "Config file not found" warnings

**Problem**: Sync uses default config instead of custom

**Solution**:
- Verify `.github/sync-config.yml` exists in main-app
- Check file path is correct (must be exactly `.github/sync-config.yml`)
- Ensure file is committed to repository

### "No changes detected" message

**Problem**: Workflow completes but says no changes

**Possible causes**:
- Commit didn't modify any files in `src/` directory
- All changed files match ignore patterns
- Changes only in workflow files (these are excluded)

**Solution**:
- Check git diff to see what changed
- Review ignore_patterns in config
- Use force_sync option if needed

### Script execution errors

**Problem**: Node script fails with module errors

**Solution**:
```bash
# In workflow, ensure dependencies are installed
- name: Install dependencies
  run: |
    cd main-app
    npm install js-yaml --no-save
```

### Validation failures

**Problem**: Sync fails during validation step

**Solution**:
- Check validation-results.json for details
- Fix syntax errors in demo-app
- Close unclosed INTENTIONAL blocks
- Use skip_validation option temporarily (not recommended)

## Updating the System

### Update Workflow

```bash
# Edit workflow file
vim .github/workflows/demo-sync.yml

# Commit and push
git add .github/workflows/demo-sync.yml
git commit -m "chore: update demo sync workflow"
git push
```

### Update Configuration

```bash
# Edit config
vim .github/sync-config.yml

# Test locally first
node .github/scripts/copilot-sync.js

# Commit and push
git add .github/sync-config.yml
git commit -m "chore: update sync configuration"
git push
```

### Update Scripts

```bash
# Edit sync script
vim .github/scripts/copilot-sync.js

# Test locally
export MAIN_APP_PATH=$(pwd)
export DEMO_APP_PATH=/path/to/demo-app
node .github/scripts/copilot-sync.js

# Commit and push
git add .github/scripts/
git commit -m "chore: update sync scripts"
git push
```

## Monitoring and Maintenance

### Regular Checks

**Weekly:**
- Review failed workflow runs
- Check open sync PRs in demo-app
- Monitor validation warnings

**Monthly:**
- Review and update ignore_patterns
- Check for unused INTENTIONAL blocks
- Update documentation if needed

**Quarterly:**
- Review AI costs (OpenAI API usage)
- Audit DEMO_REPO_TOKEN permissions
- Update dependencies if needed

### Metrics to Track

- Sync success rate
- Average PR size (files changed)
- Time to review/merge PRs
- Number of validation errors/warnings
- Protected blocks preservation rate

## Cost Estimation

### GitHub Actions

- **Free tier**: 2,000 minutes/month for public repos
- **Private repos**: Based on your plan
- **Average sync run**: ~2-3 minutes
- **Estimated monthly usage**: 60-90 minutes (30 commits/month)

### OpenAI API (Optional)

- **Model**: GPT-4
- **Average tokens per sync**: ~1,000-2,000 tokens
- **Cost**: ~$0.02-0.04 per sync
- **Estimated monthly cost**: $0.60-1.20 (30 syncs/month)

**Note**: Can operate without OpenAI API, using only rule-based sync

## Support and Resources

- **Documentation**: [SYNC_GUIDE.md](../SYNC_GUIDE.md)
- **Quick Reference**: [QUICK_REFERENCE.md](../.github/QUICK_REFERENCE.md)
- **Issues**: Create issue with `sync` label
- **Discussions**: Use GitHub Discussions for questions

## Version History

- **v1.0** (Nov 2025): Initial release with AI-powered sync
  - Protected code blocks
  - Smart merge strategies
  - Automated validation
  - AI-generated PR descriptions
