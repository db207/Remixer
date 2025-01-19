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

Create two environment files:

1. Frontend environment (`.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_backend_url # Only needed in production
```

2. Backend environment (`.env` in root directory):
```env
ANTHROPIC_API_KEY=your_claude_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
PORT=3001 # Optional, defaults to 3001
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

This will start both the Vite development server and the Express backend server.

## Deployment

### Frontend (Vercel)

1. Fork/push this repository to GitHub
2. Connect your repository to Vercel
3. Add the following environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (your backend URL once deployed)

### Backend (Railway)

1. Create a new project in Railway
2. Connect your GitHub repository
3. Add the following environment variables:
   - `ANTHROPIC_API_KEY`
   - `TWITTER_BEARER_TOKEN`
4. Railway will automatically detect the Express server and deploy it
5. Copy the generated Railway URL and set it as `VITE_API_URL` in your Vercel frontend deployment

## Future Enhancements

1. Additional AI API integrations
2. Audio file transcription support
3. Advanced tweet scheduling capabilities
4. Enhanced content management features
5. Support for more output formats