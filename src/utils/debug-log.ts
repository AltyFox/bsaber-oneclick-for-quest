const debug = true;

function debugLog(...args) {
  if (debug) {
    console.log(...args);
  }
}

export default debugLog;
