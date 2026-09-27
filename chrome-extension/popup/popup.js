/**
 * CodeShortcut - Popup UI Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const globalToggle = document.getElementById('globalToggle');
  const searchInput = document.getElementById('searchInput');
  const addSnippetBtn = document.getElementById('addSnippetBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const importFileInput = document.getElementById('importFileInput');
  const snippetsList = document.getElementById('snippetsList');
  const snippetCount = document.getElementById('snippetCount');
  const emptyState = document.getElementById('emptyState');
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
  let editingShortcut = null;

  // Show toast notification
  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#f43f5e' : '#38bdf8';
    toast.style.color = isError ? '#ffffff' : '#0f172a';
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2500);
  }

  // Load state and snippets
  async function loadData() {
    try {
      const settings = await StorageManager.getSettings();
      globalToggle.checked = settings.enabled;

      currentSnippets = await StorageManager.getSnippets();
      renderSnippets(searchInput.value.trim());
    } catch (e) {
      console.error('[CodeShortcut Popup] Failed to load data:', e);
      showToast('Error loading snippets', true);
    }
  }

  // Render snippets list
  function renderSnippets(query = '') {
    snippetsList.innerHTML = '';
    const q = query.toLowerCase();

    const filteredKeys = Object.keys(currentSnippets).filter(shortcut => {
      const item = currentSnippets[shortcut];
      const desc = (item.description || '').toLowerCase();
      const body = (item.body || '').toLowerCase();
      return shortcut.toLowerCase().includes(q) || desc.includes(q) || body.includes(q);
    });

    snippetCount.textContent = filteredKeys.length;

    if (filteredKeys.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    } else {
      emptyState.classList.add('hidden');
    }

    filteredKeys.forEach(shortcut => {
      const item = currentSnippets[shortcut];
      const card = document.createElement('div');
      card.className = 'snippet-card';

      card.innerHTML = `
        <div class="snippet-header">
          <span class="shortcut-badge">${escapeHtml(shortcut)}</span>
          <span class="snippet-desc">${escapeHtml(item.description || '')}</span>
          <div class="snippet-actions">
            <button class="btn-icon edit-btn" title="Edit snippet">✏️</button>
            <button class="btn-icon btn-icon-danger delete-btn" title="Delete snippet">🗑️</button>
          </div>
        </div>
        <div class="snippet-body-preview">${escapeHtml(item.body)}</div>
      `;

      card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(shortcut));
      card.querySelector('.delete-btn').addEventListener('click', () => deleteSnippet(shortcut));

      snippetsList.appendChild(card);
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

  // Global Toggle Change
  globalToggle.addEventListener('change', async () => {
    await StorageManager.saveSettings({ enabled: globalToggle.checked });
    showToast(globalToggle.checked ? 'CodeShortcut Enabled' : 'CodeShortcut Disabled');
  });

  // Search Input Listener
  searchInput.addEventListener('input', () => {
    renderSnippets(searchInput.value.trim());
  });

  // Open Modal for Adding Snippet
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

  // Open Modal for Editing Snippet
  function openEditModal(shortcut) {
    editingShortcut = shortcut;
    const item = currentSnippets[shortcut];
    modalTitle.textContent = `Edit Snippet [${shortcut}]`;
    modalShortcut.value = shortcut;
    modalShortcut.disabled = true; // Shortcut trigger name is immutable during edit
    modalDescription.value = item.description || '';
    modalBody.value = item.body || '';
    snippetModal.classList.remove('hidden');
    modalBody.focus();
  }

  // Close Modal
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

    if (!shortcut) {
      showToast('Shortcut name cannot be empty', true);
      return;
    }
    if (!body) {
      showToast('Snippet body content cannot be empty', true);
      return;
    }

    try {
      await StorageManager.saveSnippet(shortcut, { description, body });
      currentSnippets = await StorageManager.getSnippets();
      renderSnippets(searchInput.value.trim());
      closeModal();
      showToast(`Snippet [${shortcut}] saved!`);
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
      showToast('Failed to export snippets', true);
    }
  });

  // Import JSON
  importBtn.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const result = await StorageManager.importSnippets(evt.target.result, false);
        currentSnippets = await StorageManager.getSnippets();
        renderSnippets(searchInput.value.trim());
        showToast(`Successfully imported ${result.count} snippets!`);
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
        showToast('Snippets reset to default!');
      } catch (e) {
        showToast(e.message, true);
      }
    }
  });

  // Initial Load
  loadData();
});
