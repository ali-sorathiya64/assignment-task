# Joineazy --- Student, Group & Assignment Management System

A role-based full-stack web application for managing students, groups,
assignments, submission confirmations, progress tracking, and
assignment-focused AI assistance.

Built as a Full Stack Intern technical task for Joineazy.

------------------------------------------------------------------------

## Overview

Joineazy helps professors manage assignments and monitor student
submission progress while giving students a simple workspace to manage
groups, view assignments, access OneDrive submission links, confirm
submissions, and track progress.

The application supports two roles:

-   **Student**
    -   Register and log in
    -   Create and manage a group
    -   Add group members using student email or ID
    -   View assigned and global assignments
    -   Open OneDrive submission links
    -   Confirm assignment submission through a two-step UI flow
    -   Track assignment/group progress
    -   Ask an AI assistant questions about a specific assignment
    -   View enrolled courses and course assignments
    -   Ask an AI assistant questions about a course
-   **Admin / Professor**
    -   Log in with an admin account
    -   Create assignments
    -   Edit assignments
    -   Assign assignments to all students, groups, or individual
        students
    -   View students and groups
    -   Monitor student submission confirmations
    -   View assignment completion analytics

------------------------------------------------------------------------

## Round 2 Highlights

Round 2 extends the original functional prototype with course management,
improved UI/UX, individual and group submission workflows, professor/admin
course views, submission filters, and course-aware AI assistance.

### UI/UX
- Improved login and registration validation
- Loading, error, and disabled-submit feedback
- Enrolled course cards and responsive course grid
- Course detail page with assignment list
- Individual vs Group assignment indicators
- Group leader and non-leader submission states
- Submission success animation with automatic modal close
- Course and submission filters

### Backend
- Course creation and management
- Course-to-student enrollment
- Course-to-assignment relationships
- Individual and group submission types
- Explicit group leaders
- Group leader-only acknowledgement
- Group submission inheritance for all members
- Course-aware assignment listing
- Submission analytics and status filtering

### AI / RAG
- Separate Pinecone namespaces for assignments and courses
- Assignment-focused AI retrieval
- Course-focused AI retrieval
- Course AI chat endpoint
- Course indexing and reindexing utilities

------------------------------------------------------------------------

## Key Features

### Authentication & Authorization

-   JWT-based authentication
-   Separate Student and Admin roles
-   Protected API routes
-   Role-based access control
-   Password hashing with bcrypt
-   Frontend automatically attaches the JWT to API requests

### Student Group Management

-   Create a group
-   Automatically add the creator as a member
-   Add other students using email or student ID
-   View the student's groups and members

### Assignment Management

-   Create assignments with:
    -   Title
    -   Description
    -   Due date
    -   OneDrive submission link
    -   Global or targeted assignment setting
-   Edit existing assignments
-   Assign assignments to:
    -   All students
    -   Specific groups
    -   Individual students
-   Students only see assignments available to them

### Submission Confirmation

Students can confirm that an assignment has been submitted using a
two-step confirmation interface:

`Yes, I have submitted` → `Confirm`

The backend stores the confirmation state and timestamp.

### Course Management

-   Create courses with a unique course code
-   Enroll and remove students from courses
-   View courses taught by the current admin/professor
-   View courses enrolled by the current student
-   Open course details and course assignments

### Individual & Group Assignments

Assignments support both `individual` and `group` submission types.

For group assignments:
-   Only the group leader can confirm the submission
-   The confirmation is stored once for the group
-   All group members inherit the submitted status
-   Non-leaders cannot confirm the group assignment themselves

### Progress & Analytics

Admin users can view:

-   Total students assigned
-   Submitted students
-   Pending students
-   Student-wise confirmation status
-   Group information
-   Completion summaries

The frontend uses charts and summary cards for the analytics experience.

### Assignment AI Assistant

An optional AI/RAG enhancement is included for students.

Students can open **Ask AI** from an assignment and ask questions about
that assignment.

The AI pipeline uses:

-   LangChain
-   OpenRouter
-   OpenRouter embeddings
-   Pinecone
-   PostgreSQL assignment data

The assistant retrieves assignment-specific information before
generating an answer and is instructed not to invent assignment
requirements, deadlines, submission links, or instructions.

