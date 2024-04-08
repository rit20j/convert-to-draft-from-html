'use strict';

// const cx = require('cx');
const { Map } = require('immutable');
// const React = require('react');

// const UL_WRAP = React.createElement('ul', { className: cx('public/DraftStyleDefault/ul') });
// const OL_WRAP = React.createElement('ol', { className: cx('public/DraftStyleDefault/ol') });
// const PRE_WRAP = React.createElement('pre', { className: cx('public/DraftStyleDefault/pre') });

const DefaultDraftBlockRenderMap = Map({
  'header-one': {
    element: 'h1',
  },
  'header-two': {
    element: 'h2',
  },
  'header-three': {
    element: 'h3',
  },
  'header-four': {
    element: 'h4',
  },
  'header-five': {
    element: 'h5',
  },
  'header-six': {
    element: 'h6',
  },
  section: {
    element: 'section',
  },
  article: {
    element: 'article',
  },


  blockquote: {
    element: 'blockquote',
  },
  atomic: {
    element: 'figure',
  },

  unstyled: {
    element: 'div',
    aliasedElements: ['p'],
  },
});

module.exports = DefaultDraftBlockRenderMap;
