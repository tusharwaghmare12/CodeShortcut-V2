/**
 * CodeShortcut - Default Preloaded Snippets
 * 
 * Uses ${CURSOR} to define the exact cursor placement after snippet expansion.
 */

const DEFAULT_SNIPPETS = {
  "ci": {
    "description": "cin input",
    "body": "cin >> ${CURSOR};"
  },
  "co": {
    "description": "cout output",
    "body": "cout << \"${CURSOR}\";"
  },
  "fo": {
    "description": "for loop",
    "body": "for(int i = 0; i < n; i++){\n    ${CURSOR}\n}"
  },
  "if": {
    "description": "if statement",
    "body": "if(${CURSOR}){\n\n}"
  },
  "wh": {
    "description": "while loop",
    "body": "while(${CURSOR}){\n\n}"
  },
  "t": {
    "description": "test cases loop",
    "body": "int t;\ncin >> t;\n\nwhile(t--){\n    ${CURSOR}\n}"
  },
  "vpb": {
    "description": "vector push_back call",
    "body": "v.push_back();\n${CURSOR}"
  },
  "ve": {
    "description": "vector declaration",
    "body": "vector<int> ${CURSOR};"
  },
  "so": {
    "description": "sort vector",
    "body": "sort(${CURSOR}.begin(), ${CURSOR}.end());"
  },
  "sz": {
    "description": "size method",
    "body": "${CURSOR}.size();"
  },
  "um": {
    "description": "unordered map declaration",
    "body": "unordered_map<int, int> ${CURSOR};"
  },
  "pq": {
    "description": "priority queue declaration",
    "body": "priority_queue<int> ${CURSOR};"
  },
  "ll": {
    "description": "long long declaration",
    "body": "long long ${CURSOR};"
  },
  "else": {
    "description": "else statement",
    "body": "else{\n    ${CURSOR}\n}"
  },
  "ife": {
    "description": "if else statement",
    "body": "if(${CURSOR}){\n\n}\nelse{\n\n}"
  },
  "sw": {
    "description": "switch statement",
    "body": "switch(${CURSOR}){\n\n}"
  },
  "fn": {
    "description": "void function",
    "body": "void ${CURSOR}(){\n\n}"
  },
  "ret": {
    "description": "return statement",
    "body": "return ${CURSOR};"
  },
  "br": {
    "description": "break statement",
    "body": "break;"
  },
  "ct": {
    "description": "continue statement",
    "body": "continue;"
  },
  "in": {
    "description": "int declaration and cin",
    "body": "int ${CURSOR};\ncin >> ${CURSOR};"
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.DEFAULT_SNIPPETS = DEFAULT_SNIPPETS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEFAULT_SNIPPETS;
}
