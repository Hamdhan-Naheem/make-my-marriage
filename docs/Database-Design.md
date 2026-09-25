# Make My Marriage

## Database Design

**Version:** 1.0  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Hosting:** Amazon RDS  
**Architecture:** Relational Database  
**Application Stage:** MVP

---

# 1. Purpose

This document defines the database design for the Make My Marriage MVP.

The database must support:

- User authentication
- Sessions
- Email verification
- Password reset
- Multiple weddings per user
- Wedding roles and permissions
- Bride/Groom/Both-side access
- Multiple wedding events
- Tasks
- Budgets
- Expenses
- Vendors
- Google Places vendor discovery
- Guests
- Event-specific guest lists
- Invitations
- RSVP
- Documents

The database will use PostgreSQL because the application contains a large number of connected entities and many-to-many relationships.

---

# 2. Database Design Principles

The database should follow several principles.

## Relational Integrity

Relationships should use foreign keys wherever possible.

Example:

```text
Wedding
   ↓
Event
```

An Event cannot exist without a Wedding.

---

## Avoid Duplicate Data

Information that can reliably be calculated should generally not be stored twice.

For example:

```text
Wedding Budget
LKR 5,000,000

Expenses
LKR 3,000,000
```

We do not need to store:

```text
spent = 3,000,000
remaining = 2,000,000
```

These can be calculated.

Similarly:

```text
Vendor agreed price = 250,000
Vendor-related paid expenses = 100,000
```

The application can calculate:

```text
Remaining = 150,000
```

This avoids inconsistent data.

---

## UUID Primary Keys

Primary keys should use UUIDs rather than sequential integer IDs.

Example:

```text
id = "550e8400-e29b-41d4-a716-446655440000"
```

Advantages include:

- Difficult to guess IDs
- Suitable for distributed systems later
- Safe for public-facing resource identifiers

---

## UTC Timestamps

Database timestamps should be stored using PostgreSQL:

```text
TIMESTAMPTZ
```

and stored in UTC.

The frontend can display them according to the user's local timezone.

---

## Monetary Values

Money should never use floating-point numbers.

Use:

```text
DECIMAL / NUMERIC
```

Example:

```text
NUMERIC(14,2)
```

This is suitable for values such as:

```text
5000000.00 LKR
```

---

# 3. High-Level Entity Relationship

```text
User
 │
 ├── Session
 ├── EmailVerificationToken
 ├── PasswordResetToken
 │
 └── WeddingMember
          ├── MemberEventAccess / MemberTaskAccess
          ├── MemberVendorAccess / MemberDocumentAccess
          │
          ▼
       Wedding
          │
          ├── WeddingMember
          ├── WeddingMemberInvitation
          ├── Event
          │     └── Task
          │
          ├── Expense
          ├── WeddingVendor
          │      └── VendorEvent
          │
          ├── Guest
          │      └── GuestEvent
          │             └── RSVP
          │
          ├── Invitation
          │
          └── Document
```

---

# 4. Authentication Entities

Authentication will ultimately require four primary entities:

```text
User
Session
EmailVerificationToken
PasswordResetToken
```

The first authentication database milestone creates `User`, `Session`, and
`EmailVerificationToken` only. `PasswordResetToken` remains part of the
approved password-recovery design and will be added with that later milestone.

---

# 5. User Table

The `users` table stores registered application users.

```text
users
-----------------------------------------
id
email
password_hash
first_name
last_name
email_verified_at
created_at
updated_at
```

## Fields

### id

```text
UUID
Primary Key
```

### email

```text
VARCHAR
UNIQUE
NOT NULL
```

Emails should be normalized to lowercase before storage.

Example:

```text
AHAMED@gmail.com
```

becomes:

```text
ahamed@gmail.com
```

### password_hash

Stores the Argon2id password hash.

Raw passwords must never be stored.

### first_name

User's first name.

### last_name

Optional last name.

### email_verified_at

Nullable timestamp.

If:

```text
NULL
```

the email has not been verified.

If:

```text
2026-09-20T08:20:00Z
```

the account has been verified.

### created_at

Account creation timestamp.

### updated_at

Last account update.

---

# 6. Session Table

The `sessions` table manages refresh-token sessions.

```text
sessions
-----------------------------------------
id
user_id
refresh_token_hash
refresh_token_version
last_rotated_at
user_agent
expires_at
revoked_at
created_at
```

Relationships:

```text
User
  1
  │
  ▼
  N
Session
```

One user can have multiple active sessions.

Example:

```text
Laptop
Mobile Browser
Work Computer
```

## Important

The raw refresh token is never stored.

Only:

```text
refresh_token_hash
```

is stored.

The hash is a 64-character hexadecimal SHA-256 digest of a cryptographically
secure refresh token. `refresh_token_version` and `last_rotated_at` support
atomic rotation, concurrent-refresh handling, and stale-token reuse detection
without storing raw or historical refresh tokens. Rotation replaces the hash
but does not extend the session's fixed seven-day `expires_at` value.

