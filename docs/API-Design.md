# Make My Marriage

## REST API Design

**Version:** 1.0  
**Backend:** Node.js + Express + TypeScript  
**API Style:** REST  
**Validation:** Zod  
**ORM:** Prisma  
**Database:** PostgreSQL / AWS RDS  
**Authentication:** JWT Access + Refresh Tokens using HttpOnly Cookies

---

# 1. Purpose

This document defines the REST API contract for the Make My Marriage MVP.

The API supports:

- Authentication
- Email verification
- Password reset
- User profile
- Wedding management
- Wedding members
- Roles and permissions
- Wedding-member invitations
- Events
- Tasks
- Dashboard
- Budget management
- Expense management
- Vendor discovery
- Wedding vendors
- Guests
- Event-based guest assignment
- Digital invitations
- RSVP
- Documents

The API will be consumed primarily by the Next.js frontend.

---

# 2. Base API URL

All backend routes should use:

```text
/api/v1
```

Example:

```text
/api/v1/auth/login
/api/v1/weddings
/api/v1/weddings/:weddingId/events
```

Using `/v1` gives us room to introduce future API versions without breaking the existing application.

---

# 3. General API Architecture

Request flow:

```text
Next.js
   ↓
Nginx
   ↓
Express Router
   ↓
Authentication Middleware
   ↓
Wedding Membership Check
   ↓
Capability / Side / Resource Assignment Checks
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
```

Not every endpoint requires every middleware.

For example:

```text
POST /auth/login
```

does not require authentication.

But:

```text
POST /weddings/:weddingId/guests
```

requires:

```text
Authentication
+
Wedding Membership
+
Guest Management Permission
+
Request Validation
```

These checks apply to reads and writes, including nested resources and referenced IDs. Services must filter authorized resources before pagination/aggregation and build responses containing only permitted fields (Sections 90 and 91).

---

# 4. API Response Format

Successful APIs should use a consistent response structure.

Example:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Ahamed & Fathima Wedding"
  }
}
```

For list endpoints:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

Examples containing financial values represent callers with the required financial viewing permissions. All responses, including create/update responses, must omit fields the caller cannot view. Lists, nested data, counts, and dashboard summaries must use the caller's authorized resource scope; filtering only in the frontend is prohibited.

---

# 5. Error Response Format

Errors should use:

```json
{
  "success": false,
  "error": {
    "code": "GUEST_NOT_FOUND",
    "message": "Guest not found"
  }
}
```

Validation errors may include field information:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "fields": {
      "email": "Invalid email address"
    }
  }
}
```

---

# 6. HTTP Status Codes

Common statuses:

```text
200 OK
201 Created
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
```

Examples:

```text
Wrong login credentials
→ 401
```

```text
Valid user but no wedding permission
→ 403
```

```text
Guest does not exist
→ 404
```

```text
Email already registered
→ 409
```

---

# 7. Authentication Cookies

Authentication uses two HttpOnly cookies.

```text
access_token
refresh_token
```

The browser automatically sends them with requests.

Production properties:

```text
HttpOnly = true
Secure = true
SameSite = Lax
```

The frontend should not store access or refresh tokens in:

```text
localStorage
sessionStorage
Redux
```

---

# 8. Authentication API

Base:

```text
/api/v1/auth
```

---

# 9. Register

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "firstName": "Ahamed",
  "lastName": "Mohamed",
  "email": "ahamed@example.com",
  "password": "StrongPassword123!"
}
```

Processing:

```text
Validate request
 ↓
Normalize email
 ↓
Check email does not exist
 ↓
Hash password using Argon2id
 ↓
Create user
 ↓
Create email verification token
with a 24-hour expiry
  ↓
Store only its SHA-256 hash
 ↓
Send verification email using Resend
```

Response:

```json
{
  "success": true,
  "data": {
    "message": "If this email can be registered, use the verification message to continue. If it does not arrive, request a new link."
  }
}
```

New, duplicate, and concurrent duplicate submissions use the same honest response. It
does not claim that an account was created or an email was sent. A new account and its
hashed verification token are committed atomically before Resend delivery is attempted.
If delivery fails, the account remains and the unusable token record is removed so the
user can immediately request another link.

Status:

```text
202 Accepted
```

---

# 10. Verify Email

```http
POST /api/v1/auth/verify-email
```

Request:

```json
{
  "token": "raw-verification-token"
}
```

Processing:

```text
Hash incoming token
 ↓
Find verification record
 ↓
Check expiry
 ↓
Check not already used
 ↓
Atomically set user.emailVerifiedAt
 ↓
Set token.usedAt
```

Response:

```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully."
  }
}
```

---

# 11. Resend Verification Email

```http
POST /api/v1/auth/resend-verification
```

Request:

```json
{
  "email": "ahamed@example.com"
}
```

The API should return a generic response even if the email does not exist.

Example:

```json
{
  "success": true,
  "data": {
    "message": "If the account exists, a verification email has been sent."
  }
}
```

This prevents account enumeration.

Each user has one current email-verification-token record. Resending replaces
its hash and expiry, which invalidates previous unused links. The token is
single-use, expires after 24 hours, and is stored only as a SHA-256 hash.

---

# 12. Login

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "ahamed@example.com",
  "password": "StrongPassword123!"
}
```

Processing:

```text
Find user
 ↓
Verify password
 ↓
Check email verified
 ↓
Create access JWT
 ↓
Create refresh JWT
 ↓
Hash refresh token
 ↓
Create Session
 ↓
Set HttpOnly cookies
```

Unverified users receive `403 EMAIL_VERIFICATION_REQUIRED` in every environment. There
is no development bypass. Protected requests and refresh attempts also reject and
revoke any existing Session whose user is not verified.

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "Ahamed",
      "lastName": "Mohamed",
      "email": "ahamed@example.com"
    }
  }
}
```

---

# 13. Current User

```http
GET /api/v1/auth/me
```

Authentication required.

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Ahamed",
    "lastName": "Mohamed",
    "email": "ahamed@example.com",
    "emailVerified": true
  }
}
```

This endpoint is useful when the frontend application initially loads.

Access JWTs expire after 15 minutes and reference a Session ID. Every protected
request must confirm that the referenced Session remains active and unexpired.

---

# 14. Refresh Access Token

```http
POST /api/v1/auth/refresh
```

The browser automatically provides the refresh-token cookie.

Processing:

```text
Read refresh cookie
 ↓
Verify refresh JWT
 ↓
Find Session
 ↓
Compare token hash
 ↓
Check session not revoked
 ↓
Check expiry
 ↓
Atomically replace refresh-token hash
and increment its version
  ↓
Generate new access and refresh tokens
  ↓
Set HttpOnly cookies
```

The Session has a fixed seven-day absolute expiry from login. Rotation must not
extend it. Rotation conditionally replaces the current hash and increments its version,
so only one request can succeed. A request that loses a valid race within five seconds
receives `409 REFRESH_ALREADY_ROTATED` without cookies being cleared. The frontend may
retry its protected request once because the winning response has supplied the current
cookies. Reuse outside that window revokes the Session as suspected token theft.

Response:

```json
{
  "success": true
}
```

Cookie-setting and cookie-changing authentication routes validate the request Origin
against the exact configured `WEB_ORIGIN`. The same-origin Next.js rewrite is the
browser API boundary; the Express API does not enable permissive CORS.

---

# 15. Logout

```http
POST /api/v1/auth/logout
```

Processing:

```text
Find current session
 ↓
Set revokedAt
 ↓
Clear access-token cookie
 ↓
Clear refresh-token cookie
```

Response:

```text
204 No Content
```

---

# 16. Logout All Devices

Optional but useful because Session already exists.

```http
POST /api/v1/auth/logout-all
```

Processing:

```text
Revoke every active Session
WHERE userId = currentUser
```

Response:

```text
204 No Content
```

---

# 17. Forgot Password

```http
POST /api/v1/auth/forgot-password
```

Request:

```json
{
  "email": "ahamed@example.com"
}
```

Processing:

```text
Generate secure reset token
 ↓
Hash token
 ↓
Store token hash
 ↓
Send reset link using Resend
```

Response should always be generic:

```json
{
  "success": true,
  "data": {
    "message": "If the account exists, a password reset email has been sent."
  }
}
```

---

# 18. Reset Password

```http
POST /api/v1/auth/reset-password
```

Request:

```json
{
  "token": "password-reset-token",
  "newPassword": "NewStrongPassword123!"
}
```

Processing:

```text
Validate reset token
 ↓
Hash new password
 ↓
Update user
 ↓
Mark reset token used
 ↓
Revoke all active sessions
```

Response:

```json
{
  "success": true,
  "data": {
    "message": "Password successfully reset."
  }
}
```

---

# 19. User Profile API

Update current user's basic profile:

```http
PATCH /api/v1/users/me
```

Request:

```json
{
  "firstName": "Ahamed",
  "lastName": "Mohamed"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Ahamed",
    "lastName": "Mohamed",
    "email": "ahamed@example.com"
  }
}
```

Email-changing functionality can be introduced later if required.

---

# 20. Wedding API

Base:

```text
/api/v1/weddings
```

All wedding endpoints require authentication.

---

# 21. Create Wedding

```http
POST /api/v1/weddings
```

Request:

```json
{
  "name": "Ahamed & Fathima Wedding",
  "brideName": "Fathima",
  "groomName": "Ahamed",
  "managementType": "JOINT",
  "mainWeddingDate": "2027-01-20",
  "budgetAmount": 5000000,
  "currency": "LKR",
  "creatorSide": "GROOM"
}
```

Processing uses a database transaction:

```text
Create Wedding
      +
Create WeddingMember
role = OWNER
side = creatorSide
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "wedding-uuid",
    "name": "Ahamed & Fathima Wedding",
    "managementType": "JOINT",
    "member": {
      "role": "OWNER",
      "side": "GROOM"
    }
  }
}
```

Status:

```text
201 Created
```

Any verified registered user may create a wedding, even if they are a Collaborator in another wedding. No global role check may prohibit this. Wedding creation and its initial active Owner membership remain atomic.

---

# 22. Get User Weddings

```http
GET /api/v1/weddings
```

Returns weddings where the current user has an active WeddingMember record.

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "My Wedding",
      "role": "OWNER",
      "side": "GROOM",
      "mainWeddingDate": "2027-01-20"
    },
    {
      "id": "uuid-2",
      "name": "My Sister's Wedding",
      "role": "FAMILY_MEMBER",
      "side": "BRIDE",
      "mainWeddingDate": "2027-04-10"
    }
  ]
}
```

---

# 23. Get Wedding

```http
GET /api/v1/weddings/:weddingId
```

Requires active wedding membership. The example includes `budgetAmount` for a caller with `BUDGET_VIEW`; omit it otherwise. Membership alone does not grant financial access. Collaborators receive only the minimal workspace context needed for their assigned resources, not unrelated nested wedding data.

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Ahamed & Fathima Wedding",
    "brideName": "Fathima",
    "groomName": "Ahamed",
    "managementType": "JOINT",
    "mainWeddingDate": "2027-01-20",
    "budgetAmount": 5000000,
    "currency": "LKR"
  }
}
```

---

# 24. Update Wedding

```http
PATCH /api/v1/weddings/:weddingId
```

Owner permission is required for sensitive settings, including management-type changes. Updating `budgetAmount` separately requires `BUDGET_MANAGE`; a general wedding-edit capability is insufficient. Validate all requested fields before writing, and reject the entire request if any field is unauthorized. The response must omit budget fields without `BUDGET_VIEW`.

Example request:

```json
{
  "name": "Ahamed & Fathima",
  "mainWeddingDate": "2027-01-21",
  "budgetAmount": 5500000
}
```

---

# 25. Change Wedding Management Type

This can be handled through the normal wedding update endpoint.

Example:

```json
{
  "managementType": "JOINT"
}
```

Allowed transition:

```text
BRIDE_SIDE → JOINT

GROOM_SIDE → JOINT
```

The backend should validate invalid or unsupported transitions.

---

# 26. Archive Wedding

Instead of immediate permanent deletion:

```http
DELETE /api/v1/weddings/:weddingId
```

Owner only.

Backend performs:

```text
archived_at = current timestamp
```

Response:

```text
204 No Content
```

---

# 27. Dashboard API

Dashboard values are calculated from existing tables.

```http
GET /api/v1/weddings/:weddingId/dashboard
```

Response example:

```json
{
  "success": true,
  "data": {
    "wedding": {
      "name": "Ahamed & Fathima Wedding",
      "mainWeddingDate": "2027-01-20",
      "daysRemaining": 52
    },
    "budget": {
      "total": 5000000,
      "committed": 3200000,
      "paid": 2100000,
      "remaining": 1800000
    },
    "tasks": {
      "total": 42,
      "todo": 15,
      "inProgress": 7,
      "done": 20
    },
    "guests": {
      "expected": 350,
      "confirmed": 240,
      "declined": 40,
      "pending": 70
    },
    "vendors": {
      "total": 8
    },
    "upcomingEvents": []
  }
}
```

