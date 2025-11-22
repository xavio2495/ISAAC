const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

console.log('Building frontend - temporarily disabling API routes...');

// Recursively find all route.ts files and rename them
function renameRoutes(dir, action) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      renameRoutes(fullPath, action);
    } else if (item === 'route.ts' && action === 'disable') {
      const disabledPath = fullPath.replace('.ts', '.disabled.ts');
      fs.renameSync(fullPath, disabledPath);
      console.log('Disabled:', fullPath);
    } else if (item.endsWith('.disabled.ts') && action === 'enable') {
      const enabledPath = fullPath.replace('.disabled.ts', '.ts');
      fs.renameSync(fullPath, enabledPath);
      console.log('Enabled:', enabledPath);
    }
  }
}

// Disable API routes
if (fs.existsSync(apiDir)) {
  renameRoutes(apiDir, 'disable');
}

// Switch to frontend config
const configPath = path.join(__dirname, '..', 'next.config.ts');
const frontendConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true, // Required for IPFS
  images: { unoptimized: true }, // Required for static export
};

export default nextConfig;
`;

fs.writeFileSync(configPath, frontendConfig);

// Run Next.js build
try {
  console.log('Running Next.js build...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('Frontend build completed successfully');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} finally {
  // Restore API routes
  if (fs.existsSync(apiDir)) {
    renameRoutes(apiDir, 'enable');
  }

  // Restore original config
  const originalConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only enable static export for frontend builds (IPFS deployment)
  ...(process.env.BUILD_TARGET === 'frontend' && {
    output: 'export',
    trailingSlash: true, // Required for IPFS
    images: { unoptimized: true }, // Required for static export
  }),
};

export default nextConfig;
`;

  fs.writeFileSync(configPath, originalConfig);
  console.log('Restored API routes and config');
}