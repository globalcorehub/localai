# Browser regression tests

Install Playwright in your test environment and run `node tests/safe-rendering.cjs`. Set `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` when using an existing installation. Tests serve the committed Worker assets locally and block third-party requests. Keyboard activation avoids layout dependence when the external CSS CDN is blocked.

For PDF extraction, also provide `pdf-lib` (or `PDF_LIB_MODULE`) and run `node tests/pdf-extraction.cjs`. Fixtures are generated locally. Run `node tests/runtime-verification.cjs` for offline runtime readiness.
