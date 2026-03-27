package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"gitlab.web.fh-kufstein.ac.at/sarganton.wes24/wes-twt-praxisprojekt-backend/internal/middleware"
	"gitlab.web.fh-kufstein.ac.at/sarganton.wes24/wes-twt-praxisprojekt-backend/internal/models"
	"gitlab.web.fh-kufstein.ac.at/sarganton.wes24/wes-twt-praxisprojekt-backend/internal/services"
)

// AIHandler handles all AI-related HTTP requests
type AIHandler struct {
	Notes *models.NoteModel
}

type generateTitleInput struct {
	Content string `json:"content"`
}

// GenerateTitle responds with a single AI-generated title string
func (h *AIHandler) GenerateTitle(w http.ResponseWriter, r *http.Request) {
	var input generateTitleInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Validation: We need at least *some* content to generate a title
	if input.Content == "" || len(input.Content) < 10 {
		http.Error(w, "Content is too short to generate a meaningful title", http.StatusBadRequest)
		return
	}

	// Call our Ollama service
	title, err := services.GenerateTitle(input.Content)
	if err != nil {
		http.Error(w, "Failed to generate title: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return the title as JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"title": title,
	})
}

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

func (h *AIHandler) GenerateMonthlySummary(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 1. Get the month from the URL (e.g., ?month=2026-03)
	monthStr := r.URL.Query().Get("month")
	if monthStr == "" {
		http.Error(w, "Missing 'month' query parameter (format: YYYY-MM)", http.StatusBadRequest)
		return
	}

	// 2. Calculate the start and end dates for our DB Search
	// Parse the incoming month string (format "2006-01" is Go's magic reference date layout)
	t, err := time.Parse("2006-01", monthStr)
	if err != nil {
		http.Error(w, "Invalid month format. Use YYYY-MM", http.StatusBadRequest)
		return
	}

	fromDate := t.Format("2006-01-02")
	// Add 1 month, then subtract 1 day to get the last day of the target month
	toDate := t.AddDate(0, 1, -1).Format("2006-01-02")

	// 3. Fetch the notes using our existing Search method!
	notes, err := h.Notes.Search(userID, "", nil, fromDate, toDate)
	if err != nil {
		http.Error(w, "Failed to fetch notes", http.StatusInternalServerError)
		return
	}

	if len(notes) == 0 {
		http.Error(w, "No notes found for this month to summarize", http.StatusNotFound)
		return
	}

	// 4. Combine the notes into a single string for the AI
	var combinedText string
	for _, note := range notes {
		// We format it cleanly so the AI can distinguish different notes
		combinedText += fmt.Sprintf("Titel: %s\nInhalt: %s\n\n", note.Title, note.Content)
	}

	// 5. Ask Ollama to summarize
	summary, err := services.GenerateMonthlySummary(combinedText)
	if err != nil {
		http.Error(w, "Failed to generate summary: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 6. Return the summary
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"month":   monthStr,
		"summary": summary,
	})
}
