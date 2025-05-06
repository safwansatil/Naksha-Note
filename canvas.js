// Elements
const sidebarContent = document.getElementById('sidebarContent');
const pageTitle = document.getElementById('pageTitle');
const editorContent = document.getElementById('editorContent');
const addButton = document.querySelector('.sidebar-header .add-button');
const fileContextMenu = document.getElementById('fileContextMenu');
const sidebarParticles = document.getElementById('sidebarParticles');
const sidebar = document.querySelector('.sidebar');
const appContainer = document.querySelector('.app-container');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');

// AI Tools Elements
const aiToolsContainer = document.createElement('div');
aiToolsContainer.className = 'ai-tools-container';
const aiTools = document.createElement('div');
aiTools.className = 'ai-tools';
aiTools.innerHTML = `
    <button id="summarizeBtn" class="ai-tool-btn">Summarize</button>
    <button id="modifyBtn" class="ai-tool-btn">Modify</button>
    <button id="keywordsBtn" class="ai-tool-btn">Keywords</button>
    <button id="enhanceBtn" class="ai-tool-btn">Enhance</button>
    <button id="paraphraseBtn" class="ai-tool-btn">Paraphrase</button>
`;
aiToolsContainer.appendChild(aiTools);
document.querySelector('.editor-container').appendChild(aiToolsContainer);

// State variables
let files = [];
let currentFileId = null;
let contextMenuTargetId = null;
let renameInput = null;
let isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';


const apiKey = "YOUR_GEMINI_API_KEY"; 
const genAI = new GoogleGenerativeAI(apiKey);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log("Canvas page loaded");

    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
        console.log("User not logged in, redirecting");
        window.location.href = 'login.html';
        return;
    }

    initSidebarParticles();
    applySidebarState();
    loadFiles();
    setupCanvasEventListeners();
    setupAIEventListeners();
});

// Initialize sidebar particles animation
function initSidebarParticles() {
    console.log("Initializing sidebar particles");
    if (!sidebarParticles) return;

    sidebarParticles.innerHTML = ''; 
    const particleCount = 15; 

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('sidebar-particle'); 

        const size = Math.random() * 5 + 2; 
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.position = 'absolute'; 
        particle.style.backgroundColor = 'var(--theme-green)'; 
        particle.style.borderRadius = '50%';

        // Random position within the sidebar
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;

        // Random animation properties
        particle.style.opacity = Math.random() * 0.4 + 0.1; 
        particle.style.animationDuration = `${Math.random() * 8 + 5}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;

        sidebarParticles.appendChild(particle);
    }
}

// Load files from local storage
function loadFiles() {
    const storedFiles = localStorage.getItem('files');
    
    try {
        files = storedFiles ? JSON.parse(storedFiles) : [];
        if (!Array.isArray(files)) {
            files = [];
        }
    } catch (error) {
        console.error("Error parsing files from localStorage:", error);
        files = []; 
        localStorage.removeItem('files'); 
    }
    console.log("Loading files:", files);

    sidebarContent.innerHTML = ''; 
    if (files.length === 0) {
        pageTitle.textContent = "No files yet";
        editorContent.innerHTML = '<p>Create your first file using the "+ New File" button in the sidebar.</p>';
        editorContent.contentEditable = "false"; 

    } else {
        editorContent.contentEditable = "true";
        files.forEach(addFileToSidebar);
        
        const lastFileId = localStorage.getItem('lastOpenFileId');
        let fileToSelect = files.find(f => f.id === lastFileId);
        if (!fileToSelect && files.length > 0) {
            fileToSelect = files[0]; // Default to first file
        }

        if (fileToSelect) {
            setTimeout(() => selectFile(fileToSelect.id), 0);
        } else {
            
            pageTitle.textContent = "Select a File";
            editorContent.innerHTML = '<p>Select a file from the sidebar.</p>';
            editorContent.contentEditable = "false";
        }
    }
}

// Create a new file
function createFile() {
    console.log("Creating new file triggered");
    
    if (renameInput) {
        finishRename();
    }

    const fileId = 'file_' + Date.now();
    const defaultName = 'Untitled';
    const newFile = {
        id: fileId,
        name: defaultName,
        content: '' 
    };

    files.push(newFile); 
    saveFiles();
    const fileElement = addFileToSidebar(newFile);

    // Ensure the file item is in the DOM before trying to rename
    requestAnimationFrame(() => {
        selectFile(fileId); 
        startRename(fileElement, fileId); 
    });
    editorContent.contentEditable = "true"; 
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
    fileNameSpan.textContent = file.name || 'Untitled'; 
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
        switch (action) {
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

// Setup AI event listeners
function setupAIEventListeners() {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const modifyBtn = document.getElementById('modifyBtn');
    const keywordsBtn = document.getElementById('keywordsBtn');
    const enhanceBtn = document.getElementById('enhanceBtn');
    const paraphraseBtn = document.getElementById('paraphraseBtn');

    summarizeBtn.addEventListener('click', () => handleAIAction('summarize'));
    modifyBtn.addEventListener('click', () => handleAIAction('modify'));
    keywordsBtn.addEventListener('click', () => handleAIAction('keywords'));
    enhanceBtn.addEventListener('click', () => handleAIAction('enhance'));
    paraphraseBtn.addEventListener('click', () => handleAIAction('paraphrase'));
}

// Handle AI actions
async function handleAIAction(action) {
    if (!currentFileId) {
        showNotification('Please select a file first', 'error');
        return;
    }

    const file = files.find(f => f.id === currentFileId);
    if (!file || !file.content) {
        showNotification('No content to process', 'error');
        return;
    }

    try {
        showLoading(true);
        const result = await processWithAI(file.content, action);
        showLoading(false);

        // Create a new file with the AI result
        const newFileId = 'file_' + Date.now();
        const newFileName = `${file.name} - ${action.charAt(0).toUpperCase() + action.slice(1)}`;
        const newFile = {
            id: newFileId,
            name: newFileName,
            content: result
        };

        files.push(newFile);
        saveFiles();
        addFileToSidebar(newFile);
        selectFile(newFileId);
    } catch (error) {
        showLoading(false);
        showNotification('Error processing with AI: ' + error.message, 'error');
    }
}

// Process content with Gemini AI
async function processWithAI(content, action) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = '';
    switch (action) {
        case 'summarize':
            prompt = `Please summarize the following text, focusing on the main concepts and keeping it about 25-30% of the original length:\n\n${content}`;
            break;
        case 'modify':
            prompt = `Please rewrite the following text to be easier to understand, highlighting important parts and concepts for exams:\n\n${content}`;
            break;
        case 'keywords':
            prompt = `Extract the key keywords and important topics from the following text to help a learner remember:\n\n${content}`;
            break;
        case 'enhance':
            prompt = `Enhance the following text by elaborating on key takeaways, concepts missed, and provide deeper explanations to learn better:\n\n${content}`;
            break;
        case 'paraphrase':
            prompt = `Paraphrase the following text in simpler terms while maintaining the original meaning:\n\n${content}`;
            break;
    }

    const result = await model.generateContent(prompt);
    return result.response.text();
}

// Show loading state
function showLoading(isLoading) {
    const buttons = document.querySelectorAll('.ai-tool-btn');
    buttons.forEach(btn => {
        btn.disabled = isLoading;
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
