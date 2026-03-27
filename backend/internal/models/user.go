package models

import (
	"database/sql"
	"errors"
)

// User represents the data structure
type User struct {
	ID           int    `json:"id"`
	Email        string `json:"email"`
	PasswordHash string `json:"-"`
}

// UserModel wraps the database connection pool
type UserModel struct {
	DB *sql.DB
}

// Insert adds a new user to the database
func (m *UserModel) Insert(email, passwordHash string) error {
	stmt := `INSERT INTO users (email, password_hash) VALUES ($1, $2)`
	_, err := m.DB.Exec(stmt, email, passwordHash)
	return err
}

// GetByEmail retrieves a user by their email address
func (m *UserModel) GetByEmail(email string) (*User, error) {
	stmt := `SELECT id, email, password_hash FROM users WHERE email = $1`

	u := &User{}
	err := m.DB.QueryRow(stmt, email).Scan(&u.ID, &u.Email, &u.PasswordHash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return u, nil
}