New and edited assignments are automatically indexed into Pinecone after
the database operation.

------------------------------------------------------------------------

## Technology Stack

### Frontend

-   React 19
-   Vite
-   Tailwind CSS
-   React Router
-   Axios
-   Recharts

### Backend

-   Node.js
-   Express 5
-   JavaScript ES Modules
-   PostgreSQL
-   `pg`
-   JWT
-   bcrypt
-   Swagger / OpenAPI

### AI / RAG

-   LangChain
-   OpenRouter
-   Pinecone
-   Vector embeddings

### Deployment / Infrastructure

-   Docker
-   Docker Compose
-   Neon PostgreSQL
-   Vercel
-   Render

------------------------------------------------------------------------

## Architecture

``` text
                         ┌─────────────────────┐
                         │     React Client    │
                         │ React + Tailwind    │
                         │ React Router        │
                         └──────────┬──────────┘
                                    │
                             REST API + JWT
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Express Backend   │
                         │                     │
                         │ Controllers         │
                         │ Routes              │
                         │ JWT Middleware      │
                         │ Role Middleware     │
                         └───────┬───────┬─────┘
                                 │       │
                      SQL queries │       │ AI requests
                                 │       │
                                 ▼       ▼
                    ┌────────────────┐  ┌──────────────────┐
                    │  PostgreSQL    │  │ LangChain / RAG  │
                    │                │  └────────┬─────────┘
                    │ Users          │           │
                    │ Groups         │           ▼
                    │ Assignments    │  ┌──────────────────┐
                    │ Submissions    │  │     Pinecone     │
                    └────────────────┘  │ Vector Search    │
                                        └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │    OpenRouter    │
                                        │      LLM         │
                                        └──────────────────┘
```

------------------------------------------------------------------------

## AI / RAG Flow

When an assignment is created or edited:

``` text
Admin creates/updates assignment
              │
              ▼
        PostgreSQL
              │
              ▼
     indexAssignment()
              │
              ▼
     Generate embedding
              │
              ▼
          Pinecone
```

When a student asks a question:

``` text
Student question
       │
       ▼
POST /api/ai/chat/:assignmentId
       │
       ▼
Generate question embedding
       │
       ▼
Pinecone similarity search
       │
       │ assignmentId filter
       ▼
Relevant assignment context
       │
       ▼
OpenRouter LLM
       │
       ▼
Answer + source information
```

This keeps the AI response focused on the selected assignment instead of
allowing the model to freely answer from unrelated information.

------------------------------------------------------------------------

## Project Structure

``` text
joineazy-task/
│
├── backend/
│   ├── src/
│   │   ├── ai/
│   │   │   ├── embeddings.js
│   │   │   ├── indexAssignment.js
│   │   │   ├── indexCourse.js
│   │   │   ├── ingest.js
│   │   │   ├── rag.js
│   │   │   ├── reindex.js
│   │   │   └── vectorStore.js
│   │   │
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   └── swagger.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── ai.controller.js
│   │   │   ├── analytics.controller.js
│   │   │   ├── assignment.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── course.controller.js
│   │   │   ├── group.controller.js
│   │   │   ├── submission.controller.js
│   │   │   └── user.controller.js
│   │   │
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   │   ├── add-global-assignment.sql
│   │   │   │   └── round2-courses-groups.sql
│   │   │   ├── connection.js
│   │   │   └── schema.sql
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── role.middleware.js
│   │   │
│   │   ├── routes/
│   │   │   ├── ai.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   ├── assignment.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── course.routes.js
│   │   │   ├── group.routes.js
│   │   │   ├── submission.routes.js
│   │   │   └── user.routes.js
│   │   │
│   │   ├── utils/
│   │   │   └── jwt.js
│   │   │
│   │   └── server.js
│   │
│   ├── Dockerfile
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── endpoints.js
│   │   │   └── format.js
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useStudentAssignments.js
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── student/
│   │   │       ├── AskAIModal.jsx
│   │   │       ├── AskCourseAIModal.jsx
│   │   │       ├── AssignmentCard.jsx
│   │   │       ├── CourseDetail.jsx
│   │   │       ├── ConfirmSubmissionModal.jsx
│   │   │       ├── StudentAssignments.jsx
│   │   │       ├── StudentDashboard.jsx
│   │   │       └── StudentGroups.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── Dockerfile
│   ├── package.json
│   └── .env
│
└── docker-compose.yml
```

