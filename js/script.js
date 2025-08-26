/**
 * Libretto - AI Reading Companion
 * Wireframe-based app with homepage and book discussion views
 */

// Application State
let books = [];
let currentView = 'homepage';
let selectedBook = null;

// DOM Elements - Homepage
const homepageView = document.getElementById('homepage');
const bookDiscussionView = document.getElementById('book-discussion');
const addBookModal = document.getElementById('add-book-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelAddBtn = document.getElementById('cancel-add');
const addBookForm = document.getElementById('add-book-form');
const booksGrid = document.getElementById('books-grid');

// DOM Elements - Book Discussion
const backToHomeBtn = document.getElementById('back-to-home');
const currentBookTitle = document.getElementById('current-book-title');
const currentBookAuthor = document.getElementById('current-book-author');
const progressFill = document.getElementById('progress-fill');
const progressIndicator = document.getElementById('progress-indicator');
const currentPageDisplay = document.getElementById('current-page-display');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendMessageBtn = document.getElementById('send-message');

/**
 * Initialize App
 */
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    setupEventListeners();
    renderBooks();
    switchToView('homepage');
});

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Modal interactions
    closeModalBtn.addEventListener('click', closeAddBookModal);
    cancelAddBtn.addEventListener('click', closeAddBookModal);
    
    // Close modal when clicking backdrop
    addBookModal.addEventListener('click', (e) => {
        if (e.target === addBookModal || e.target.classList.contains('modal-backdrop')) {
            closeAddBookModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && addBookModal.style.display !== 'none') {
            closeAddBookModal();
        }
    });

    // Add book form
    addBookForm.addEventListener('submit', handleAddBook);

    // Book discussion interactions
    backToHomeBtn.addEventListener('click', () => switchToView('homepage'));
    prevPageBtn.addEventListener('click', () => updateBookProgress('prev'));
    nextPageBtn.addEventListener('click', () => updateBookProgress('next'));

    // Chat functionality
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    sendMessageBtn.addEventListener('click', sendMessage);
}

/**
 * View Management
 */
function switchToView(viewName) {
    currentView = viewName;
    
    // Hide all views
    homepageView.classList.remove('active');
    bookDiscussionView.classList.remove('active');
    
    // Show target view
    if (viewName === 'homepage') {
        homepageView.classList.add('active');
    } else if (viewName === 'book-discussion') {
        bookDiscussionView.classList.add('active');
    }
}

/**
 * Modal Management
 */
function openAddBookModal() {
    addBookModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    setTimeout(() => {
        document.getElementById('book-title').focus();
    }, 100);
}

function closeAddBookModal() {
    addBookModal.style.display = 'none';
    document.body.style.overflow = '';
    addBookForm.reset();
}

/**
 * Book Management
 */
function handleAddBook(e) {
    e.preventDefault();
    
    const title = document.getElementById('book-title').value.trim();
    const author = document.getElementById('book-author').value.trim();
    const currentPosition = document.getElementById('current-position').value.trim();

    if (!title || !author || !currentPosition) {
        alert('Please fill in all fields');
        return;
    }

    const book = {
        id: Date.now(),
        title,
        author,
        currentPosition,
        // Set a default total based on the current position for progress calculation
        totalPages: estimateTotalPages(currentPosition),
        progress: 0, // We'll calculate this based on user updates
        dateAdded: new Date().toISOString()
    };

    books.push(book);
    saveBooks();
    renderBooks();
    
    // Close modal and show success feedback
    closeAddBookModal();
    showNotification(`"${title}" added to your library!`);
}

function calculateProgress(current, total) {
    const currentNum = parseInt(current.match(/\d+/)?.[0] || 0);
    const totalNum = parseInt(total.match(/\d+/)?.[0] || 1);
    return Math.min(Math.round((currentNum / totalNum) * 100), 100);
}