No Dashboard table is required.

Apply authorized resource scope before calculating counts or selecting previews. Budget amounts require `BUDGET_VIEW`, expense-derived figures require `EXPENSE_VIEW`, and combined figures such as remaining budget require both. Omit unauthorized fields or sections. Collaborator summaries must not reveal unrelated resources.

---

# 28. Wedding Members API

Base:

```text
/api/v1/weddings/:weddingId/members
```

---

# 29. List Wedding Members

```http
GET /api/v1/weddings/:weddingId/members
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "member-uuid",
      "user": {
        "id": "user-uuid",
        "firstName": "Ahamed",
        "email": "ahamed@example.com"
      },
      "role": "OWNER",
      "side": "GROOM",
      "isActive": true
    }
  ]
}
```

---

# 30. Invite Wedding Member

```http
POST /api/v1/weddings/:weddingId/member-invitations
```

An Owner, or an Admin with member-management permission acting within their authorized side and delegated scope, may invite a member. Only an Owner may invite another Owner. An Admin must not grant capabilities they do not possess, including capabilities implied by the invited role.

Request:

```json
{
  "email": "brother@example.com",
  "role": "FAMILY_MEMBER",
  "side": "GROOM"
}
```

Processing:

```text
Check invitation does not already exist
 ↓
Generate secure invitation token
 ↓
Store token hash
 ↓
Send invitation through Resend
```

Response:

```text
201 Created
```

---

# 31. Preview Wedding Member Invitation

Public minimal endpoint:

```http
GET /api/v1/member-invitations/:token
```

Response:

```json
{
  "success": true,
  "data": {
    "weddingName": "Ahamed & Fathima Wedding",
    "email": "brother@example.com",
    "role": "FAMILY_MEMBER",
    "side": "GROOM"
  }
}
```

No sensitive wedding information should be returned.

---

# 32. Accept Wedding Member Invitation

Requires authentication.

```http
POST /api/v1/member-invitations/:token/accept
```

The authenticated user's email must match the invited email.

Processing:

```text
Validate token
 ↓
Check invited email
 ↓
Check invitation not expired
 ↓
Create WeddingMember
 ↓
Set acceptedAt
```

Revalidate the stored invitation's proposed role/capabilities against the inviter's current authority before acceptance grants access. An invitation must not bypass Owner-only ownership rules or Admin delegation limits. The accepting user must be verified. Expired/reissued invitations and inactive-member reinvitation behavior remain implementation-stage questions.

---

# 33. Update Wedding Member

```http
PATCH /api/v1/weddings/:weddingId/members/:memberId
```

Example:

```json
{
  "role": "ADMIN",
  "side": "BRIDE"
}
```

Only Owners can add, remove, or demote Owners. Admins cannot edit Owner memberships or promote anyone to Owner. Admin changes to other members require member-management permission and must stay within their authorized side and delegated scope.

Validate the resulting effective permissions, including role defaults and existing overrides. An Admin cannot grant a capability they do not possess through a role change or removal of a denial. Ownership changes must preserve at least one active Owner using a transaction protected against concurrent changes; reject a last-Owner violation with `409 Conflict`.

---

# 34. Remove Wedding Member

```http
DELETE /api/v1/weddings/:weddingId/members/:memberId
```

Instead of hard deleting:

```text
is_active = false
```

Response:

```text
204 No Content
```

Only Owners may remove Owner memberships. Reject any operation that would leave no active Owner, including concurrent removals/demotions. Admin removal of non-Owners requires member-management permission within authorized scope. Deactivation immediately prevents further use of that membership's resource assignments.

---

# 35. Member Permission API

Get permissions:

```http
GET /api/v1/weddings/:weddingId/members/:memberId/permissions
```

Update permission overrides:

```http
PUT /api/v1/weddings/:weddingId/members/:memberId/permissions
```

Request:

```json
{
  "permissions": {
    "GUEST_VIEW": true,
    "GUEST_MANAGE": true,
    "TASK_VIEW": true,
    "TASK_MANAGE": true,
    "BUDGET_VIEW": false,
    "BUDGET_MANAGE": false,
    "EXPENSE_VIEW": false,
    "EXPENSE_MANAGE": false
  }
}
```

The backend stores permission overrides in `wedding_member_permissions`.

Owners have full wedding access. Admins need member-management permission, cannot modify Owner permissions, and cannot grant capabilities they do not possess, including through replacement/removal of existing overrides. Evaluate the resulting effective capabilities before writing; reject unauthorized changes without partial updates.

`BUDGET_VIEW` and `BUDGET_MANAGE` are separate checks. `EXPENSE_VIEW` protects expense/payment data and vendor financial fields; `EXPENSE_MANAGE` protects financial writes. Manage permission does not imply view permission. For Collaborators, permission overrides alone never grant resource access.

## 35.1 Explicit Collaborator Resource Assignments

Manage explicit assignments through the member API:

```http
GET /api/v1/weddings/:weddingId/members/:memberId/resource-access
PUT /api/v1/weddings/:weddingId/members/:memberId/resource-access
```

The GET response uses the standard success/data envelope with these four arrays. PUT supplies the complete replacement assignment set:

```json
{
  "eventIds": ["event-uuid"],
  "taskIds": ["task-uuid"],
  "vendorIds": ["vendor-uuid"],
  "documentIds": ["document-uuid"]
}
```

All four arrays are required for PUT; an empty array removes assignments of that type. Synchronize the four typed access tables from Database Design Section 17.1 in one transaction. Return `200 OK` with the resulting assignment set.

Owners may manage assignments. An Admin must have member-management permission and may delegate only resources within their own authorized side/scope and capabilities. Validate every target member and resource against the same wedding; reject the entire request if any assignment is unauthorized. Admins cannot use assignment changes to affect Owners. This endpoint does not grant capabilities or broaden the Admin's own access.

Admin GET responses must not disclose assignments outside the caller's authorized scope. Because PUT replaces the complete set, reject an Admin PUT if either the current or proposed assignments include resources outside that scope; do not remove unseen assignments. Validate removals as well as additions.

Each event, task, vendor, and document requires its own assignment. Assigning an event does not assign its related records. Task responsibility through `assignedMemberId` does not replace a task access row. Removing an assignment revokes that resource access for a Collaborator.

Resource creation by a Collaborator requires an authorized workflow that establishes the explicit assignment atomically; a creation permission must not permit arbitrary self-assignment or access to existing unassigned records.

