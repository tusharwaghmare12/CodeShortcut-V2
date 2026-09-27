/**
 * CodeShortcut - Editor Adapter Abstraction Layer
 * Supports HTML textarea, input, contenteditable, Monaco Editor, CodeMirror, and generic web editors.
 * Includes native KeyboardEvent ArrowLeft dispatching to move real editor carets across complex web editors.
 */

class BaseEditorAdapter {
  constructor(element) {
    this.element = element;
  }

  getText() { return ''; }
  getCursorPosition() { return 0; }
  setCursorPosition(start, end = start) {}
  replaceRange(start, end, text) {}
  insertText(text) {}
  
  focus() {
    if (this.element && typeof this.element.focus === 'function') {
      try { this.element.focus(); } catch (e) {}
    }
  }

  /**
   * Dispatches native ArrowLeft keyboard events to move real internal editor carets in Monaco, CodeMirror, etc.
   * 
   * @param {number} steps - Number of positions to move left
   */
  moveCursorLeft(steps) {
    if (!this.element || steps <= 0) return;
    for (let i = 0; i < steps; i++) {
      const eventInit = {
        key: 'ArrowLeft',
        code: 'ArrowLeft',
        keyCode: 37,
        which: 37,
        bubbles: true,
        cancelable: true
      };
      try {
        this.element.dispatchEvent(new KeyboardEvent('keydown', eventInit));
        this.element.dispatchEvent(new KeyboardEvent('keyup', eventInit));
      } catch (e) {}
    }
  }
}

class TextareaAdapter extends BaseEditorAdapter {
  getText() {
    return this.element.value || '';
  }

  getCursorPosition() {
    return this.element.selectionStart !== undefined ? this.element.selectionStart : 0;
  }

  setCursorPosition(start, end = start) {
    this.focus();
    if (typeof this.element.setSelectionRange === 'function') {
      this.element.setSelectionRange(start, end);
    }
  }

  replaceRange(start, end, text) {
    this.focus();
    this.setCursorPosition(start, end);

    let success = false;
    try {
      success = document.execCommand('insertText', false, text);
    } catch (e) {
      success = false;
    }

    if (!success) {
      const val = this.element.value || '';
      const before = val.substring(0, start);
      const after = val.substring(end);
      this.element.value = before + text + after;
      const newPos = start + text.length;
      this.setCursorPosition(newPos, newPos);
      
      this.element.dispatchEvent(new Event('input', { bubbles: true }));
      this.element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

class ContentEditableAdapter extends BaseEditorAdapter {
  getText() {
    return this.element.innerText || this.element.textContent || '';
  }

  getCursorPosition() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(this.element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }

  setCursorPosition(targetOffset, endOffset = targetOffset) {
    this.focus();
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let currentLen = 0;
    let foundStart = false;

    const walkTextNodes = (node) => {
      if (foundStart) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const nodeLen = node.textContent.length;
        if (currentLen + nodeLen >= targetOffset) {
          const offsetInNode = Math.min(targetOffset - currentLen, nodeLen);
          range.setStart(node, offsetInNode);
          range.setEnd(node, offsetInNode);
          foundStart = true;
          return;
        }
        currentLen += nodeLen;
      } else {
        for (let child of node.childNodes) {
          walkTextNodes(child);
          if (foundStart) return;
        }
      }
    };

    walkTextNodes(this.element);

    if (foundStart) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  replaceRange(start, end, text) {
    this.setCursorPosition(start, end);
    let success = false;
    try {
      success = document.execCommand('insertText', false, text);
    } catch (e) {
      success = false;
    }

    if (!success) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        this.element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }
}

class MonacoAdapter extends TextareaAdapter {
  constructor(element) {
    super(element);
    this.monacoContainer = element.closest('.monaco-editor') || element;
  }

  replaceRange(start, end, text) {
    super.replaceRange(start, end, text);
  }
}

class CodeMirrorAdapter extends BaseEditorAdapter {
  constructor(element) {
    super(element);
    this.isCM6 = Boolean(element.classList.contains('cm-content') || element.closest('.cm-editor'));

    if (this.isCM6) {
      this.delegate = new ContentEditableAdapter(element);
    } else {
      this.delegate = new TextareaAdapter(element);
    }
  }

  getText() {
    return this.delegate.getText();
  }

  getCursorPosition() {
    return this.delegate.getCursorPosition();
  }

  setCursorPosition(start, end = start) {
    this.delegate.setCursorPosition(start, end);
  }

  replaceRange(start, end, text) {
    this.delegate.replaceRange(start, end, text);
  }

  moveCursorLeft(steps) {
    this.delegate.moveCursorLeft(steps);
  }
}

class EditorAdapterFactory {
  /**
   * Examines active DOM element and returns matching EditorAdapter
   * 
   * @param {HTMLElement} element 
   * @returns {BaseEditorAdapter}
   */
  static getAdapter(element) {
    if (!element) return new BaseEditorAdapter(null);

    // 1. Monaco Editor (.monaco-editor or textarea.inputarea)
    if (element.closest('.monaco-editor') || (element.tagName === 'TEXTAREA' && element.classList.contains('inputarea'))) {
      return new MonacoAdapter(element);
    }

    // 2. CodeMirror 5 / 6 (.CodeMirror, .cm-editor, .cm-content)
    if (element.closest('.CodeMirror') || element.closest('.cm-editor') || element.classList.contains('cm-content')) {
      return new CodeMirrorAdapter(element);
    }

    // 3. Standard Textarea or Input
    if (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && /^(text|search|url|tel)$/i.test(element.type))) {
      return new TextareaAdapter(element);
    }

    // 4. ContentEditable elements
    if (element.isContentEditable || element.getAttribute('contenteditable') === 'true' || element.getAttribute('contenteditable') === '') {
      return new ContentEditableAdapter(element);
    }

    // 5. Fallback generic adapter
    return new TextareaAdapter(element);
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.BaseEditorAdapter = BaseEditorAdapter;
  globalThis.TextareaAdapter = TextareaAdapter;
  globalThis.ContentEditableAdapter = ContentEditableAdapter;
  globalThis.MonacoAdapter = MonacoAdapter;
  globalThis.CodeMirrorAdapter = CodeMirrorAdapter;
  globalThis.EditorAdapterFactory = EditorAdapterFactory;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BaseEditorAdapter,
    TextareaAdapter,
    ContentEditableAdapter,
    MonacoAdapter,
    CodeMirrorAdapter,
    EditorAdapterFactory
  };
}
