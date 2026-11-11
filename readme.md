# Joineazy — Student, Group & Assignment Management System

A role-based full-stack application for managing students, courses, groups, assignments, submission confirmations, grading, and assignment progress.

Built as a Full Stack Intern technical task for Joineazy.

## Live Demo

- **Frontend:** https://joineazy-assignment-system.vercel.app
- **Backend:** https://joineazy-backend-4ja5.onrender.com
- **API Documentation:** https://joineazy-backend-4ja5.onrender.com/api-docs
- **Demo Video:** 

## Overview

Joineazy provides a centralized platform for professors to manage courses, enroll students, organize groups, create assignments, monitor submissions, and grade student work.

Students can access their enrolled courses, manage groups, view assignments, confirm submissions, interact with an AI assistant, and track their grades.

The application supports two roles:

### Student
- Register and log in.
- View enrolled courses and course assignments.
- Create and manage groups.
- Add or remove group members.
- View individual and group assignments.
- Access assignment submission links.
- Confirm individual assignment submissions.
- View group submission status.
- Ask AI questions about assignments and courses.
- View grades, feedback, and individual grade overrides.

### Admin / Professor
- Manage courses and students.
- Enroll individual students or enroll students in bulk.
- Create and manage groups.
- Create and edit assignments.
- Assign work to all students, specific groups, or individual students.
- Configure individual or group submission types.
- Monitor submission confirmations and progress.
- View assignment analytics.
- Grade individual submissions.
- Assign common grades to groups.
- Override grades for individual group members.

## Key Features

### 1. Authentication & Authorization
- JWT-based authentication.
- Separate student and admin roles.
- Protected frontend routes.
- Backend authentication and role-based authorization.
- Password hashing using bcrypt.
- Ownership checks for protected professor operations.

### 2. Course Management
- Create and update courses.
- Assign unique course codes.
- Enroll and remove students.
- View enrolled students and course details.
- Associate assignments with courses.
- Support bulk student enrollment using email addresses.

### 3. Group Management
- Create student groups.
- Automatically add the group creator as a member.
- Set an explicit group leader.
- Add and remove group members.
- Update group information.
- Delete groups with relationship checks.
- Manage group membership in the context of course assignments.

### 4. Assignment Management
Professors can create assignments with:
- Title and description.
- Due date.
- OneDrive submission link.
- Optional course association.
- Individual or group submission type.
- Global or targeted assignment settings.

Assignments can be assigned to:
- All eligible students.
- Specific groups.
- Individual students.

The application validates assignment deadlines and prevents incompatible assignment changes after grading or submissions exist.

### 5. Submission Confirmation
Students can confirm submissions through a two-step confirmation flow.

For individual assignments, the student confirms their own submission.

For group assignments:
- Only the designated group leader can confirm.
- The confirmation is stored for the group.
- Other group members inherit the confirmed status.
- Non-leaders cannot independently confirm the group submission.

### 6. Grading System

The grading module supports individual and group assignment evaluation.

**Professor Grading Dashboard**
- View assignments available for grading.
- View submission counts and grading progress.
- Open assignment submissions for evaluation.

**Individual Grading**
- Assign marks to individual students.
- Add feedback.
- Update previously saved grades.
- Validate grades against the assignment's maximum score.

**Group Grading**
- Assign one common grade to a group.
- Apply an individual grade override to a specific member.
- Update the common group grade without removing existing overrides.
- Remove an override to restore the common group grade.

**Student Grade View**

Students can view:
- Their grades.
- Maximum assignment marks.
- Professor feedback.
- Their effective grade after individual overrides.

### 7. Progress & Analytics
Professors can monitor:
- Total assigned students.
- Submitted and pending students.
- Student-wise submission status.
- Group submission information.
- Assignment completion summaries.

### 8. AI Assistant (RAG)

The application includes an additional AI-powered assistant for assignment and course-related questions.

The retrieval pipeline uses:
- LangChain.
- OpenRouter.
- Vector embeddings.
- Pinecone.
- PostgreSQL assignment and course data.

The assistant retrieves relevant assignment or course context before generating a response.

Assignment and course retrieval use separate Pinecone namespaces. Access checks ensure students can only query resources they are permitted to access.

New and updated assignments are indexed into the vector database.

## Technology Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts

### Backend
- Node.js
- Express 5
- JavaScript ES Modules
- PostgreSQL
- `pg`
- JWT
- bcrypt
- Swagger / OpenAPI

### AI / RAG
- LangChain
- OpenRouter
- Pinecone
- Vector Embeddings

