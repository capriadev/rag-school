# Requirements Document

## Introduction

RAG Customs is a multi-profile RAG (Retrieval-Augmented Generation) platform that transforms the single-profile RAG School system into a multi-tenant architecture supporting independent knowledge bases (School, Civil, UBA, etc.). The system enables centralized training by administrators while allowing distributed access where users query with their own API keys. This is a private, non-commercial system designed for a small group of users (6 total).

## Glossary

- **RAG_Customs**: The multi-profile RAG platform system
- **Profile**: An independent knowledge base with its own vector store (e.g., School, Civil, UBA)
- **Vector_Store**: Supabase table containing embeddings and documents for a specific profile
- **Admin**: User with local access who performs training operations via n8n
- **End_User**: Authenticated user who queries profiles using their own API keys
- **Firebase_Auth**: Firebase Authentication service for user management
- **Supabase**: PostgreSQL database with pgvector extension for vector storage
- **n8n**: Local workflow automation tool used for training operations
- **API_Key**: User-provided Groq and Gemini API keys for LLM and embedding operations
- **Chat_History**: Optional Firebase Realtime Database storage for user conversations
- **Profile_Selector**: UI component allowing users to choose which profile to query

## Requirements

### Requirement 1: Multi-Profile Vector Store Architecture

**User Story:** As an admin, I want to support multiple independent RAG profiles, so that different knowledge domains can be isolated and managed separately.

#### Acceptance Criteria

1. THE Vector_Store SHALL support multiple profiles with isolated data storage
2. WHEN a profile is created, THE RAG_Customs SHALL create a dedicated vector store table in Supabase
3. THE Profile_Metadata_Table SHALL store profile information including id, name, description, and table_name
4. WHEN querying, THE RAG_Customs SHALL retrieve documents only from the selected profile's vector store
5. THE RAG_Customs SHALL maintain the existing 3072-dimension embedding structure for each profile

### Requirement 2: Simple Email Authentication

**User Story:** As an end user, I want to authenticate with just my email, so that I can quickly access the RAG system without complex registration.

#### Acceptance Criteria

1. WHEN a user clicks "Cuenta", THE RAG_Customs SHALL display a modal with email input and "Entrar" button
2. WHEN a user enters an email and clicks "Entrar", THE RAG_Customs SHALL authenticate via Firebase
3. IF the email is new, THE RAG_Customs SHALL create a user account automatically
4. WHEN authentication succeeds, THE RAG_Customs SHALL create a user record in Supabase with firebase_uid, email, and created_at
5. WHEN authentication succeeds, THE RAG_Customs SHALL show the chat history sidebar
6. WHEN authentication succeeds, THE Header SHALL replace "Cuenta" with "Guardar chat" and "Nuevo chat" buttons
7. THE RAG_Customs SHALL maintain user session state across page refreshes
8. THE RAG_Customs SHALL allow unauthenticated users to query without saving chat history

### Requirement 3: User-Provided API Key Management

**User Story:** As an end user, I want to provide my own Groq and Gemini API keys, so that I can use the system without sharing API costs with others.

#### Acceptance Criteria

1. THE RAG_Customs SHALL provide a settings section in the "Cuenta" modal for users to input Groq and Gemini API keys
2. WHEN API keys are provided, THE RAG_Customs SHALL store them securely in Supabase encrypted
3. WHEN a user queries, THE RAG_Customs SHALL use that user's API keys for embeddings and LLM operations
4. IF API keys are missing or invalid, THEN THE RAG_Customs SHALL return a descriptive error message
5. THE RAG_Customs SHALL validate API key format before storage
6. THE RAG_Customs SHALL allow users to update their API keys at any time

### Requirement 4: Modern Chat Interface with Profile Selection

**User Story:** As an end user, I want a modern chat-style interface with profile selection, so that I can easily query different knowledge bases.

#### Acceptance Criteria

1. THE RAG_Customs SHALL display a chat-style interface similar to modern AI assistants
2. THE Header SHALL display "RAG [Profile_Name]" with "Customs" subtitle (e.g., "RAG Civil" with "Customs" below)
3. THE Header SHALL include a profile selector dropdown that loads available profiles from the database
4. THE Header SHALL include a chunks selector dropdown with options (4, 8, 12, 16)
5. THE Header SHALL display "Cuenta" button when not authenticated, or "Guardar chat" and "Nuevo chat" buttons when authenticated
6. THE Main_Area SHALL display the conversation with query/response pairs
7. THE Input_Area SHALL use a textarea that auto-expands from 1 to 6 lines with scroll
8. THE Input_Area SHALL include a "Consultar" button to submit queries
9. WHEN a profile is selected, THE RAG_Customs SHALL persist the selection across sessions

### Requirement 5: Admin-Only Training System (Separate Environment)

**User Story:** As an admin, I want to train profiles locally using a separate training UI and n8n, so that I can control knowledge base updates without exposing training to end users.

#### Acceptance Criteria

1. THE RAG_Customs SHALL provide two separate runtime environments: public (query-only) and admin (training)
2. THE Admin_Environment SHALL run via `npm run train` command with separate backend routes
3. THE Public_Environment SHALL run via `npm run dev` or `npm start` with query-only backend routes
4. THE Admin SHALL train profiles through the local training UI connected to n8n workflows
5. WHEN training via n8n, THE RAG_Customs SHALL accept a profile_id parameter to target the correct vector store
6. THE n8n_Workflow SHALL support PDF processing as currently implemented
7. THE n8n_Workflow SHALL support text, images, audio, video, PPTX, CSV, and Excel files
8. WHEN training completes, THE RAG_Customs SHALL return inserted chunk count and success status
9. THE Training_UI SHALL reuse the same styles and components as the public UI

