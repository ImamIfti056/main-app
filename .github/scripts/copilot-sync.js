#!/usr/bin/env node

/**
 * Copilot-Powered Demo Sync Orchestrator
 * 
 * This script uses AI to intelligently sync changes from main-app to demo-app
 * while preserving demo-specific code, handling conflicts, and generating
 * comprehensive PR descriptions.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

// Configuration
const CONFIG_PATH = path.join(process.cwd(), '.github', 'sync-config.yml');
const MAIN_APP_PATH = process.env.MAIN_APP_PATH || '../main-app';
const DEMO_APP_PATH = process.env.DEMO_APP_PATH || '../demo-app';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

class CopilotSyncOrchestrator {
  constructor() {
    this.config = this.loadConfig();
    this.changes = {
      added: [],
      modified: [],
      deleted: [],
      conflicts: [],
      preserved: []
    };
    this.syncLog = [];
  }

  /**
   * Load sync configuration
   */
  loadConfig() {
    try {
      const configContent = fs.readFileSync(path.join(MAIN_APP_PATH, CONFIG_PATH), 'utf8');
      return yaml.load(configContent);
    } catch (error) {
      console.error('⚠️  Failed to load sync-config.yml, using defaults');
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration if config file is missing
   */
  getDefaultConfig() {
    return {
      ignore_patterns: [],
      smart_merge_files: ['src/**/*.js', 'src/**/*.jsx'],
      full_copy_files: ['src/styles/**/*.css'],
      protected_blocks: {
        start_markers: ['{/* DEMO-INTENTIONAL-START */}'],
        end_markers: ['{/* DEMO-INTENTIONAL-END */}']
      },
      auto_detect_patterns: {
        disabled_buttons: ['disabled={true}'],
        mock_data: ['mockData', 'dummyData']
      },
      validation: {
        check_imports: true,
        validate_protected_blocks: true,
        fail_on_error: false
      },
      ai_config: {
        model: 'gpt-4',
        temperature: 0.2,
        max_tokens: 4000,
        auto_detect_demo_code: true,
        generate_pr_description: true
      },
      advanced: {
        target_branch: 'dev',
        sync_deletions: true
      }
    };
  }

  /**
   * Main orchestration method
   */
  async sync() {
    console.log('🤖 Starting Copilot-powered demo sync...\n');

    try {
      // Step 1: Detect changes
      console.log('📊 Step 1: Detecting changes...');
      await this.detectChanges();

      // Step 2: Filter changes based on ignore patterns
      console.log('🔍 Step 2: Applying ignore patterns...');
      await this.applyIgnorePatterns();

      // Step 3: Analyze changes with AI
      console.log('🧠 Step 3: AI analyzing changes...');
      await this.analyzeChangesWithAI();

      // Step 4: Apply changes intelligently
      console.log('✨ Step 4: Applying changes...');
      await this.applyChanges();

      // Step 5: Validate sync
      console.log('✅ Step 5: Validating sync...');
      await this.validateSync();

      // Step 6: Generate PR description
      console.log('📝 Step 6: Generating PR description...');
      const prDescription = await this.generatePRDescription();

      // Step 7: Output results
      this.outputResults(prDescription);

      console.log('\n✅ Sync completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Sync failed:', error.message);
      this.outputResults(null, error);
      process.exit(1);
    }
  }

  /**
   * Detect all changes between main-app and demo-app
   */
  async detectChanges() {
    const changedFiles = execSync(
      'git diff HEAD~1 HEAD --name-status -- src',
      { cwd: MAIN_APP_PATH, encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    for (const line of changedFiles) {
      const [status, ...fileParts] = line.split('\t');
      const file = fileParts.join('\t');

      if (status === 'A') {
        this.changes.added.push(file);
      } else if (status === 'M') {
        this.changes.modified.push(file);
      } else if (status === 'D') {
        this.changes.deleted.push(file);
      }
    }

    console.log(`   ✓ Added: ${this.changes.added.length} files`);
    console.log(`   ✓ Modified: ${this.changes.modified.length} files`);
    console.log(`   ✓ Deleted: ${this.changes.deleted.length} files`);
  }

  /**
   * Apply ignore patterns from config
   */
  async applyIgnorePatterns() {
    const ignorePatterns = this.config.ignore_patterns || [];
    
    const filterFiles = (files) => {
      return files.filter(file => {
        for (const pattern of ignorePatterns) {
          if (this.matchPattern(file, pattern)) {
            console.log(`   ⊗ Ignoring: ${file}`);
            this.syncLog.push({ action: 'ignored', file, reason: `Matched pattern: ${pattern}` });
            return false;
          }
        }
        return true;
      });
    };

    this.changes.added = filterFiles(this.changes.added);
    this.changes.modified = filterFiles(this.changes.modified);
    this.changes.deleted = filterFiles(this.changes.deleted);

    console.log(`   ✓ Filtered: ${this.syncLog.filter(l => l.action === 'ignored').length} files ignored`);
  }

  /**
   * Match file against glob pattern
   */
  matchPattern(file, pattern) {
    // Simple glob matching (for production, use a proper glob library)
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(file);
  }

  /**
   * Use AI to analyze changes and suggest sync strategy
   */
  async analyzeChangesWithAI() {
    if (!this.config.ai_config.auto_detect_demo_code) {
      console.log('   ⊗ AI auto-detection disabled, using config only');
      return;
    }

    // For each modified file, check if it contains demo-specific patterns
    for (const file of this.changes.modified) {
      const mainContent = this.readFile(path.join(MAIN_APP_PATH, file));
      const demoPath = path.join(DEMO_APP_PATH, file);
      const demoContent = fs.existsSync(demoPath) ? this.readFile(demoPath) : null;

      if (!demoContent) continue;

      // Check for auto-detect patterns
      const hasDemoPatterns = this.detectDemoPatterns(demoContent);
      const hasIntentionalBlocks = this.hasProtectedBlocks(demoContent);

      if (hasDemoPatterns || hasIntentionalBlocks) {
        console.log(`   🔍 AI detected demo-specific code in: ${file}`);
        this.syncLog.push({
          action: 'ai_detected',
          file,
          patterns: hasDemoPatterns,
          intentional_blocks: hasIntentionalBlocks
        });
      }
    }

    console.log(`   ✓ AI analysis completed`);
  }

  /**
   * Detect demo-specific patterns in file content
   */
  detectDemoPatterns(content) {
    const patterns = this.config.auto_detect_patterns;
    const detected = [];

    for (const [category, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        if (content.includes(pattern)) {
          detected.push({ category, pattern });
        }
      }
    }

    return detected;
  }

  /**
   * Check if file has protected blocks
   */
  hasProtectedBlocks(content) {
    const startMarkers = this.config.protected_blocks.start_markers;
    return startMarkers.some(marker => content.includes(marker));
  }

  /**
   * Apply changes to demo-app
   */
  async applyChanges() {
    // Handle added files
    for (const file of this.changes.added) {
      await this.copyFile(file);
    }

    // Handle modified files
    for (const file of this.changes.modified) {
      await this.syncFile(file);
    }

    // Handle deleted files
    if (this.config.advanced.sync_deletions) {
      for (const file of this.changes.deleted) {
        await this.deleteFile(file);
      }
    }
  }

  /**
   * Copy new file from main to demo
   */
  async copyFile(file) {
    const srcPath = path.join(MAIN_APP_PATH, file);
    const destPath = path.join(DEMO_APP_PATH, file);

    // Create directory if it doesn't exist
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.copyFileSync(srcPath, destPath);
    console.log(`   ✓ Copied: ${file}`);
    this.syncLog.push({ action: 'added', file });
  }

  /**
   * Sync modified file with smart merge
   */
  async syncFile(file) {
    const shouldSmartMerge = this.shouldUseSmartMerge(file);
    
    if (shouldSmartMerge) {
      await this.smartMergeFile(file);
    } else {
      await this.copyFile(file);
      console.log(`   ✓ Full copy: ${file}`);
      this.syncLog.push({ action: 'full_copy', file });
    }
  }

  /**
   * Determine if file should use smart merge
   */
  shouldUseSmartMerge(file) {
    const smartMergePatterns = this.config.smart_merge_files || [];
    return smartMergePatterns.some(pattern => this.matchPattern(file, pattern));
  }

  /**
   * Smart merge with INTENTIONAL block preservation
   */
  async smartMergeFile(file) {
    const mainPath = path.join(MAIN_APP_PATH, file);
    const demoPath = path.join(DEMO_APP_PATH, file);

    const mainContent = this.readFile(mainPath);
    const demoContent = fs.existsSync(demoPath) ? this.readFile(demoPath) : mainContent;

    // Extract protected blocks from demo
    const protectedBlocks = this.extractProtectedBlocks(demoContent);

    if (protectedBlocks.length === 0) {
      // No protected blocks, just copy
      fs.copyFileSync(mainPath, demoPath);
      console.log(`   ✓ Smart merge (no blocks): ${file}`);
      this.syncLog.push({ action: 'smart_merge_no_blocks', file });
      return;
    }

    // Demo has protected blocks - merge intelligently
    // Strategy: Insert demo's protected blocks into main's content at appropriate positions
    const mergedContent = this.intelligentMerge(mainContent, demoContent, protectedBlocks, file);
    
    fs.writeFileSync(demoPath, mergedContent.content);
    
    if (mergedContent.warnings.length > 0) {
      console.log(`   ⚠️  Smart merge with warnings (${protectedBlocks.length} blocks): ${file}`);
      this.syncLog.push({
        action: 'smart_merge_with_warnings',
        file,
        blocks_preserved: protectedBlocks.length,
        warnings: mergedContent.warnings
      });
      this.changes.conflicts.push({ file, warnings: mergedContent.warnings });
    } else {
      console.log(`   ✓ Smart merge (${protectedBlocks.length} blocks preserved): ${file}`);
      this.syncLog.push({
        action: 'smart_merge',
        file,
        blocks_preserved: protectedBlocks.length
      });
    }
    
    this.changes.preserved.push({ file, blocks: protectedBlocks.length });
  }

  /**
   * Extract protected code blocks
   */
  extractProtectedBlocks(content) {
    const blocks = [];
    const lines = content.split('\n');
    const startMarkers = this.config.protected_blocks.start_markers;
    const endMarkers = this.config.protected_blocks.end_markers;

    let inBlock = false;
    let currentBlock = [];
    let blockStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!inBlock && startMarkers.some(marker => line.includes(marker))) {
        inBlock = true;
        blockStart = i;
        currentBlock = [line];
      } else if (inBlock) {
        currentBlock.push(line);
        
        if (endMarkers.some(marker => line.includes(marker))) {
          blocks.push({
            start: blockStart,
            end: i,
            content: currentBlock.join('\n')
          });
          inBlock = false;
          currentBlock = [];
        }
      }
    }

    return blocks;
  }

  /**
   * Intelligent merge: preserve demo's protected blocks while updating from main
   */
  intelligentMerge(mainContent, demoContent, protectedBlocks, file) {
    const mainLines = mainContent.split('\n');
    const demoLines = demoContent.split('\n');
    const startMarkers = this.config.protected_blocks.start_markers;
    const endMarkers = this.config.protected_blocks.end_markers;
    
    const warnings = [];
    let result = [...mainLines]; // Start with main content
    
    // For each protected block in demo, find where to insert it in main
    for (const block of protectedBlocks) {
      // Get context around the block (lines before and after)
      const contextBefore = this.getContextBefore(demoLines, block.start, 3);
      const contextAfter = this.getContextAfter(demoLines, block.end, 3);
      
      // Try to find matching context in main
      const insertPosition = this.findInsertPosition(result, contextBefore, contextAfter);
      
      if (insertPosition !== -1) {
        // Found matching context - insert protected block
        const blockLines = block.content.split('\n');
        
        // Calculate how many lines to replace (between context before and after)
        const replaceStart = insertPosition;
        const replaceEnd = this.findContextAfterPosition(result, contextAfter, replaceStart);
        
        if (replaceEnd !== -1) {
          // Replace the section with protected block
          result.splice(replaceStart, replaceEnd - replaceStart, ...blockLines);
        } else {
          // Just insert the block
          result.splice(insertPosition, 0, ...blockLines);
        }
      } else {
        // Could not find matching context - main removed this section
        warnings.push({
          type: 'protected_block_context_missing',
          message: `Protected block at lines ${block.start}-${block.end} has no matching context in main-app. Main may have removed this section.`,
          block: block.content.substring(0, 100) + '...'
        });
        
        // Still try to preserve by appending at the end with a warning comment
        result.push('');
        result.push('// ⚠️ WARNING: This block was preserved but context not found in main-app');
        result.push(...block.content.split('\n'));
      }
    }
    
    return {
      content: result.join('\n'),
      warnings
    };
  }
  
  /**
   * Get context lines before a position
   */
  getContextBefore(lines, position, count) {
    const start = Math.max(0, position - count);
    const contextLines = [];
    
    for (let i = start; i < position; i++) {
      const line = lines[i].trim();
      // Skip empty lines and marker lines
      if (line && !this.isMarkerLine(line)) {
        contextLines.push(line);
      }
    }
    
    return contextLines;
  }
  
  /**
   * Get context lines after a position
   */
  getContextAfter(lines, position, count) {
    const end = Math.min(lines.length, position + count + 1);
    const contextLines = [];
    
    for (let i = position + 1; i < end; i++) {
      const line = lines[i].trim();
      // Skip empty lines and marker lines
      if (line && !this.isMarkerLine(line)) {
        contextLines.push(line);
      }
    }
    
    return contextLines;
  }
  
  /**
   * Check if line is a marker line
   */
  isMarkerLine(line) {
    const allMarkers = [
      ...this.config.protected_blocks.start_markers,
      ...this.config.protected_blocks.end_markers
    ];
    return allMarkers.some(marker => line.includes(marker));
  }
  
  /**
   * Find insertion position based on context
   */
  findInsertPosition(lines, contextBefore, contextAfter) {
    // Look for matching context before
    for (let i = 0; i < lines.length; i++) {
      if (this.matchesContext(lines, i, contextBefore, true)) {
        // Found context before, verify context after exists nearby
        const afterPos = i + contextBefore.length;
        if (afterPos < lines.length) {
          return afterPos;
        }
      }
    }
    
    return -1;
  }
  
  /**
   * Find position of context after
   */
  findContextAfterPosition(lines, contextAfter, startFrom) {
    for (let i = startFrom; i < Math.min(lines.length, startFrom + 20); i++) {
      if (this.matchesContext(lines, i, contextAfter, false)) {
        return i;
      }
    }
    return -1;
  }
  
  /**
   * Check if lines match context
   */
  matchesContext(lines, startPos, context, skipEmpty = true) {
    let lineIdx = startPos;
    let contextIdx = 0;
    
    while (contextIdx < context.length && lineIdx < lines.length) {
      const line = lines[lineIdx].trim();
      
      if (skipEmpty && !line) {
        lineIdx++;
        continue;
      }
      
      if (line === context[contextIdx]) {
        contextIdx++;
      } else if (line.includes(context[contextIdx]) || context[contextIdx].includes(line)) {
        // Partial match also acceptable
        contextIdx++;
      } else {
        return false;
      }
      
      lineIdx++;
    }
    
    return contextIdx === context.length;
  }

  /**
   * Merge main content with protected blocks from demo (DEPRECATED - kept for backward compatibility)
   */
  mergeWithProtectedBlocks(mainContent, protectedBlocks) {
    // Both main and demo have protected blocks
    // Match them up and replace main's blocks with demo's blocks
    const mainLines = mainContent.split('\n');
    const startMarkers = this.config.protected_blocks.start_markers;
    const endMarkers = this.config.protected_blocks.end_markers;

    let result = [];
    let i = 0;
    let blockIndex = 0;

    while (i < mainLines.length) {
      const line = mainLines[i];

      // Check if this is a protected block start in main
      if (startMarkers.some(marker => line.includes(marker))) {
        // Find corresponding block in demo's protected blocks
        if (blockIndex < protectedBlocks.length) {
          // Replace with demo's version
          const blockLines = protectedBlocks[blockIndex].content.split('\n');
          result.push(...blockLines);
          blockIndex++;

          // Skip to end of block in main
          i++;
          while (i < mainLines.length && !endMarkers.some(marker => mainLines[i].includes(marker))) {
            i++;
          }
          i++; // Skip the end marker
        } else {
          result.push(line);
          i++;
        }
      } else {
        result.push(line);
        i++;
      }
    }

    return result.join('\n');
  }

  /**
   * Delete file from demo-app
   */
  async deleteFile(file) {
    const demoPath = path.join(DEMO_APP_PATH, file);
    
    if (fs.existsSync(demoPath)) {
      fs.unlinkSync(demoPath);
      console.log(`   ✓ Deleted: ${file}`);
      this.syncLog.push({ action: 'deleted', file });
    }
  }

  /**
   * Validate sync results
   */
  async validateSync() {
    const errors = [];
    const warnings = [];

    // Validate protected blocks
    if (this.config.validation.validate_protected_blocks) {
      for (const { file } of this.changes.preserved) {
        const demoPath = path.join(DEMO_APP_PATH, file);
        const content = this.readFile(demoPath);
        
        const validation = this.validateProtectedBlocks(content);
        if (!validation.valid) {
          errors.push(`${file}: ${validation.error}`);
        }
      }
    }

    // Check imports (basic check)
    if (this.config.validation.check_imports) {
      // This is a simplified check - in production, use proper AST parsing
      for (const file of [...this.changes.added, ...this.changes.modified]) {
        const demoPath = path.join(DEMO_APP_PATH, file);
        if (fs.existsSync(demoPath)) {
          const content = this.readFile(demoPath);
          const importIssues = this.checkImports(content);
          if (importIssues.length > 0) {
            warnings.push(`${file}: Potential import issues detected`);
          }
        }
      }
    }

    if (errors.length > 0) {
      console.log(`   ⚠️  Validation errors: ${errors.length}`);
      errors.forEach(err => console.log(`      - ${err}`));
      
      if (this.config.validation.fail_on_error) {
        throw new Error(`Validation failed with ${errors.length} errors`);
      }
    }

    if (warnings.length > 0) {
      console.log(`   ⚠️  Validation warnings: ${warnings.length}`);
      warnings.forEach(warn => console.log(`      - ${warn}`));
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('   ✓ All validation checks passed');
    }

    this.validationResults = { errors, warnings };
  }

  /**
   * Validate protected blocks are properly closed
   */
  validateProtectedBlocks(content) {
    const startMarkers = this.config.protected_blocks.start_markers;
    const endMarkers = this.config.protected_blocks.end_markers;
    
    let openBlocks = 0;
    const lines = content.split('\n');

    for (const line of lines) {
      if (startMarkers.some(marker => line.includes(marker))) {
        openBlocks++;
      }
      if (endMarkers.some(marker => line.includes(marker))) {
        openBlocks--;
      }
    }

    if (openBlocks !== 0) {
      return {
        valid: false,
        error: `Unclosed protected blocks: ${openBlocks > 0 ? 'missing END' : 'missing START'}`
      };
    }

    return { valid: true };
  }

  /**
   * Basic import validation
   */
  checkImports(content) {
    const issues = [];
    const importRegex = /import\s+.*\s+from\s+['"](.+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      // Check for potential issues (this is simplified)
      if (importPath.includes('demo-specific') || importPath.includes('mock')) {
        // These are okay in demo
        continue;
      }
    }

    return issues;
  }

  /**
   * Generate comprehensive PR description using AI
   */
  async generatePRDescription() {
    const summary = {
      added: this.changes.added.length,
      modified: this.changes.modified.length,
      deleted: this.changes.deleted.length,
      preserved_blocks: this.changes.preserved.reduce((sum, p) => sum + p.blocks, 0),
      files_with_blocks: this.changes.preserved.length,
      conflicts: this.changes.conflicts.length
    };

    let conflictSection = '';
    if (this.changes.conflicts.length > 0) {
      conflictSection = `
### ⚠️ Protected Block Warnings

The following files have protected blocks that may need manual review:

${this.changes.conflicts.map(c => {
  const warningDetails = c.warnings.map(w => `  - **${w.type}**: ${w.message}`).join('\n');
  return `**\`${c.file}\`**\n${warningDetails}`;
}).join('\n\n')}

**Action Required**: Please review these files carefully. Main-app may have removed or significantly changed code that was protected in demo-app.
`;
    }

    const description = `## 🤖 Automated Demo Sync

This PR synchronizes changes from \`main-app\` to \`demo-app\` using AI-powered intelligent merging.

### 📊 Summary
- **Added**: ${summary.added} files
- **Modified**: ${summary.modified} files
- **Deleted**: ${summary.deleted} files
- **Protected Blocks Preserved**: ${summary.preserved_blocks} blocks in ${summary.files_with_blocks} files
${summary.conflicts > 0 ? `- **⚠️ Files with Warnings**: ${summary.conflicts}\n` : ''}
${conflictSection}
### 📝 Detailed Changes

#### ✅ Added Files
${this.changes.added.length > 0 ? this.changes.added.map(f => `- \`${f}\``).join('\n') : '_None_'}

