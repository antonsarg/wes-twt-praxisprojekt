package models

import (
	"database/sql"
	"errors"
	"fmt"
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
		ORDER BY updated_at DESC`

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

func (m *NoteModel) Update(id, userID int, title, content string, tags []string) error {
	if tags == nil {
		tags = []string{}
	}

	stmt := `
		UPDATE notes 
		SET title = $1, content = $2, tags = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4 AND user_id = $5`

	result, err := m.DB.Exec(stmt, title, content, pq.Array(tags), id, userID)
	if err != nil {
		return err
	}

	// Check if any row was actually updated (prevents silent failures if ID is wrong)
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("note not found or you do not have permission to update it")
	}

	return nil
}

func (m *NoteModel) Delete(id, userID int) error {
	stmt := `DELETE FROM notes WHERE id = $1 AND user_id = $2`

	result, err := m.DB.Exec(stmt, id, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("note not found or you do not have permission to delete it")
	}

	return nil
}

func (m *NoteModel) Search(userID int, keyword string, tags []string, fromDate, toDate string) ([]*Note, error) {
	// 1. Start with the base query that belongs to the user
	stmt := `SELECT id, user_id, title, content, tags, created_at, updated_at FROM notes WHERE user_id = $1`

	// args holds the values we will pass to the database securely
	args := []any{userID}
	argID := 2 // We start at $2 because $1 is the userID

	// 2. Add text search (Title OR Content)
	if keyword != "" {
		stmt += fmt.Sprintf(` AND (title ILIKE $%d OR content ILIKE $%d)`, argID, argID)
		args = append(args, "%"+keyword+"%") // The % signs are SQL wildcards for "contains"
		argID++
	}

	// 3. Add tags search
	if len(tags) > 0 {
		// The && operator in Postgres means "overlap" (find notes that have ANY of these tags)
		// If you want strict matching (notes must have ALL these tags), use the @> operator instead.
		stmt += fmt.Sprintf(` AND tags && $%d`, argID)
		args = append(args, pq.Array(tags))
		argID++
	}

	// 4. Add date filters
	if fromDate != "" {
		stmt += fmt.Sprintf(` AND created_at >= $%d`, argID)
		args = append(args, fromDate)
		argID++
	}
	if toDate != "" {
		// We append " 23:59:59" so it includes the entire end day
		stmt += fmt.Sprintf(` AND created_at <= $%d`, argID)
		args = append(args, toDate+" 23:59:59")
		argID++
	}

	// 5. Finally, sort the results
	stmt += ` ORDER BY updated_at DESC`

	// 6. Execute the query (this is identical to how we did GetAllForUser)
	rows, err := m.DB.Query(stmt, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []*Note
	for rows.Next() {
		n := &Note{}
		var dbTags []string
		err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Content, pq.Array(&dbTags), &n.CreatedAt, &n.UpdatedAt)
		if err != nil {
			return nil, err
		}
		n.Tags = dbTags
		notes = append(notes, n)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	if notes == nil {
		notes = []*Note{} // Return [] instead of null for empty JSON arrays
	}

	return notes, nil
}
