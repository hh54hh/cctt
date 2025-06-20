#!/usr/bin/env node

/**
 * Build Validation Script for Hussam Gym Management System
 * This script validates all imports before build to prevent deployment errors
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, "..", "src");
const errors = [];
const warnings = [];

// File extensions to check
const extensions = [".ts", ".tsx", ".js", ".jsx"];

// Get all TypeScript/JavaScript files recursively
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (extensions.some((ext) => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Extract import statements from file content
function extractImports(content) {
  const importRegex =
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"](.*?)['"];?/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

// Resolve import path
function resolveImportPath(importPath, currentFile) {
  // Skip external packages
  if (!importPath.startsWith(".") && !importPath.startsWith("@/")) {
    return null;
  }

  // Handle @ alias (src directory)
  if (importPath.startsWith("@/")) {
    return path.join(srcDir, importPath.slice(2));
  }

  // Handle relative imports
  const currentDir = path.dirname(currentFile);
  return path.resolve(currentDir, importPath);
}

// Check if file exists with common extensions
function checkFileExists(basePath) {
  // Check exact path first
  if (fs.existsSync(basePath)) {
    return true;
  }

  // Check with extensions
  for (const ext of extensions) {
    if (fs.existsSync(basePath + ext)) {
      return true;
    }
  }

  // Check for index files
  const indexPaths = extensions.map((ext) =>
    path.join(basePath, `index${ext}`),
  );
  for (const indexPath of indexPaths) {
    if (fs.existsSync(indexPath)) {
      return true;
    }
  }

  return false;
}

// Main validation function
function validateImports() {
  console.log("🔍 Validating imports...\n");

  const allFiles = getAllFiles(srcDir);
  let totalImports = 0;
  let validImports = 0;

  allFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const imports = extractImports(content);

    imports.forEach((importPath) => {
      totalImports++;
      const resolvedPath = resolveImportPath(importPath, filePath);

      if (resolvedPath && !checkFileExists(resolvedPath)) {
        errors.push({
          file: path.relative(process.cwd(), filePath),
          import: importPath,
          resolved: path.relative(process.cwd(), resolvedPath),
        });
      } else {
        validImports++;
      }
    });
  });

  return { totalImports, validImports };
}

// Check for common issues
function checkCommonIssues() {
  console.log("🔧 Checking for common issues...\n");

  // Check for missing files that are commonly imported
  const commonFiles = [
    "src/lib/auth.ts",
    "src/lib/supabase.ts",
    "src/lib/sync.ts",
    "src/lib/indexeddb.ts",
    "src/lib/utils.ts",
    "src/App.tsx",
    "src/main.tsx",
  ];

  commonFiles.forEach((file) => {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      errors.push({
        file: "MISSING_CRITICAL_FILE",
        import: file,
        resolved: file,
      });
    }
  });

  // Check package.json dependencies
  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for required dependencies
    const requiredDeps = [
      "react",
      "react-dom",
      "typescript",
      "vite",
      "@supabase/supabase-js",
      "idb",
    ];

    requiredDeps.forEach((dep) => {
      if (!deps[dep]) {
        warnings.push(`Missing dependency: ${dep}`);
      }
    });
  }
}

// Generate report
function generateReport(stats) {
  console.log("📊 Import Validation Report");
  console.log("═".repeat(50));
  console.log(`Total imports checked: ${stats.totalImports}`);
  console.log(`Valid imports: ${stats.validImports}`);
  console.log(`Errors found: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}\n`);

  if (errors.length > 0) {
    console.log("❌ ERRORS:");
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.file}`);
      console.log(`   Import: "${error.import}"`);
      console.log(`   Resolved: ${error.resolved}`);
      console.log("");
    });
  }

  if (warnings.length > 0) {
    console.log("⚠️  WARNINGS:");
    warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
    console.log("");
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ All imports are valid! Build should succeed.");
  } else if (errors.length === 0) {
    console.log("✅ No critical errors found. Build should succeed.");
    console.log("⚠️  Please review warnings above.");
  } else {
    console.log("❌ Critical errors found! Build will likely fail.");
    console.log("Please fix the errors above before attempting to build.");
  }

  return errors.length === 0;
}

// Main execution
try {
  const stats = validateImports();
  checkCommonIssues();
  const isValid = generateReport(stats);

  process.exit(isValid ? 0 : 1);
} catch (error) {
  console.error("💥 Validation script failed:", error.message);
  process.exit(1);
}
