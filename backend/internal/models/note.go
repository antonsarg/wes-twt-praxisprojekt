package models

import (
	"database/sql"
	"time"

	"github.com/lib/pq"
)

// Note represents the data structure of a note
type Note struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Tags      []string  `json:"tags"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// NoteModel wraps the database connection pool
type NoteModel struct {
	DB *sql.DB
}

// Insert adds a new note to the database and returns its new ID
func (m *NoteModel) Insert(userID int, title, content string, tags []string) (int, error) {
	// If tags is nil, insert an empty array instead of NULL to keep the DB clean
	if tags == nil {
		tags = []string{}
	}

	stmt := `
		INSERT INTO notes (user_id, title, content, tags)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	var id int
	// pq.Array() converts the Go string slice into a format Postgres understands
	err := m.DB.QueryRow(stmt, userID, title, content, pq.Array(tags)).Scan(&id)
	if err != nil {
		return 0, err
	}

	return id, nil
}
