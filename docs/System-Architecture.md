# Make My Marriage

## System Design & Architecture

**Version:** 1.0  
**Architecture Stage:** MVP  
**Application Type:** Responsive Web Application  
**Primary Market:** Sri Lanka  
**Architecture Style:** Modular Monolith  
**Cloud Provider:** AWS

---

# 1. Purpose

This document defines the technical architecture for the Make My Marriage MVP.

Make My Marriage is a wedding planning and management platform that allows brides, grooms, parents, family members, and selected collaborators to manage:

- Weddings
- Multiple wedding events
- Members and permissions
- Tasks
- Budgets
- Expenses
- Guests
- Invitations
- RSVP
- Vendors
- Nearby vendor discovery
- Wedding documents

The architecture is intentionally designed to remain:

- Simple
- Understandable
- Maintainable
- Cost-conscious
- Secure
- Easy to deploy
- Easy to scale later

The MVP avoids unnecessary infrastructure such as microservices, Kubernetes, Redis, Kafka, and other distributed-system components.

---

# 2. Technology Stack

## Frontend

- Next.js
- TypeScript
- Redux Toolkit
- Tailwind CSS
- React Hook Form
- Zod

## Backend

- Node.js
- Express
- TypeScript
- REST API
- Prisma ORM
- Zod

## Database

- PostgreSQL
- Amazon RDS

## Authentication

- Custom email/password authentication
- Argon2id password hashing
- JWT access tokens
- JWT refresh tokens
- HttpOnly cookies
- Session table
- Email verification
- Forgot/reset password

## Email

- Resend

## File Storage

- Amazon S3

## Vendor Discovery

- Google Places API

## Infrastructure

- AWS EC2
- Docker
- Docker Compose
- Amazon ECR
- Nginx

## CI/CD

- GitHub
- GitHub Actions
- Amazon ECR
- EC2

## Logging

- console.log
- console.error

## Package Management

- npm
- npm workspaces

---

# 3. High-Level Architecture

```text
                             USERS
                               │
                               │ HTTPS
                               ▼
                       ┌────────────────┐
                       │     NGINX      │
                       │ Reverse Proxy  │
                       └───────┬────────┘
                               │
                   ┌───────────┴────────────┐
                   │                        │
                   ▼                        ▼
          ┌────────────────┐       ┌────────────────┐
          │    Next.js     │       │  Express API   │
          │   TypeScript   │       │ Node.js + TS   │
          │ Redux Toolkit  │       │   REST API     │
          └────────────────┘       └────────┬───────┘
                                           │
                                           │ Prisma
                                           ▼
                                 ┌──────────────────┐
                                 │   PostgreSQL     │
                                 │    AWS RDS       │
                                 └──────────────────┘


                External / Supporting Services

             ┌────────────┬────────────┬─────────────┐
             │            │            │
             ▼            ▼            ▼
         Amazon S3      Resend     Google Places
         Documents      Emails     Vendor Discovery
```

---

# 4. Architecture Style

The application will use a:

## Modular Monolith

There will be one backend application deployed as one Express service.

However, the backend will internally be divided into independent business modules.

Example:

```text
API
│
├── Authentication
├── Users
├── Weddings
├── Wedding Members
├── Events
├── Tasks
├── Budgets
├── Expenses
├── Guests
├── Invitations
├── RSVP
├── Vendors
└── Documents
```

This provides clear separation without introducing microservices.

### Why not microservices?

The MVP does not currently require:

- Independent service scaling
- Multiple engineering teams
- Distributed transactions
- Event-driven communication
- Service discovery
- Complex message queues

A modular monolith is therefore simpler and more suitable.

---

# 5. Repository Architecture

The application will use a single GitHub repository.

```text
make-my-marriage/
│
├── apps/
│   │
│   ├── web/
│   │   └── Next.js application
│   │
│   └── api/
│       └── Express application
│
├── packages/
│   │
│   └── shared/
│       ├── shared types
│       ├── enums
│       └── constants
│
├── docker/
│
├── docker-compose.yml
│
├── package.json
│
└── README.md
```

