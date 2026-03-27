CREATE TABLE notes (
                       id SERIAL PRIMARY KEY,
                       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                       title VARCHAR(255) NOT NULL,
                       content TEXT NOT NULL,
                       tags TEXT[] DEFAULT '{}',
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries when filtering by user
CREATE INDEX idx_notes_user_id ON notes(user_id);