# Plan: YouTube Content Integration (Services & Podcasts)

Implement a visual and functional integration of Sunday Services (Live Streams) and Sunday Morning Bible Studies (Podcasts) from the @BatistaAtos YouTube channel.

## User Review Required

> [!IMPORTANT]
> To fetch this data automatically, we should ideally use the YouTube Data API. If we don't have an API key, I will implement a modern "Manual Link" system for administrators to easily paste the current Sunday's links, ensuring the most accurate experience.

- **Sunday Services Link**: https://www.youtube.com/@BatistaAtos/streams
- **Bible Studies (Mesacast)**: https://www.youtube.com/@BatistaAtos/podcasts

## Proposed Changes

### Backend & Logic

- **New Server Functions**:
  - `getYoutubeContent`: Fetch the latest videos from both specific channel sections (streams and podcasts).
  - `syncYoutubeVideos`: (Admin only) A manual trigger to refresh the cache.
- **Database Schema**:
  - Create `youtube_videos` table to store metadata (ID, title, thumbnail, type: 'service' | 'podcast', published_at).
  - Add RLS and grants.

### UI Components

- **Media Hub Refinement (`src/routes/_authenticated/midia.tsx`)**:
  - Add "Cultos de Domingo" and "Estudos Bíblicos (Mesacast)" as primary categories.
  - Create a `YoutubeVideoCard` component with a modern "Neo-Tech" look.
- **Dashboard Integration**:
  - Update the "Live" section to show the latest recorded service or current live stream.
  - Add a dedicated section for "Último Estudo Bíblico" to encourage engagement.

### Automation & AI

- **Sermon AI Enhancement**:
  - Integrate the existing AI Summarization tool to automatically process these new videos when they are synced, generating summaries for members.

## Technical Details

- **Supabase Integration**:
  - `CREATE TABLE public.youtube_videos (...)`
  - Columns: `id (uuid)`, `youtube_id (text)`, `title (text)`, `thumbnail_url (text)`, `type (text)`, `url (text)`, `published_at (timestamptz)`.
- **API Fetching**:
  - Use `fetch` on the server-side to call YouTube Data API (v3) or a fallback scraper logic if keys aren't provided initially.
- **Framer Motion**:
  - Staggered entry animations for video cards.
  - Hover effects with 3D depth matching the new "Neo-Tech Radical" aesthetic.