Access JWTs reference the Session row. Protected requests will check that the
referenced session is still active and unexpired so logout can promptly revoke
subsequent access.

### revoked_at

If NULL:

```text
Session active
```

If populated:

```text
Session revoked
```

---

# 7. Email Verification Token

```text
email_verification_tokens
-----------------------------------------
id
user_id
token_hash
expires_at
used_at
created_at
```

Flow:

```text
Register
 ↓
Create token
 ↓
Hash token
 ↓
Store token hash
 ↓
Send raw token through Resend
 ↓
User clicks link
 ↓
Hash supplied token
 ↓
Compare
 ↓
Verify email
```

The raw token should never be stored.

Verification tokens expire after 24 hours and are single-use. They are created
from cryptographically secure random bytes and stored only as 64-character
hexadecimal SHA-256 hashes. Each user has at most one current verification-token
record. Resending replaces that record's hash and expiry, invalidating every
previous unused link. Email verification must update `used_at` and the user's
`email_verified_at` together in one transaction.

---

# 8. Password Reset Token

```text
password_reset_tokens
-----------------------------------------
id
user_id
token_hash
expires_at
used_at
created_at
```

Once the password has been successfully changed:

```text
used_at = current timestamp
```

All active user sessions should then be revoked.

---

# 9. Wedding Table

The `weddings` table represents one wedding workspace.

```text
weddings
-----------------------------------------
id
name
bride_name
groom_name
management_type
main_wedding_date (nullable)
created_by_user_id
created_at
updated_at
archived_at
```

The initial wedding-creation migration stores the workspace identity, management type, optional main wedding date, creator, and lifecycle timestamps. `budget_amount` and `currency` remain part of the approved future budget design in Section 11 and will be added with that feature rather than collected during onboarding.

---

# 10. Wedding Management Type

`management_type` uses:

```text
BRIDE_SIDE
GROOM_SIDE
JOINT
```

Example:

```text
Wedding created by bride family

management_type = BRIDE_SIDE
```

Later:

```text
BRIDE_SIDE
   ↓
JOINT
```

The same wedding workspace remains.

---

# 11. Wedding Budget

The overall budget will be stored directly on the Wedding.

Example:

```text
budget_amount = 5000000.00
currency = LKR
```

We do not need a separate WeddingBudget table in the MVP because every wedding has only one overall budget.

Actual spending is calculated using Expenses.

Example:

```text
Wedding budget = 5,000,000

SUM(expenses.amount)
= 3,500,000
```

Then:

```text
Remaining budget
= 5,000,000 - 3,500,000
```

---

# 12. Wedding Member

This is one of the most important tables.

```text
wedding_members
-----------------------------------------
id
wedding_id
user_id
role
side
is_active
joined_at
created_at
updated_at
```

Relationship:

```text
User
   │
   ▼
WeddingMember
   │
   ▼
Wedding
```

This creates a many-to-many relationship.

```text
User
  N
  │
  │
  N
Wedding
```

A user can belong to many weddings.

A wedding can have many users.

---

# 13. Wedding Member Unique Constraint

The same user should not be added twice to the same wedding.

Therefore:

```text
UNIQUE(wedding_id, user_id)
```

The initial implementation also adds `UNIQUE(wedding_id, id)` so later same-wedding foreign keys can safely reference a member, plus indexes on `wedding_id` and `user_id` for membership checks. Creating a Wedding and its first active `OWNER` WeddingMember is one database transaction.

---

# 14. Wedding Roles

`role` supports:

```text
OWNER
ADMIN
FAMILY_MEMBER
COLLABORATOR
```

Example:

```text
user_id = A
wedding_id = W1
role = OWNER
```

The same user could have:

```text
user_id = A
wedding_id = W2
role = FAMILY_MEMBER
```

This is why the role belongs to `wedding_members`, not `users`.

Any verified registered user can create a wedding and become its initial Owner. A Collaborator in one wedding can be an Owner in another.

Owners have full wedding access. Admins have operational access within their authorized side and delegated permissions, and cannot manage ownership or grant permissions they do not possess. Family Members have only permitted capabilities. Collaborators require both permitted capabilities and explicit resource assignments.

Only Owners can add, remove, or demote other Owners. Every wedding must always retain at least one active Owner. All writes that could affect this invariant must serialize ownership changes for that wedding inside a transaction (for example, by locking the wedding row before checking and updating). A count followed by an unprotected update is insufficient under concurrent requests.

---

# 15. Wedding Side

`side` supports:

```text
BRIDE
GROOM
BOTH
```

Example:

```text
role = ADMIN
side = GROOM
```

Role and side remain independent.

---

# 16. Wedding Member Permissions

Effective capabilities are determined from the role and its permission overrides, within the finalized role limits. Family Members have only permitted capabilities. Collaborators have no access to unassigned resources even if a module capability is allowed.

Budget viewing and modification are separate keys: `BUDGET_VIEW` and `BUDGET_MANAGE`. `EXPENSE_VIEW` protects expense/payment information and vendor financial fields; `EXPENSE_MANAGE` protects financial writes. A vendor price change also requires vendor-management capability. A manage permission does not automatically grant viewing permission.

