'use strict';
importScripts('engine.js');
self.onmessage = ({ data }) => {
  const start = performance.now();
  try {
    const result = self.ForgeEngine.generate(data);
    self.postMessage({ ...result, elapsed: performance.now() - start });
  } catch (error) { self.postMessage({ error: error.message }); }
};