### Requirement 6: Query System with Profile Isolation

**User Story:** As an end user, I want to query my selected profile using my API keys, so that I can retrieve relevant information from the specific knowledge base.

#### Acceptance Criteria

1. WHEN a user submits a query, THE RAG_Customs SHALL generate embeddings using the user's Gemini API key
2. THE RAG_Customs SHALL retrieve documents only from the selected profile's vector store
3. THE RAG_Customs SHALL generate responses using the user's Groq API key
4. THE RAG_Customs SHALL return matched documents with similarity scores
5. THE RAG_Customs SHALL maintain the existing chunk count selection (4, 8, 12, 16 options)
6. IF the selected profile has no documents, THEN THE RAG_Customs SHALL return an informative message

### Requirement 7: Chat History Sidebar with Storage Management

**User Story:** As an authenticated user, I want to view, manage, and save my chat conversations in a sidebar, so that I can reference previous queries and manage my storage.

#### Acceptance Criteria

1. WHEN a user is authenticated, THE RAG_Customs SHALL display a left sidebar with chat history
2. THE Sidebar SHALL list saved chats with format: "#[chat_number] [size_kb] [delete_icon]"
3. WHEN a user clicks a chat item, THE RAG_Customs SHALL allow renaming the chat (default: chat ID)
4. THE Sidebar SHALL display each chat's size in KB or MB
5. THE Sidebar SHALL include a delete icon for each chat that removes it from Firebase
6. THE Sidebar_Footer SHALL display "Storage [used] / 100 MB" to show current usage
7. THE RAG_Customs SHALL store conversations in Firebase Realtime Database
8. THE RAG_Customs SHALL enforce a 100MB storage limit per user
9. WHEN a user clicks "Guardar chat", THE RAG_Customs SHALL save the current conversation
10. WHEN a user clicks "Nuevo chat", THE RAG_Customs SHALL clear the current conversation
11. IF storage limit is exceeded, THEN THE RAG_Customs SHALL notify the user and prevent new saves
12. WHEN not authenticated, THE Sidebar SHALL be hidden

### Requirement 8: Database Schema Migration

**User Story:** As an admin, I want to migrate the existing single-table schema to a multi-profile architecture, so that the system supports isolated knowledge bases.

#### Acceptance Criteria

1. THE RAG_Customs SHALL create a profiles table with columns: id, name, description, table_name, created_at
2. THE RAG_Customs SHALL create a users table with columns: id, firebase_uid, username, groq_api_key, gemini_api_key, created_at
3. WHEN a new profile is created, THE RAG_Customs SHALL generate a unique table name (e.g., documents_school, documents_civil)
4. THE RAG_Customs SHALL create vector store tables with the same structure as the existing documents table
5. THE RAG_Customs SHALL create a match function for each profile's vector store
6. THE RAG_Customs SHALL migrate existing documents table data to a default profile (e.g., "School")

### Requirement 9: Deployment Architecture

**User Story:** As an admin, I want to deploy the query interface on Vercel while keeping training local, so that end users can access the system remotely while I control training.

#### Acceptance Criteria

1. THE RAG_Customs SHALL deploy the web application to Vercel with query-only functionality
2. THE RAG_Customs SHALL configure environment variables in Vercel for Supabase and Firebase credentials
3. THE Admin SHALL run n8n locally for training operations
4. THE RAG_Customs SHALL not expose any training endpoints in the deployed Vercel application
5. THE RAG_Customs SHALL maintain current performance targets: 4-6s dev startup, 0.5-0.7s first load, 0.1-0.2s subsequent loads

### Requirement 10: Profile Metrics and Monitoring

**User Story:** As an end user, I want to view metrics for my selected profile, so that I can understand the knowledge base size and content.

#### Acceptance Criteria

1. WHEN a profile is selected, THE RAG_Customs SHALL display estimated storage size in MB
2. THE RAG_Customs SHALL display total chunk count for the selected profile
3. THE RAG_Customs SHALL display unique source count for the selected profile
4. THE RAG_Customs SHALL display source type breakdown (text, pdf, image, etc.)
5. THE RAG_Customs SHALL update metrics after each training operation

### Requirement 11: Security and Access Control

**User Story:** As an admin, I want to ensure user data and API keys are secure, so that the system protects sensitive information.

#### Acceptance Criteria

1. THE RAG_Customs SHALL encrypt API keys before storing in Supabase
2. THE RAG_Customs SHALL use HTTPS for all client-server communication
3. THE RAG_Customs SHALL validate Firebase authentication tokens on each API request
4. THE RAG_Customs SHALL implement row-level security in Supabase for user data isolation
5. IF an authentication token is invalid or expired, THEN THE RAG_Customs SHALL reject the request with a 401 error

### Requirement 12: Profile Configuration Parser

**User Story:** As an admin, I want to define profiles in a configuration file, so that I can easily add or modify profiles without code changes.

#### Acceptance Criteria

1. THE RAG_Customs SHALL read profile definitions from a JSON configuration file
2. THE Configuration_Parser SHALL validate profile structure including name, description, and table_name
3. WHEN the application starts, THE RAG_Customs SHALL load all profiles from the configuration
4. IF a profile's vector store table does not exist, THEN THE RAG_Customs SHALL log an error and skip that profile
5. THE Configuration_Parser SHALL support adding new profiles without application restart (via admin action)