---

# 36. Event API

Base:

```text
/api/v1/weddings/:weddingId/events
```

Event reads/lists/updates use the capability, authorized-side, and explicit-assignment rules in Section 90. Omit `budgetAmount` without `BUDGET_VIEW`, including nested and mutation responses.

---

# 37. List Events

```http
GET /api/v1/weddings/:weddingId/events
```

Optional filters:

```text
?side=BRIDE
?side=GROOM
?side=BOTH
?upcoming=true
```

---

# 38. Create Event

```http
POST /api/v1/weddings/:weddingId/events
```

Request:

```json
{
  "name": "Wedding Ceremony",
  "description": "Main wedding ceremony",
  "side": "BOTH",
  "startsAt": "2027-01-20T10:00:00+05:30",
  "endsAt": "2027-01-20T15:00:00+05:30",
  "venueName": "Grand Ballroom",
  "address": "Colombo, Sri Lanka",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "budgetAmount": 2000000
}
```

Status:

```text
201 Created
```

Supplying `budgetAmount` requires `BUDGET_MANAGE` in addition to event-creation authorization. Creation must not bypass field-level financial checks.

---

# 39. Get Event

```http
GET /api/v1/weddings/:weddingId/events/:eventId
```

---

# 40. Update Event

```http
PATCH /api/v1/weddings/:weddingId/events/:eventId
```

Example:

```json
{
  "venueName": "New Venue",
  "budgetAmount": 2200000
}
```

Changing `budgetAmount` requires `BUDGET_MANAGE` in addition to event/resource authorization. A general event-management permission is insufficient. Reject mixed requests containing unauthorized fields before any write; omit budget values from the response without `BUDGET_VIEW`.

---

# 41. Delete Event

```http
DELETE /api/v1/weddings/:weddingId/events/:eventId
```

Before deletion, the backend should check connected:

```text
Guests
Expenses
Vendors
Tasks
Documents
```

If significant dependent data exists, return a conflict or require explicit handling.

---

# 42. Task API

Base:

```text
/api/v1/weddings/:weddingId/tasks
```

Collaborator task access requires the relevant capability and an explicit `member_task_access` row. Lists, details, updates, and nested event/member references must all respect authorized resource scope.

---

# 43. List Tasks

```http
GET /api/v1/weddings/:weddingId/tasks
```

Filters:

```text
?status=TODO
?eventId=uuid
?assignedMemberId=uuid
?page=1
?limit=20
```

---

# 44. Create Task

```http
POST /api/v1/weddings/:weddingId/tasks
```

Request:

```json
{
  "eventId": "optional-event-uuid",
  "title": "Confirm Photographer",
  "description": "Call and finalize the photographer",
  "assignedMemberId": "member-uuid",
  "dueAt": "2026-12-10T18:00:00+05:30",
  "status": "TODO"
}
```

---

# 45. Get Task

```http
GET /api/v1/weddings/:weddingId/tasks/:taskId
```

---

# 46. Update Task

```http
PATCH /api/v1/weddings/:weddingId/tasks/:taskId
```

Example:

```json
{
  "status": "DONE"
}
```

---

# 47. Delete Task

```http
DELETE /api/v1/weddings/:weddingId/tasks/:taskId
```

Response:

```text
204 No Content
```

---

# 48. Budget API Design

The database intentionally has no separate Budget table.

Therefore budget management uses Wedding and Event APIs.

Update wedding budget:

```http
PATCH /api/v1/weddings/:weddingId
```

```json
{
  "budgetAmount": 5000000
}
```

Update event budget:

```http
PATCH /api/v1/weddings/:weddingId/events/:eventId
```

```json
{
  "budgetAmount": 1500000
}
```

Budget summaries are calculated from Expenses.

`BUDGET_VIEW` controls viewing wedding/event budget amounts. `BUDGET_MANAGE` controls modifying them, including through the general wedding/event endpoints. Neither permission implies the other. Budget editing does not grant access to other wedding settings.

---

# 49. Budget Summary

For a detailed budget page:

```http
GET /api/v1/weddings/:weddingId/budget-summary
```

Response:

```json
{
  "success": true,
  "data": {
    "overall": {
      "budget": 5000000,
      "committed": 3500000,
      "paid": 2500000,
      "remaining": 1500000,
      "outstanding": 1000000
    },
    "events": [
      {
        "eventId": "uuid",
        "eventName": "Wedding",
        "budget": 2000000,
        "committed": 1600000,
        "paid": 1000000,
        "remaining": 400000
      }
    ]
  }
}
```

Budget values require `BUDGET_VIEW`; committed/paid/outstanding figures require `EXPENSE_VIEW`; combined remaining-budget figures require both. Omit fields without the required viewing permissions and scope event entries and aggregates to authorized resources. Deny the endpoint if the caller has no permission to view any of its financial data.

---

# 50. Expense API

Base:

```text
/api/v1/weddings/:weddingId/expenses
```

Expense reads require `EXPENSE_VIEW`; writes require `EXPENSE_MANAGE`, alongside the applicable wedding and resource restrictions. Financial capabilities do not expand Collaborator resource scope: assignment to an event or vendor does not grant direct access to raw expense records.

---

# 51. List Expenses

```http
GET /api/v1/weddings/:weddingId/expenses
```

Filters:

```text
?eventId=uuid
?vendorId=uuid
?payer=BRIDE_FAMILY
?category=Photography
?page=1
?limit=20
```

---

# 52. Create Expense

```http
POST /api/v1/weddings/:weddingId/expenses
```

Request:

```json
{
  "eventId": "event-uuid",
  "vendorId": "vendor-uuid",
  "name": "Photography Package",
  "category": "Photography",
  "amount": 250000,
  "paidAmount": 100000,
  "payer": "GROOM_FAMILY",
  "expenseDate": "2026-12-01",
  "notes": "Advance payment completed"
}
```

Backend derives:

```text
paymentStatus
```

from:

```text
amount
paidAmount
```

---

# 53. Update Expense

```http
PATCH /api/v1/weddings/:weddingId/expenses/:expenseId
```

Example:

```json
{
  "paidAmount": 250000
}
```

---

# 54. Delete Expense

```http
DELETE /api/v1/weddings/:weddingId/expenses/:expenseId
```

---

# 55. Vendor Discovery API

Vendor discovery uses Google Places.

Base:

```text
/api/v1/vendor-discovery
```

Authentication required.

---

# 56. Search Nearby Vendors

```http
GET /api/v1/vendor-discovery/search
```

