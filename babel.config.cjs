module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  // Jest runs via CommonJS/Babel, which chokes on `import.meta` (a
  // Vite/ESM-only construct used in src/api/googleBooks.js). This plugin
  // rewrites import.meta.env to a plain object under test so the file
  // doesn't need a separate test-only branch.
  plugins: ['transform-vite-meta-env'],
};
