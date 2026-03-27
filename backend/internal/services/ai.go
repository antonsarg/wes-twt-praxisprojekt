package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// ollamaRequest represents the JSON payload we send to Ollama
type ollamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}

// ollamaResponse represents the JSON payload Ollama sends back
type ollamaResponse struct {
	Response string `json:"response"`
}

// GenerateTitle asks the local Ollama model to create a short title based on the content
func GenerateTitle(content string) (string, error) {
	ollamaURL := os.Getenv("OLLAMA_URL")
	modelName := os.Getenv("OLLAMA_MODEL")

	if ollamaURL == "" || modelName == "" {
		return "", fmt.Errorf("ollama configuration missing in .env")
	}

	// Prompt engineered for a short, clean title
	prompt := fmt.Sprintf(`
		Analyze the following note content and generate a short, descriptive, and catchy title (maximum 6 words).
		Respond STRICTLY with the title only. Do not use quotes, markdown formatting, or any extra explanations.
		
		Content: %s
	`, content)

	reqBody := ollamaRequest{
		Model:  modelName,
		Prompt: prompt,
		Stream: false,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(ollamaURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to reach Ollama: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ollama returned status: %d", resp.StatusCode)
	}

	bodyBytes, _ := io.ReadAll(resp.Body)
	var ollamaResp ollamaResponse
	if err := json.Unmarshal(bodyBytes, &ollamaResp); err != nil {
		return "", err
	}

	// Clean up the response (remove any quotes or trailing newlines the LLM might add)
	cleanTitle := strings.TrimSpace(ollamaResp.Response)
	cleanTitle = strings.ReplaceAll(cleanTitle, "\"", "")
	cleanTitle = strings.TrimSuffix(cleanTitle, ".") // remove trailing period if present

	return cleanTitle, nil
}

// GenerateTags asks the local Ollama model to generate tags for a given text
func GenerateTags(title, content string) ([]string, error) {
	ollamaURL := os.Getenv("OLLAMA_URL")
	modelName := os.Getenv("OLLAMA_MODEL")

	if ollamaURL == "" || modelName == "" {
		return nil, fmt.Errorf("ollama configuration missing in .env")
	}

	// This prompt is engineered to force the LLM to only output a comma-separated list
	prompt := fmt.Sprintf(`
			You are an expert categorization AI. Analyze the following note.
			Title: %s
			Content: %s
			
			Generate exactly 3 to 4 highly relevant, single-word tags for this note. 
			Format your response STRICTLY as a comma-separated list, all lowercase. 
			Do not use spaces after commas. Do not write any explanations. Do not use quotes. 
			Example output: web,frontend,architecture
		`, title, content)

	reqBody := ollamaRequest{
		Model:  modelName,
		Prompt: prompt,
		Stream: false,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	// Create an HTTP client with a timeout (LLMs can take a few seconds to think!)
	client := &http.Client{Timeout: 30 * time.Second}

	resp, err := client.Post(ollamaURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to reach Ollama: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ollama returned status: %d", resp.StatusCode)
	}

	bodyBytes, _ := io.ReadAll(resp.Body)

	var ollamaResp ollamaResponse
	if err := json.Unmarshal(bodyBytes, &ollamaResp); err != nil {
		return nil, err
	}

	// Clean up the response (split by comma, trim whitespace)
	rawTags := strings.Split(ollamaResp.Response, ",")
	var cleanTags []string
	for _, tag := range rawTags {
		cleaned := strings.TrimSpace(tag)
		// Remove any stray quotes or periods the LLM might have hallucinated
		cleaned = strings.ReplaceAll(cleaned, "\"", "")
		cleaned = strings.ReplaceAll(cleaned, ".", "")
		if cleaned != "" {
			cleanTags = append(cleanTags, cleaned)
		}
	}

	return cleanTags, nil
}

// GenerateMonthlySummary asks Ollama to summarize a collection of notes into a short text
func GenerateMonthlySummary(combinedNotes string) (string, error) {
	ollamaURL := os.Getenv("OLLAMA_URL")
	modelName := os.Getenv("OLLAMA_MODEL")

	if ollamaURL == "" || modelName == "" {
		return "", fmt.Errorf("ollama configuration missing in .env")
	}

	// We explicitly ask for a German summary ("Fließtext") focusing on core themes
	prompt := fmt.Sprintf(`
		You are a helpful AI assistant. Read the following notes from the user from this month.
		Write a short, coherent summary (continuous text, max. 5 short sentences) in English about the core topics the user has learned or written down.
		Reply EXCLUSIVELY with the summary. No greetings, no explanations.
		
		Notes:
		%s
	`, combinedNotes)

	reqBody := ollamaRequest{
		Model:  modelName,
		Prompt: prompt,
		Stream: false,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	// Summarizing takes longer than tagging, so we give the client a generous 60-second timeout
	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Post(ollamaURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to reach Ollama: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ollama returned status: %d", resp.StatusCode)
	}

	bodyBytes, _ := io.ReadAll(resp.Body)
	var ollamaResp ollamaResponse
	if err := json.Unmarshal(bodyBytes, &ollamaResp); err != nil {
		return "", err
	}

	cleanSummary := strings.TrimSpace(ollamaResp.Response)
	return cleanSummary, nil
}