Additional overrides are stored in:

```text
wedding_member_permissions
-----------------------------------------
id
wedding_member_id
permission_key
allowed
created_at
updated_at
```

Example:

```text
wedding_member_id = 123
permission_key = GUEST_MANAGE
allowed = true
```

Another:

```text
permission_key = EXPENSE_VIEW
allowed = false
```

Unique constraint:

```text
UNIQUE(
  wedding_member_id,
  permission_key
)
```

---

# 17. Permission Resolution

The backend first verifies active membership in the requested wedding.

- Owners have unrestricted wedding access, regardless of side or permission overrides.
- Admins use only their delegated capabilities within their authorized side.
- Family Members use only permitted capabilities within applicable side restrictions.
- Collaborators require an allowed capability and an explicit assignment to each event, task, vendor, or document they access, with side and financial checks still enforced.

Module permission overrides do not replace resource assignments. Assignments do not confer capabilities. No matching resource assignment means no Collaborator access.

An Admin may not grant a capability they do not possess, whether through explicit overrides, role defaults, or removal of a denial. Admin resource delegation must remain within their own authorized scope. Admins cannot modify Owner memberships or Owner permissions.

## 17.1 Explicit Collaborator Resource Access

Use four typed join tables rather than a generic resource ID without a foreign key:

| Table | Columns | Resource foreign key |
|---|---|---|
| `member_event_access` | `wedding_id`, `wedding_member_id`, `event_id` | Event |
| `member_task_access` | `wedding_id`, `wedding_member_id`, `task_id` | Task |
| `member_vendor_access` | `wedding_id`, `wedding_member_id`, `vendor_id` | WeddingVendor |
| `member_document_access` | `wedding_id`, `wedding_member_id`, `document_id` | Document |

Each table has a composite primary key on `(wedding_member_id, resource_id)`, using its actual typed resource column. No extra UUID or permission flags are needed on these join rows.

Enforce same-wedding assignment with composite foreign keys:

- `(wedding_id, wedding_member_id)` references `wedding_members(wedding_id, id)`.
- `(wedding_id, event_id/task_id/vendor_id/document_id)` references the corresponding resource's `(wedding_id, id)`.
- Add `UNIQUE(wedding_id, id)` to WeddingMember, Event, Task, WeddingVendor, and Document as the referenced keys.

One member can have many explicitly assigned resources, and one resource can be assigned to multiple members. Removing an access row revokes that resource assignment. Access rows confer nothing for inactive memberships, and never grant capabilities by themselves.

An event assignment does not grant access to its tasks, vendors, documents, guests, or expenses. Each of the four supported resource types is assigned separately. When Task responsibility is introduced later, Collaborator task access will still require its own `member_task_access` row.

Queries must apply these restrictions to lists, nested relations, search, totals, and individual records, not just direct resource endpoints. General module permissions must not expose other resource types to Collaborators. Any workflow that creates a resource for a Collaborator must establish its authorized explicit assignment atomically; a request cannot grant itself arbitrary access.

## 17.2 Financial Data Projection

Keep existing financial storage and calculations. Protect their output in the backend:

- Wedding/event `budget_amount` requires `BUDGET_VIEW`; modifying it requires `BUDGET_MANAGE`.
- Expense-derived amounts, payer/payment information, and vendor financial fields (`agreed_price`, calculated paid/remaining amounts and payment status) require `EXPENSE_VIEW`.
- Values combining budgets and expenses, such as remaining budget, require both viewing permissions.
- Financial writes require their corresponding manage permission in addition to resource/module authorization.
- Financial document access additionally requires the relevant financial viewing permission.

Build response projections from allowed fields. Never serialize raw financial columns or unrestricted aggregates into wedding, event, vendor, dashboard, nested, list, or mutation responses. Authorized financial capabilities do not broaden resource access; an assigned vendor does not expose its raw expense records to a Collaborator. Omit restricted fields before returning data to the frontend.
---

# 18. Wedding Member Invitations

Before someone becomes a WeddingMember, they may need to be invited.

Use:

```text
wedding_member_invitations
-----------------------------------------
id
wedding_id
email
role
side
token_hash
invited_by_user_id
expires_at
accepted_at
created_at
```

Example:

```text
Bride invites brother

Email:
brother@gmail.com

Role:
FAMILY_MEMBER

Side:
BRIDE
```

After the invitation is accepted:

```text
WeddingMember created
```

and:

```text
accepted_at
```

is populated.

---

# 19. Event Table

Each wedding can contain unlimited events.

```text
events
-----------------------------------------
id
wedding_id
name
description
side
event_date
start_time
end_time
venue_name
address
created_by_user_id
created_at
updated_at
```

For the initial Events milestone, `event_date`, `start_time`, `end_time`, `description`, `venue_name`, and `address` are nullable. Times are stored separately from the local calendar date and represent same-day scheduling. A start or end time requires an event date, an end time requires a start time, and the end time must be later than the start time. Event budget and coordinates remain deferred to their approved future features.