Query:

```text
?category=PHOTOGRAPHER
&latitude=6.9271
&longitude=79.8612
&radius=10000
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "placeId": "google-place-id",
      "name": "ABC Photography",
      "address": "Colombo",
      "latitude": 6.9,
      "longitude": 79.8,
      "phone": "+9411XXXXXXX"
    }
  ]
}
```

The exact returned Google fields will depend on the implementation and permitted usage.

---

# 57. Wedding Vendor API

Base:

```text
/api/v1/weddings/:weddingId/vendors
```

Collaborator access requires an explicit vendor assignment and the relevant capability. Vendor list/detail/mutation responses must omit `agreedPrice`, `paidAmount`, `remainingAmount`, payment status, and other restricted financial fields without `EXPENSE_VIEW`. Assignment does not grant access to raw linked expenses or unassigned events/documents.

---

# 58. List Wedding Vendors

```http
GET /api/v1/weddings/:weddingId/vendors
```

Filters:

```text
?category=PHOTOGRAPHER
?eventId=uuid
?page=1
?limit=20
```

---

# 59. Add Google Vendor to Wedding

```http
POST /api/v1/weddings/:weddingId/vendors
```

Request:

```json
{
  "source": "GOOGLE_PLACES",
  "googlePlaceId": "google-place-id",
  "category": "PHOTOGRAPHER",
  "agreedPrice": 250000,
  "currency": "LKR",
  "notes": "Includes wedding album",
  "eventIds": [
    "event-1",
    "event-2"
  ]
}
```

---

# 60. Add Manual Vendor

Same endpoint:

```http
POST /api/v1/weddings/:weddingId/vendors
```

Request:

```json
{
  "source": "MANUAL",
  "manualName": "ABC Decorations",
  "manualPhone": "+94771234567",
  "manualAddress": "Colombo",
  "category": "DECORATOR",
  "agreedPrice": 300000,
  "currency": "LKR",
  "eventIds": [
    "event-uuid"
  ]
}
```

---

# 61. Get Wedding Vendor

```http
GET /api/v1/weddings/:weddingId/vendors/:vendorId
```

Response may contain calculated financial values:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "category": "PHOTOGRAPHER",
    "agreedPrice": 250000,
    "paidAmount": 100000,
    "remainingAmount": 150000,
    "events": []
  }
}
```

`paidAmount` and `remainingAmount` are calculated from Expenses.

The example assumes `EXPENSE_VIEW`. Omit the financial fields for other callers and filter nested events to authorized records. A non-financial vendor view must not reveal amounts through alternative field names or derived summaries.

---

# 62. Update Wedding Vendor

```http
PATCH /api/v1/weddings/:weddingId/vendors/:vendorId
```

Example:

```json
{
  "agreedPrice": 275000,
  "notes": "Added extra album"
}
```

Changing `agreedPrice` requires `EXPENSE_MANAGE` in addition to vendor-management and resource authorization. The same check applies when supplying an agreed price during vendor creation (Sections 59–60). Validate mixed updates before any write and filter their responses independently by viewing permissions.

---

# 63. Update Vendor Event Assignments

```http
PUT /api/v1/weddings/:weddingId/vendors/:vendorId/events
```

Request:

```json
{
  "eventIds": [
    "event-uuid-1",
    "event-uuid-2"
  ]
}
```

The backend synchronizes `vendor_events`.

---

# 64. Remove Wedding Vendor

```http
DELETE /api/v1/weddings/:weddingId/vendors/:vendorId
```

The backend should validate linked Expenses/Documents before destructive removal.

---

# 65. Guest API

Base:

```text
/api/v1/weddings/:weddingId/guests
```

---

# 66. List Guests

```http
GET /api/v1/weddings/:weddingId/guests
```

Filters:

```text
?side=BRIDE
?type=FAMILY
?eventId=uuid
?search=Ruwan
?page=1
?limit=20
```

---

# 67. Create Guest

```http
POST /api/v1/weddings/:weddingId/guests
```

Request:

```json
{
  "type": "FAMILY",
  "displayName": "Mr. Ruwan & Family",
  "side": "BRIDE",
  "expectedCount": 4,
  "phoneNumber": "+94771234567",
  "events": [
    {
      "eventId": "wedding-event",
      "invitedCount": 4
    },
    {
      "eventId": "reception-event",
      "invitedCount": 2
    }
  ]
}
```

Processing should use a transaction:

```text
Create Guest
+
Create GuestEvents
```

---

# 68. Get Guest

```http
GET /api/v1/weddings/:weddingId/guests/:guestId
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "FAMILY",
    "displayName": "Mr. Ruwan & Family",
    "side": "BRIDE",
    "expectedCount": 4,
    "phoneNumber": "+94771234567",
    "events": [
      {
        "eventId": "uuid",
        "eventName": "Wedding",
        "invitedCount": 4,
        "rsvp": {
          "status": "ATTENDING",
          "attendingCount": 4
        }
      }
    ]
  }
}
```

---

# 69. Update Guest

```http
PATCH /api/v1/weddings/:weddingId/guests/:guestId
```

Example:

```json
{
  "displayName": "Mr. Ruwan Perera & Family",
  "expectedCount": 5
}
```

---

# 70. Update Guest Event Assignments

```http
PUT /api/v1/weddings/:weddingId/guests/:guestId/events
```

Request:

```json
{
  "events": [
    {
      "eventId": "wedding-event",
      "invitedCount": 5
    },
    {
      "eventId": "reception-event",
      "invitedCount": 3
    }
  ]
}
```

This endpoint synchronizes GuestEvent records.

---

# 71. Delete Guest

```http
DELETE /api/v1/weddings/:weddingId/guests/:guestId
```

The backend should handle associated:

```text
GuestEvents
RSVPs
Invitation
```

inside a transaction.

---

# 72. Invitation Management API

Wedding administrators manage invitations through:

```text
/api/v1/weddings/:weddingId/guests/:guestId/invitation
```

---

# 73. Create Guest Invitation

```http
POST /api/v1/weddings/:weddingId/guests/:guestId/invitation
```

Processing:

```text
Generate secure random token
 ↓
Store token hash
 ↓
