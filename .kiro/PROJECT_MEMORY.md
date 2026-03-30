# RAG Customs - Project Memory & Context

## Project Overview

**Original Name**: RAG School  
**New Name**: RAG Customs  
**Type**: Multi-profile RAG (Retrieval-Augmented Generation) system  
**Purpose**: Private system for you, your brother, and 4 friends to query different knowledge bases

## Core Concept Transformation

### From RAG School (Single Profile)
- Single RAG for school-related queries
- Public training page
- Single vector store table
- No user management

### To RAG Customs (Multi-Profile)
- Multiple independent RAG profiles (School, Civil, UBA, etc.)
- Centralized training (admin only, local with n8n)
- Distributed access (users query with their own API keys)
- User authentication with Firebase
- Optional chat history storage

## Technology Stack

- **Frontend**: Next.js 14.2.35, React 18.2.0, TypeScript 6.0.2
- **Styling**: Tailwind CSS 4.2.2
- **Database**: Supabase (PostgreSQL with pgvector)
- **Auth**: Firebase Authentication (planned)
- **Chat Storage**: Firebase Realtime Database (planned)
- **Embeddings**: Google Gemini (user-provided API keys)
- **LLM**: Groq (user-provided API keys)
- **Training**: n8n (local workflow automation)
- **Deployment**: Vercel (query only), Local (training)

## Working Methodology

### Commit Strategy
**CRITICAL**: We work in small, modular commits. Each logical change = one commit.

**Pattern**:
1. Make a specific change (e.g., "add scroll to textarea")
2. `git add -A`
3. `git commit -m "descriptive message"`
4. Move to next change
5. Repeat

**Commit Message Format**:
- `feat:` - New feature
- `fix:` - Bug fix
- `style:` - UI/styling changes
- `refactor:` - Code restructuring
- `docs:` - Documentation

**Examples from this session**:
- `fix: disable PDF processing in Next.js, add n8n workflow button`
- `feat: create new minimal chat interface UI`
- `style: add textarea scroll and custom select arrows`
- `fix: reset textarea height after sending message`

### Development Flow
1. User describes what they want
2. I implement the change
3. Commit immediately
4. User reviews
5. If adjustments needed, make them and commit again
6. Move to next feature

**Never**: Bundle multiple unrelated changes in one commit  
**Always**: Keep commits atomic and descriptive

## What We Accomplished Today

### Session Summary
Transformed RAG School into RAG Customs with a modern, minimal UI inspired by Claude/ChatGPT.

### Major Changes

#### 1. UI Complete Redesign
**Commits**: 
- `feat: create new minimal chat interface UI`
- `refactor: redesign UI with minimal Claude-style interface`
- `fix: correct UI styling, add auth modal, move chunk selector`

**What we did**:
- Deleted old `rag-shell.tsx` component
- Created new `chat-interface.tsx` with minimal design
- Centered initial view with large "RAG Custom" title
- Chat-style interface with messages
- Compact sidebar with expand/collapse

#### 2. PDF Processing Fix
**Commits**:
- `fix: disable PDF processing in Next.js, add n8n workflow button`

**Problem**: `pdf-parse` doesn't work in Next.js/Vercel edge runtime  
**Solution**: 
- Disabled PDF processing in Next.js code
- Added "Workflow n8n" button for PDF training
- PDFs now processed via local n8n workflow at `http://localhost:5678/webhook/entrenar`

#### 3. Input Design Iterations
**Commits**:
- `style: add textarea scroll and custom select arrows`
- `style: add custom arrows to selects and improve textarea scroll`
- `style: redesign chat input with inline selects and compact layout`
- `style: align initial input with chat input layout`
- `fix: correct input layout with textarea on top and add rotating placeholders`

**Final Design**:
- Textarea on top (full width)
- Selects (RAG + Chunks) and Send button on bottom row
- Custom SVG arrows for selects (no native browser arrows)
- Compact, minimal styling
- Rotating placeholders: "Escribe tu consulta...", "¿Qué necesitas saber?", etc.
- Auto-expanding textarea (1-6 lines with scroll)
- Textarea resets height after sending message

#### 4. Mobile Responsive Design
**Commits**:
- `feat: add mobile responsive design and move account button to sidebar`

**Changes**:
- Sidebar text shortens on mobile: "Ocultar barra lateral" → "Ocultar"
- Input layout works on mobile and desktop (same structure)
- Account button moved to sidebar bottom with purple background
- Person icon in compact mode

