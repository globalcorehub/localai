// Run with: node tests/runtime-verification.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const signature = { version: 'v4.2', runtime: '@xenova/transformers@2.17.2', onnx: 'ort-wasm-simd.wasm' };

(async () => {
  let checks = 0;
  for (const language of ['', 'zh/', 'de/', 'es/', 'fr/', 'ja/', 'pt/']) {
    const html = fs.readFileSync(path.join(root, language, 'whisper-speech-to-text.html'), 'utf8');
    const start = html.indexOf('  async function probeNeuralRuntime()');
    const end = html.indexOf('  async function updateRuntimeUI()', start);
    assert(start >= 0 && end > start, 'Runtime verification function exists');
    const source = html.slice(start, end);
    for (const scenario of ['valid', 'invalid', 'missing', 'unsupported', 'cache-error']) {
      let stored = JSON.stringify(scenario === 'invalid' ? { ...signature, onnx: 'bad' } : signature);
      const context = {
        RUNTIME_SIGNATURE: signature,
        RUNTIME_VERIFIED_KEY: 'key',
        RUNTIME_ASSETS: [{ url: 'js', minSize: 5 }, { url: 'wasm', minSize: 5 }],
        localStorage: { getItem: () => stored },
        revokeRuntimeVerified: () => { stored = null; },
        window: {}
      };
      if (scenario !== 'unsupported') {
        context.window.caches = {
          keys: async () => {
            if (scenario === 'cache-error') throw new Error('CacheStorage unavailable');
            return ['localai-offline-v8'];
          },
          open: async () => ({
            match: async () => scenario === 'missing' ? undefined : { blob: async () => ({ size: 10 }) }
          })
        };
      }
      vm.createContext(context);
      const result = await vm.runInContext(source + ';probeNeuralRuntime()', context);
      assert.equal(result.ready, scenario === 'valid', `${language} ${scenario} readiness`);
      assert.equal(stored === null, scenario !== 'valid', `${language} ${scenario} revocation`);
      checks++;
    }
  }
  console.log(`${checks} runtime verification scenarios passed across seven languages.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
