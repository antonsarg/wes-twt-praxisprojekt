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

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Printf("Warning: No .env file found: %v", err)
	}

	dbUser := os.Getenv("POSTGRES_USER")
	dbPass := os.Getenv("POSTGRES_PASSWORD")
	dbName := os.Getenv("POSTGRES_DB")

	connStr := fmt.Sprintf("postgres://%s:%s@localhost:5432/%s?sslmode=disable", dbUser, dbPass, dbName)
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

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Server is healthy!"))
	})

	mux.HandleFunc("POST /register", authHandler.Register)
	mux.HandleFunc("POST /login", authHandler.Login)

	mux.HandleFunc("POST /notes", middleware.RequireAuth(noteHandler.Create))
	mux.HandleFunc("GET /notes", middleware.RequireAuth(noteHandler.GetAll))

	port := ":8080"
	fmt.Printf("Starting server on port %s\n", port)

	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}