The project will use:

```text
npm workspaces
```

This allows the frontend and backend to remain in the same repository while sharing common types where appropriate.

---

# 6. Frontend Architecture

The frontend will use:

```text
Next.js
TypeScript
Redux Toolkit
Tailwind CSS
React Hook Form
Zod
```

The frontend is responsible for:

- User interface
- Forms
- Client-side validation
- Application state
- Calling backend REST APIs
- Showing data according to permissions
- Invitation pages
- RSVP forms

shadcn/ui will not be used. Tailwind CSS remains approved; this update does not select a replacement component library.

Frontend permission checks support the user experience only. The API must omit unauthorized data before it reaches the browser. Clear wedding-specific cached data when switching weddings or when access changes.

---

# 7. Frontend Route Structure

Example:

```text
/
├── login
├── register
├── verify-email
├── forgot-password
├── reset-password
│
├── dashboard
├── weddings
├── events
├── tasks
├── guests
├── budget
├── expenses
├── vendors
├── vendor-discovery
├── invitations
├── documents
├── members
└── settings
```

Public guest invitation:

```text
/invite/:token
```

The invitation route does not require a normal user account.

---

# 8. Redux Architecture

Redux Toolkit will manage important application-wide frontend state.

Potential slices:

```text
store/
│
├── authSlice
├── weddingSlice
├── eventSlice
├── guestSlice
├── budgetSlice
└── vendorSlice
```

Example:

```text
authSlice
├── currentUser
├── authenticated
└── loading
```

```text
weddingSlice
├── currentWedding
├── availableWeddings
├── currentMemberRole
├── currentMemberSide
└── permissions
```

Redux should only contain state that needs to be shared across multiple areas of the application.

Simple component-level state should remain inside React components.

---

# 9. Backend Architecture

The backend will use:

```text
Node.js
Express
TypeScript
Prisma
Zod
```

The API will follow a modular structure.

```text
apps/api/src/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── weddings/
│   ├── members/
│   ├── events/
│   ├── tasks/
│   ├── budgets/
│   ├── expenses/
│   ├── guests/
│   ├── invitations/
│   ├── rsvp/
│   ├── vendors/
│   └── documents/
│
├── middleware/
├── config/
├── utils/
├── types/
└── app.ts
```

---

# 10. Backend Module Structure

Example Guest module:

```text
guests/
│
├── guest.routes.ts
├── guest.controller.ts
├── guest.service.ts
├── guest.repository.ts
├── guest.schema.ts
└── guest.types.ts
```

Responsibilities:

### Routes

Define API endpoints.

### Controller

Handle HTTP requests and responses.

### Service

Contain business logic.

### Repository

Communicate with Prisma/database.

### Schema

Validate incoming data with Zod.

---

# 11. Backend Request Flow

A standard request will follow:

```text
Client
  ↓
Nginx
  ↓
Express Route
  ↓
Authentication Middleware
  ↓
Wedding Membership Middleware
  ↓
Permission / Side / Resource Assignment Checks
  ↓
Zod Validation
  ↓
Controller
  ↓
Service
  ↓
Repository / Prisma
  ↓
PostgreSQL
  ↓
Authorized response projection (including financial fields)
  ↓
Client
```

Example:

```text
POST /api/weddings/:weddingId/guests
```

Flow:

```text
Check authentication
       ↓
Check user belongs to wedding
       ↓
Check guest-management permission
       ↓
Validate body
       ↓
Create guest
       ↓
Return response
```

---

# 12. API Style

The application will use:

## REST APIs

Example:

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh

GET    /api/weddings
POST   /api/weddings
GET    /api/weddings/:id
PATCH  /api/weddings/:id

GET    /api/weddings/:id/events
POST   /api/weddings/:id/events

GET    /api/weddings/:id/guests
POST   /api/weddings/:id/guests

GET    /api/weddings/:id/expenses
POST   /api/weddings/:id/expenses

