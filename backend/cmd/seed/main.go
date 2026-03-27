package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// 1. Load Environment Variables
	err := godotenv.Load("../.env")
	if err != nil {
		log.Printf("Warning: No .env file found: %v", err)
	}

	dbUser := os.Getenv("DATABASE_USER")
	dbPass := os.Getenv("DATABASE_PASSWORD")
	dbName := os.Getenv("DATABASE_NAME")

	if dbUser == "" {
		log.Fatal("Missing database environment variables. Are you running this from the project root?")
	}

	// 2. Connect to Database
	connStr := fmt.Sprintf("postgres://%s:%s@localhost:5432/%s?sslmode=disable", dbUser, dbPass, dbName)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatal("Cannot connect to database:", err)
	}
	fmt.Println("Connected to database...")

	// 3. Create a Dummy User for the Arts Class
	email := "anton@example.com"
	password := "securepassword123"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), 14)

	var userID int
	// Insert user and return ID, or get ID if they already exist
	err = db.QueryRow(`
		INSERT INTO users (email, password_hash) 
		VALUES ($1, $2) 
		ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email 
		RETURNING id`, email, string(hash)).Scan(&userID)

	if err != nil {
		log.Fatal("Failed to create dummy user:", err)
	}
	fmt.Printf("User ready (ID: %d)\n", userID)

	// 4. Define the Dummy Notes (Arts Class Theme)
	now := time.Now()
	notes := []struct {
		Title     string
		Content   string
		Tags      []string
		CreatedAt time.Time
	}{
		{
			Title:     "WebAssembly (Wasm) Performance",
			Content:   "Wasm allows running Rust/Go in the browser at near-native speed. Great for heavy computation, but DOM manipulation is still a bottleneck. Need to read up on the component model.",
			Tags:      []string{"wasm", "performance", "architecture"},
			CreatedAt: now.AddDate(0, -2, 0),
		},
		{
			Title:     "Micro-Frontends with Module Federation",
			Content:   "Webpack 5 makes micro-frontends highly viable. Allows independent deployments for different domain teams. The biggest trade-off is handling shared state and CSS scoping.",
			Tags:      []string{"architecture", "frontend", "scaling"},
			CreatedAt: now.AddDate(0, -1, -5),
		},
		{
			Title:     "Edge Computing vs. Serverless",
			Content:   "Cloudflare Workers use V8 isolates instead of full containers, eliminating cold starts. Perfect for auth middleware and A/B testing right at the CDN level. Including this in the final paper.",
			Tags:      []string{"serverless", "edge", "cloud"},
			CreatedAt: now.AddDate(0, 0, -14),
		},
		{
			Title:     "RAG Architecture for Praxisprojekt",
			Content:   "Retrieval-Augmented Generation is perfect for the Smart Notes app. Plan: Use pgvector in Postgres to store note embeddings, then pass relevant context to the LLM (maybe local Ollama) for the chat feature.",
			Tags:      []string{"ai", "rag", "pgvector", "project"},
			CreatedAt: now.AddDate(0, 0, -3),
		},
		{
			Title:     "Go Backend Status Update",
			Content:   "Docker compose is fully set up with Postgres and automatic migrations. JWT middleware is securing the endpoints. The dynamic SQL for the search feature is working perfectly.",
			Tags:      []string{"golang", "backend", "docker"},
			CreatedAt: now.AddDate(0, 0, -1),
		},
	}

	// 5. Insert Notes into Database
	// We write a custom SQL string here so we can force the created_at date to be in the past
	stmt := `INSERT INTO notes (user_id, title, content, tags, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5)`

	for _, note := range notes {
		_, err := db.Exec(stmt, userID, note.Title, note.Content, pq.Array(note.Tags), note.CreatedAt)
		if err != nil {
			log.Printf("Failed to insert note '%s': %v\n", note.Title, err)
		}
	}

	fmt.Println("✅ Successfully seeded the database with Arts Class notes!")
}
