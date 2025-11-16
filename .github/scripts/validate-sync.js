#!/usr/bin/env node

/**
 * Validation Script for Demo Sync
 * 
 * Performs pre-sync and post-sync validation checks to ensure
 * the integrity of protected blocks, imports, and syntax.
 */

const fs = require('fs');
const path = require('path');

class SyncValidator {
  constructor(demoAppPath, configPath) {
    this.demoAppPath = demoAppPath;
    this.config = this.loadConfig(configPath);
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Load sync configuration
   */
  loadConfig(configPath) {
    try {
      const yaml = require('js-yaml');
      const configContent = fs.readFileSync(configPath, 'utf8');
      return yaml.load(configContent);
    } catch (error) {
      console.warn('⚠️  Could not load config, using defaults');
      return this.getDefaultConfig();
    }
  }

  /**
   * Default configuration
   */
  getDefaultConfig() {
    return {
      protected_blocks: {
        start_markers: ['// INTENTIONAL-START', '<!-- INTENTIONAL-START -->', '/* INTENTIONAL-START */'],
        end_markers: ['// INTENTIONAL-END', '<!-- INTENTIONAL-END -->', '/* INTENTIONAL-END */']
      },
      validation: {
        check_imports: true,
        validate_protected_blocks: true,
        syntax_check: true,
        max_file_size: 1048576  // 1MB
      }
    };
  }

  /**
   * Run all validation checks
   */
  async validate() {
    console.log('🔍 Running validation checks...\n');

    // Get all source files
    const files = this.getAllSourceFiles(path.join(this.demoAppPath, 'src'));

    for (const file of files) {
      await this.validateFile(file);
    }

    return this.getResults();
  }

  /**
   * Get all source files recursively
   */
  getAllSourceFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...this.getAllSourceFiles(fullPath));
      } else if (this.isSourceFile(item)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Check if file is a source file
   */
  isSourceFile(filename) {
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Validate individual file
   */
  async validateFile(filePath) {
    const relativePath = path.relative(this.demoAppPath, filePath);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check file size
      if (this.config.validation.max_file_size) {
        const size = Buffer.byteLength(content, 'utf8');
        if (size > this.config.validation.max_file_size) {
          this.warnings.push({
            file: relativePath,
            type: 'file_size',
            message: `File size ${size} bytes exceeds limit ${this.config.validation.max_file_size}`
          });
        }
      }

      // Validate protected blocks
      if (this.config.validation.validate_protected_blocks) {
        this.validateProtectedBlocks(relativePath, content);
      }

      // Check imports
      if (this.config.validation.check_imports) {
        this.checkImports(relativePath, content);
      }

      // Basic syntax check
      if (this.config.validation.syntax_check) {
        this.checkSyntax(relativePath, content, filePath);
      }

    } catch (error) {
      this.errors.push({
        file: relativePath,
        type: 'read_error',
        message: `Failed to read file: ${error.message}`
      });
    }
  }

  /**
   * Validate INTENTIONAL blocks are properly formed
   */
  validateProtectedBlocks(filePath, content) {
    const startMarkers = this.config.protected_blocks.start_markers;
    const endMarkers = this.config.protected_blocks.end_markers;
    
    const lines = content.split('\n');
    let openBlocks = 0;
    const blockStarts = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (startMarkers.some(marker => line.includes(marker))) {
        openBlocks++;
        blockStarts.push(i + 1);  // Line numbers are 1-indexed
      }

      if (endMarkers.some(marker => line.includes(marker))) {
        openBlocks--;
        if (openBlocks < 0) {
          this.errors.push({
            file: filePath,
            type: 'protected_block',
            line: i + 1,
            message: 'INTENTIONAL-END without matching INTENTIONAL-START'
          });
          openBlocks = 0;  // Reset to prevent cascading errors
        }
      }
    }

    if (openBlocks > 0) {
      this.errors.push({
        file: filePath,
        type: 'protected_block',
        line: blockStarts[blockStarts.length - 1],
        message: `${openBlocks} unclosed INTENTIONAL block(s) - missing INTENTIONAL-END`
      });
    }
  }

  /**
   * Check for common import issues
   */
  checkImports(filePath, content) {
    // Only check JS/TS files
    if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) {
      return;
    }

    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for relative imports going too many levels up
      if (line.match(/from\s+['"](\.\.\/){4,}/)) {
        this.warnings.push({
          file: filePath,
          type: 'import',
          line: i + 1,
          message: 'Import path goes up too many levels (>= 4 levels)'
        });
      }

      // Check for imports from main-app specific paths (should not exist in demo)
      if (line.match(/from\s+['"].*\/main-app\//)) {
        this.errors.push({
          file: filePath,
          type: 'import',
          line: i + 1,
          message: 'Import references main-app path (should be relative or demo-specific)'
        });
      }

      // Check for common typos in imports
      if (line.match(/improt|imoprt|form\s+['"]/) && !line.includes('//')) {
        this.warnings.push({
          file: filePath,
          type: 'import',
          line: i + 1,
          message: 'Possible typo in import statement'
        });
      }
    }
  }

  /**
   * Basic syntax checking
   */
  checkSyntax(filePath, content, fullPath) {
    const ext = path.extname(filePath);

    if (ext === '.js' || ext === '.jsx') {
      this.checkJavaScriptSyntax(filePath, content);
    } else if (ext === '.html') {
      this.checkHTMLSyntax(filePath, content);
    } else if (ext === '.css' || ext === '.scss') {
      this.checkCSSSyntax(filePath, content);
    }
  }

  /**
   * Check JavaScript syntax
   */
  checkJavaScriptSyntax(filePath, content) {
    // Check for unmatched brackets
    const brackets = { '(': ')', '[': ']', '{': '}' };
    const stack = [];
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (Object.keys(brackets).includes(char)) {
        stack.push({ char, pos: i });
      } else if (Object.values(brackets).includes(char)) {
        if (stack.length === 0) {
          this.warnings.push({
            file: filePath,
            type: 'syntax',
            message: `Unmatched closing bracket '${char}'`
          });
          break;
        }
        
        const last = stack.pop();
        if (brackets[last.char] !== char) {
          this.warnings.push({
            file: filePath,
            type: 'syntax',
            message: `Mismatched brackets: '${last.char}' and '${char}'`
          });
          break;
        }
      }
    }

    if (stack.length > 0) {
      this.warnings.push({
        file: filePath,
        type: 'syntax',
        message: `${stack.length} unclosed bracket(s)`
      });
    }

    // Check for common JavaScript errors
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for var (should use let/const)
      if (line.match(/^\s*var\s+/) && !line.includes('//')) {
        this.warnings.push({
          file: filePath,
          type: 'best_practice',
          line: i + 1,
          message: 'Use let/const instead of var'
        });
      }

      // Check for console.log (might be debug code)
      if (line.match(/console\.(log|debug|info)/) && !line.includes('//')) {
        this.warnings.push({
          file: filePath,
          type: 'debug_code',
          line: i + 1,
          message: 'Console statement detected (might be debug code)'
        });
      }
    }
  }

  /**
   * Check HTML syntax
   */
  checkHTMLSyntax(filePath, content) {
    // Check for unclosed tags (simplified)
    const tagPattern = /<(\w+)[^>]*>/g;
    const closePattern = /<\/(\w+)>/g;
    
    const openTags = [];
    const closeTags = [];
    
    let match;
    while ((match = tagPattern.exec(content)) !== null) {
      const tag = match[1].toLowerCase();
      // Skip self-closing tags
      if (!['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tag)) {
        openTags.push(tag);
      }
    }
    
    while ((match = closePattern.exec(content)) !== null) {
      closeTags.push(match[1].toLowerCase());
    }

    // Basic count check
    if (openTags.length !== closeTags.length) {
      this.warnings.push({
        file: filePath,
        type: 'syntax',
        message: `Potential unclosed HTML tags (${openTags.length} open vs ${closeTags.length} close)`
      });
    }
  }

  /**
   * Check CSS syntax
   */
  checkCSSSyntax(filePath, content) {
    // Check for unmatched braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      this.errors.push({
        file: filePath,
        type: 'syntax',
        message: `Unmatched braces (${openBraces} open vs ${closeBraces} close)`
      });
    }

    // Check for missing semicolons
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Property lines should end with semicolon
      if (line.match(/:\s*.+[^;{}\s]$/) && !line.includes('//')) {
        this.warnings.push({
          file: filePath,
          type: 'syntax',
          line: i + 1,
          message: 'CSS property might be missing semicolon'
        });
      }
    }
  }

  /**
   * Get validation results
   */
  getResults() {
    console.log('\n📋 Validation Results:');
    console.log(`   ✓ Files checked: ${this.getAllSourceFiles(path.join(this.demoAppPath, 'src')).length}`);
    console.log(`   ❌ Errors: ${this.errors.length}`);
    console.log(`   ⚠️  Warnings: ${this.warnings.length}\n`);

    if (this.errors.length > 0) {
      console.log('❌ Errors:');
      this.errors.forEach(err => {
        const line = err.line ? `:${err.line}` : '';
        console.log(`   ${err.file}${line} - ${err.message}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach(warn => {
        const line = warn.line ? `:${warn.line}` : '';
        console.log(`   ${warn.file}${line} - ${warn.message}`);
      });
      console.log('');
    }

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      filesChecked: this.getAllSourceFiles(path.join(this.demoAppPath, 'src')).length
    };
  }

  /**
   * Write results to JSON file
   */
  writeResults(outputPath) {
    const results = {
      timestamp: new Date().toISOString(),
      success: this.errors.length === 0,
      summary: {
        filesChecked: this.getAllSourceFiles(path.join(this.demoAppPath, 'src')).length,
        errors: this.errors.length,
        warnings: this.warnings.length
      },
      errors: this.errors,
      warnings: this.warnings
    };

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📄 Results written to ${outputPath}`);
  }
}

// Main execution
if (require.main === module) {
  const demoAppPath = process.env.DEMO_APP_PATH || process.argv[2] || '../demo-app';
  const configPath = process.env.CONFIG_PATH || process.argv[3] || '.github/sync-config.yml';
  const outputPath = process.argv[4] || 'validation-results.json';

  const validator = new SyncValidator(demoAppPath, configPath);
  
  validator.validate().then(results => {
    validator.writeResults(outputPath);
    
    if (!results.success) {
      console.error('❌ Validation failed');
      process.exit(1);
    }
    
    console.log('✅ Validation passed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Validation error:', error.message);
    process.exit(1);
  });
}

module.exports = SyncValidator;