GET    /api/weddings/:id/vendors
POST   /api/weddings/:id/vendors
```

GraphQL is not required for the MVP.

---

# 13. Database

The application will use:

```text
PostgreSQL
AWS RDS
Prisma ORM
```

PostgreSQL is selected because Make My Marriage contains many relational entities.

Examples:

```text
User
 ↕
WeddingMember
 ↕
Wedding
```

and:

```text
Guest
 ↕
GuestEvent
 ↕
Event
```

and:

```text
Wedding
├── Events
├── Tasks
├── Guests
├── Vendors
├── Expenses
└── Documents
```

---

# 14. Core Database Entities

Expected main entities:

```text
User
Session
EmailVerificationToken
PasswordResetToken

Wedding
WeddingMember
MemberPermission
MemberEventAccess
MemberTaskAccess
MemberVendorAccess
MemberDocumentAccess

Event
Task

Budget
Expense

Guest
GuestEvent
Invitation
RSVP

Vendor
WeddingVendor

Document
```

The detailed database model is defined in [Database Design](Database-Design.md), including the four typed member-resource access tables in Section 17.1.

---

# 15. Multiple Wedding Support

One user can participate in multiple weddings.

Example:

```text
User: Ahamed

Wedding #100
Role: OWNER
Side: GROOM

Wedding #200
Role: FAMILY_MEMBER
Side: BRIDE
```

Therefore role and side must not be stored directly on the User.

Instead:

```text
User
  │
  ▼
WeddingMember
  │
  ▼
Wedding
```

`WeddingMember` stores:

```text
userId
weddingId
role
side
permissions
```

Any verified registered user may create a wedding and become its initial Owner, even if they are a Collaborator in another wedding. There are no global wedding-role user types.

---

# 16. User Roles

The application will contain four roles.

```text
OWNER
ADMIN
FAMILY_MEMBER
COLLABORATOR
```

## Owner

Full access to the wedding, independent of side or permission overrides. Only Owners can add, remove, or demote other Owners. Every wedding must retain at least one active Owner.

## Admin

Operational access within the Admin's authorized side and delegated permissions. Admins cannot manage ownership or grant permissions they do not possess, including through role changes. Resource delegation must remain within their own authorized scope.

## Family Member

Can use only permitted capabilities, subject to applicable side restrictions.

## Collaborator

Can use only explicitly permitted capabilities on explicitly assigned events, tasks, vendors, and documents. Module permissions alone never expose unrelated resources.

Vendors do not require accounts in the MVP.

---

# 17. Wedding Side

Each wedding member can belong to:

```text
BRIDE
GROOM
BOTH
```

Example:

```text
role: ADMIN
side: GROOM
```

Role and side are independent.

---

# 18. Authorization Model

Authorization is enforced in Express using active wedding membership, role, permitted capabilities, authorized side, and explicit resource assignments where required.

- **Owner:** full wedding access. Only Owners manage ownership.
- **Admin:** operational access within authorized side and delegated permissions. Delegation cannot exceed the Admin's own effective permissions or resource scope.
- **Family Member:** only permitted capabilities, subject to side restrictions.
- **Collaborator:** the relevant capability and an explicit assignment to the requested event, task, vendor, or document are both required. No matching assignment means no access.

Use four small relational access tables, defined in Database Design Section 17.1: `member_event_access`, `member_task_access`, `member_vendor_access`, and `member_document_access`. Each connects a WeddingMember to one resource with foreign keys and same-wedding constraints. Permission flags remain in `wedding_member_permissions`; resource access rows do not grant capabilities.

An event assignment does not automatically grant access to related tasks, vendors, documents, guests, or expenses. Task responsibility (`assigned_member_id`) does not replace an explicit task access assignment for a Collaborator.

Apply the same checks to direct reads, writes, lists, search, nested relations, selectors, counts, and dashboard summaries. Filter before pagination and aggregation. Validate access to referenced resources when linking records. A resource assignment never bypasses side or financial restrictions.

Ownership and permission changes must be validated against the resulting effective access, including role defaults. An Admin cannot use role changes or removal of a deny override to grant a capability they do not possess. Only Owners can affect Owner memberships. Ownership mutations must preserve at least one active Owner in a transaction protected against concurrent changes.

## Financial Response Security

Backend services must project authorized response fields rather than serialize raw Prisma records.

- `BUDGET_VIEW` permits viewing wedding/event budget amounts.
- `BUDGET_MANAGE` permits modifying those amounts; it does not substitute for `BUDGET_VIEW`.
- `EXPENSE_VIEW` protects expense-derived totals, payer/payment information, and vendor financial fields, including agreed price, paid amount, remaining amount, and payment status.
- `EXPENSE_MANAGE` protects financial writes; changing a vendor's agreed price also requires the relevant vendor-management capability.
- Owners have all these capabilities. For other members, neither a general module permission nor an explicit resource assignment grants financial access by itself.

Combined values such as remaining budget require both the budget and expense viewing permissions. Financial permissions do not broaden resource access. Collaborators with financial permissions can receive permitted financial fields on assigned resources, but do not gain access to unrelated resources or raw expense records.

Omit unauthorized financial fields from wedding, event, vendor, dashboard, list, nested, and mutation responses. Do not send values to the browser and rely on hidden UI elements. Financial document downloads must also satisfy the relevant financial viewing permission in addition to document access.

Mixed update requests must validate every changed field before any write. General wedding/event editing cannot change `budgetAmount` without `BUDGET_MANAGE`. The same rules apply to financial values supplied at creation.

The frontend may hide unavailable actions, but it is never the authorization boundary.
---

# 19. Authentication Architecture

Authentication will be developed inside the Express backend.

Cognito will not be used.

Authentication features:

- Register
- Email verification
- Login
- Logout
- Refresh token
- Forgot password
- Reset password

---

# 20. Registration Flow

```text
User
 ↓
