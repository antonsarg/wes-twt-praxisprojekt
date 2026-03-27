package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"gitlab.web.fh-kufstein.ac.at/sarganton.wes24/wes-twt-praxisprojekt-backend/internal/middleware"
	"gitlab.web.fh-kufstein.ac.at/sarganton.wes24/wes-twt-praxisprojekt-backend/internal/models"
)

// NoteHandler holds dependencies for note routes
type NoteHandler struct {
	Notes *models.NoteModel
}

// Helper struct for incoming JSON requests
type createNoteInput struct {
	Title   string   `json:"title"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

func (h *NoteHandler) Create(w http.ResponseWriter, r *http.Request) {
	// 1. Extract the User ID from the request context (put there by our middleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized context missing", http.StatusUnauthorized)
		return
	}

	// 2. Parse the JSON body
	var input createNoteInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// 3. Basic validation (MVP rule: Must have a title and content)
	if input.Title == "" || input.Content == "" {
		http.Error(w, "Title and content are required", http.StatusBadRequest)
		return
	}

	// 4. Save the note to the database
	noteID, err := h.Notes.Insert(userID, input.Title, input.Content, input.Tags)
	if err != nil {
		http.Error(w, "Could not save note", http.StatusInternalServerError)
		return
	}

	// 5. Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"message": "Note created successfully",
		"note_id": noteID,
	})
}

func (h *NoteHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	// 1. Extract the User ID from the context (injected by the Auth Middleware)
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized context missing", http.StatusUnauthorized)
		return
	}

	// 2. Fetch the notes from the database
	notes, err := h.Notes.GetAllForUser(userID)
	if err != nil {
		http.Error(w, "Could not fetch notes", http.StatusInternalServerError)
		return
	}

	// 3. Return the notes as JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(notes)
}

func (h *NoteHandler) Update(w http.ResponseWriter, r *http.Request) {
	// 1. Get User ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 2. Get Note ID from the URL (Go 1.22+ feature!)
	noteIDStr := r.PathValue("id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	// 3. Parse the JSON body
	var input createNoteInput // We can reuse the struct from the Create handler
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// 4. Update the database
	err = h.Notes.Update(noteID, userID, input.Title, input.Content, input.Tags)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Note updated successfully"}`))
}

func (h *NoteHandler) Delete(w http.ResponseWriter, r *http.Request) {
	// 1. Get User ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 2. Get Note ID from the URL
	noteIDStr := r.PathValue("id")
	noteID, err := strconv.Atoi(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	// 3. Delete from the database
	err = h.Notes.Delete(noteID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Note deleted successfully"}`))
}

func (h *NoteHandler) Search(w http.ResponseWriter, r *http.Request) {
	// 1. Get User ID from context
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 2. Parse URL Query Parameters
	query := r.URL.Query()
	keyword := query.Get("q")      // e.g., ?q=project
	tagsParam := query.Get("tags") // e.g., ?tags=golang,mvp
	fromDate := query.Get("from")  // e.g., ?from=2024-01-01
	toDate := query.Get("to")      // e.g., ?to=2024-12-31

	// 3. Process the tags string into a slice
	var tags []string
	if tagsParam != "" {
		// Split "golang,mvp" into ["golang", "mvp"]
		tags = strings.Split(tagsParam, ",")

		// Clean up any accidental whitespace (e.g., "golang, mvp")
		for i := range tags {
			tags[i] = strings.TrimSpace(tags[i])
		}
	}

	// 4. Call the model
	notes, err := h.Notes.Search(userID, keyword, tags, fromDate, toDate)
	if err != nil {
		http.Error(w, "Error searching notes", http.StatusInternalServerError)
		return
	}

	// 5. Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}
