-- Create saved_tweets table
CREATE TABLE IF NOT EXISTS saved_tweets (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    title TEXT,
    is_thread BOOLEAN DEFAULT false,
    thread_position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_tweets_updated_at
    BEFORE UPDATE ON saved_tweets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 