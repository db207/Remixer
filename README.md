# Content Remixer

A powerful content remixing tool that transforms your content into different formats using AI.

## Features

1. Multiple Input Methods:
   - Text input
   - PDF file upload
   - Tweet URL import

2. Content Transformation:
   - Convert content to Twitter threads
   - Transform content into blog posts

3. Content Management:
   - Save remixed content
   - Edit saved content
   - Delete saved items
   - View history of saved items

4. Social Integration:
   - Direct "Tweet" button integration
   - Thread support

## Tech Stack

- React + Vite
- TailwindCSS
- Anthropic Claude API
- Supabase (Database)
- Heroicons
- Twitter API integration

## Environment Setup

Create a `.env` file with the following variables:

```env
# Frontend
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend (Vercel Serverless Functions)
ANTHROPIC_API_KEY=your_claude_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Deployment

This project is configured for deployment on Vercel, which will handle both the frontend and backend (serverless functions).

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. Deploy to Vercel:
   1. Go to https://vercel.com and sign in with GitHub
   2. Click "Add New Project"
   3. Import your GitHub repository
   4. Add the following environment variables:
      - `VITE_SUPABASE_URL`
      - `VITE_SUPABASE_ANON_KEY`
      - `ANTHROPIC_API_KEY`
      - `TWITTER_BEARER_TOKEN`
   5. Click "Deploy"

3. Set up Supabase:
   1. Create a new project at https://supabase.com
   2. Go to Project Settings > Database
   3. Copy your database connection info:
      - Project URL → `VITE_SUPABASE_URL`
      - Project API keys > anon/public → `VITE_SUPABASE_ANON_KEY`
   4. Go to the SQL editor and run the following migration:
   ```sql
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
   ```

## Future Enhancements

1. Additional AI API integrations
2. Audio file transcription support
3. Advanced tweet scheduling capabilities
4. Enhanced content management features
5. Support for more output formats