function estimateTotalPages(currentPosition) {
    // Estimate total pages/chapters based on current position
    // This is just for internal calculations, user won't see this
    const currentNum = parseInt(currentPosition.match(/\d+/)?.[0] || 1);
    const isChapter = currentPosition.toLowerCase().includes('chapter');
    
    if (isChapter) {
        // Assume average book has 20-25 chapters
        return `${Math.max(currentNum * 2, 20)} chapters`;
    } else {
        // Assume average book has 300-400 pages
        return `${Math.max(currentNum * 3, 300)} pages`;
    }
}

function generateMockResponse(message, book) {
    // Mock responses for testing when API is blocked by CORS
    const responses = [
        `That's a really interesting point about "${book.title}"! What you've read up to ${book.currentPosition} really sets up some fascinating themes. What stood out most to you in that section?`,
        `I love discussing "${book.title}"! Based on what you've experienced up to ${book.currentPosition}, there's so much to unpack. Which character has surprised you the most so far?`,
        `Great question about "${book.title}"! The writing style really shines through in the sections you've read up to ${book.currentPosition}. How are you finding the author's approach?`,
        `That's exactly the kind of insight that makes "${book.title}" so compelling! From what you've read to ${book.currentPosition}, what themes are resonating with you?`,
        `Fascinating observation! "${book.title}" has so many layers, especially in the part you've reached at ${book.currentPosition}. What do you think the author is trying to convey there?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function renderBooks() {
    // Always show the grid
    booksGrid.style.display = 'grid';
    
    // Create the add book card (+ sign)
    const addBookCard = `
        <div class="add-book-card" onclick="openAddBookModal()">
            <div class="add-book-icon">+</div>
            <div class="add-book-text">Add Book</div>
        </div>
    `;
    
    // Render existing books + add card
    const bookCards = books.map(book => `
        <div class="book-card" onclick="openBookDiscussion(${book.id})">
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <p class="book-author">by ${escapeHtml(book.author)}</p>
        </div>
    `).join('');
    
    booksGrid.innerHTML = addBookCard + bookCards;
}

/**
 * Book Discussion Management
 */
function openBookDiscussion(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    selectedBook = book;
    
    // Update discussion view with book info
    currentBookTitle.textContent = book.title;
    currentBookAuthor.textContent = `by ${book.author}`;
    
    // Update progress indicator
    updateProgressDisplay();
    
    // Clear previous chat messages and show welcome
    chatMessages.innerHTML = `
        <div class="message ai">
            <div class="message-bubble">
                Hi! I'm ready to discuss "${book.title}" with you. I'll only reference content up to ${book.currentPosition} to avoid spoilers. What would you like to talk about?
            </div>
        </div>
    `;
    
    // Switch to discussion view
    switchToView('book-discussion');
}

function updateProgressDisplay() {
    if (!selectedBook) return;
    
    const progress = selectedBook.progress;
    progressFill.style.width = `${progress}%`;
    progressIndicator.style.left = `${progress}%`;
    currentPageDisplay.textContent = selectedBook.currentPosition;
}

function updateBookProgress(direction) {
    if (!selectedBook) return;
    
    let currentNum = parseInt(selectedBook.currentPosition.match(/\d+/)?.[0] || 0);
    const isChapter = selectedBook.currentPosition.toLowerCase().includes('chapter');
    
    if (direction === 'prev' && currentNum > 1) {
        currentNum--;
    } else if (direction === 'next') {
        currentNum++;
        // Update estimated total if we go beyond current estimate
        const currentTotalNum = parseInt(selectedBook.totalPages.match(/\d+/)?.[0] || 1);
        if (currentNum > currentTotalNum * 0.8) {
            selectedBook.totalPages = estimateTotalPages(`${isChapter ? 'Chapter' : 'Page'} ${currentNum}`);
        }
    }
    
    const prefix = isChapter ? 'Chapter' : 'Page';
    selectedBook.currentPosition = `${prefix} ${currentNum}`;
    selectedBook.progress = calculateProgress(selectedBook.currentPosition, selectedBook.totalPages);
    
    // Update the book in the books array
    const bookIndex = books.findIndex(b => b.id === selectedBook.id);
    if (bookIndex !== -1) {
        books[bookIndex] = { ...selectedBook };
        saveBooks();
    }
    
    updateProgressDisplay();
    
    // Progress updated silently - no automatic AI message
}

/**
 * Chat Management
 */
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !selectedBook) return;

    addMessage('user', message);
    chatInput.value = '';
    
    // Disable input while processing
    chatInput.disabled = true;
    sendMessageBtn.disabled = true;
    
    // Show typing indicator
    const typingId = addMessage('ai', '💭 Thinking...');

    try {
        const response = await generateAIResponse(message, selectedBook);
        removeMessage(typingId);
        addMessage('ai', response);
    } catch (error) {
        removeMessage(typingId);
        addMessage('ai', `I'm having trouble connecting right now. Let me try again in a moment. Error: ${error.message}`);
    } finally {
        // Re-enable input
        chatInput.disabled = false;
        sendMessageBtn.disabled = false;
        chatInput.focus();
    }
}