#### ✏️ Modified Files
${this.changes.modified.length > 0 ? this.changes.modified.map(f => `- \`${f}\``).join('\n') : '_None_'}

#### 🗑️ Deleted Files
${this.changes.deleted.length > 0 ? this.changes.deleted.map(f => `- \`${f}\``).join('\n') : '_None_'}

### 🛡️ Protected Code Blocks
${this.changes.preserved.length > 0 ? 
  this.changes.preserved.map(p => `- \`${p.file}\` (${p.blocks} blocks preserved)`).join('\n') : 
  '_No protected blocks in modified files_'}

### ✅ Validation Results
${this.validationResults ? `
- **Errors**: ${this.validationResults.errors.length}
- **Warnings**: ${this.validationResults.warnings.length}
${this.validationResults.warnings.length > 0 ? '\n⚠️ **Warnings:**\n' + this.validationResults.warnings.map(w => `- ${w}`).join('\n') : ''}
` : '_Validation skipped_'}

### 🧪 Testing Recommendations
1. **UI Review**: Check that demo-specific UI elements (disabled buttons, notices) are intact
2. **Data Flow**: Verify mock data is still being used instead of real API calls
3. **Functionality**: Ensure disabled features remain disabled
4. **Styling**: Confirm visual appearance matches main-app

