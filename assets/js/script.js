// Notes Management System - Cloud Sync with Supabase + localStorage fallback

class NotesManager {
    constructor() {
        this.storageKey = 'notes_data';
        this.notes = this.loadNotes();
        this.supabaseReady = false;
        this.useCloud = SUPABASE_ENABLED;
        this.userId = null;
        
        if (this.useCloud) {
            this.initSupabase();
        }
        
        this.initializeEventListeners();
        this.renderNotes();
    }

    // Initialize Supabase
    initSupabase() {
        try {
            // Initialize Supabase client
            const { createClient } = window.supabase;
            this.supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
            
            // Authenticate anonymously
            this.supabase.auth.signInAnonymously().then(({ data, error }) => {
                if (error) {
                    console.error('Supabase auth error:', error);
                    this.useCloud = false;
                    return;
                }
                
                this.userId = data.session.user.id;
                this.supabaseReady = true;
                console.log('Supabase connected - Cloud sync enabled');
                
                // Load notes from database
                this.loadNotesFromCloud();
                
                // Listen for real-time changes
                this.setupRealtimeListener();
            }).catch(error => {
                console.error('Supabase initialization error:', error);
                this.useCloud = false;
            });
        } catch (error) {
            console.error('Supabase setup error:', error);
            this.useCloud = false;
        }
    }

    // Load notes from Supabase
    loadNotesFromCloud() {
        if (!this.supabaseReady) return;
        
        this.supabase
            .from('notes')
            .select('*')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error loading notes:', error);
                    return;
                }
                
                if (data && data.length > 0) {
                    this.notes = data.map(note => ({
                        id: note.id,
                        title: note.title,
                        content: note.content,
                        createdAt: new Date(note.created_at).getTime()
                    }));
                    this.saveLocalNotes();
                    this.renderNotes();
                }
            });
    }

    // Setup real-time listener
    setupRealtimeListener() {
        if (!this.supabaseReady) return;
        
        try {
            this.supabase
                .channel('notes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${this.userId}` },
                    (payload) => {
                        this.loadNotesFromCloud();
                    }
                )
                .subscribe();
        } catch (error) {
            console.error('Error setting up realtime listener:', error);
        }
    }

    // Load notes from localStorage
    loadNotes() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    // Save notes to localStorage (local cache)
    saveLocalNotes() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.notes));
    }

    // Save notes to Supabase
    async saveToCloud(note) {
        if (!this.supabaseReady) return;
        
        try {
            const { error } = await this.supabase
                .from('notes')
                .insert([{
                    id: note.id,
                    user_id: this.userId,
                    title: note.title,
                    content: note.content,
                    created_at: new Date(note.createdAt).toISOString()
                }]);
            
            if (error) {
                console.error('Error saving to cloud:', error);
            }
        } catch (error) {
            console.error('Error saving to cloud:', error);
        }
    }

    // Delete note from Supabase
    async deleteFromCloud(id) {
        if (!this.supabaseReady) return;
        
        try {
            const { error } = await this.supabase
                .from('notes')
                .delete()
                .eq('id', id)
                .eq('user_id', this.userId);
            
            if (error) {
                console.error('Error deleting from cloud:', error);
            }
        } catch (error) {
            console.error('Error deleting from cloud:', error);
        }
    }

    // Add a new note
    addNote(title, content) {
        if (!title.trim() || !content.trim()) {
            alert('Please fill in both title and content');
            return;
        }

        const note = {
            id: Date.now().toString(),
            title: title.trim(),
            content: content.trim(),
            createdAt: Date.now()
        };

        this.notes.unshift(note);
        this.saveLocalNotes();
        
        // Save to cloud if available
        if (this.useCloud && this.supabaseReady) {
            this.saveToCloud(note);
        }
        
        this.renderNotes();
        this.clearInputs();
    }

    // Delete a note
    deleteNote(id) {
        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(note => note.id !== id);
            this.saveLocalNotes();
            
            // Delete from cloud if available
            if (this.useCloud && this.supabaseReady) {
                this.deleteFromCloud(id);
            }
            
            this.renderNotes();
        }
    }

    // Clear input fields
    clearInputs() {
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteTitle').focus();
    }

    // Render notes to the DOM
    renderNotes() {
        const notesList = document.getElementById('notesList');
        
        let statusHTML = '';
        if (this.useCloud) {
            if (this.supabaseReady) {
                statusHTML = '<div style="text-align:center; color:#14b8a6; font-size:0.9rem; margin-bottom:1rem;">☁️ Cloud sync enabled - Data synced across devices</div>';
            } else {
                statusHTML = '<div style="text-align:center; color:#f59e0b; font-size:0.9rem; margin-bottom:1rem;">⚠️ Connecting to cloud...</div>';
            }
        } else {
            statusHTML = '<div style="text-align:center; color:#6b7280; font-size:0.9rem; margin-bottom:1rem;">📱 Local storage only (Configure Supabase for cloud sync)</div>';
        }
        
        if (this.notes.length === 0) {
            notesList.innerHTML = statusHTML + '<div class="empty-state">No notes yet. Add your first note!</div>';
            return;
        }

        const notesHTML = this.notes.map(note => {
            const date = new Date(note.createdAt).toLocaleString();
            return `
            <div class="note-item">
                <h3>${this.escapeHtml(note.title)}</h3>
                <p>${this.escapeHtml(note.content)}</p>
                <div class="note-meta">
                    <span class="note-date">${date}</span>
                    <div class="note-actions">
                        <button class="note-btn delete" onclick="notesManager.deleteNote('${note.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        notesList.innerHTML = statusHTML + notesHTML;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Initialize event listeners
    initializeEventListeners() {
        const addNoteBtn = document.getElementById('addNoteBtn');
        const noteTitle = document.getElementById('noteTitle');
        const noteContent = document.getElementById('noteContent');

        addNoteBtn.addEventListener('click', () => {
            this.addNote(noteTitle.value, noteContent.value);
        });

        // Allow Enter key to add note from title field
        noteTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                noteContent.focus();
            }
        });

        // Allow Ctrl+Enter to submit from content field
        noteContent.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.addNote(noteTitle.value, noteContent.value);
            }
        });
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Notes Manager
    window.notesManager = new NotesManager();

    // Hello button functionality
    const helloBtn = document.getElementById('helloBtn');
    if (helloBtn) {
        helloBtn.addEventListener('click', function() {
            alert('Hello from your GitHub Pages site! 👋');
        });
    }
});