Enter email + password
 ↓
POST /auth/register
 ↓
Validate data
 ↓
Check email uniqueness
 ↓
Hash password using Argon2id
 ↓
Create User
emailVerified = false
 ↓
Generate verification token
 ↓
Store hashed verification token
 ↓
Send verification email using Resend
 ↓
User opens verification URL
 ↓
Verify token
 ↓
emailVerified = true
```

Users must verify their email before fully accessing the application.

---

# 21. Login Flow

```text
User
 ↓
Email + Password
 ↓
POST /auth/login
 ↓
Find user
 ↓
Verify Argon2id password hash
 ↓
Check email verification
 ↓
Generate Access JWT
 ↓
Generate Refresh JWT
 ↓
Create Session record
 ↓
Store hashed refresh token
 ↓
Return HttpOnly cookies
```

---

# 22. Token Architecture

Two tokens will be used.

## Access Token

The finalized lifetime is:

```text
15 minutes
```

Contains basic authentication identity such as:

```text
userId
sessionId
```

Wedding permissions will generally be retrieved/validated against the database rather than permanently trusting role information contained in the JWT.

## Refresh Token

The finalized lifetime is:

```text
7 days
```

Refresh tokens will be associated with Session records. Seven days is an
absolute expiry measured from login. Refresh-token rotation must not extend it.
Access and refresh tokens are stored in HttpOnly cookies; only SHA-256 hashes of
refresh tokens are stored in PostgreSQL.

---

# 23. Session Table

The application will contain a Session table.

Example structure:

```text
sessions
--------------------------------
id
user_id
refresh_token_hash
refresh_token_version
last_rotated_at
expires_at
created_at
revoked_at
user_agent
```

Purpose:

- Track refresh tokens
- Logout properly
- Revoke sessions
- Handle password reset safely
- Allow future multi-device session management
- Support atomic refresh-token rotation and stale-token reuse detection
- Invalidate subsequent access promptly after logout

---

# 24. Token Refresh Flow

```text
Access token expires
       ↓
Frontend calls /auth/refresh
       ↓