The `wedding_id` and `created_by_user_id` foreign keys use `ON DELETE RESTRICT`. Event reads and writes always include the wedding ID in their database scope. The composite uniqueness of `(wedding_id, id)` supports future same-wedding resource-access foreign keys.

Relationship:

```text
Wedding
  1
  │
  ▼
  N
Event
```

---

# 20. Event Side

Each event can belong to:

```text
BRIDE
GROOM
BOTH
```

Examples:

```text
Engagement
BRIDE
```

```text
Wedding
BOTH
```

```text
Homecoming
GROOM
```

---

# 21. Event Budget

Each event has one optional budget.

Therefore:

```text
events.budget_amount
```

is enough for the MVP.

Example:

```text
Wedding
budget_amount = 2000000
```

Actual event spending:

```text
SUM(
 expenses.amount
 WHERE event_id = event.id
)
```

No separate EventBudget table is required.

---

# 22. Task Table

```text
tasks
-----------------------------------------
id
wedding_id
event_id
name
description
side
due_date
status
completed_at
created_by_user_id
created_at
updated_at
```

`name` and `side` are required. `description`, `due_date`, `event_id`, and `completed_at` are nullable. `event_id` is optional so the same Task system supports wedding-wide and Event-linked work. Member assignment is deferred and is not part of the initial Task model.

This allows tasks such as:

```text
Create overall wedding budget
```

which might not belong to one event.

Every Task belongs to one Wedding. When `event_id` is present, a composite foreign key from `(wedding_id, event_id)` to the Event's `(wedding_id, id)` ensures that the linked Event belongs to the same Wedding. Add `UNIQUE(wedding_id, id)` to Task for later explicit Task-access relationships.

Task sides use `BRIDE`, `GROOM`, or `BOTH`. Bride Side weddings allow only `BRIDE`, Groom Side weddings allow only `GROOM`, and Joint weddings allow all three values. Wedding-wide Tasks require only this wedding-type validation.

An Event-linked Task must also be compatible with its Event: a `BRIDE` Event permits only `BRIDE` Tasks, a `GROOM` Event permits only `GROOM` Tasks, and a `BOTH` Event permits `BRIDE`, `GROOM`, or `BOTH` Tasks. The service enforces these cross-row rules during Event-with-Tasks creation and when a Task's `event_id` or `side` changes. An Event side update is rejected if any linked Task would become incompatible; existing Task rows are never changed implicitly.

---

# 23. Task Status

```text
TO_DO
COMPLETED
```

Example:

```text
Confirm Photographer

status = TO_DO
```

New Tasks start as `TO_DO` with `completed_at = NULL`. Changing status to `COMPLETED` records the completion timestamp. Reopening a Task changes status to `TO_DO` and clears `completed_at`. Writes should keep status and completion timestamp consistent atomically.

---

# 24. Task Assignment

Member assignment is deferred beyond the initial Task Planner milestone. When introduced, assignments must reference WeddingMember rather than User because responsibility is wedding-specific, and the assigned WeddingMember must belong to the same Wedding as the Task.

For Collaborators, future task responsibility will not by itself grant access. An explicit `member_task_access` row and the relevant capability will also be required. Assigning an Event does not assign its Tasks.

---

# 25. Expense Table

```text
expenses
-----------------------------------------
id
wedding_id
event_id
vendor_id
name
category
amount
paid_amount
payer
expense_date
notes
created_by_user_id
created_at
updated_at
```

`event_id` is optional.

`vendor_id` is optional.

---

# 26. Expense Amounts

Example:

```text
amount = 500000
paid_amount = 200000
```

Then payment status can be calculated.

```text
paid_amount = 0
→ UNPAID

0 < paid_amount < amount
→ PARTIALLY_PAID

paid_amount >= amount
→ PAID
```

We therefore do not need to permanently store a separate payment-status value.

This avoids data inconsistency.

---

# 27. Expense Payer

The `payer` field supports:

```text
BRIDE
GROOM
BRIDE_FAMILY
GROOM_FAMILY
SHARED
OTHER
```

This allows calculations such as:

```text
Bride Family Paid:
SUM(paid_amount)
WHERE payer = BRIDE_FAMILY
```

---

# 28. Expense Category

For the MVP, `category` can remain a string rather than a strict database enum.

Examples:

```text
Venue
Photography
Catering
Decoration
Transport
Clothing
Other
```

This gives users flexibility without requiring database migrations whenever a new expense category is needed.

---

# 29. Vendor Table

Selected wedding vendors are stored in:

```text
wedding_vendors
-----------------------------------------
id
wedding_id
source
google_place_id
manual_name
manual_phone
manual_address
category
agreed_price
currency
notes
created_by_user_id
created_at
updated_at
```

---

# 30. Vendor Source

```text
GOOGLE_PLACES
MANUAL
```

If:

```text
source = GOOGLE_PLACES
```

we primarily retain the Google Place ID according to the vendor-discovery implementation rules.

If:

```text
source = MANUAL
```

the user can store:

```text
manual_name
manual_phone
manual_address
```

---

# 31. Google Place Vendor

Example:

```text
source = GOOGLE_PLACES

google_place_id =
ChIJxxxxxxxxxxxxx

category =
PHOTOGRAPHER
```

Wedding-specific information remains ours:

```text
agreed_price
notes
event assignments
expenses
documents
```

---

# 32. Vendor Categories

Suggested enum:

```text
WEDDING_HALL
HOTEL
PHOTOGRAPHER
VIDEOGRAPHER
CATERER
DECORATOR
MAKEUP_ARTIST
BRIDAL_WEAR
GROOM_WEAR
FLORIST
DJ
BAND
CAKE
TRANSPORT
JEWELLERY
INVITATION_PRINTING
OTHER
```

---

# 33. Vendors and Events

A vendor may work for more than one event.

Example:

```text
ABC Photography

Wedding ✅
Reception ✅
Homecoming ✅
```

Therefore Vendor and Event should use a many-to-many relationship.

```text
vendor_events
-----------------------------------------
id
vendor_id
event_id
created_at
```

Unique constraint:

```text
UNIQUE(vendor_id, event_id)
```

Relationship:

```text
WeddingVendor
      N
      │
      │
      N
Event
```

This is more flexible than storing only one `event_id` on the vendor.

---

# 34. Vendor Payment Calculation

Do not store:

```text
vendor.paid_amount
vendor.remaining_amount
```

because this information already exists in expenses.

Instead:

```text
Vendor Agreed Price
= wedding_vendors.agreed_price
```

and:

```text
Amount Paid
=
SUM(expenses.paid_amount)
WHERE expenses.vendor_id = vendor.id
```

Then:

```text
Remaining
=
agreed_price - amount_paid
```

This prevents payment numbers from becoming inconsistent.

---

# 35. Guest Table

A Guest represents an invitation unit.

It may represent:

```text
Individual
```

or:

```text
Family
```

Table:

```text
guests
-----------------------------------------
id
wedding_id
type
display_name
side
expected_count
phone_number
created_by_user_id
created_at
updated_at
```

Example:

```text
type = INDIVIDUAL
display_name = "Nimal Perera"
expected_count = 1
```

Family example:

```text
type = FAMILY
display_name = "Mr. Ruwan & Family"
expected_count = 4
```

---

# 36. Guest Type

```text
INDIVIDUAL
FAMILY
```

---

# 37. Guest Side

```text
BRIDE
GROOM
BOTH
```

Example:

```text
Mr. Ruwan & Family
side = BRIDE
```

---

# 38. Guest Phone Number

Because invitations will primarily be shared through WhatsApp, the guest record should support:

```text
phone_number
```

Store phone numbers in normalized international format where possible.

Example:

```text
+94771234567
```

---

# 39. Guest and Event Relationship

A guest is not automatically invited to every event.

Therefore use:

```text
guest_events
-----------------------------------------
id
guest_id
event_id
invited_count
created_at
```

Relationship:

```text
Guest
   N
   │
   │
   N
Event
```

Unique constraint:

```text
UNIQUE(guest_id, event_id)
```

---

# 40. Event-Specific Guest Count

`invited_count` allows flexibility.

Example:

Family size:

```text
expected_count = 4
```

Wedding invitation:

```text
invited_count = 4
```

Reception invitation:

```text
invited_count = 2
```

This is more flexible than assuming every family member is invited to every event.

---

# 41. Invitation Table

One invitation can represent the guest's complete wedding invitation.

```text
invitations
-----------------------------------------
id
wedding_id
guest_id
token_hash
expires_at
revoked_at
created_by_user_id
created_at
updated_at
```

The raw public invitation token is never stored.

Only:

```text
token_hash
```

is stored.

---

# 42. Invitation Flow

```text
Guest created
      ↓
Guest assigned to Events
      ↓
Invitation token generated
      ↓
Token hashed
      ↓
Hash stored in database
      ↓
Raw token placed in URL
      ↓
WhatsApp
```

Example:

```text
https://makemymarriage.lk/invite/abcXYZ123...
```

---

# 43. RSVP Table

RSVP belongs to a specific GuestEvent.

```text
rsvps
-----------------------------------------
id
guest_event_id
status
attending_count
responded_at
created_at
updated_at
```

Unique constraint:

```text
UNIQUE(guest_event_id)
```

Therefore one GuestEvent has one current RSVP.

---

# 44. RSVP Status

```text
PENDING
ATTENDING
NOT_ATTENDING
```

Example:

```text
Wedding

status = ATTENDING
attending_count = 4
```

Reception:

```text
status = ATTENDING
attending_count = 2
```

Homecoming:

```text
status = NOT_ATTENDING
attending_count = 0
```

---

# 45. RSVP Validation

If:

```text
status = ATTENDING
```

then:

```text
attending_count > 0
```

and normally:

```text
attending_count <= guest_event.invited_count
```

If:

```text
status = NOT_ATTENDING
```

then:

```text
attending_count = 0
```

These validations should happen in the backend.

---

