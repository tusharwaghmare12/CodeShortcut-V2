/**
 * CodeShortcut - Chrome Extension Snippet Parser & Dynamic Evaluator
 */

const SnippetParser = {
  /**
   * Parses a snippet template containing ${CURSOR} (or legacy ${1}, ${2} markers).
   * Strips out ${CURSOR} markers and determines the target cursor offset in cleanText.
   * Uses the position of the LAST ${CURSOR} marker as the target cursor position.
   * 
   * @param {string} template 
   * @returns {{ cleanText: string, cursorOffset: number }}
   */
  parse(template) {
    if (!template || typeof template !== 'string') {
      return { cleanText: '', cursorOffset: 0 };
    }

    const cursorMarker = '${CURSOR}';
    
    if (template.includes(cursorMarker)) {
      let lastMarkerOffset = -1;
      let cleanText = '';
      let lastIndex = 0;
      let matchPos;

      while ((matchPos = template.indexOf(cursorMarker, lastIndex)) !== -1) {
        cleanText += template.substring(lastIndex, matchPos);
        lastMarkerOffset = cleanText.length;
        lastIndex = matchPos + cursorMarker.length;
      }

      cleanText += template.substring(lastIndex);

      return {
        cleanText,
        cursorOffset: lastMarkerOffset !== -1 ? lastMarkerOffset : cleanText.length
      };
    }

    // Fallback for legacy ${1}, ${2} numbered tab stops
    const regex = /\${(\d+)}/g;
    let cleanText = '';
    let firstStopOffset = -1;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
      cleanText += template.substring(lastIndex, match.index);
      if (firstStopOffset === -1 && parseInt(match[1], 10) === 1) {
        firstStopOffset = cleanText.length;
      }
      lastIndex = match.index + match[0].length;
    }
    cleanText += template.substring(lastIndex);

    return {
      cleanText,
      cursorOffset: firstStopOffset !== -1 ? firstStopOffset : cleanText.length
    };
  },

  /**
   * Evaluates text immediately preceding cursor against dynamic rules (pb/pp) and registered snippets.
   * 
   * @param {string} text - Full editor text
   * @param {number} cursorOffset - Current cursor character index
   * @param {Object} snippetsMap - Dictionary of shortcut -> snippet data
   * @returns {{ shortcut: string, isDynamic: boolean, cleanText: string, cursorOffset: number, startOffset: number, endOffset: number } | null}
   */
  findShortcutBeforeCursor(text, cursorOffset, snippetsMap) {
    if (!text || cursorOffset <= 0) return null;

    const textBefore = text.substring(0, cursorOffset);

    // Extract trailing identifier word immediately behind cursor
    const wordMatch = textBefore.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);

    if (wordMatch) {
      const word = wordMatch[1];

      // DYNAMIC RULE 1: Dynamic push_back ("pb")
      // Example: apb, vpb, cpb, arrpb, vecpb, stackpb, myVectorpb
      // Target cursor position is at the END of statement: <expression>.push_back();|
      if (word.endsWith('pb') && word.length > 2) {
        const expression = word.substring(0, word.length - 2);
        if (expression.length > 0) {
          const cleanText = `${expression}.push_back();`;
          return {
            shortcut: word,
            isDynamic: true,
            cleanText,
            cursorOffset: cleanText.length, // Cursor at the END of statement
            startOffset: cursorOffset - word.length,
            endOffset: cursorOffset
          };
        }
      }

      // DYNAMIC RULE 2: Dynamic pop_back ("pp")
      // Example: app, npp, lpp, cpp, arrpp, myVectorpp
      // Target cursor position is at the END of statement: <expression>.pop_back();|
      if (word.endsWith('pp') && word.length > 2) {
        const expression = word.substring(0, word.length - 2);
        if (expression.length > 0) {
          const cleanText = `${expression}.pop_back();`;
          return {
            shortcut: word,
            isDynamic: true,
            cleanText,
            cursorOffset: cleanText.length, // Cursor at the END of statement
            startOffset: cursorOffset - word.length,
            endOffset: cursorOffset
          };
        }
      }
    }

    // NORMAL SHORTCUT LOOKUP
    if (!snippetsMap) return null;

    const shortcuts = Object.keys(snippetsMap);
    // Sort shortcuts by length descending so longer triggers take precedence
    shortcuts.sort((a, b) => b.length - a.length);

    for (const shortcut of shortcuts) {
      if (!shortcut) continue;

      if (textBefore.endsWith(shortcut)) {
        const startOffset = cursorOffset - shortcut.length;

        // Word boundary check for shortcuts starting with word char
        const startsWithWordChar = /^\w/.test(shortcut);
        if (startsWithWordChar && startOffset > 0) {
          const charBefore = textBefore.charAt(startOffset - 1);
          if (/[\w]/.test(charBefore)) {
            continue;
          }
        }

        const data = snippetsMap[shortcut];
        const parsed = this.parse(data.body);

        return {
          shortcut,
          isDynamic: false,
          cleanText: parsed.cleanText,
          cursorOffset: parsed.cursorOffset,
          startOffset,
          endOffset: cursorOffset
        };
      }
    }

    return null;
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.SnippetParser = SnippetParser;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SnippetParser;
}
