package handlers

import (
	"encoding/json"
	"net/http"

	"gitlab.web.fh-kufstein.ac.at/sarganton.wes24/wes-twt-praxisprojekt-backend/internal/services"
)

// AIHandler handles all AI-related HTTP requests
type AIHandler struct{}

// Helper struct for the incoming JSON payload
type generateTagsInput struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// GenerateTags responds with an array of AI-generated tags based on the provided text
func (h *AIHandler) GenerateTags(w http.ResponseWriter, r *http.Request) {
	var input generateTagsInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if input.Content == "" {
		http.Error(w, "Content is required to generate tags", http.StatusBadRequest)
		return
	}

	// Call our Ollama service
	tags, err := services.GenerateTags(input.Title, input.Content)
	if err != nil {
		http.Error(w, "Failed to generate tags: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the tags as a JSON array
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string][]string{
		"tags": tags,
	})
}