# 46. Document Table

Documents are stored in Amazon S3.

PostgreSQL only stores metadata.

```text
documents
-----------------------------------------
id
wedding_id
event_id
vendor_id
expense_id
document_type
file_name
s3_key
mime_type
file_size
uploaded_by_user_id
created_at
```

---

# 47. Document Context

A document may belong directly to a Wedding.

Example:

```text
General wedding agreement
```

or an Event:

```text
Wedding Hall Contract
```

or Vendor:

```text
Photographer Quotation
```

or Expense:

```text
Payment Receipt
```

Therefore:

```text
event_id
vendor_id
expense_id
```

are nullable.

For the MVP, a document should normally be associated with no more than one specific context entity in addition to its Wedding.

---

# 48. Document Type

Suggested values:

```text
QUOTATION
CONTRACT
RECEIPT
INVOICE
VENUE_DOCUMENT
OTHER
```

---

# 49. S3 File Storage

The database stores:

```text
s3_key
```

Example:

```text
weddings/
550e8400/
documents/
invoice-123.pdf
```

The database should not store permanent public S3 URLs.

The S3 bucket remains private.

---

# 50. Complete Relationship Diagram

```text
USERS
 │
 ├─────────────< SESSIONS
 │
 ├─────────────< EMAIL_VERIFICATION_TOKENS
 │
 ├─────────────< PASSWORD_RESET_TOKENS
 │
 │
 └─────────────< WEDDING_MEMBERS >───────────── WEDDINGS
                          │                         │
                          │                         │
                          ├─< MEMBER_PERMISSIONS    │
                          └─< RESOURCE_ACCESS       │
                                                    │
                                                    ├──< EVENTS
                                                    │      │
                                                    │      ├──< TASKS
                                                    │      │
                                                    │      ├──< GUEST_EVENTS
                                                    │      │
                                                    │      └──< VENDOR_EVENTS
                                                    │
                                                    ├──< EXPENSES
                                                    │
                                                    ├──< WEDDING_VENDORS
                                                    │      │
                                                    │      └──< VENDOR_EVENTS
                                                    │
                                                    ├──< GUESTS
                                                    │      │
                                                    │      ├──< GUEST_EVENTS
                                                    │      │      │
                                                    │      │      └── RSVP
                                                    │      │
                                                    │      └── INVITATION
                                                    │
                                                    └──< DOCUMENTS
```

The RESOURCE_ACCESS branch above represents the four typed tables in Section 17.1, each referencing its corresponding resource.

---

# 51. Main Database Tables

The MVP contains the following primary tables:

```text
users

sessions

email_verification_tokens

password_reset_tokens

weddings

wedding_members

wedding_member_permissions

member_event_access
member_task_access
member_vendor_access
member_document_access

wedding_member_invitations

events

tasks

expenses

wedding_vendors

vendor_events

guests

guest_events

invitations

rsvps

documents
```

A separate Budget table is intentionally not required in the MVP.

Budget amounts are stored on:

```text
weddings
events
```

Actual spending is calculated from:

```text
expenses
```

---

# 52. Recommended Enums

## WeddingManagementType

```text
BRIDE_SIDE
GROOM_SIDE
JOINT
```

## MemberRole

```text
OWNER
ADMIN
FAMILY_MEMBER
COLLABORATOR
```

## Side

```text
BRIDE
GROOM
BOTH
```

This can be reused for:

```text
WeddingMember
Event
Task
Guest
```

## TaskStatus

```text
TO_DO
COMPLETED
```

## GuestType

```text
INDIVIDUAL
FAMILY
```

## RSVPStatus

```text
PENDING
ATTENDING
NOT_ATTENDING
```

## ExpensePayer

```text
BRIDE
GROOM
BRIDE_FAMILY
GROOM_FAMILY
SHARED
OTHER
```

## VendorSource

```text
GOOGLE_PLACES
MANUAL
```

## DocumentType

```text
QUOTATION
CONTRACT
RECEIPT
INVOICE
VENUE_DOCUMENT
OTHER
```

---

# 53. Recommended Indexes

Indexes should be created based on common application queries.

## Users

```text
UNIQUE(email)
```

## Sessions

```text
INDEX(user_id)
INDEX(expires_at)
UNIQUE(refresh_token_hash)
```

## Email Verification Tokens

```text
UNIQUE(user_id)
UNIQUE(token_hash)
INDEX(expires_at)
```

## Wedding Members

```text
UNIQUE(wedding_id, user_id)

INDEX(wedding_id)
INDEX(user_id)
```

## Resource Access

For each typed access table, use the composite primary key and same-wedding foreign keys in Section 17.1. Add an index on `(wedding_id, resource_id)` using the corresponding typed column for reverse lookup. Add `UNIQUE(wedding_id, id)` on WeddingMember and each referenced resource.

## Events

```text
INDEX(wedding_id)
INDEX(wedding_id, event_date)
INDEX(created_by_user_id)
UNIQUE(wedding_id, id)
```

## Tasks

