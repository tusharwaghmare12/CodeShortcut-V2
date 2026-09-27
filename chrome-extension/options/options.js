/**
 * CodeShortcut - Options UI Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('href').substring(1);
      
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(sec => {
        if (sec.id === targetId) {
          sec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  });

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const snippetsGrid = document.getElementById('snippetsGrid');
  const sitesGrid = document.getElementById('sitesGrid');
  const debugModeToggle = document.getElementById('debugModeToggle');
  const addSnippetBtn = document.getElementById('addSnippetBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const importFileInput = document.getElementById('importFileInput');
  const toast = document.getElementById('toast');

  // Modal Elements
  const snippetModal = document.getElementById('snippetModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalShortcut = document.getElementById('modalShortcut');
  const modalDescription = document.getElementById('modalDescription');
  const modalBody = document.getElementById('modalBody');
  const saveSnippetBtn = document.getElementById('saveSnippetBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  let currentSnippets = {};
  let currentSettings = {};
  let editingShortcut = null;

  const KNOWN_SITES = [
    { key: 'leetcode.com', name: 'LeetCode (leetcode.com)' },
    { key: 'codechef.com', name: 'CodeChef (codechef.com)' },
    { key: 'codeforces.com', name: 'Codeforces (codeforces.com)' },
    { key: 'hackerrank.com', name: 'HackerRank (hackerrank.com)' },
    { key: 'geeksforgeeks.org', name: 'GeeksforGeeks (geeksforgeeks.org)' },
    { key: 'chatgpt.com', name: 'ChatGPT (chatgpt.com)' },
    { key: 'naukri.com', name: 'Coding Ninjas / Code360 (naukri.com)' },
    { key: 'all_sites', name: 'All Other Websites & Textareas' }
  ];

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#f43f5e' : '#38bdf8';
    toast.style.color = isError ? '#ffffff' : '#0f172a';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
  }

  async function loadData() {
    try {
      currentSnippets = await StorageManager.getSnippets();
      currentSettings = await StorageManager.getSettings();

      debugModeToggle.checked = currentSettings.debugMode;

      renderSites();
      renderSnippets(searchInput.value.trim());
    } catch (e) {
      console.error('[CodeShortcut Options] Load failed:', e);
      showToast('Error loading configuration', true);
    }
  }

  // Render Site Compatibility Checkboxes
  function renderSites() {
    sitesGrid.innerHTML = '';
    const siteSettings = currentSettings.siteSettings || {};

    KNOWN_SITES.forEach(site => {
      const isChecked = siteSettings[site.key] !== false;
      const label = document.createElement('label');
      label.className = 'site-item';
      label.innerHTML = `
        <input type="checkbox" data-site="${site.key}" ${isChecked ? 'checked' : ''}>
        <span>${escapeHtml(site.name)}</span>
      `;

      label.querySelector('input').addEventListener('change', async (e) => {
        const siteKey = e.target.getAttribute('data-site');
        const updatedSiteSettings = { ...currentSettings.siteSettings, [siteKey]: e.target.checked };
        await StorageManager.saveSettings({ siteSettings: updatedSiteSettings });
        currentSettings.siteSettings = updatedSiteSettings;
        showToast(`Updated site setting for ${siteKey}`);
      });

      sitesGrid.appendChild(label);
    });
  }

  // Render Snippets Grid
  function renderSnippets(query = '') {
    snippetsGrid.innerHTML = '';
    const q = query.toLowerCase();

    const filteredKeys = Object.keys(currentSnippets).filter(shortcut => {
      const item = currentSnippets[shortcut];
      const desc = (item.description || '').toLowerCase();
      const body = (item.body || '').toLowerCase();
      return shortcut.toLowerCase().includes(q) || desc.includes(q) || body.includes(q);
    });

    if (filteredKeys.length === 0) {
      snippetsGrid.innerHTML = '<p class="help-text">No snippets found matching your query.</p>';
      return;
    }

    filteredKeys.forEach(shortcut => {
      const item = currentSnippets[shortcut];
      const card = document.createElement('div');
      card.className = 'card snippet-card';

      card.innerHTML = `
        <div class="snippet-header">
          <span class="shortcut-badge">${escapeHtml(shortcut)}</span>
          <span class="snippet-desc">${escapeHtml(item.description || '')}</span>
          <div class="snippet-actions">
            <button class="btn-icon edit-btn" title="Edit snippet">✏️</button>
            <button class="btn-icon delete-btn" title="Delete snippet">🗑️</button>
          </div>
        </div>
        <div class="snippet-body-preview">${escapeHtml(item.body)}</div>
      `;

      card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(shortcut));
      card.querySelector('.delete-btn').addEventListener('click', () => deleteSnippet(shortcut));

      snippetsGrid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Debug Toggle
  debugModeToggle.addEventListener('change', async () => {
    await StorageManager.saveSettings({ debugMode: debugModeToggle.checked });
    showToast(debugModeToggle.checked ? 'Debug mode enabled' : 'Debug mode disabled');
  });

  // Search Filter
  searchInput.addEventListener('input', () => {
    renderSnippets(searchInput.value.trim());
  });

  // Add Snippet Modal
  addSnippetBtn.addEventListener('click', () => {
    editingShortcut = null;
    modalTitle.textContent = 'Add New Snippet';
    modalShortcut.value = '';
    modalShortcut.disabled = false;
    modalDescription.value = '';
    modalBody.value = '';
    snippetModal.classList.remove('hidden');
    modalShortcut.focus();
  });

  // Edit Snippet Modal
  function openEditModal(shortcut) {
    editingShortcut = shortcut;
    const item = currentSnippets[shortcut];
    modalTitle.textContent = `Edit Snippet [${shortcut}]`;
    modalShortcut.value = shortcut;
    modalShortcut.disabled = true;
    modalDescription.value = item.description || '';
    modalBody.value = item.body || '';
    snippetModal.classList.remove('hidden');
    modalBody.focus();
  }

  function closeModal() {
    snippetModal.classList.add('hidden');
  }
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  // Save Snippet
  saveSnippetBtn.addEventListener('click', async () => {
    const shortcut = modalShortcut.value.trim();
    const description = modalDescription.value.trim();
    const body = modalBody.value;

    if (!shortcut) { showToast('Shortcut name cannot be empty', true); return; }
    if (!body) { showToast('Snippet body content cannot be empty', true); return; }

    try {
      await StorageManager.saveSnippet(shortcut, { description, body });
      currentSnippets = await StorageManager.getSnippets();
      renderSnippets(searchInput.value.trim());
      closeModal();
      showToast(`Snippet [${shortcut}] saved successfully!`);
    } catch (e) {
      showToast(e.message, true);
    }
  });

  // Delete Snippet
  async function deleteSnippet(shortcut) {
    if (confirm(`Are you sure you want to delete snippet [${shortcut}]?`)) {
      try {
        await StorageManager.deleteSnippet(shortcut);
        currentSnippets = await StorageManager.getSnippets();
        renderSnippets(searchInput.value.trim());
        showToast(`Snippet [${shortcut}] deleted.`);
      } catch (e) {
        showToast(e.message, true);
      }
    }
  }

  // Export JSON
  exportBtn.addEventListener('click', async () => {
    try {
      const jsonStr = await StorageManager.exportSnippets();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'codeshortcut-snippets.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Snippets exported to JSON file!');
    } catch (e) {
      showToast('Export failed', true);
    }
  });

  // Import JSON
  importBtn.addEventListener('click', () => importFileInput.click());

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const result = await StorageManager.importSnippets(evt.target.result, false);
        currentSnippets = await StorageManager.getSnippets();
        renderSnippets(searchInput.value.trim());
        showToast(`Imported ${result.count} snippets!`);
      } catch (err) {
        showToast(err.message, true);
      }
      importFileInput.value = '';
    };
    reader.readAsText(file);
  });

  // Reset Defaults
  resetDefaultsBtn.addEventListener('click', async () => {
    if (confirm('Reset all snippets to default C++ preloaded snippets? Custom changes will be overwritten.')) {
      try {
        currentSnippets = await StorageManager.resetToDefaults();
        renderSnippets(searchInput.value.trim());
        showToast('Snippets reset to default preloaded list!');
      } catch (e) {
        showToast(e.message, true);
      }
    }
  });

  loadData();
});