------------------------------------------------------------------------

## Database Design

The PostgreSQL database contains the following main entities:

``` text
users
  │
  ├────────────── groups.created_by
  │
  ├────────────── group_members.user_id
  │
  ├────────────── assignment_students.student_id
  │
  └────────────── submissions.student_id

groups
  │
  ├────────────── group_members.group_id
  │
  ├────────────── assignment_groups.group_id
  │
  └────────────── submissions.group_id

assignments
  │
  ├────────────── assignment_groups.assignment_id
  ├────────────── assignment_students.assignment_id
  └────────────── submissions.assignment_id
```

### Main Tables

  Table                   Purpose
  ----------------------- ----------------------------------------------------
  `users`                 Stores students and admins
  `groups`                Stores student groups
  `group_members`         Many-to-many relationship between groups and users
  `assignments`           Stores assignment details
  `assignment_groups`     Assigns assignments to groups
  `assignment_students`   Assigns assignments directly to students
  `submissions`           Stores student submission confirmations

The schema uses foreign keys, unique constraints, and indexes for the
main relationship columns.

------------------------------------------------------------------------

## Round 2 Database Changes

The Round 2 migration adds the course and group-submission structure:

- `courses` — course name, unique code, description, professor/admin
- `course_students` — student enrollment with a unique course/student pair
- `assignments.course_id` — optional course relationship
- `assignments.submission_type` — `individual` or `group`
- `groups.leader_id` — explicit group leader
- `submissions.confirmed_by` — user who confirmed the submission

For group assignments, the leader's confirmation is inherited by the other
members instead of requiring a separate confirmation action for each member.

------------------------------------------------------------------------

## API Documentation

Swagger/OpenAPI documentation is available when the backend is running:

``` text
http://localhost:8000/api-docs
```

### Authentication

  Method   Endpoint               Access
  -------- ---------------------- ---------------
  POST     `/api/auth/register`   Public
  POST     `/api/auth/login`      Public
  GET      `/api/auth/me`         Authenticated

### Users

  Method   Endpoint                Access
  -------- ----------------------- --------
  GET      `/api/users/students`   Admin

### Groups

  Method   Endpoint                         Access
  -------- -------------------------------- ---------
  POST     `/api/groups`                    Student
  GET      `/api/groups`                    Student
  GET      `/api/groups/all`                Admin
  POST     `/api/groups/:groupId/members`   Student

### Courses

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/courses` | Admin |
| GET | `/api/courses` | Admin |
| GET | `/api/courses/my` | Student |
| GET | `/api/courses/:courseId` | Authenticated |
| PUT | `/api/courses/:courseId` | Admin |
| POST | `/api/courses/:courseId/students` | Admin |
| DELETE | `/api/courses/:courseId/students/:studentId` | Admin |

### Assignments

  Method   Endpoint                                    Access
  -------- ------------------------------------------- ---------------
  GET      `/api/assignments`                          Authenticated
  POST     `/api/assignments`                          Admin
  PUT      `/api/assignments/:assignmentId`            Admin
  POST     `/api/assignments/:assignmentId/groups`     Admin
  POST     `/api/assignments/:assignmentId/students`   Admin

### Submissions

  Method   Endpoint                                   Access
  -------- ------------------------------------------ ---------
  POST     `/api/submissions/:assignmentId/confirm`   Student
  GET      `/api/submissions/:assignmentId/status`    Student

### Analytics

  Method   Endpoint                                     Access
  -------- -------------------------------------------- --------
  GET      `/api/analytics/assignments/:assignmentId`   Admin

### AI

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/ai/chat/:assignmentId` | Student |
| POST | `/api/ai/chat/course/:courseId` | Student |

Example AI request:

``` http
POST /api/ai/chat/1
Authorization: Bearer <JWT>
Content-Type: application/json
```

``` json
{
  "question": "What do I need to submit for this assignment?"
}
```

Example response:

``` json
{
  "success": true,
  "answer": "You need to submit the completed work described in the assignment.",
  "sources": [
    {
      "assignmentId": 1,
      "title": "Database Assignment"
    }
  ]
}
```

------------------------------------------------------------------------

