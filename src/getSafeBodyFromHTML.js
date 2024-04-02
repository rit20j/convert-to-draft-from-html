
// const jsdom = require("jsdom");

import jsdom from "jsdom";
const { JSDOM } = jsdom;
const { document } = (new JSDOM('')).window;

const dom = new JSDOM(`<body>
  <div id="content">test data</div>
</body>`);


const getSafeBodyFromHTML = (html) => {
  var doc;
  var root = null;
  if (
    document.implementation &&
    document.implementation.createHTMLDocument
  ) {
    doc = document.implementation.createHTMLDocument('foo');
    doc.documentElement.innerHTML = html;
    root = doc.getElementsByTagName('body')[0];
    console.log(root.nodeName)
  }

  console.log("root", JSON.stringify(root))
  return root;
}

export default getSafeBodyFromHTML;
