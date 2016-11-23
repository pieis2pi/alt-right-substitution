/*
 * This file is responsible for performing the logic of replacing
 * all occurrences of each mapped word with its real counterpart.
 */

// mediaMap.js defines the 'dictionary' variable.
// Referenced here to reduce confusion.
let dictionary = new Map();
dictionary.set('the alt-right', 'the neo-nazi group');
dictionary.set('The alt-right', 'The neo-nazi group');
dictionary.set('The Alt-Right', 'The Neo-Nazi group');
dictionary.set('alt-right', 'neo-nazi');
dictionary.set('Alt-Right', 'Neo-Nazi');
dictionary.set('Alt-right', 'Neo-nazi');
dictionary.set('alt right', 'neo-nazi');
dictionary.set('Alt Right', 'Neo-Nazi');
dictionary.set('Alt right', 'Neo-nazi');
dictionary.set('white nationalist', 'white supremicist');
dictionary.set('white nationalism', 'white supremicy');
dictionary.set('White nationalist', 'White supremicist');
dictionary.set('White nationalism', 'White supremicy');
dictionary.set('White Nationalist', 'White Supremicist');
dictionary.set('White Nationalism', 'White Supremicy');

// Do longer words first.
let tempArray = Array.from(dictionary);
tempArray.sort((pair1, pair2) => {
  const firstWord = pair1[0];
  const secondWord = pair2[0];
  if (firstWord.length > secondWord.length) {
    // The first word should come before the second word.
    return -1;
  }
  if (secondWord.length > firstWord.length) {
    // The second word should come before the first word.
    return 1;
  }
  // The words have the same length, it doesn't matter which comes first.
  return 0;
});
// Now that the entries are sorted, put them back into a Map.
let sortedMediaMap = new Map(tempArray);

const mediaMap = sortedMediaMap;

/*
 * For efficiency, create a word --> search RegEx Map too.
 */
let regexs = new Map();
for (let word of mediaMap.keys()) {
  // If we want a global, case-insensitive replacement, use 'gi' instead.
  // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
  regexs.set(word, new RegExp(word, 'g'));
}

/**
 * Substitutes emojis into text nodes.
 * If the node contains more than just text (ex: it has child nodes),
 * call replaceText() on each of its children.
 *
 * @param  {Node} node    - The target DOM Node.
 * @return {void}         - Note: the emoji substitution is done inline.
 */
function replaceText (node) {
  // Setting textContent on a node removes all of its children and replaces
  // them with a single text node. Since we don't want to alter the DOM aside
  // from substituting text, we only substitute on single text nodes.
  // @see https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
  if (node.nodeType === Node.TEXT_NODE) {
    // This node only contains text.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType.

    // Skip textarea nodes due to the potential for accidental submission
    // of substituted emoji where none was intended.
    if (node.parentNode &&
        node.parentNode.nodeName === 'TEXTAREA') {
      return;
    }

    // Because DOM manipulation is slow, we don't want to keep setting
    // textContent after every replacement. Instead, manipulate a copy of
    // this string outside of the DOM and then perform the manipulation
    // once, at the end.
    let content = node.textContent;

    // Replace every occurrence of 'media_word' in 'content' with 'real_word'.
    // Use the mediaMap for replacements.
    for (let [media_word, real_word] of mediaMap) {
      // Grab the search regex for this word.
      const regex = regexs.get(media_word);

      // Actually do the replacement / substitution.
      // Note: if 'word' does not appear in 'content', nothing happens.
      content = content.replace(regex, real_word);
    }

    // Now that all the replacements are done, perform the DOM manipulation.
    node.textContent = content;
  }
  else {
    // This node contains more than just text, call replaceText() on each
    // of its children.
    for (let i = 0; i < node.childNodes.length; i++) {
      replaceText(node.childNodes[i]);
    }    
  }
}

// Start the recursion from the body tag.
replaceText(document.body);

// Now monitor the DOM for additions and substitute words into new nodes.
// @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver.
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      // This DOM change was new nodes being added. Run our substitution
      // algorithm on each newly added node.
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const newNode = mutation.addedNodes[i];
        replaceText(newNode);
      }
    }
  });
});
observer.observe(document.body, {
  childList: true,
  subtree: true
});