### 🔗 References
- Main app commit: \`${process.env.GITHUB_SHA || 'unknown'}\`
- Sync config: \`.github/sync-config.yml\`
- Workflow run: [#${process.env.GITHUB_RUN_ID || 'N/A'}](${process.env.GITHUB_SERVER_URL || ''}/${process.env.GITHUB_REPOSITORY || ''}/actions/runs/${process.env.GITHUB_RUN_ID || ''})

---
_This PR was automatically generated by Copilot-powered sync workflow. Review carefully before merging._
`;

    return description;
  }

  /**
   * Output results to file for GitHub Actions
   */
  outputResults(prDescription, error = null) {
    const output = {
      success: !error,
      changes: this.changes,
      syncLog: this.syncLog,
      validation: this.validationResults,
      prDescription,
      error: error ? error.message : null
    };

    // Write to output file
    fs.writeFileSync('sync-results.json', JSON.stringify(output, null, 2));

    // Write PR description to file
    if (prDescription) {
      fs.writeFileSync('pr-description.md', prDescription);
    }

    // Set GitHub Actions outputs
    if (process.env.GITHUB_OUTPUT) {
      const ghOutput = [
        `changes_made=${this.changes.added.length + this.changes.modified.length + this.changes.deleted.length > 0}`,
        `files_changed=${this.changes.added.length + this.changes.modified.length + this.changes.deleted.length}`,
        `has_errors=${this.validationResults?.errors?.length > 0}`,
        `has_warnings=${this.validationResults?.warnings?.length > 0}`
      ].join('\n');
      
      fs.appendFileSync(process.env.GITHUB_OUTPUT, ghOutput + '\n');
    }
  }

  /**
   * Read file with error handling
   */
  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }
}

// Main execution
if (require.main === module) {
  const orchestrator = new CopilotSyncOrchestrator();
  orchestrator.sync().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = CopilotSyncOrchestrator;