```text
INDEX(wedding_id)
INDEX(wedding_id, status)
INDEX(wedding_id, side)
INDEX(wedding_id, event_id)
INDEX(wedding_id, due_date)
UNIQUE(wedding_id, id)
```

## Expenses

```text
INDEX(wedding_id)
INDEX(event_id)
INDEX(vendor_id)
INDEX(wedding_id, payer)
```

## Vendors

```text
INDEX(wedding_id)
INDEX(wedding_id, category)
INDEX(google_place_id)
```

## Guests

```text
INDEX(wedding_id)
INDEX(wedding_id, side)
INDEX(wedding_id, type)
```

## Guest Events

```text
UNIQUE(guest_id, event_id)

INDEX(event_id)
INDEX(guest_id)
```

## Invitations

```text
UNIQUE(token_hash)

INDEX(guest_id)
```

## RSVP

```text
UNIQUE(guest_event_id)

INDEX(status)
```

## Documents

```text
INDEX(wedding_id)
INDEX(event_id)
INDEX(vendor_id)
INDEX(expense_id)
```

---

# 54. Referential Delete Rules

Delete behavior should be chosen carefully.

## Wedding

Deleting a wedding affects almost every table.

For the MVP, instead of immediately hard deleting a Wedding:

```text
archived_at
```

should normally be used.

This protects important wedding data from accidental deletion.

---

## Wedding Member

Removing a member should normally use:

```text
is_active = false
```

rather than deleting historical references.

For example, after member assignment is introduced, Tasks assigned to that member can still retain history.

Inactive members cannot use resource access rows. Only Owners can deactivate or demote Owners, and the transaction must preserve at least one active Owner even during concurrent requests. The last-Owner invariant also applies to any other operation that changes membership or role.

---

## Event

An Event should not be deleted if important Expenses, Guests, or Vendors are connected without confirmation.

The application should warn users before destructive operations.

---

## Session

Sessions may be deleted after they have expired for a suitable period.

---

## Authentication Tokens

Expired verification/reset tokens can periodically be cleaned up.

---

# 55. Data Isolation

Every wedding-owned entity must have a reliable path back to a Wedding.

Examples:

```text
Task → wedding_id

Expense → wedding_id

Guest → wedding_id

Vendor → wedding_id

Document → wedding_id
```

This is intentional even when the Wedding can technically be determined through another relationship.

Example:

```text
Task
→ Event
→ Wedding
```

We still store:

```text
task.wedding_id
```

because it makes authorization queries simpler and safer.

---

# 56. Wedding Authorization Query

When accessing a wedding:

```text
SELECT *
FROM wedding_members
WHERE user_id = currentUser
AND wedding_id = requestedWedding
AND is_active = true
```

If no record exists:

```text
403 Forbidden
```

The backend then applies role, capability, authorized-side, and explicit resource-assignment checks where required (Section 17). Financial response projection is required independently of general resource access.

---

# 57. Preventing Cross-Wedding Data Access

Suppose:

```text
Expense ID = E100
```

The backend should not simply query:

```text
WHERE id = E100
```

Instead:

```text
WHERE id = E100
AND wedding_id = requestedWeddingId
```

This prevents a user from accessing another wedding's records by guessing an ID.

---

# 58. Expense and Budget Calculation

Wedding totals:

```text
Total Budget
=
weddings.budget_amount
```

Total expenses:

```text
SUM(expenses.amount)
```

Total paid:

```text
SUM(expenses.paid_amount)
```

Remaining budget:

```text
budget_amount
-
SUM(expenses.amount)
```

Outstanding payment:

```text
SUM(
  expenses.amount
  -
  expenses.paid_amount
)
```

---

# 59. Event Budget Calculation

For Event:

```text
event.budget_amount
```

Spent:

```text
SUM(expenses.amount)
WHERE event_id = event.id
```

Remaining:

```text
event.budget_amount
-
event_expenses
```

---

# 60. Vendor Financial Calculation

Vendor contract:

```text
wedding_vendors.agreed_price
```

Paid:

```text
SUM(expenses.paid_amount)
WHERE vendor_id = vendor.id
```

Remaining:

```text
agreed_price - paid
```

This keeps one financial source of truth.

---

# 61. Guest Statistics

Total invitation groups:

```text
COUNT(guests)
```

Expected guests:

```text
SUM(guests.expected_count)
```

Bride side:

```text
WHERE side = BRIDE
```

Groom side:

```text
WHERE side = GROOM
```

Shared:

```text
WHERE side = BOTH
```

---

# 62. RSVP Statistics

For an Event:

Confirmed:

```text
COUNT(rsvps)
WHERE status = ATTENDING
```

Declined:

```text
COUNT(rsvps)
WHERE status = NOT_ATTENDING
```

Pending:

```text
GuestEvents without completed RSVP
```

Expected attendees:

```text
SUM(rsvps.attending_count)
WHERE status = ATTENDING
```

---

# 63. Dashboard Queries

The Dashboard can calculate:

```text
Wedding countdown
Wedding budget
Total expenses
Total paid
Outstanding payments
Task completion
Guest counts
RSVP counts
Upcoming events
Selected vendor count
```