Refresh token sent automatically
through HttpOnly cookie
       ↓
Backend verifies JWT
       ↓
Find corresponding session
       ↓
Check:
not revoked
not expired
token valid
       ↓
Atomically replace refresh-token hash
and increment its version
       ↓
Generate new access and refresh tokens
       ↓
Return new HttpOnly cookies
```

Refresh-token rotation is required. The Session row retains only the current
token hash and its monotonically increasing version. The later authentication
API milestone must handle simultaneous refresh requests and stale-token reuse
explicitly. Rotation never changes the session's absolute expiry.

Every protected request will validate the access JWT and confirm that its
referenced Session row is active and unexpired. This database check makes a
logout revocation effective for subsequent requests instead of waiting for the
15-minute access JWT to expire.

---

# 25. Logout Flow

```text
POST /auth/logout
       ↓
Find session
       ↓
Set revoked_at
       ↓
Clear Access Cookie
       ↓
Clear Refresh Cookie
```

---

# 26. Password Reset

```text
Forgot Password
       ↓
Enter email
       ↓
Generate random reset token
       ↓
Store hashed reset token
       ↓
Resend sends reset URL
       ↓
User enters new password
       ↓
Verify token
       ↓
Hash new password
       ↓
Update user
       ↓
Revoke active sessions
```

---

# 27. Email Architecture

Resend will handle transactional authentication emails.

Examples:

```text
Email Verification
Password Reset
Password Changed Confirmation
```

Flow:

```text
Express
  ↓
Resend API
  ↓
User Email
```

The MVP will keep email functionality simple.

---

# 28. Guest Authentication

Wedding guests do not need a Make My Marriage user account.

A guest receives a secure invitation URL.

Example:

```text
https://makemymarriage.lk/invite/secure-token
```

The token identifies the invitation.

The guest can:

- View invitation
- View invited events
- Submit RSVP

The guest cannot access the wedding dashboard or private wedding-management functionality.

---

# 29. Event-Level RSVP

RSVP will operate per event.

Example:

```text
Mr. Ahmed & Family

Wedding
Attending: Yes
Number: 4

Reception
Attending: Yes
Number: 3

Homecoming
Attending: No
```

Database relationship:

```text
Guest
   │
   ▼
GuestEvent
   │
   ▼
Event

GuestEvent
   │
   ▼
RSVP
```

One invitation URL may show multiple invited events.

---

# 30. Vendor Discovery

Vendor discovery will use:

```text
Google Places API
```

The feature will intentionally remain simple.

Example:

```text
User searches:

Category:
Photographer

Location:
Colombo

Radius:
10 km
       ↓
Express API
       ↓
Google Places API
       ↓
Nearby vendor results
```

Users can then select:

```text
Add to My Wedding
```

---

# 31. My Vendors

Vendor Discovery and My Vendors are separate concepts.

```text
Google Places
     ↓
Vendor Discovery
     ↓
Add to My Wedding
     ↓
Wedding Vendor
```

Wedding-specific vendor data may contain:

```text
event
agreedPrice
amountPaid
balance
notes
documents
```

Users can also manually add vendors without using Google Places.

The implementation will remain simple and follow the applicable Google Places usage rules.

---

# 32. Document Architecture

Files such as:

- Quotations
- Contracts
- Receipts
- Invoices
- Venue documents

will be stored in:

```text
Amazon S3
```

They will not be stored directly in PostgreSQL.

---

# 33. Document Upload Flow

```text
User selects document
       ↓
Next.js requests upload permission
       ↓
Express validates user/wedding permission
       ↓
Express generates S3 presigned URL
       ↓
URL returned to frontend
       ↓
Browser uploads directly to S3
       ↓
Frontend informs backend upload completed
       ↓
Document metadata stored in PostgreSQL
```

Example metadata:

```text
id
weddingId
eventId?
vendorId?
expenseId?

