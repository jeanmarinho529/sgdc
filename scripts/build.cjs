// Empacota a aplicação React com esbuild e gera a pasta dist/ pronta para hospedagem estática.
//   npm run build   -> dist/ otimizada (minificada)
//   npm run dev     -> reconstrói a cada alteração e serve em http://localhost:5173
const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const watch = process.argv.includes('--watch');

const options = {
  entryPoints: [path.join(root, 'src/main.jsx')],
  bundle: true,
  // Permite resolver pacotes instalados globalmente quando NODE_PATH estiver definido (opcional).
  nodePaths: (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean),
  outdir: path.join(dist, 'assets'),
  entryNames: 'app',
  jsx: 'automatic',
  loader: { '.jsx': 'jsx' },
  format: 'esm',
  target: ['es2020'],
  minify: !watch,
  sourcemap: watch,
  define: { 'process.env.NODE_ENV': JSON.stringify(watch ? 'development' : 'production') },
  logLevel: 'info',
};

function writeHtml() {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(path.join(dist, 'index.html'), html);
}

(async () => {
  fs.rmSync(dist, { recursive: true, force: true });
  writeHtml();
  if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    const { port } = await ctx.serve({ servedir: dist, port: 5173 });
    console.log(`Servindo em http://localhost:${port}`);
  } else {
    await esbuild.build(options);
    console.log('Build concluído em dist/');
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
