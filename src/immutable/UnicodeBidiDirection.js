import invariant from "invariant"

// exports.BidiDirection = 'LTR' | 'RTL' | 'NEUTRAL';
// exports.HTMLDir = 'ltr' | 'rtl';

const BidiDirection = 'LTR' | 'RTL' | 'NEUTRAL';
const HTMLDir = 'ltr' | 'rtl';

const NEUTRAL = 'NEUTRAL'; // No strong direction
const LTR = 'LTR'; // Left-to-Right direction
const RTL = 'RTL'; // Right-to-Left direction

let globalDir = null;

// == Helpers ==

/**
 * Check if a directionality value is a Strong one
 */
function isStrong(dir) {
  return dir === LTR || dir === RTL;
}

/**
 * Get string value to be used for `dir` HTML attribute or `direction` CSS
 * property.
 */
function getHTMLDir(dir) {
  invariant(
    isStrong(dir),
    '`dir` must be a strong direction to be converted to HTML Direction',
  );
  return dir === LTR ? 'ltr' : 'rtl';
}

/**
 * Get string value to be used for `dir` HTML attribute or `direction` CSS
 * property, but returns null if `dir` has same value as `otherDir`.
 * `null`.
 */
function getHTMLDirIfDifferent(dir, otherDir) {
  invariant(
    isStrong(dir),
    '`dir` must be a strong direction to be converted to HTML Direction',
  );
  invariant(
    isStrong(otherDir),
    '`otherDir` must be a strong direction to be converted to HTML Direction',
  );
  return dir === otherDir ? null : getHTMLDir(dir);
}

// == Global Direction ==

/**
 * Set the global direction.
 */
function setGlobalDir(dir) {
  globalDir = dir;
}

/**
 * Initialize the global direction
 */
function initGlobalDir() {
  setGlobalDir(LTR);
}

/**
 * Get the global direction
 */
function getGlobalDir() {
  if (!globalDir) {
    initGlobalDir();
  }
  invariant(globalDir, 'Global direction not set.');
  return globalDir;
}

const UnicodeBidiDirection = {
  // Values
  NEUTRAL,
  LTR,
  RTL,
  // Helpers
  isStrong,
  getHTMLDir,
  getHTMLDirIfDifferent,
  // Global Direction
  setGlobalDir,
  initGlobalDir,
  getGlobalDir,
};

export default UnicodeBidiDirection;
