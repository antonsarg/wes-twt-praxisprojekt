package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"gitlab.web.fh-kufstein.ac.at/sarganton.wes24/wes-twt-praxisprojekt-backend/internal/handlers"
	"gitlab.web.fh-kufstein.ac.at/sarganton.wes24/wes-twt-praxisprojekt-backend/internal/middleware"
	"gitlab.web.fh-kufstein.ac.at/sarganton.wes24/wes-twt-praxisprojekt-backend/internal/models"

	_ "github.com/lib/pq"
)

func main() {
	dbUser := os.Getenv("DATABASE_USER")
	dbPass := os.Getenv("DATABASE_PASSWORD")
	dbName := os.Getenv("DATABASE_NAME")

	dbHost := os.Getenv("DATABASE_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	connStr := fmt.Sprintf("postgres://%s:%s@%s:5432/%s?sslmode=disable", dbUser, dbPass, dbHost, dbName)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatal("Cannot connect to database:", err)
	}
	log.Println("Database connection established")

	userModel := &models.UserModel{DB: db}
	authHandler := &handlers.AuthHandler{Users: userModel}

	noteModel := &models.NoteModel{DB: db}
	noteHandler := &handlers.NoteHandler{Notes: noteModel}

	aiHandler := &handlers.AIHandler{Notes: noteModel}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Server is healthy!"))
	})

	// Public routes
	mux.HandleFunc("POST /register", authHandler.Register)
	mux.HandleFunc("POST /login", authHandler.Login)

	// Protected Notes routes
	mux.HandleFunc("POST /notes", middleware.RequireAuth(noteHandler.Create))
	mux.HandleFunc("GET /notes", middleware.RequireAuth(noteHandler.GetAll))
	mux.HandleFunc("GET /notes/{id}", middleware.RequireAuth(noteHandler.GetByID))
	mux.HandleFunc("GET /notes/search", middleware.RequireAuth(noteHandler.Search))
	mux.HandleFunc("GET /notes/months", middleware.RequireAuth(noteHandler.GetMonthlySummary))
	mux.HandleFunc("PUT /notes/{id}", middleware.RequireAuth(noteHandler.Update))
	mux.HandleFunc("DELETE /notes/{id}", middleware.RequireAuth(noteHandler.Delete))

	// Protected AI routes
	mux.HandleFunc("POST /ai/generate-title", middleware.RequireAuth(aiHandler.GenerateTitle))
	mux.HandleFunc("POST /ai/generate-tags", middleware.RequireAuth(aiHandler.GenerateTags))
	mux.HandleFunc("GET /ai/monthly-summary", middleware.RequireAuth(aiHandler.GenerateMonthlySummary))

	port := ":8080"
	fmt.Printf("Starting server on port %s\n", port)

	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}
