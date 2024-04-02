const UnicodeBidi = require("./UnicodeBidi.js");
const UnicodeBidiDirection = require("./UnicodeBidiDirection.js");
const invariant = require("invariant");


// Remove import statement, type definitions not directly supported in JS
// const { BidiDirection } = require('UnicodeBidiDirection');

class UnicodeBidiService {

  _defaultDir;
  _lastDir;

  /**
   * Stateful class for paragraph direction detection
   *
   * @param defaultDir  Default direction of the service
   */
  constructor(defaultDir) {
    if (!defaultDir) {
      defaultDir = UnicodeBidiDirection.getGlobalDir();
    } else {
      invariant(
        UnicodeBidiDirection.isStrong(defaultDir),
        'Default direction must be a strong direction (LTR or RTL)'
      );
    }
    this._defaultDir = defaultDir;
    this.reset();
  }

  /**
   * Reset the internal state
   *
   * Instead of creating a new instance, you can just reset() your instance
   * everytime you start a new loop.
   */
  reset() {
    this._lastDir = this._defaultDir;
  }

  /**
   * Returns the direction of a block of text, and remembers it as the
   * fall-back direction for the next paragraph.
   *
   * @param str  A text block, e.g. paragraph, table cell, tag
   * @return     The resolved direction
   */
  getDirection(str) {
    this._lastDir = UnicodeBidi.getDirection(str, this._lastDir);
    return this._lastDir;
  }

}

module.exports = UnicodeBidiService
