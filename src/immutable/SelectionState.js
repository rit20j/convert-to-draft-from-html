import Immutable from 'immutable';

const { Record } = Immutable;

const defaultRecord = {
  anchorKey: '',
  anchorOffset: 0,
  focusKey: '',
  focusOffset: 0,
  isBackward: false,
  hasFocus: false,
};

const SelectionStateRecord = Record(defaultRecord);

class SelectionState extends SelectionStateRecord {
  serialize() {
    return (
      'Anchor: ' +
      this.getAnchorKey() +
      ':' +
      this.getAnchorOffset() +
      ', ' +
      'Focus: ' +
      this.getFocusKey() +
      ':' +
      this.getFocusOffset() +
      ', ' +
      'Is Backward: ' +
      String(this.getIsBackward()) +
      ', ' +
      'Has Focus: ' +
      String(this.getHasFocus())
    );
  }

  getAnchorKey() {
    return this.get('anchorKey');
  }

  getAnchorOffset() {
    return this.get('anchorOffset');
  }

  getFocusKey() {
    return this.get('focusKey');
  }

  getFocusOffset() {
    return this.get('focusOffset');
  }

  getIsBackward() {
    return this.get('isBackward');
  }

  getHasFocus() {
    return this.get('hasFocus');
  }

  hasEdgeWithin(blockKey, start, end) {
    const anchorKey = this.getAnchorKey();
    const focusKey = this.getFocusKey();

    if (anchorKey === focusKey && anchorKey === blockKey) {
      const selectionStart = this.getStartOffset();
      const selectionEnd = this.getEndOffset();
      return (
        (start <= selectionStart && selectionStart <= end) ||
        (start <= selectionEnd && selectionEnd <= end)
      );
    }

    if (blockKey !== anchorKey && blockKey !== focusKey) {
      return false;
    }

    const offsetToCheck =
      blockKey === anchorKey ? this.getAnchorOffset() : this.getFocusOffset();

    return start <= offsetToCheck && end >= offsetToCheck;
  }

  isCollapsed() {
    return (
      this.getAnchorKey() === this.getFocusKey() &&
      this.getAnchorOffset() === this.getFocusOffset()
    );
  }

  getStartKey() {
    return this.getIsBackward() ? this.getFocusKey() : this.getAnchorKey();
  }

  getStartOffset() {
    return this.getIsBackward()
      ? this.getFocusOffset()
      : this.getAnchorOffset();
  }

  getEndKey() {
    return this.getIsBackward() ? this.getAnchorKey() : this.getFocusKey();
  }

  getEndOffset() {
    return this.getIsBackward()
      ? this.getAnchorOffset()
      : this.getFocusOffset();
  }

  static createEmpty(key) {
    return new SelectionState({
      anchorKey: key,
      anchorOffset: 0,
      focusKey: key,
      focusOffset: 0,
      isBackward: false,
      hasFocus: false,
    });
  }
}

export default SelectionState;