## Local Development Setup

### Prerequisites

Make sure the following are installed:

-   Node.js 22+
-   npm
-   PostgreSQL database or Neon PostgreSQL
-   Git

For the optional AI feature:

-   OpenRouter API key
-   Pinecone API key
-   Pinecone index

------------------------------------------------------------------------

### 1. Clone the repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd joineazy-task
```

------------------------------------------------------------------------

### 2. Backend setup

``` bash
cd backend
npm install
```

Create:

``` text
backend/.env
```

Example:

``` env
PORT=8000

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openrouter/free
OPENROUTER_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index
PINECONE_DIMENSION=384
```

Do not commit `.env` files or API keys to GitHub.

Run the backend:

``` bash
npm run dev
```

Backend:

``` text
http://localhost:8000
```

Swagger:

``` text
http://localhost:8000/api-docs
```

Health check:

``` text
http://localhost:8000/api/health
```

------------------------------------------------------------------------

### 3. Frontend setup

``` bash
cd ../frontend
npm install
```

Create:

``` text
frontend/.env
```

Example:

``` env
VITE_API_URL=http://localhost:8000
```

Run:

``` bash
npm run dev
```

Frontend:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

## Docker

The project includes separate Dockerfiles for the backend and frontend
and a root `docker-compose.yml`.

From the project root:

``` bash
docker compose build
```

Start the application:

``` bash
docker compose up
```

The expected local ports are:

``` text
Frontend  → http://localhost:5173
Backend   → http://localhost:8000
Swagger   → http://localhost:8000/api-docs
```

For deployment, environment variables should be supplied through the
deployment platform or environment configuration rather than committed
to the repository.

------------------------------------------------------------------------

## Environment Variables

### Backend

  Variable                       Purpose
  ------------------------------ ---------------------------
  `PORT`                         Express server port
  `DATABASE_URL`                 PostgreSQL connection
  `JWT_SECRET`                   JWT signing secret
  `JWT_EXPIRES_IN`               JWT expiration
  `OPENROUTER_API_KEY`           OpenRouter authentication
  `OPENROUTER_MODEL`             LLM model
  `OPENROUTER_EMBEDDING_MODEL`   Embedding model
  `PINECONE_API_KEY`             Pinecone authentication
  `PINECONE_INDEX_NAME`          Pinecone index
  `PINECONE_DIMENSION`           Embedding dimension

### Frontend

  Variable         Purpose
  ---------------- ----------------------
  `VITE_API_URL`   Backend API base URL

------------------------------------------------------------------------

## Security Considerations

-   Passwords are hashed using bcrypt before storage.
-   Authentication uses signed JWTs.
-   API routes use authentication middleware.
-   Admin and student permissions are enforced through role middleware.
-   Frontend API requests reuse the stored JWT rather than implementing
    a second authentication mechanism.
-   Secrets are supplied through environment variables.
-   AI responses are constrained to retrieved assignment information.
-   Assignment AI retrieval is filtered by the selected assignment ID.

------------------------------------------------------------------------

## Design Decisions

### PostgreSQL

PostgreSQL was selected because the application contains structured
relationships between users, groups, assignments, and submissions.
Foreign keys and unique constraints help maintain data consistency.

### JWT Authentication

JWT keeps authentication simple for a separate React frontend and
Express API while allowing role information to be included in the
authenticated request context.

### Modular Express Structure

Routes, controllers, middleware, database access, utilities, and AI
logic are separated so each part of the application has a clear
responsibility.

### Targeted Assignment Relationships

Assignments can be global, group-specific, or student-specific. Separate
relationship tables make these assignment rules explicit and keep the
core assignment table simple.

### Pinecone + RAG

The AI feature uses vector retrieval so the model receives relevant
assignment information instead of relying only on general model
knowledge.

### Automatic AI Indexing

Assignment creation and updates trigger indexing for that specific
assignment. This avoids requiring a full manual re-ingestion whenever a
professor creates or edits an assignment.

### Docker

Docker provides a consistent runtime environment for the frontend and
backend and makes the application easier to run across different
environments.

------------------------------------------------------------------------

## Screenshots

### Login
![Login](docs/screenshots/login.jpg)

### Register
![Register](docs/screenshots/register.jpg)

### Student Dashboard
![Student Dashboard](docs/screenshots/student_dashboard.jpg)

### Student Course
![Student Course](docs/screenshots/student-course-page.jpg)

### My Group
![My Group](docs/screenshots/my-group-owner.jpg)

### Assignment Submission
![Assignment Submission](docs/screenshots/confirm-submission.jpg)

### Pending Assignment
![Pending Assignment](docs/screenshots/assignment-pending.jpg)

### Ask AI - Assignment
![Ask AI - Assignment](docs/screenshots/ask-ai-assignment.jpg)

### Ask AI - Course
![Ask AI - Course](docs/screenshots/ask-ai-course.jpg)

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin_dashboard.jpg)

### Course Management
![Course Management](docs/screenshots/course-admin.jpg)

### Swagger API Documentation
![Swagger](docs/screenshots/swagger.jpg)

------------------------------------------------------------------------

## Round 2 Screenshots

Add the following screenshots under `docs/screenshots/`:

- `register.jpg`
- `course-detail.jpg`
- `group-leader.jpg`
- `ask-ai-assignment.jpg`
- `ask-ai-course.jpg`
- `admin-submission-filter.jpg`

------------------------------------------------------------------------

## Testing Checklist

### Student

-   [x] Register
-   [x] Login
-   [x] View assignments
-   [x] Create group
-   [x] Add group member
-   [x] Open OneDrive link
-   [x] Confirm submission
-   [x] View progress
-   [x] Ask AI about an assignment

### Admin

-   [x] Login
-   [x] View students
-   [x] View groups
-   [x] Create assignment
-   [x] Edit assignment
-   [x] Assign assignment to group
-   [x] Assign assignment to student
-   [x] Create global assignment
-   [x] View submission analytics

### Backend

-   [x] JWT authentication
-   [x] Role-based authorization
-   [x] PostgreSQL integration
-   [x] Swagger documentation
-   [x] AI/RAG endpoint
-   [x] Automatic assignment indexing
-   [x] Docker configuration

------------------------------------------------------------------------

## Round 2 Testing Checklist

### Student
-   [x] View enrolled courses
-   [x] Open course detail
-   [x] Ask AI about a course
-   [x] Create/view group with explicit leader
-   [x] Group leader can confirm group submission
-   [x] Non-leader sees inherited submitted status
-   [x] Non-leader cannot confirm group submission
-   [x] Individual assignment flow remains unchanged

### Admin / Professor
-   [x] Create course
-   [x] Enroll student
-   [x] Create assignment with course
-   [x] Select individual/group submission type
-   [x] Assign assignment to a group
-   [x] Filter assignments by course
-   [x] Filter submissions by status
-   [x] View course/student/assignment analytics

------------------------------------------------------------------------

## Project Scope Notes

The implementation focuses on the requirements defined for the Student,
Group & Assignment Management System.

Assignment deletion is not included because it is not part of the
specified core functional scope. The application instead provides
assignment creation, editing, assignment targeting, submission
confirmation, and progress tracking.

The AI assistant is an additional enhancement beyond the required core
functionality.

------------------------------------------------------------------------

## Future Improvements

Possible extensions include:

-   Assignment deletion with confirmation
-   Real invitation/notification system for group members
-   Email notifications for upcoming deadlines
-   More detailed group-level analytics
-   Background job processing for large-scale AI indexing
-   Streaming AI responses
-   Conversation history for the AI assistant
-   Production deployment with HTTPS and managed secrets
-   Automated tests and CI/CD pipeline

------------------------------------------------------------------------

## Submission

This project was developed for the Joineazy Full Stack Intern technical
task.

### Repository

https://github.com/ali-sorathiya64/assignment-task

### Demo Video

https://youtu.be/hT2G4qUtALM

### Platform / Live Demo

Frontend: https://joineazy-assignment-system.vercel.app

Backend: https://joineazy-backend-4ja5.onrender.com

Swagger: https://joineazy-backend-4ja5.onrender.com/api-docs

------------------------------------------------------------------------

## Author

**Ali Sorathiya**

-   GitHub: https://github.com/ali-sorathiya64
-   LinkedIn: https://linkedin.com/in/ali-sorathiya

------------------------------------------------------------------------

## License

This project was created as part of a technical evaluation task.