Most of these are derived from the existing relational tables.

No separate Dashboard table is required.

Scope all queries and counts to authorized resources before aggregation. Return only permitted financial values using Section 17.2; a dashboard must not reveal unrelated resources or restricted amounts.

---

# 64. What We Are Not Storing

The database will not contain dedicated tables for:

```text
Notifications
Reminders
Activity History
Activity Feed
Gallery
Livestream
Seating Plans
QR Check-In
Vendor Accounts
Vendor Marketplace
Online Payments
AI Features
```

These are outside the MVP.

---

# 65. Example Wedding Data Relationship

Example:

```text
User
Ahamed
   │
   ▼
WeddingMember
role = OWNER
side = GROOM
   │
   ▼
Wedding
Ahamed & Fathima
   │
   ├── Wedding Event
   │     ├── Tasks
   │     ├── Guests
   │     ├── Vendors
   │     └── Expenses
   │
   ├── Reception
   │     ├── Guests
   │     ├── Vendors
   │     └── Expenses
   │
   └── Homecoming
         ├── Guests
         └── Tasks
```

---

# 66. Example Guest Relationship

```text
Guest

Mr. Ruwan & Family
expected_count = 4
side = BRIDE

        │
        ├───────────────┐
        ▼               ▼

GuestEvent          GuestEvent
Wedding             Reception
invited = 4         invited = 2
    │                   │
    ▼                   ▼
RSVP                RSVP
Attending           Attending
4 people            2 people
```

---

# 67. Example Vendor Relationship

```text
WeddingVendor

ABC Photography

source:
GOOGLE_PLACES

google_place_id:
XYZ123

agreed_price:
250000

        │
        ├──────────────┐
        ▼              ▼

Wedding Event     Reception Event


Expenses

Advance Payment
100000 paid

Final Payment
150000 pending
```

The application can calculate the vendor payment status automatically.

---

# 68. Prisma Relationship Direction

The database design should translate naturally into Prisma.

Example conceptually:

```text
User

has many:
Sessions
WeddingMembers
CreatedWeddings
```

```text
Wedding

has many:
WeddingMembers
Events
Tasks
Expenses
Guests
Vendors
Documents
```

```text
Guest

has many:
GuestEvents

has one:
Invitation
```

```text
GuestEvent

belongs to:
Guest
Event

has one:
RSVP
```

WeddingMember also has many MemberEventAccess, MemberTaskAccess, MemberVendorAccess, and MemberDocumentAccess rows. Each row belongs to one WeddingMember and one typed resource, with the same-wedding constraints defined in Section 17.1.

The actual Prisma schema should be generated after this database design is approved.

---

# 69. Database Security

Database access should follow these rules:

```text
RDS is not publicly accessible.

Only Express backend connects directly to PostgreSQL.

Frontend never connects directly to PostgreSQL.

Google Places never connects directly to PostgreSQL.

Guests never connect directly to PostgreSQL.
```

Architecture:

```text
Next.js
   ↓
Express
   ↓
Prisma
   ↓
RDS PostgreSQL
```

---

# 70. Final Database Model

The Make My Marriage MVP database is centered around:

```text
Authentication
      │
      ▼
Users
      │
      ▼
Wedding Membership
      │
      ▼
Wedding
      │
      ├── Events
      ├── Tasks
      ├── Expenses
      ├── Vendors
      ├── Guests
      ├── Invitations
      ├── RSVP
      └── Documents
```

The design intentionally keeps:

- Authentication separate from wedding membership
- Roles separate from family side
- Guests separate from application users
- Vendor discovery separate from wedding vendor management
- Expenses as the financial source of truth
- Documents outside the database in S3
- RSVP specific to each invited event

This provides a normalized and maintainable relational model suitable for the Make My Marriage MVP.

---

# 71. Final Core Tables

```text
users

sessions

email_verification_tokens

password_reset_tokens

weddings

wedding_members

wedding_member_permissions

member_event_access
member_task_access
member_vendor_access
member_document_access

wedding_member_invitations

events

tasks

expenses

wedding_vendors

vendor_events

guests

guest_events

invitations

rsvps

documents
```

This database structure is the recommended Version 1.0 foundation for Make My Marriage.

---

# 72. Implementation-Stage Questions

The six unresolved groups are maintained in [PRD Section 41](PRD.md#41-implementation-stage-questions): guest invitation persistence/sharing, member invitation lifecycle, financial boundaries, guest/RSVP statistics, incomplete API contracts, and lifecycle/operational details.

In particular, the conceptual Guest-to-Invitation relationship in Sections 41 and 68 and the index list in Section 53 do not settle whether regenerated invitations replace a row or retain history. Choose the persistence model and matching uniqueness constraints during implementation. Do not silently infer that choice from the diagram.

Member reactivation/reinvitation behavior, currency/overpayment/budget boundaries, counting units, dependency deletion, and upload completion/failure handling remain open. The finalized resource-access tables, ownership invariant, and financial permission checks do not settle those separate questions.
