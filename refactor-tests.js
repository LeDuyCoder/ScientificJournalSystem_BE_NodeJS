import fs from 'fs';
import path from 'path';

const testFiles = [
    'tests/unit/controllers/article.test.js',
    'tests/system/auth.test.js',
    'tests/system/user.test.js',
    'tests/system/article.test.js'
];

for (const file of testFiles) {
    if (!fs.existsSync(file)) {
        console.log(`Skipping ${file} - not found`);
        continue;
    }
    
    let content = fs.readFileSync(file, 'utf8');

    // 1. Replace `import app from '.../app.js'` with `import { buildApp } from '.../app.js'`
    content = content.replace(/import\s+app\s+from\s+(['"])(.*\/app\.js)\1;/, "import { buildApp } from '$2';");

    // 2. Insert setup hook.
    if (content.includes('import { jest, test, expect, beforeAll, afterAll } from \'@jest/globals\';') || content.includes('beforeAll(')) {
        // Jest style
        if (!content.includes('let app;')) {
            content = content.replace(/(import.*?\n\n)/s, "$1let app;\n\nbeforeAll(async () => {\n  app = await buildApp();\n  await app.ready();\n});\n\n");
        }
        content = content.replace(/afterAll\(async \(\) => \{/, "afterAll(async () => {\n    if (app) await app.close();");
    } else if (content.includes('test.after(') || content.includes('import test from \'node:test\';')) {
        // node:test style
        if (!content.includes('let app;')) {
            content = content.replace(/(import.*?\n\n)/s, "$1let app;\ntest.before(async () => {\n  app = await buildApp();\n  await app.ready();\n});\n\n");
        }
        content = content.replace(/test\.after\(async \(\) => \{/, "test.after(async () => {\n  if (app) await app.close();");
    }

    // 3. Replace request(app) with request(app.server)
    content = content.replace(/request\(app\)/g, "request(app.server)");

    fs.writeFileSync(file, content);
    console.log(`Refactored ${file}`);
}