Return invitation URL
```

Response:

```json
{
  "success": true,
  "data": {
    "invitationUrl": "https://makemymarriage.lk/invite/raw-token"
  }
}
```

The frontend can use this URL with WhatsApp sharing.

The backend itself does not need to send WhatsApp messages in the MVP.

---

# 74. Get Invitation Information

```http
GET /api/v1/weddings/:weddingId/guests/:guestId/invitation
```

Returns:

```json
{
  "success": true,
  "data": {
    "createdAt": "2026-12-01T10:00:00Z",
    "revoked": false,
    "expiresAt": null
  }
}
```

The raw token should not be returned again after creation.

---

# 75. Regenerate Invitation

```http
POST /api/v1/weddings/:weddingId/guests/:guestId/invitation/regenerate
```

Processing:

```text
Revoke existing invitation
 ↓
Generate new token
 ↓
Store new token hash
 ↓
Return new public URL
```

---

# 76. Revoke Invitation

```http
DELETE /api/v1/weddings/:weddingId/guests/:guestId/invitation
```

Processing:

```text
revoked_at = current timestamp
```

---

# 77. Public Invitation API

These endpoints do not require normal authentication.

Base:

```text
/api/v1/public/invitations/:token
```

---

# 78. View Digital Invitation

```http
GET /api/v1/public/invitations/:token
```

Processing:

```text
Hash token
 ↓
Find Invitation
 ↓
Check not revoked
 ↓
Check expiry if applicable
 ↓
Load Guest
 ↓
Load invited Events
 ↓
Load existing RSVP responses
```

Example response:

```json
{
  "success": true,
  "data": {
    "wedding": {
      "brideName": "Fathima",
      "groomName": "Ahamed"
    },
    "guest": {
      "displayName": "Mr. Ruwan & Family"
    },
    "events": [
      {
        "guestEventId": "uuid",
        "name": "Wedding Ceremony",
        "startsAt": "2027-01-20T10:00:00+05:30",
        "venueName": "Grand Ballroom",
        "address": "Colombo",
        "invitedCount": 4,
        "rsvp": {
          "status": "PENDING",
          "attendingCount": 0
        }
      }
    ]
  }
}
```

Only invitation-safe data should be returned.

---

# 79. Submit or Update RSVP

Use `PUT` because the same guest may update an existing response.

```http
PUT /api/v1/public/invitations/:token/rsvp
```

Request:

```json
{
  "responses": [
    {
      "guestEventId": "uuid-1",
      "status": "ATTENDING",
      "attendingCount": 4
    },
    {
      "guestEventId": "uuid-2",
      "status": "NOT_ATTENDING",
      "attendingCount": 0
    }
  ]
}
```

Validation:

```text
GuestEvent belongs to invited guest
+
status is valid
+
attendingCount <= invitedCount
```

Processing should use a transaction.

Response:

```json
{
  "success": true,
  "data": {
    "message": "RSVP updated successfully."
  }
}
```

---

# 80. RSVP Management for Organizers

Organizers can see RSVP statistics:

```http
GET /api/v1/weddings/:weddingId/rsvp-summary
```

Optional:

```text
?eventId=uuid
```

Response:

```json
{
  "success": true,
  "data": {
    "invited": 350,
    "attending": 240,
    "notAttending": 40,
    "pending": 70,
    "expectedAttendees": 280
  }
}
```

---

# 81. Document API

Base:

```text
/api/v1/weddings/:weddingId/documents
```

Files themselves are stored in Amazon S3.

Collaborators require document-management/viewing capability as appropriate and an explicit document assignment; a linked event/vendor assignment is insufficient. These rules cover metadata lists, upload authorization/confirmation, download URLs, and deletion. Financial documents additionally require the relevant financial viewing permission. The upload workflow must not create a path to unrelated documents or bypass assignment checks; completion details remain open under PRD Section 41.

---

# 82. Request Upload URL

```http
POST /api/v1/weddings/:weddingId/documents/upload-url
```

Request:

```json
{
  "fileName": "photographer-quotation.pdf",
  "mimeType": "application/pdf",
  "fileSize": 245000,
  "documentType": "QUOTATION",
  "vendorId": "optional-vendor-uuid",
  "eventId": null,
  "expenseId": null
}
```

Backend:

```text
Validate permission
 ↓
Validate file type and size
 ↓
Generate S3 key
 ↓
Generate presigned upload URL
```

Response:

```json
{
  "success": true,
  "data": {
    "uploadUrl": "temporary-s3-presigned-url",
    "s3Key": "weddings/.../document.pdf"
  }
}
```

---

# 83. Confirm Document Upload

After successful S3 upload:

```http
POST /api/v1/weddings/:weddingId/documents
```

Request:

```json
{
  "fileName": "photographer-quotation.pdf",
  "s3Key": "weddings/.../document.pdf",
  "mimeType": "application/pdf",
  "fileSize": 245000,
  "documentType": "QUOTATION",
  "vendorId": "vendor-uuid"
}
```

Response:

```text
201 Created
```

---

# 84. List Documents

```http
GET /api/v1/weddings/:weddingId/documents
```

Filters:

```text
?eventId=uuid
?vendorId=uuid
?expenseId=uuid
?documentType=RECEIPT
?page=1
?limit=20
```

---

# 85. Get Document Download URL

```http
GET /api/v1/weddings/:weddingId/documents/:documentId/download-url
```

Backend validates authorization then generates a temporary S3 download URL.

Response:

```json
{
  "success": true,
  "data": {
    "downloadUrl": "temporary-presigned-url"
  }
}
```

---

# 86. Delete Document

```http
DELETE /api/v1/weddings/:weddingId/documents/:documentId
```

Processing:

```text
Validate permission
 ↓
Delete S3 object
 ↓
Delete Document metadata
```

Response:

```text
204 No Content
```

---

# 87. Pagination

List APIs should support:

```text
?page=1
&limit=20
```

Default:

```text
page = 1
limit = 20
```

Maximum:

```text
limit = 100
```

Response:

```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 235,
    "totalPages": 12
  }
}
```

---

# 88. Search

Relevant list endpoints should support:

```text
?search=
```

Examples:

```text
GET /guests?search=Ruwan

GET /vendors?search=Photography
```

Search should only operate inside the requested Wedding.

---

# 89. Sorting

Where useful:

```text
?sortBy=createdAt
&sortOrder=desc
```

Only approved sortable fields should be accepted.

Never directly pass arbitrary frontend field names into SQL ordering.

---

# 90. Wedding-Scoped Authorization Middleware

Example middleware chain:

```text
authenticateUser
      ↓
loadWeddingMember
      ↓
requirePermission("GUEST_MANAGE")
      ↓
validateRequest
      ↓