#### 5. Sidebar Improvements
**Commits**:
- `fix: redesign sidebar with full-width buttons and labels`

**Changes**:
- Full-width buttons (easier to click)
- Icons stay in same position when expanded
- Text appears next to icons: "Ocultar barra lateral", "Nuevo chat"
- Account button at bottom with purple bg (#5b4cff)

#### 6. Header & Button Adjustments
**Commits**:
- `fix: adjust header height and account button size`

**Changes**:
- Fixed header height: `h-14`
- Smaller button text: `text-xs`
- Account button moved from header to sidebar

#### 7. Select Dropdown Styling
**Commits**:
- `fix: add dark theme styles to select dropdown options`

**Changes**:
- Dark background for dropdown options
- Proper hover states
- Consistent with app theme

#### 8. Requirements Spec Created
**Commits**:
- `docs: update requirements for RAG Customs multi-profile system`

**File**: `.kiro/specs/rag-customs-multi-profile/requirements.md`

**12 Requirements Defined**:
1. Multi-Profile Vector Store Architecture
2. Simple Email Authentication
3. User-Provided API Key Management
4. Modern Chat Interface with Profile Selection
5. Admin-Only Training System (Separate Environment)
6. Query System with Profile Isolation
7. Chat History Sidebar with Storage Management
8. Database Schema Migration
9. Deployment Architecture
10. Profile Metrics and Monitoring
11. Security and Access Control
12. Profile Configuration Parser

## Current File Structure

```
rag-school/
├── .kiro/
│   ├── specs/
│   │   └── rag-customs-multi-profile/
│   │       ├── .config.kiro
│   │       └── requirements.md
│   └── PROJECT_MEMORY.md (this file)
├── app/
│   ├── api/
│   │   ├── health/
│   │   ├── keepalive/
│   │   ├── query/
│   │   └── train/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── chat-interface.tsx (NEW - main UI component)
├── lib/
│   ├── server/
│   │   ├── chunking.ts
│   │   ├── config.ts
│   │   ├── embeddings.ts
│   │   ├── ingestion.ts (PDF disabled)
│   │   ├── llm.ts
│   │   ├── multimodal.ts
│   │   ├── office.ts
│   │   ├── pdf.ts (not used in production)
│   │   └── supabase.ts
│   └── shared/
│       ├── llm.ts
│       └── types.ts
├── supabase/
│   └── schema.sql
├── package.json
└── next.config.mjs
```

## Key Design Decisions

### 1. Two Separate Environments
**Public (Vercel)**:
- Query interface only
- No training capabilities
- Users query with their own API keys

**Admin (Local)**:
- Training interface
- n8n workflow integration
- Full control over knowledge bases
- Run with: `npm run train` (to be implemented)

### 2. n8n for PDF Processing
- Next.js can't handle `pdf-parse` in production
- n8n runs locally in Docker
- Webhook endpoint: `http://localhost:5678/webhook/entrenar`
- Supports: PDF, text, images, audio, video, PPTX, CSV, Excel

### 3. User-Provided API Keys
- Each user provides their own Groq + Gemini API keys
- Stored encrypted in Supabase
- No shared API costs
- Admin manages training, users manage their own inference costs

### 4. Multi-Profile Architecture
- Each profile = separate vector store table in Supabase
- Examples: `documents_school`, `documents_civil`, `documents_uba`
- Profile metadata stored in `profiles` table
- Users select profile from dropdown

### 5. Optional Chat History
- Firebase Realtime Database
- 100MB limit per user
- Users can save/load conversations
- Not required for basic usage

## UI Design Philosophy

### Inspiration
- Claude.ai interface
- ChatGPT interface
- Minimal, clean, professional

### Color Palette
- Background: `#0a0a0f`
- Panels: `#111118`
- Borders: `#2a2a3a`, `#1f1f23`
- Text: `#ececf7` (primary), `#8e8ea9` (secondary), `#55556f` (tertiary)
- Accent: `#5b4cff` (purple)
- Success: `#00e5b0` (green)
- Error: `#ff4c6b` (red)

### Typography
- Font: Monospace (var(--font-mono))
- Headers: Sans-serif for "RAG Custom" title
- Sizes: Small (text-xs), Normal (text-sm), Large (text-lg, text-5xl)

### Layout Principles
- Minimal borders, subtle shadows
- Rounded corners (rounded-lg, rounded-2xl)
- Compact spacing
- Full-width clickable areas for buttons
- Responsive: mobile-first, then desktop

## What Still Needs to Be Done

### 1. Database Schema Migration
**Priority**: HIGH

**Tasks**:
- [ ] Create `profiles` table in Supabase
  - Columns: id, name, description, table_name, created_at
- [ ] Create `users` table in Supabase
  - Columns: id, firebase_uid, email, groq_api_key_encrypted, gemini_api_key_encrypted, created_at
- [ ] Create separate vector store tables per profile
  - `documents_school`, `documents_civil`, etc.
  - Same structure as current `documents` table
- [ ] Create match functions for each profile table
- [ ] Migrate existing data to default profile

**Files to modify**:
- `supabase/schema.sql`
- `lib/server/supabase.ts`

### 2. Firebase Integration
**Priority**: HIGH

**Tasks**:
- [ ] Set up Firebase project
- [ ] Install Firebase SDK: `npm install firebase`
- [ ] Configure Firebase Authentication
- [ ] Create auth modal functionality (already has UI)
- [ ] Set up Firebase Realtime Database for chat history
- [ ] Implement 100MB storage limit per user
- [ ] Create chat save/load functionality

**Files to create/modify**:
- `lib/firebase/config.ts` (new)
- `lib/firebase/auth.ts` (new)
- `lib/firebase/database.ts` (new)
- `components/chat-interface.tsx` (connect auth)

### 3. Profile Management System
**Priority**: HIGH

**Tasks**:
- [ ] Load profiles from database
- [ ] Populate profile selector dropdown
- [ ] Store selected profile in state/localStorage
- [ ] Filter queries by selected profile
- [ ] Create profile configuration JSON
- [ ] Profile metrics per profile

**Files to modify**:
- `components/chat-interface.tsx`
- `app/api/query/route.ts`
- `lib/server/supabase.ts`

### 4. API Key Management
**Priority**: MEDIUM

**Tasks**:
- [ ] Create API key input form in account modal
- [ ] Encrypt API keys before storing
- [ ] Store in Supabase users table
- [ ] Retrieve user's API keys for queries
- [ ] Use user's keys instead of env variables
- [ ] Validate API key format

**Files to create/modify**:
- `lib/server/encryption.ts` (new)
- `app/api/user/keys/route.ts` (new)
- `components/chat-interface.tsx` (account modal)

### 5. Chat History Sidebar
**Priority**: MEDIUM

**Tasks**:
- [ ] Connect to Firebase Realtime Database
- [ ] Load user's saved chats
- [ ] Display chat list with size and delete button
- [ ] Implement save chat functionality
- [ ] Implement load chat functionality
- [ ] Implement delete chat functionality
- [ ] Show storage usage indicator
- [ ] Enforce 100MB limit

**Files to modify**:
- `components/chat-interface.tsx`
- `lib/firebase/database.ts`

### 6. Message Display Improvements
**Priority**: MEDIUM

**Tasks**:
- [ ] Add markdown rendering for messages (already has ReactMarkdown)
- [ ] Add LaTeX support (KaTeX or MathJax)
- [ ] Add syntax highlighting for code blocks
- [ ] Move user messages to the right
- [ ] Move assistant messages to the left
- [ ] Highlight user messages differently
- [ ] Add copy button to code blocks
- [ ] Add message timestamps

**Files to modify**:
- `components/chat-interface.tsx`
- Install: `npm install katex react-katex` or `npm install react-syntax-highlighter`

### 7. Training System Separation
**Priority**: MEDIUM

**Tasks**:
- [ ] Create separate training UI (reuse components)
- [ ] Add `npm run train` script to package.json
- [ ] Create training-specific routes
- [ ] Keep training UI local-only
- [ ] Document how to run training locally
- [ ] Ensure training doesn't deploy to Vercel

**Files to create**:
- `app/admin/page.tsx` (new)
- `app/admin/layout.tsx` (new)
- `scripts/train-server.mjs` (new)

**Files to modify**:
- `package.json` (add train script)
- `next.config.mjs` (exclude admin from production)

### 8. n8n Workflow Redesign
**Priority**: MEDIUM

**Tasks**:
- [ ] Document current n8n workflow
- [ ] Add n8n workflow JSON to repo
- [ ] Redesign workflow for multi-profile support
- [ ] Add profile_id parameter to webhook
- [ ] Handle rate limiting (RPM/RPD)
- [ ] Add batch processing for multiple PDFs
- [ ] Add error handling and retries
- [ ] Document setup instructions

**Files to create**:
- `n8n/workflows/train-profile.json` (new)
- `n8n/README.md` (new)

### 9. Query API Updates
**Priority**: HIGH

**Tasks**:
- [ ] Accept profile_id parameter
- [ ] Query correct vector store table
- [ ] Use user's API keys from database
- [ ] Return profile-specific results
- [ ] Add error handling for missing profile
- [ ] Add error handling for invalid API keys

**Files to modify**:
- `app/api/query/route.ts`
- `lib/server/supabase.ts`
- `lib/server/embeddings.ts`
- `lib/server/llm.ts`

### 10. Metrics System
**Priority**: LOW

**Tasks**:
- [ ] Update metrics to be profile-specific
- [ ] Show metrics for selected profile only
- [ ] Add profile selector to metrics view
- [ ] Update export functionality per profile

**Files to modify**:
- `app/api/train/metrics/route.ts`
- `app/api/train/export/route.ts`
- `components/chat-interface.tsx`

### 11. Environment Variables
**Priority**: HIGH

**Tasks**:
- [ ] Document required env variables
- [ ] Update .env.example
- [ ] Add Firebase config variables
- [ ] Remove hardcoded API keys (use user's keys)
- [ ] Set up Vercel environment variables

**Files to modify**:
- `.env.example`
- `README.md` (when we update it)

### 12. Testing & Validation
**Priority**: LOW

**Tasks**:
- [ ] Test multi-profile queries
- [ ] Test user authentication flow
- [ ] Test API key management
- [ ] Test chat history save/load
- [ ] Test mobile responsive design
- [ ] Test n8n workflow integration
- [ ] Test rate limiting
- [ ] Test storage limits

### 13. Documentation
**Priority**: LOW (do at the end)

**Tasks**:
- [ ] Update README.md (English)
- [ ] Update README.es.md (Spanish)
- [ ] Document architecture
- [ ] Document deployment process
- [ ] Document n8n setup
- [ ] Document Firebase setup
- [ ] Document Supabase schema
- [ ] Add screenshots

## Important Notes

### PDF Processing
- **DO NOT** try to fix PDF processing in Next.js
- It doesn't work in Vercel/edge runtime
- Always use n8n for PDFs
- This is a known limitation, not a bug

### Commit Discipline
- Small commits are CRITICAL
- Each commit should do ONE thing
- Commit messages should be descriptive
- Never bundle unrelated changes

### Code Style
- Use TypeScript strictly
- Prefer functional components
- Use Tailwind for all styling
- Keep components small and focused
- Extract reusable logic to lib/

### Testing Approach
- Test locally first
- Use `npm run dev` for development
- Use `npm run clean` to clear cache when needed
- Test mobile with browser dev tools

## How to Continue When You Return

### Step 1: Review Context
1. Read this file completely
2. Check recent commits: `git log --oneline -20`
3. Review current branch: `git status`

### Step 2: Prioritize Tasks
Ask me: "What should we work on next?"

I'll review the pending tasks and suggest:
- High priority items first
- Logical order (e.g., database before API)
- Dependencies between tasks

### Step 3: Work in Small Iterations
1. Pick ONE task from the list
2. Implement it
3. Commit immediately
4. Test it
5. Move to next task

### Step 4: Update This File
As we complete tasks:
- Mark them as done: `- [x] Task completed`
- Add new tasks if discovered
- Update notes with important decisions

## Quick Reference Commands

### Development
```bash
npm run dev          # Start development server
npm run clean        # Clear Next.js cache
npm run build        # Build for production
npm start            # Start production server
```

### Git
```bash
git status           # Check current state
git add -A           # Stage all changes
git commit -m "msg"  # Commit with message
git log --oneline    # View recent commits
git push             # Push to remote
```

### Docker (for n8n)
```bash
docker start n8n     # Start n8n container
docker stop n8n      # Stop n8n container
```

## Current State Summary

**UI**: ✅ Complete and professional  
**Backend**: ⚠️ Needs multi-profile support  
**Database**: ❌ Needs schema migration  
**Auth**: ❌ Not implemented  
**Chat History**: ❌ Not implemented  
**Training**: ⚠️ Works but needs separation  
**n8n**: ⚠️ Works but needs redesign  

**Next Critical Steps**:
1. Database schema migration
2. Firebase setup
3. Profile management
4. API key management

---

**Last Updated**: Session ending (transformation from RAG School to RAG Customs UI complete)  
**Status**: Ready for next session - UI foundation solid, backend work needed