function addMessage(sender, content) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;
    messageEl.setAttribute('data-message-id', Date.now());
    messageEl.innerHTML = `<div class="message-bubble">${escapeHtml(content)}</div>`;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageEl.getAttribute('data-message-id');
}

function removeMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
        messageEl.remove();
    }
}

async function generateAIResponse(message, book) {
    // Embedded API key (fixed format)
    const apiKey = 'sk-ant-api03-1nF9aBc_-aQYXLzMszrjL1cAHoVc-UXBPX6GtnvwzU7B11eVQS1Ibj89hC6qFsZF3DWdcaMDawHoLRRCBIFuAQ-U9IQKAAA';

    const spoilerFreePrompt = `You are an enthusiastic and knowledgeable literary companion discussing "${book.title}" by ${book.author} with someone who is currently reading it.

STRICT SPOILER PROTECTION:
- Reader's current progress: ${book.currentPosition}
- You must ONLY discuss content that occurs up to and including ${book.currentPosition}
- NEVER hint at, foreshadow, or mention anything that happens after ${book.currentPosition}
- If asked about later events, redirect with: "Let's focus on what you've experienced so far!"

Your personality:
- Enthusiastic but not overwhelming
- Ask thoughtful follow-up questions
- Encourage deeper thinking about themes, characters, and literary devices
- Keep responses conversational and engaging (2-4 sentences typically)
- Show genuine interest in their reading experience

Reader's message: "${message}"

Respond as their literary companion, staying completely within spoiler boundaries.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: spoilerFreePrompt
                }]
            }),
            mode: 'cors'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, response.statusText, errorText);
            if (response.status === 401) {
                throw new Error('API authentication failed. Invalid API key.');
            }
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.content && data.content[0] && data.content[0].text) {
            return data.content[0].text;
        } else {
            throw new Error('Unexpected response format from Claude API');
        }
    } catch (fetchError) {
        console.error('Fetch Error:', fetchError);
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('CORS')) {
            // CORS error - use mock response for now
            console.log('Using mock response due to CORS restriction');
            return generateMockResponse(message, book);
        }
        throw fetchError;
    }
}

/**
 * Data Persistence
 */
function loadBooks() {
    try {
        const savedBooks = localStorage.getItem('libretto_books');
        books = savedBooks ? JSON.parse(savedBooks) : [];
    } catch (error) {
        console.error('Error loading books:', error);
        books = [];
    }
}

function saveBooks() {
    try {
        localStorage.setItem('libretto_books', JSON.stringify(books));
        console.log('Books saved:', books);
    } catch (error) {
        console.error('Error saving books:', error);
    }
}

/**
 * Utility Functions
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-purple);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Make functions globally available
window.openBookDiscussion = openBookDiscussion;
window.openAddBookModal = openAddBookModal;