fileName
s3Key
mimeType
fileSize
uploadedBy
createdAt
```

---

# 34. Infrastructure Architecture

MVP infrastructure will remain at Stage 1.

```text
                           Internet
                              │
                              ▼
                         AWS EC2
                              │
                      Docker Compose
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
           Nginx           Next.js          Express
                                               │
                                               ▼
                                           AWS RDS
                                          PostgreSQL


External AWS Service

Amazon S3
```

Only one EC2 instance will initially be used.

---

# 35. Docker Architecture

Both application services will be containerized.

Docker images:

```text
make-my-marriage-web
make-my-marriage-api
```

Docker Compose:

```text
services:
  nginx
  web
  api
```

PostgreSQL will not run in the production Docker Compose environment.

Production PostgreSQL will use Amazon RDS.

For local development, PostgreSQL can run through Docker.

---

# 36. Amazon ECR

Amazon ECR will store Docker images.

```text
Amazon ECR
│
├── make-my-marriage-web
└── make-my-marriage-api
```

ECS will not be used for the MVP.

---

# 37. CI/CD Architecture

Deployment flow:

```text
Developer
    ↓
Git Push
    ↓
GitHub
    ↓
GitHub Actions
    ↓
Install dependencies
    ↓
Run checks/tests
    ↓
Build Next.js Docker image
    ↓
Build Express Docker image
    ↓
Push images to Amazon ECR
    ↓
Deploy to EC2
    ↓
docker compose pull
    ↓
docker compose up -d
```

The exact deployment script can be designed during implementation.

---

# 38. Nginx

Nginx will run as the main entry point for the EC2-hosted application.

Conceptually:

```text
User
 ↓
