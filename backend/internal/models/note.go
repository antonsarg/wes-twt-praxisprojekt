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

// GetAllForUser retrieves all notes for a specific user, sorted newest first
func (m *NoteModel) GetAllForUser(userID int) ([]*Note, error) {
	stmt := `
		SELECT id, user_id, title, content, tags, created_at, updated_at
		FROM notes
		WHERE user_id = $1
		ORDER BY created_at DESC`

	// Query returns multiple rows
	rows, err := m.DB.Query(stmt, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close() // Crucial: always close rows to prevent database connection leaks!

	// Initialize an empty slice to hold the results
	var notes []*Note

	for rows.Next() {
		n := &Note{}
		var tags []string // Temporary slice to hold the unmarshaled Postgres array

		// Scan the row data into our struct. Note the pq.Array(&tags) here too!
		err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Content, pq.Array(&tags), &n.CreatedAt, &n.UpdatedAt)
		if err != nil {
			return nil, err
		}

		n.Tags = tags
		notes = append(notes, n)
	}

	// Check for errors that might have occurred during the iteration
	if err = rows.Err(); err != nil {
		return nil, err
	}

	// If the user has no notes, return an empty array [] instead of null for better JSON
	if notes == nil {
		notes = []*Note{}
	}

	return notes, nil
}
