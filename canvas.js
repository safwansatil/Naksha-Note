// Elements
const sidebarContent = document.getElementById('sidebarContent');
const pageTitle = document.getElementById('pageTitle');
//const editorContent = document.getElementById('editorContent');
const addButton = document.querySelector('.sidebar-header .add-button'); // Adjusted selector if button is inside header
const fileContextMenu = document.getElementById('fileContextMenu');
const sidebarParticles = document.getElementById('sidebarParticles');
const sidebar = document.querySelector('.sidebar'); // Added for collapse
const appContainer = document.querySelector('.app-container'); // Added for collapse
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn'); // Added for collapse

// State variables
let files = [];
let currentFileId = null;
let contextMenuTargetId = null;
let renameInput = null; // Track the rename input element
let isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'; // Added for collapse state

// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    console.log("Canvas page loaded");

    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        console.log("User not logged in, redirecting");
        window.location.href = 'login.html';
        return; // Stop further execution if not logged in
    }

    initSidebarParticles(); // Initialize sidebar particles
    applySidebarState(); // Apply initial collapse state
    loadFiles();
    setupCanvasEventListeners();
});


// Initialize sidebar particles animation
function initSidebarParticles() {
  console.log("Initializing sidebar particles");
  if (!sidebarParticles) return;

  sidebarParticles.innerHTML = ''; // Clear existing
  const particleCount = 15; // Adjust density

  for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('sidebar-particle'); // Use the CSS class for styling

      const size = Math.random() * 5 + 2; // Smaller particles
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.position = 'absolute'; // Ensure positioning works
      particle.style.backgroundColor = 'var(--theme-green)'; // Use theme color
      particle.style.borderRadius = '50%';

      // Random position within the sidebar
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.left = `${Math.random() * 100}%`;

      // Random animation properties
      particle.style.opacity = Math.random() * 0.4 + 0.1; // Subtle opacity
      particle.style.animationDuration = `${Math.random() * 8 + 5}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;

      sidebarParticles.appendChild(particle);
  }
}


// Load files from local storage
function loadFiles() {
    const storedFiles = localStorage.getItem('files');
    // Basic error handling for potentially corrupt JSON
    try {
        files = storedFiles ? JSON.parse(storedFiles) : [];
        if (!Array.isArray(files)) { // Ensure it's an array
           files = [];
        }
    } catch (error) {
        console.error("Error parsing files from localStorage:", error);
        files = []; // Reset to empty array on error
        localStorage.removeItem('files'); // Clear corrupted data
    }
    console.log("Loading files:", files);

    sidebarContent.innerHTML = ''; // Clear existing items
    if (files.length === 0) {
         pageTitle.textContent = "No files yet";
         editorContent.innerHTML = '<p>Create your first file using the "+ New File" button in the sidebar.</p>';
         editorContent.contentEditable = "false"; // Disable editing when no file selected

    } else {
        editorContent.contentEditable = "true"; // Enable editing
        files.forEach(addFileToSidebar);
        // Attempt to reselect the last opened file, otherwise select the first
        const lastFileId = localStorage.getItem('lastOpenFileId');
        let fileToSelect = files.find(f => f.id === lastFileId);
        if (!fileToSelect && files.length > 0) {
             fileToSelect = files[0]; // Default to first file
        }

        if (fileToSelect) {
             setTimeout(() => selectFile(fileToSelect.id), 0);
        } else {
            // Handle case where there are files but none could be selected (edge case)
             pageTitle.textContent = "Select a File";
             editorContent.innerHTML = '<p>Select a file from the sidebar.</p>';
             editorContent.contentEditable = "false";
        }
    }
}

// Create a new file
function createFile() {
    console.log("Creating new file triggered");
    // Finish any rename operation before creating a new file
    if (renameInput) {
        finishRename();
    }

    const fileId = 'file_' + Date.now();
    const defaultName = 'Untitled';
    const newFile = {
        id: fileId,
        name: defaultName,
        content: '' // Start with empty content
    };

    files.push(newFile); // Add to the end (or use unshift to add to start)
    saveFiles();
    const fileElement = addFileToSidebar(newFile);

    // Ensure the file item is in the DOM before trying to rename
    requestAnimationFrame(() => {
        selectFile(fileId); // Select the new file immediately
        startRename(fileElement, fileId); // Start rename process
    });
     editorContent.contentEditable = "true"; // Ensure editor is editable
}


// Add file item to the sidebar UI
function addFileToSidebar(file) {
    const fileItem = document.createElement('div');
    fileItem.classList.add('file-item');
    fileItem.id = `file-item-${file.id}`;
    fileItem.setAttribute('data-id', file.id);

    // Icon (Optional)
    // const icon = document.createElement('span');
    // icon.textContent = '📄 ';
    // fileItem.appendChild(icon);

    const fileNameSpan = document.createElement('span');
    fileNameSpan.classList.add('file-name');
    fileNameSpan.textContent = file.name || 'Untitled'; // Fallback name
    fileItem.appendChild(fileNameSpan);

    // --- Event Listeners for the file item ---
    fileItem.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
           selectFile(file.id);
        }
    });

    fileNameSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        startRename(fileItem, file.id);
    });

    fileItem.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, file.id);
    });

    sidebarContent.appendChild(fileItem);
    return fileItem;
}


// // Select a file
// function selectFile(fileId) {
//     console.log("Selecting file:", fileId);

//     // Don't re-select if already selected and editor isn't in initial placeholder state
//     const isPlaceholder = editorContent.innerHTML.includes('Select a file') || editorContent.innerHTML.includes('No files yet');
//     if (currentFileId === fileId && !isPlaceholder) return;

//     // If currently renaming, finish it before switching
//     if (renameInput) {
//        finishRename();
//     }

//     currentFileId = fileId;
//     localStorage.setItem('lastOpenFileId', fileId); // Remember last opened file

//     document.querySelectorAll('.file-item').forEach(item => {
//         item.classList.toggle('active', item.getAttribute('data-id') === fileId);
//     });

//     const file = files.find(f => f.id === fileId);
//     if (file) {
//         pageTitle.textContent = file.name;
//         // Set content carefully, avoid adding paragraphs around simple text
//         editorContent.innerHTML = file.content || ''; // Use empty string instead of <p> for new files
//         // Add placeholder if content is truly empty after loading
//         if (editorContent.innerHTML.trim() === '') {
//              editorContent.innerHTML = '<p>Start typing...</p>';
//         }
//         editorContent.contentEditable = "true"; // Ensure editable
//         editorContent.focus(); // Focus the editor
//     } else {
//         console.error("File not found on select:", fileId);
//         pageTitle.textContent = "Error Loading File";
//         editorContent.innerHTML = '<p>Could not load file content.</p>';
//         editorContent.contentEditable = "false";
//         currentFileId = null;
//         localStorage.removeItem('lastOpenFileId');
//     }
// }

// Save content of the current file
function saveCurrentFileContent() {
    if (!currentFileId || editorContent.contentEditable !== 'true') return; // No file selected or not editable

    const fileIndex = files.findIndex(f => f.id === currentFileId);
    if (fileIndex !== -1) {
        // Avoid saving the placeholder text
        const currentContent = editorContent.innerHTML;
        const placeholder = '<p>Start typing...</p>';
        const contentToSave = (currentContent === placeholder) ? '' : currentContent;

        if (files[fileIndex].content !== contentToSave) {
             files[fileIndex].content = contentToSave;
             saveFiles();
             console.log("Content saved for file:", currentFileId);
        }
    } else {
        console.warn("Could not find file to save content for:", currentFileId);
    }
}

// Setup event listeners for the canvas page
function setupCanvasEventListeners() {
    console.log("Setting up canvas event listeners");

    // Add File Button
    if (addButton) {
        addButton.addEventListener('click', createFile);
    } else {
        console.error("Add button not found!");
    }

    // Editor Content Change - Use debounce
    if (editorContent) {
        editorContent.addEventListener('input', debounce(saveCurrentFileContent, 400)); // Save 400ms after input stops
         // Also save on blur, e.g., when switching tabs
        editorContent.addEventListener('blur', saveCurrentFileContent);
    }

    // Global click listener to hide context menu
    document.addEventListener('click', hideContextMenu);

    // Context Menu Item Actions
    if (fileContextMenu) {
        fileContextMenu.addEventListener('click', handleContextMenuAction);
    }

    // Listener for rename input events (delegated to sidebar content)
    if (sidebarContent) {
        sidebarContent.addEventListener('blur', handleRenameInputEvent, true);
        sidebarContent.addEventListener('keydown', handleRenameInputEvent);
    }

    // Sidebar Toggle Button
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
    } else {
        console.error("Toggle sidebar button not found!");
    }
}

// --- Rename Functionality ---

function startRename(fileItemElement, fileId) {
    if (renameInput) finishRename(); // Finish any existing rename first

    const fileNameSpan = fileItemElement.querySelector('.file-name');
    if (!fileNameSpan) return;

    const currentName = fileNameSpan.textContent;
    fileNameSpan.style.display = 'none'; // Hide the span

    renameInput = document.createElement('input');
    renameInput.type = 'text';
    renameInput.value = currentName === 'Untitled' ? '' : currentName; // Clear "Untitled" for easier typing
    renameInput.placeholder = 'Enter file name';
    renameInput.classList.add('rename-input');
    renameInput.setAttribute('data-file-id', fileId);
    renameInput.spellcheck = false;

    // Insert input after the (hidden) span
    fileNameSpan.parentNode.insertBefore(renameInput, fileNameSpan.nextSibling);
    renameInput.focus();
    renameInput.select();

    renameInput.addEventListener('click', e => e.stopPropagation());
}

function handleRenameInputEvent(e) {
     if (!e.target.classList.contains('rename-input')) return;

     if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
        e.preventDefault();
        finishRename();
    } else if (e.type === 'keydown' && e.key === 'Escape') {
         e.preventDefault();
        cancelRename();
    }
}


function finishRename() {
     if (!renameInput) return;

     const fileId = renameInput.getAttribute('data-file-id');
     let newName = renameInput.value.trim();
     const fileItemElement = document.getElementById(`file-item-${fileId}`); // Get parent element via ID
     const fileNameSpan = fileItemElement?.querySelector('.file-name');

     // If name is empty, default to "Untitled"
     if (!newName) {
         newName = 'Untitled';
     }

     renameInput.remove(); // Remove input field first
     renameInput = null; // Reset tracking variable

     if (fileNameSpan) {
         fileNameSpan.textContent = newName; // Update span text immediately
         fileNameSpan.style.display = ''; // Show the span again
         updateFileName(fileId, newName);
         if (currentFileId === fileId) {
             pageTitle.textContent = newName; // Update title if current
         }
     } else {
         console.error("Could not find fileNameSpan during finishRename for", fileId);
     }
 }

 function cancelRename() {
      if (!renameInput) return;

      const fileId = renameInput.getAttribute('data-file-id');
      const fileItemElement = document.getElementById(`file-item-${fileId}`);
      const fileNameSpan = fileItemElement?.querySelector('.file-name');

      renameInput.remove();
      renameInput = null;

      if (fileNameSpan) {
          fileNameSpan.style.display = ''; // Just reveal the original name span
      }
 }

function updateFileName(fileId, newName) {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
        if (files[fileIndex].name !== newName) {
             files[fileIndex].name = newName;
             saveFiles();
             console.log("File renamed:", fileId, "to", newName);
        }
    } else {
         console.warn("File not found during rename update:", fileId);
    }
}


// --- Context Menu Functionality ---

function showContextMenu(event, fileId) {
    hideContextMenu(); // Hide any existing menu first

    if (fileContextMenu) {
        // Prevent context menu during rename
        if (renameInput && renameInput.getAttribute('data-file-id') === fileId) {
            console.log("Rename in progress, context menu disabled.");
            return;
        };

        contextMenuTargetId = fileId; // Set target ID
        fileContextMenu.style.top = `${event.clientY}px`;
        fileContextMenu.style.left = `${event.clientX}px`;
        fileContextMenu.style.display = 'block';
        console.log("Showing context menu for:", fileId, "at", event.clientY, event.clientX);
        event.stopPropagation(); // Prevent document click listener
    } else {
        console.error("File context menu element not found");
    }
}

function hideContextMenu() {
    if (fileContextMenu && fileContextMenu.style.display === 'block') {
        fileContextMenu.style.display = 'none';
        contextMenuTargetId = null;
         console.log("Hiding context menu");
    }
}

function handleContextMenuAction(e) {
    if (!contextMenuTargetId || !e.target.classList.contains('context-menu-item')) {
         hideContextMenu(); // Hide if clicking outside items
         return;
     }


     const action = e.target.getAttribute('data-action');
     console.log("Context action:", action, "on", contextMenuTargetId);
     const targetFileId = contextMenuTargetId; // Store before hiding resets it
     hideContextMenu(); // Hide menu immediately after click

     // Need a small delay to ensure the menu is hidden before potential confirmation dialogs
     setTimeout(() => {
        switch(action) {
            case 'rename':
                const fileItem = document.getElementById(`file-item-${targetFileId}`);
                if (fileItem) startRename(fileItem, targetFileId);
                break;
            case 'delete':
                const fileToDelete = files.find(f => f.id === targetFileId);
                const fileName = fileToDelete ? fileToDelete.name : 'this file';
                if (confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
                   deleteFile(targetFileId);
                }
                break;
         }
     }, 50); // 50ms delay
 }


// // Delete file
// function deleteFile(fileId) {
//     console.log("Deleting file:", fileId);
//     files = files.filter(f => f.id !== fileId);
//     saveFiles();

//     const fileElement = document.getElementById(`file-item-${fileId}`);
//     if (fileElement) {
//         fileElement.remove();
//     }

//     if (fileId === currentFileId) {
//         currentFileId = null;
//         localStorage.removeItem('lastOpenFileId');
//         if (files.length > 0) {
//             selectFile(files[0].id);
//         } else {
//             pageTitle.textContent = 'No files';
//             editorContent.innerHTML = '<p>Create a file to start writing.</p>';
//             editorContent.contentEditable = "false";
//         }
//     } else if (files.length === 0) {
//          // Edge case: deleted the last file, even if it wasn't selected
//          pageTitle.textContent = 'No files';
//          editorContent.innerHTML = '<p>Create a file to start writing.</p>';
//          editorContent.contentEditable = "false";
//     }
// }

// Save all files to local storage
function saveFiles() {
    try {
        localStorage.setItem('files', JSON.stringify(files));
    } catch (error) {
        console.error("Error saving files to localStorage:", error);
        // Maybe show a toast notification to the user
        showToast('Save Error', 'Could not save changes. LocalStorage might be full.', 'error');
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- Sidebar Collapse Functionality ---
function toggleSidebar() {
    isSidebarCollapsed = !isSidebarCollapsed;
    applySidebarState();
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
}

function applySidebarState() {
     if (!appContainer || !toggleSidebarBtn) return; // Ensure elements exist

     if (isSidebarCollapsed) {
        appContainer.classList.add('sidebar-collapsed');
        toggleSidebarBtn.setAttribute('aria-expanded', 'false');
        toggleSidebarBtn.title = "Show Sidebar";
         // Update icon to "show" state (e.g., arrows pointing right)
        toggleSidebarBtn.innerHTML = `
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="9 18 15 12 9 6"></polyline>
             </svg>
         `;
     } else {
        appContainer.classList.remove('sidebar-collapsed');
        toggleSidebarBtn.setAttribute('aria-expanded', 'true');
        toggleSidebarBtn.title = "Hide Sidebar";
         // Update icon to "hide" state (e.g., arrows pointing left)
        toggleSidebarBtn.innerHTML = `
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="15 18 9 12 15 6"></polyline>
             </svg>
         `;
     }
}