Nginx
 ├── /        → Next.js
 │
 └── /api/*   → Express
```

Example:

```text
/dashboard
     ↓
Next.js
```

```text
/api/weddings
     ↓
Express
```

This keeps the frontend and backend under the same application origin.

---

# 39. Domain and SSL

Domain configuration, DNS, SSL certificates, and final HTTPS architecture will be discussed separately before production deployment.

These details are intentionally not finalized in this version of the architecture.

---

# 40. AWS RDS Network Access

The PostgreSQL database should not be directly exposed to the public internet.

Conceptually:

```text
Internet
   │
   X
   │
PostgreSQL


Express / EC2
      │
      ▼
AWS RDS PostgreSQL
```

Security Group configuration should allow PostgreSQL access only from the application infrastructure.

---

# 41. Amazon S3 Security

The S3 bucket should remain private.

Users should not receive permanent public object URLs.

Access will happen through authorized application flows such as presigned URLs.

Example:

```text
Private S3 Bucket

quotation.pdf
receipt.pdf
contract.pdf
```

Access is granted temporarily when required.

---

# 42. AWS Permissions

The EC2 instance should use an IAM role rather than storing permanent AWS access keys inside application files.

EC2 may require permissions such as:

```text
Pull Docker images from ECR

Generate/use required S3 operations
```

Permissions should follow least-privilege principles.

---

# 43. Environment Configuration

Development can use:

```text
.env
```

Example:

```text
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
RESEND_API_KEY
GOOGLE_PLACES_API_KEY
S3_BUCKET_NAME
AWS_REGION
```

Production secrets should not be committed to Git.

The exact AWS secret/configuration management strategy can remain simple for the MVP and be improved later.

---

# 44. Validation

Zod will validate incoming data.

Example:

```text
POST /api/weddings/:id/guests
       ↓
guestSchema.parse()
       ↓
Controller
```

Validation should happen before business logic runs.

Frontend forms can also use Zod.

---

# 45. Error Handling

Express should have one centralized error-handling middleware.

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Error
 ↓
Global Error Middleware
 ↓
Safe API Response
```

Example response:

```json
{
  "error": {
    "code": "GUEST_NOT_FOUND",
    "message": "Guest not found"
  }
}
```

Internal stack traces should not be returned to production users.

---

# 46. Logging

Logging will remain simple in the MVP.

Use:

```text
console.log()
console.error()
```

Examples:

```text
console.log("Guest created", guestId)

console.error("Failed to create guest", error)
```

Sensitive values must never be logged.

Do not log:

- Passwords
- Password hashes
- JWT tokens
- Refresh tokens
- Email verification tokens
- Password reset tokens

More advanced logging can be introduced later if required.

---

# 47. Security Requirements

The MVP should include the following basic protections.

## Password Security

Use Argon2id hashing.

Never store raw passwords.

## HttpOnly Cookies

Authentication tokens should not be directly accessible through browser JavaScript.

## Secure Cookies

Production cookies should use HTTPS-compatible secure settings.

## Input Validation

Use Zod.

## Authorization

Every protected resource must validate active wedding membership, role, capability, authorized side, and explicit resource assignment where required. Financial fields must be omitted unless the corresponding viewing permission is present. Ownership changes must preserve an active Owner.

## Rate Limiting

Authentication endpoints should be rate limited.

Examples:

```text
/login
/register
/forgot-password
/reset-password
/resend-verification
```

## SQL Injection Protection

Use Prisma rather than manually concatenating SQL.

## File Upload Validation

Validate:

- File type
- File size
- Permission
- File ownership

## S3

Keep bucket private.

---

# 48. Important Authorization Rule

The frontend is never considered the security layer.

For example:

Even if the frontend hides:

```text
Delete Wedding
```

the API must still verify:

```text
Is authenticated?
       ↓
Is wedding member?
       ↓
Is OWNER?
       ↓
Allow / Deny
```

Every sensitive operation must be protected server-side.

---

# 49. Wedding Data Isolation

Wedding information must be isolated between wedding workspaces.

For example:

User belongs to:

```text
Wedding A
```

They should not be able to request:

```text
Wedding B guests
```

unless they are also a member of Wedding B.

Every wedding-scoped query must include the relevant wedding context.

Example:

```text
WHERE
wedding_id = requestedWeddingId
```

combined with membership validation.

---

# 50. Main Application Data Flow

Example: creating an expense.

```text
User
 ↓
Next.js Expense Form
 ↓
Zod frontend validation
 ↓
Redux/API action
 ↓
POST /api/weddings/100/expenses
 ↓
Nginx
 ↓
Express
 ↓
Authenticate JWT
 ↓
Check WeddingMember
 ↓
Check expense permission
 ↓
Validate request
 ↓
Expense Service
 ↓
Prisma
 ↓
PostgreSQL
 ↓
Expense created
 ↓
Response
 ↓
Redux/UI update
```

---

# 51. Vendor Discovery Data Flow

```text
User
 ↓
Vendor Discovery Page
 ↓
Select category + location + radius
 ↓
Next.js
 ↓
Express
 ↓
Google Places
 ↓
Vendor results
 ↓
Express
 ↓
Next.js
 ↓
Display nearby vendors
```

When selected:

```text
Add to My Wedding
 ↓
Express
 ↓
Validate wedding permission
 ↓
Create WeddingVendor
 ↓
PostgreSQL
```

---

# 52. RSVP Data Flow

```text
Organizer
 ↓
Creates guest
 ↓
Assigns guest to events
 ↓
Creates invitation
 ↓
Shares invitation through WhatsApp
 ↓
Guest opens secure link
 ↓
GET /invite/:token
 ↓
Invitation data loaded
 ↓
Guest chooses attendance
 ↓
POST RSVP
 ↓
Validate invitation token
 ↓
Create/update RSVP
 ↓
PostgreSQL
```

No guest account is required.

---

# 53. Document Data Flow

```text
User
 ↓
Upload quotation
 ↓
Next.js
 ↓
Request S3 upload URL
 ↓
Express
 ↓
Authorization check
 ↓
Generate presigned URL
 ↓
Next.js
 ↓
Direct upload to S3
 ↓
Save metadata
 ↓
PostgreSQL
```

---

# 54. Current Scaling Strategy

For the MVP we are intentionally using only:

## Stage 1

```text
1 EC2 Instance
1 RDS PostgreSQL Database
Amazon S3
Amazon ECR
Google Places
Resend
GitHub Actions
```

We will not design additional scaling infrastructure until the application actually requires it.

---

# 55. Technologies Explicitly Not Used

The MVP does not use:

```text
MongoDB
Cognito
Microservices
Kubernetes
ECS
Fargate
Redis
Kafka
RabbitMQ
SQS
DynamoDB
GraphQL
WebSockets
Elasticsearch
OpenSearch
Complex logging platforms
```

This is intentional.

---

# 56. Final System Architecture

```text
                            ┌───────────────┐
                            │     User      │
                            └───────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │     Nginx     │
                            │ Reverse Proxy │
                            └───────┬───────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            ┌───────────────┐               ┌───────────────┐
            │    Next.js    │               │    Express    │
            │  TypeScript   │               │ Node.js + TS  │
            │     Redux     │               │   REST API    │
            └───────────────┘               └───────┬───────┘
                                                    │
                                                    │ Prisma
                                                    ▼
                                            ┌───────────────┐
                                            │ PostgreSQL    │
                                            │    RDS        │
                                            └───────────────┘

                           Express also communicates with:

                 ┌────────────────┬────────────────┬───────────────┐
                 │                │                │
                 ▼                ▼                ▼
             Amazon S3         Resend        Google Places
             Documents          Email        Vendor Search


Infrastructure:

AWS EC2
│
└── Docker Compose
    ├── nginx
    ├── web
    └── api

Docker Images
      ↓
Amazon ECR

Code
 ↓
GitHub
 ↓
GitHub Actions
 ↓
ECR
 ↓
EC2
```

---

# 57. Final Architecture Decisions

The Make My Marriage MVP is finalized with:

### Frontend

Next.js + TypeScript + Redux Toolkit

### Backend

Node.js + Express + TypeScript

### API

REST

### Database

PostgreSQL + Prisma + AWS RDS

### Authentication

Custom email/password authentication

### Password Security

Argon2id

### Session Management

JWT access token + refresh token + Session table

### Browser Authentication

HttpOnly cookies

### Email

Resend

### Roles

Owner  
Admin  
Family Member  
Collaborator

### Authorization

Role + Permission + Side + Explicit Resource Assignment (for Collaborators), with backend financial-field filtering and Owner-only ownership management.

### Guest Access

Secure invitation tokens without user accounts

### RSVP

Per-event RSVP

### Vendor Discovery

Google Places

### File Storage

Amazon S3

### Hosting

AWS EC2

### Containers

Docker + Docker Compose

### Container Registry

Amazon ECR

### Reverse Proxy

Nginx

### CI/CD

GitHub Actions

### Package Manager

npm

### Repository

Single monorepo

### Logging

console.log / console.error

### Scaling

Stage 1 only for MVP

---

# 58. Architecture Principle

The guiding architecture principle for Make My Marriage is:

> Build the simplest architecture that safely supports the current product requirements, while keeping clear boundaries that allow the application to evolve later.

The MVP therefore prioritizes understandable code, clear module boundaries, secure authentication, relational data integrity, simple AWS infrastructure, and straightforward deployment instead of introducing unnecessary distributed-system complexity.

---

# 59. Implementation-Stage Questions

The six implementation-stage groups remain recorded in [PRD Section 41](PRD.md#41-implementation-stage-questions): guest invitation persistence/sharing, member invitation lifecycle, financial boundaries, guest/RSVP statistics, incomplete API contracts, and lifecycle/operational details.

Authentication now uses a 15-minute access JWT, a fixed seven-day refresh session that rotation does not extend, a 24-hour single-use email-verification token, refresh-token rotation, and protected-request Session checks for prompt revocation. Exact concurrent-refresh and stale-token response behavior remains for the authentication API milestone. CSRF protection, upload completion/failure handling, domain/HTTPS, and production secrets remain open. Logout-all remains optional. None of these questions weaken the finalized access or financial-security rules.