controller
```

Example route:

```text
POST /weddings/:weddingId/guests
```

The middleware loads:

```text
currentUser
currentWedding
currentWeddingMember
role
side
permissions
```

for later services.

For every wedding-scoped operation, enforce the finalized rules:

1. Require active membership in the requested wedding.
2. Owners have full wedding access. Only Owners may manage ownership.
3. Admins remain within their authorized side and delegated capabilities; Family Members have only permitted capabilities.
4. Collaborators require the relevant capability and a matching explicit assignment to each accessed event, task, vendor, or document. Module permissions and matching side alone are insufficient.
5. Validate related IDs and filter nested data independently. Event access does not grant access to its tasks, vendors, documents, guests, or expenses. Apply restrictions before list pagination, search, counts, and dashboard aggregation.
6. Validate every financial write and omit restricted financial response fields using the rules below.

| Data/action | Required financial capability, in addition to resource authorization |
|---|---|
| View wedding/event budget amount | `BUDGET_VIEW` |
| Create/change wedding/event budget amount | `BUDGET_MANAGE` |
| View expense-derived totals, payer/payment information, vendor agreed/paid/remaining amounts or payment status | `EXPENSE_VIEW` |
| Modify expense financial data or vendor agreed price | `EXPENSE_MANAGE`, plus relevant module-management capability |
| View remaining budget or another figure combining budget and expenses | Both `BUDGET_VIEW` and `EXPENSE_VIEW` |

Viewing and modification are separate checks. Owners have all capabilities. Financial permissions never bypass resource assignment or side restrictions. Build authorized response objects before sending data; never return raw Prisma objects containing restricted values. These rules also apply to nested, list, create/update, and dashboard responses.

Admin delegation must be checked against the resulting effective access, including role defaults and override removal. No endpoint, including invitations and assignment management, may bypass Owner-only ownership actions or permit an Admin to grant capabilities they do not possess.

---

# 91. Side-Based Authorization

Certain event operations may require side validation.

Example:

```text
Member side:
BRIDE

Event side:
GROOM
```

For a non-Owner whose authorized side excludes that event:

```text
403 Forbidden
```

Possible rule:

```text
BOTH
→ access according to role/permission

BRIDE
→ Bride-side or BOTH users

GROOM
→ Groom-side or BOTH users
```

Owners have full wedding access. Admins do not receive an automatic side override; their operations and delegation must stay within their authorized side. For Collaborators, an explicit assignment is an additional requirement and does not bypass side checks. The example above illustrates side matching; all capability and resource checks still apply.

---

# 92. Wedding Data Isolation

Every wedding-scoped request must query using both:

```text
resourceId
+
weddingId
```

Wrong:

```text
find expense where
id = expenseId
```

Correct:

```text
find expense where
id = expenseId
AND
weddingId = currentWeddingId
```

This prevents cross-wedding access.

---

# 93. Database Transactions

Use Prisma transactions for operations that modify multiple related records.

Examples:

```text
Create Wedding
+
Create Owner WeddingMember
```

```text
Create Guest
+
Create GuestEvents
```

```text
Accept Wedding Member Invitation
+
Create WeddingMember
+
Mark Invitation accepted
```

```text
Submit multiple RSVP responses
```

```text
Delete Guest
+
GuestEvents
+
RSVP
+
Invitation
```

If one operation fails, the entire transaction should roll back.

Ownership changes must preserve at least one active Owner under concurrent requests, for example by locking the wedding row before checking and mutating memberships. Resource-assignment replacement and authorized creation-plus-assignment must also be atomic. Any delegation failure must roll back the entire change.

---

# 94. Rate Limiting

Rate limit security-sensitive APIs.

Especially:

```text
POST /auth/login
POST /auth/register
POST /auth/resend-verification
POST /auth/forgot-password
POST /auth/reset-password
PUT /public/invitations/:token/rsvp
```

When exceeded:

```text
429 Too Many Requests
```

---

# 95. Request Validation

All request bodies, route parameters, and important query parameters should be validated with Zod.

Example:

```text
POST /expenses
      ↓
CreateExpenseSchema
      ↓
Controller
```

Invalid payloads never reach business logic.

---

# 96. API Security

The API should enforce:

```text
Authentication
Authorization
Input validation
Rate limiting
Wedding data isolation
Explicit Collaborator resource assignments
Owner-only ownership changes and last-active-Owner invariant
Admin delegation limits
Backend financial-field projection and separate budget view/manage checks
Secure password hashing
Refresh-token session validation
Private S3 documents
Invitation token validation
```

The frontend must never be treated as the security boundary.

---

# 97. Logging

The MVP will use:

```text
console.log()
console.error()
```

Examples:

```text
console.log("Wedding created", weddingId)

console.error("Guest creation failed", error)
```

Do not log:

```text
Passwords
Password hashes
Access tokens
Refresh tokens
Invitation tokens
Verification tokens
Reset tokens
```

---

# 98. Main API Modules

The Express application will contain:

```text
auth
users

weddings
members

dashboard

events
tasks

expenses

vendors
vendor-discovery

guests
invitations
rsvp

documents
```

---

# 99. API Route Summary

```text
AUTH

POST   /api/v1/auth/register
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/resend-verification
POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password


USER

PATCH  /api/v1/users/me


WEDDINGS

GET    /api/v1/weddings
POST   /api/v1/weddings

GET    /api/v1/weddings/:weddingId
PATCH  /api/v1/weddings/:weddingId
DELETE /api/v1/weddings/:weddingId

GET    /api/v1/weddings/:weddingId/dashboard
GET    /api/v1/weddings/:weddingId/budget-summary
GET    /api/v1/weddings/:weddingId/rsvp-summary


MEMBERS

GET    /api/v1/weddings/:weddingId/members

POST   /api/v1/weddings/:weddingId/member-invitations

GET    /api/v1/member-invitations/:token
POST   /api/v1/member-invitations/:token/accept

PATCH  /api/v1/weddings/:weddingId/members/:memberId
DELETE /api/v1/weddings/:weddingId/members/:memberId

GET    /api/v1/weddings/:weddingId/members/:memberId/permissions
PUT    /api/v1/weddings/:weddingId/members/:memberId/permissions

GET    /api/v1/weddings/:weddingId/members/:memberId/resource-access
PUT    /api/v1/weddings/:weddingId/members/:memberId/resource-access


EVENTS

GET    /api/v1/weddings/:weddingId/events
POST   /api/v1/weddings/:weddingId/events

GET    /api/v1/weddings/:weddingId/events/:eventId
PATCH  /api/v1/weddings/:weddingId/events/:eventId
DELETE /api/v1/weddings/:weddingId/events/:eventId


TASKS