### Infrastructure & Deployment
- Docker
- Docker Compose
- Neon PostgreSQL
- Vercel
- Render

## Architecture

```text
                 React Frontend
                       |
                       | REST API + JWT
                       |
                       v
                Express Backend
                 /     |      \
                /      |       \
               v       v        v
          PostgreSQL  Grading   AI / RAG
                         |        |
                         |        v
                         |     Pinecone
                         |        |
                         |        v
                         |     OpenRouter
                         |
                         v
                   Grade Records
```

## Project Structure

```text
joineazy-task/
│
├── backend/
│   ├── src/
│   │   ├── ai/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   ├── connection.js
│   │   │   └── schema.sql
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── student/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yml
```

## Database Design

The application uses PostgreSQL for relational data management.

Main entities include:

| Table | Purpose |
|---|---|
| `users` | Student and admin accounts |
| `groups` | Student groups and group leaders |
| `group_members` | Group membership relationships |
| `courses` | Course information |
| `course_students` | Course enrollment |
| `assignments` | Assignment details |
| `assignment_groups` | Group-specific assignments |
| `assignment_students` | Student-specific assignments |
| `submissions` | Submission confirmation records |
| `grades` | Individual and group grading records |

Database relationships use foreign keys, unique constraints, checks, and indexes to maintain data consistency.

### Database Migrations

The project includes SQL schema and migration files under:

```text
backend/src/db/
├── schema.sql
└── migrations/
```

The migrations cover course and group functionality, global assignments, and grading-related database changes.

Apply the schema and required migrations to your PostgreSQL database before running the application. Use the migration files in the appropriate order and avoid applying the same migration more than once.

## Grading Rules

The grading system follows these rules:

1. Individual assignments are graded separately for each student.
2. Group assignments can receive a common group grade.
3. A professor can override the common grade for an individual group member.
4. An individual override takes precedence over the common group grade.
5. Updating a common group grade does not remove existing individual overrides.
6. Removing an individual override restores the common group grade for that student.
7. Grades must be non-negative and cannot exceed the assignment's maximum score.
8. Students can access only their own grade information.

## API Documentation

Swagger documentation is available at:

```text
/api-docs
```

All protected endpoints require a JWT bearer token.

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

### Students

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/users/students` | Admin |

### Groups

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/groups` | Student |
| GET | `/api/groups` | Student |
| GET | `/api/groups/all` | Admin |
| POST | `/api/groups/:groupId/members` | Student |
| PUT | `/api/groups/:groupId` | Student |
| DELETE | `/api/groups/:groupId/members/:userId` | Student |
| DELETE | `/api/groups/:groupId` | Student |

### Courses

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/courses` | Admin |
| GET | `/api/courses` | Admin |
| GET | `/api/courses/my` | Student |
| GET | `/api/courses/:courseId` | Authenticated |
| PUT | `/api/courses/:courseId` | Admin |
| POST | `/api/courses/:courseId/students` | Admin |
| POST | `/api/courses/:courseId/students/bulk` | Admin |
| DELETE | `/api/courses/:courseId/students/:studentId` | Admin |

### Assignments

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/assignments` | Authenticated |
| POST | `/api/assignments` | Admin |
| PUT | `/api/assignments/:assignmentId` | Admin |
| POST | `/api/assignments/:assignmentId/groups` | Admin |
| POST | `/api/assignments/:assignmentId/students` | Admin |

### Submissions

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/submissions/:assignmentId/confirm` | Student |
| GET | `/api/submissions/:assignmentId/status` | Student |

### Grading

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/grading/dashboard` | Admin |
| GET | `/api/grading/assignments/:assignmentId/submissions` | Admin |
| POST | `/api/grading/individual` | Admin |
| POST | `/api/grading/group/common` | Admin |
| POST | `/api/grading/group/override` | Admin |
| DELETE | `/api/grading/group/override/:submissionId/:studentId` | Admin |
| GET | `/api/grading/my-grades` | Student |

### Analytics

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/analytics/assignments/:assignmentId` | Admin |

### AI Assistant

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/ai/chat/:assignmentId` | Student |
| POST | `/api/ai/chat/course/:courseId` | Student |

For request and response schemas, refer to the Swagger documentation.

## Local Development Setup

### Prerequisites

- Node.js 22 or later
- npm
- PostgreSQL database or Neon PostgreSQL
- Git

For AI functionality:

- OpenRouter API key
- Pinecone API key
- Pinecone index configured for the selected embedding dimension

### 1. Clone the repository

