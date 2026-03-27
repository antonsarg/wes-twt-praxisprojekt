package handlers

import (
	"encoding/json"
	"net/http"

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