GET    /api/v1/weddings/:weddingId/tasks
POST   /api/v1/weddings/:weddingId/tasks

GET    /api/v1/weddings/:weddingId/tasks/:taskId
PATCH  /api/v1/weddings/:weddingId/tasks/:taskId
DELETE /api/v1/weddings/:weddingId/tasks/:taskId


EXPENSES

GET    /api/v1/weddings/:weddingId/expenses
POST   /api/v1/weddings/:weddingId/expenses

GET    /api/v1/weddings/:weddingId/expenses/:expenseId
PATCH  /api/v1/weddings/:weddingId/expenses/:expenseId
DELETE /api/v1/weddings/:weddingId/expenses/:expenseId


VENDOR DISCOVERY

GET    /api/v1/vendor-discovery/search


WEDDING VENDORS

GET    /api/v1/weddings/:weddingId/vendors
POST   /api/v1/weddings/:weddingId/vendors

GET    /api/v1/weddings/:weddingId/vendors/:vendorId
PATCH  /api/v1/weddings/:weddingId/vendors/:vendorId
DELETE /api/v1/weddings/:weddingId/vendors/:vendorId

PUT    /api/v1/weddings/:weddingId/vendors/:vendorId/events


GUESTS

GET    /api/v1/weddings/:weddingId/guests
POST   /api/v1/weddings/:weddingId/guests

GET    /api/v1/weddings/:weddingId/guests/:guestId
PATCH  /api/v1/weddings/:weddingId/guests/:guestId
DELETE /api/v1/weddings/:weddingId/guests/:guestId

PUT    /api/v1/weddings/:weddingId/guests/:guestId/events


GUEST INVITATIONS

POST   /api/v1/weddings/:weddingId/guests/:guestId/invitation
GET    /api/v1/weddings/:weddingId/guests/:guestId/invitation
POST   /api/v1/weddings/:weddingId/guests/:guestId/invitation/regenerate
DELETE /api/v1/weddings/:weddingId/guests/:guestId/invitation


PUBLIC INVITATION / RSVP

GET    /api/v1/public/invitations/:token

PUT    /api/v1/public/invitations/:token/rsvp


DOCUMENTS

POST   /api/v1/weddings/:weddingId/documents/upload-url
POST   /api/v1/weddings/:weddingId/documents

GET    /api/v1/weddings/:weddingId/documents

GET    /api/v1/weddings/:weddingId/documents/:documentId/download-url

DELETE /api/v1/weddings/:weddingId/documents/:documentId
```

---

# 100. Example Complete Guest Flow

```text
POST /weddings/:weddingId/guests
        ↓
Create Guest
        ↓
Create GuestEvents
        ↓
POST /guests/:guestId/invitation
        ↓
Generate Invitation URL
        ↓
Share URL through WhatsApp
        ↓
Guest opens link
        ↓
GET /public/invitations/:token
        ↓
Guest views Events
        ↓
PUT /public/invitations/:token/rsvp
        ↓
RSVP records created/updated
        ↓
Organizer dashboard updates
```

---

# 101. Example Complete Vendor Flow

```text
User opens Vendor Discovery
        ↓
GET /vendor-discovery/search
        ↓
Google Places results
        ↓
User selects vendor
        ↓
POST /weddings/:weddingId/vendors
        ↓
WeddingVendor created
        ↓
Assign Vendor to Events
        ↓
Create Expense
        ↓
Upload Quotation / Contract
        ↓
Vendor appears in My Vendors
```

---

# 102. Example Complete Wedding Setup Flow

```text
User registers
        ↓
Email verification
        ↓
Login
        ↓
POST /weddings
        ↓
Wedding created
        ↓
Owner membership created
        ↓
Create Events
        ↓
Invite family members
        ↓
Configure permissions
        ↓
Add Tasks
        ↓
Set budgets
        ↓
Start planning wedding
```

---

# 103. API Design Principles

The API should remain:

```text
Simple
Predictable
RESTful
Wedding-scoped
Permission-aware
Secure
Easy to understand
Easy to test
```

Business logic belongs in Services.

HTTP handling belongs in Controllers.

Database access belongs in repositories/Prisma.

Validation belongs in Zod schemas.

Authentication and authorization belong in reusable middleware.

---

# 104. Final API Architecture

```text
                     Next.js
                        │
                        ▼
                     Nginx
                        │
                        ▼
                  Express REST API
                        │
        ┌───────────────┼──────────────────┐
        │               │                  │
        ▼               ▼                  ▼

 Authentication     Business Modules    Integrations

 Auth               Weddings            Resend
 Sessions           Members             Google Places
 Email Verify       Events              Amazon S3
 Password Reset     Tasks
                    Expenses
                    Vendors
                    Guests
                    RSVP
                    Documents

                        │
                        ▼
                     Prisma
                        │
                        ▼
                  PostgreSQL RDS
```

---

# 105. Final API Design Decision

The Make My Marriage MVP will use a versioned REST API:

```text
/api/v1
```

with:

```text
JWT + Session Authentication
Wedding-scoped authorization
Role + Permission + Side + Explicit Resource Assignment checks
Owner-only ownership management and at least one active Owner
Admin delegation limits
Backend financial-field filtering and separate budget view/manage checks
Zod request validation
Prisma transactions
Consistent response structures
Public token-based guest invitation APIs
Direct S3 document uploads
Google Places vendor discovery
```

This API design directly supports the approved PRD, database design, and system architecture without introducing additional infrastructure or unnecessary complexity.

---

# 106. Implementation-Stage Questions

Retain the six groups in [PRD Section 41](PRD.md#41-implementation-stage-questions) as open questions: guest invitation persistence/sharing, member invitation lifecycle, financial boundaries, guest/RSVP statistics, incomplete API contracts, and lifecycle/operational details.

In particular, invitation regeneration/storage and later resharing, inactive-member reinvitation, currency/decimal/overpayment rules, group-versus-person counting and cross-event totals, and reduced invited counts are not finalized here. Dashboard outstanding-payment/vendor details, payer summaries, Google Places View Details, and typed-location lookup contracts still need completion within approved scope.

Archive/deletion behavior, upload completion/failure handling, and production HTTPS/secrets remain open. Authentication now uses a 15-minute access JWT, a fixed seven-day refresh session, a 24-hour verification token, refresh-token rotation, protected-request Session checks, the Section 14 concurrent/stale-token behavior, and exact trusted-Origin checks on cookie-changing routes. Logout-all remains optional. Existing example payloads and flows do not silently settle the remaining questions, and none of them override the finalized access or financial-security rules.