```bash
git clone https://github.com/ali-sorathiya64/assignment-task.git

cd assignment-task
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
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

Run the backend:

```bash
npm run dev
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/api-docs
```

Health check:

```text
http://localhost:8000/api/health
```

### 3. Frontend Setup

Open a separate terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000
```

Run the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Docker

The project includes Dockerfiles for the frontend and backend, along with a root `docker-compose.yml`.

From the project root:

```bash
docker compose build
docker compose up
```

The expected local ports are:

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8000` |
| Swagger | `http://localhost:8000/api-docs` |

Provide the required environment variables through the environment configuration. Do not commit secrets or `.env` files.

## Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| `PORT` | Express server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | JWT expiration duration |
| `OPENROUTER_API_KEY` | OpenRouter authentication |
| `OPENROUTER_MODEL` | LLM model |
| `OPENROUTER_EMBEDDING_MODEL` | Embedding model |
| `PINECONE_API_KEY` | Pinecone authentication |
| `PINECONE_INDEX_NAME` | Pinecone index name |
| `PINECONE_DIMENSION` | Embedding dimension |

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |

## Security Considerations

- Passwords are hashed using bcrypt.
- Authentication is handled through signed JWTs.
- Protected API routes require authentication.
- Role-based middleware restricts access to admin and student operations.
- Professor operations validate ownership of relevant resources.
- Student grade and AI endpoints enforce resource-level access checks.
- Database operations use parameterized SQL queries.
- Sensitive credentials are supplied through environment variables.

## Design Decisions

### PostgreSQL

PostgreSQL was chosen because the system relies on structured relationships between students, courses, groups, assignments, submissions, and grades.

### JWT Authentication

JWT provides authentication between the React frontend and Express backend, with role-based access to protected resources.

### Modular Express Structure

Routes, controllers, middleware, database access, utilities, and AI functionality are separated by responsibility.

### Targeted Assignment Relationships

Separate relationship tables support global, group-specific, and student-specific assignment targeting.

### Group Grading and Overrides

A common group grade avoids repeating the same grading operation for every member, while individual overrides support different evaluations within the same group.

### Retrieval-Augmented Generation

Pinecone vector retrieval provides assignment- and course-specific context to the AI assistant before generating answers.

## Testing Checklist

The following functional areas have been tested during development.

### Student
- [x] Registration and login
- [x] View enrolled courses
- [x] View assignments
- [x] Create and manage groups
- [x] Add and remove group members
- [x] View group leader and member information
- [x] Confirm individual submissions
- [x] View inherited group submission status
- [x] Ask AI about assignments and courses
- [x] View grades and feedback

### Admin / Professor
- [x] Create and update courses
- [x] Enroll individual students
- [x] Bulk enroll students
- [x] Create and manage assignments
- [x] Assign work to groups and individual students
- [x] Configure individual and group submission types
- [x] Validate assignment deadlines
- [x] View submission analytics
- [x] Access grading dashboard
- [x] Save and update individual grades
- [x] Save common group grades
- [x] Apply and remove individual grade overrides

### Backend
- [x] JWT authentication
- [x] Role-based authorization
- [x] Resource ownership checks
- [x] PostgreSQL integration
- [x] Database migrations
- [x] Swagger documentation
- [x] Bulk enrollment endpoint
- [x] Grading endpoints
- [x] AI/RAG endpoints
- [x] Docker configuration

## Screenshots

Screenshots can be added under `docs/screenshots/` to demonstrate the application's main workflows.

Suggested screenshots:

- Student dashboard
- Course and group management
- Professor grading dashboard
- Group grading with individual override
- Student grades and feedback

## Project Scope

This project was developed to meet the functional requirements of the Joineazy Student, Group & Assignment Management System technical task.

The AI assistant is an additional enhancement beyond the core assignment management and grading functionality.

## Future Improvements

- Email notifications for assignment deadlines.
- Group invitation and notification workflows.
- More detailed analytics and reporting.
- Background job processing for AI indexing.
- Streaming AI responses.
- Automated test coverage and CI/CD improvements.

## Submission

**Repository:**  
https://github.com/ali-sorathiya64/assignment-task

**Demo Video:**  

**Live Application:**  
https://joineazy-assignment-system.vercel.app

**Backend:**  
https://joineazy-backend-4ja5.onrender.com

**Swagger API Documentation:**  
https://joineazy-backend-4ja5.onrender.com/api-docs

## Author

**Ali Sorathiya**

- GitHub: https://github.com/ali-sorathiya64
- LinkedIn: https://linkedin.com/in/ali-sorathiya

## License

This project was created as part of a technical evaluation task.