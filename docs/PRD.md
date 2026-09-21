# Make My Marriage

# Product Requirements Document (PRD)

**Version:** 1.0  
**Product Type:** Web Application  
**Primary Market:** Sri Lanka  
**Product Stage:** Minimum Viable Product (MVP)  
**Platform:** Responsive Web Application

---

# 1. Product Overview

Make My Marriage is a wedding planning and management web application designed to help couples and their families organize their wedding from one centralized digital workspace.

Wedding planning in Sri Lanka often involves multiple events, large guest lists, several vendors, different family members, and shared financial responsibilities.

Managing all these activities through WhatsApp conversations, spreadsheets, notebooks, and separate documents can become complicated.

Make My Marriage aims to simplify this process by bringing all essential wedding planning activities into one application.

The platform allows users to manage:

- Wedding setup and multiple wedding events
- Family members and permissions
- Wedding tasks
- Overall and event-specific budgets
- Wedding expenses
- Vendor management
- Nearby vendor discovery
- Guest management
- Digital invitations
- RSVP
- Wedding-related documents

The application primarily serves couples while allowing parents, family members, and selected organizers to participate in wedding planning.

---

# 2. Problem Statement

Wedding planning involves many interconnected activities that are frequently managed through separate tools.

For example:

- WhatsApp groups for communication
- Excel sheets for budgets
- Notebooks for guest lists
- Phone calls for vendor coordination
- Separate files for quotations and receipts
- Different family members managing different responsibilities

This creates several problems.

Couples and families may struggle to understand:

- What tasks are still pending?
- Who is responsible for each task?
- How many wedding events need to be organized?
- What is the budget for each event?
- How much money has already been spent?
- How much remains to be paid?
- Who is responsible for wedding expenses?
- Which vendors have been selected?
- Which guests are invited to each event?
- How many guests have confirmed attendance?
- Where are important wedding documents stored?

There is also the added complexity of coordinating between the bride's family and the groom's family.

Make My Marriage addresses these problems through a centralized wedding management platform.

---

# 3. Product Vision

**Make wedding planning simpler, more organized, and more collaborative for couples and their families.**

The product should allow a couple to understand the status of their entire wedding from one place.

The central product promise is:

> Everything about your wedding, beautifully organized in one place.

Make My Marriage should reduce the complexity of managing wedding activities so couples can spend less time coordinating information and more time enjoying their wedding experience.

---

# 4. Product Goals

The primary goals are to:

1. Provide one centralized workspace for wedding planning.
2. Support multiple wedding events within one wedding.
3. Allow the bride's family, groom's family, or both families to organize the wedding.
4. Support collaboration with controlled permissions.
5. Simplify wedding task management.
6. Help families manage budgets and expenses.
7. Provide visibility into who is paying wedding expenses.
8. Help users discover nearby wedding vendors.
9. Manage selected vendors and their payment information.
10. Simplify guest management and invitation sharing.
11. Collect guest RSVP responses without requiring guest accounts.
12. Organize important wedding documents.

The application should remain simple enough for non-technical family members to use.

---

# 5. Target Users

## 5.1 Bride

The bride can create or participate in a wedding workspace.

Depending on her assigned role, she can manage wedding events, budgets, guests, tasks, vendors, and other activities.

## 5.2 Groom

The groom can create or participate in a wedding workspace.

He can collaborate with the bride and family members.

## 5.3 Parents

Parents from either family can create a wedding and participate in planning.

A parent may also become the Owner or Admin of a wedding workspace.

## 5.4 Family Members

Family members include:

- Siblings
- Cousins
- Relatives
- Other trusted family members

They may receive access to selected areas of the application.

## 5.5 Collaborators / Organizers

External organizers or trusted helpers can be invited into a wedding workspace.

They can access only explicitly assigned events, tasks, vendors, and documents, and only with the permitted capabilities for those resources.

Any verified registered user, including someone who is a Collaborator in another wedding, can create their own wedding workspace and become its Owner.

## 5.6 Wedding Guests

Guests do not need application accounts.

They interact with the platform through digital invitations and RSVP forms.

## 5.7 Vendors

Vendors do not need application accounts.

They are managed as vendor records by wedding users.

---

# 6. Wedding Workspace Management

A Wedding represents the primary workspace of the application.

Any verified registered user can create a wedding and become its initial Owner. Roles are wedding-specific, not global user types.

During wedding creation, the user must select the wedding management type.

The available options are:

- Bride Side
- Groom Side
- Both Sides / Joint

### Bride Side

The wedding is initially managed by the bride's family.

### Groom Side

The wedding is initially managed by the groom's family.

### Joint Wedding

Both families participate in managing the same wedding workspace.

The creator can be any verified registered user, including the bride, groom, parent, another family member, or someone collaborating in another wedding.

The creator does not necessarily have to be the bride or groom.

---

# 7. Wedding Management Type Changes

A Bride Side or Groom Side wedding can later become a Joint Wedding.

Example:

```text
Wedding Created
    ↓
Bride Side
    ↓
Invite Groom Side
    ↓
Joint Wedding
```

The existing wedding workspace remains unchanged.

Its events, expenses, guests, and other data remain associated with the same wedding.

### MVP Limitation

Two independently created wedding workspaces cannot be merged.

For example:

```text
Bride creates Wedding A

Groom creates Wedding B
```

Wedding A and Wedding B cannot be automatically combined.

This limitation avoids complicated data-merging operations involving guests, expenses, vendors, tasks, and permissions.

---

# 8. Multiple Weddings per User

One registered user can belong to multiple wedding workspaces.

For example:

```text
Ahamed

My Wedding
Role: Owner
Side: Groom

Sister's Wedding
Role: Family Member
Side: Bride
```

The application should provide a wedding switcher so users can move between their available workspaces.

Each wedding must maintain its own members, permissions, events, guests, vendors, and financial information.

A user can be a Collaborator in one wedding and an Owner in another.

---

# 9. User Roles and Permissions

The application contains four roles.

## 9.1 Owner

The Owner has full control over the wedding workspace.

Owner responsibilities include:

- Wedding settings
- Member management
- Role assignment
- Permission management
- Event management
- Task management
- Budget management
- Expense management
- Guest management
- Vendor management
- Document management
- Changing a single-side wedding into a Joint Wedding

Joint weddings may have multiple Owners.

Only Owners can add, remove, or demote other Owners. Admins cannot manage ownership.

At least one active Owner must always remain in every wedding. Any operation that would remove or demote the last active Owner must be rejected, including concurrent requests.

## 9.2 Admin

Admins have operational access only within their authorized side and delegated permissions. The Admin role does not automatically grant every capability or access across sides.

Depending on their permissions, Admins can manage:

- Events
- Tasks
- Guests
- Invitations
- Expenses
- Vendors
- Documents
- Other wedding activities

Admins cannot:

- Delete or archive the wedding
- Remove Owners
- Transfer ownership
- Perform other Owner-only operations
- Grant permissions they do not possess, including indirectly through role changes
- Delegate resource access outside their own authorized scope

## 9.3 Family Member

Family Members can use only their permitted capabilities, within applicable side restrictions. Membership alone does not grant access to every module.

Example:

```text
Guest Management: Allowed

Task Management: Allowed

Vendor Management: Allowed

Budget Management: Not Allowed

Expense Management: Not Allowed
```

A Family Member should not automatically receive access to every wedding activity.

## 9.4 Collaborator

A Collaborator is an external organizer or trusted helper.

Collaborators can access only explicitly assigned events, tasks, vendors, and documents. Both the relevant capability and the explicit resource assignment are required; module permissions alone must never expose unrelated resources.

An event assignment does not automatically expose its tasks, vendors, documents, guests, or financial information. Each supported resource requires its own assignment. Task responsibility and permission to access a task are separate concerns.

Example:

```text
Photography Tasks: Allowed

Photography Vendor: Allowed

Guest List: Not Allowed

Wedding Budget: Not Allowed

Other Documents: Not Allowed
```

Collaborator restrictions apply only inside the wedding where that role is held. Any verified registered user may create another wedding and become its Owner.

---

# 10. Wedding Side Assignment

Every wedding member can be assigned a side.

Available values:

- Bride
- Groom
- Both

Role and Side are independent.

Example:

```text
User: Bride's Brother

Role: Admin

Side: Bride
```

Another example:

```text
User: Groom's Sister

Role: Family Member

Side: Groom
```

The backend must use role, permitted capabilities, authorized side, and explicit resource assignments where required. Owners have full wedding access; Admins remain within their authorized side. Collaborator assignments do not bypass capability, side, or financial checks.

---

# 11. Wedding Dashboard

The dashboard is the central overview of the wedding.

It should allow a couple to quickly understand the current state of their wedding.

## Wedding Information

Display:

- Couple names
- Main wedding date
- Wedding countdown
- Current wedding management type

## Budget Overview

Display:

- Overall budget
- Total committed expenses
- Amount paid
- Outstanding amount
- Remaining budget

## Task Overview

Display:

- Total tasks
- Completed tasks
- In-progress tasks
- Pending tasks

## Guest Overview

Display:

- Total invited guests
- Confirmed guests
- Declined guests
- Pending RSVP responses

## Events

Display upcoming wedding events with their dates and basic details.

## Vendors

Display selected vendors and useful payment information.

## Quick Actions

Provide easy access to common actions such as:

- Create Event
- Add Task
- Add Guest
- Add Expense
- Add Vendor

The dashboard should use information from existing features rather than requiring users to maintain separate dashboard records.

The backend must scope dashboard records and counts to the member's authorized resources and omit restricted financial fields or sections. A Collaborator's dashboard must not expose unrelated resources through totals, previews, or nested data.

**Notifications, reminders, and activity feeds must not appear in the MVP dashboard.**

---

# 12. Event Management

A wedding can contain unlimited events.

Users are not restricted to predefined wedding types.

Suggested events may include:

- Engagement
- Wedding Ceremony
- Reception
- Homecoming
- Nikah
- Mehendi
- Poruwa Ceremony
- Family Dinner

Users can create events with any custom name.

Each event should contain:

- Event name
- Description
- Date
- Start time
- End time
- Venue name
- Location
- Bride/Groom/Both side assignment
- Event budget

Related information may include:

- Tasks
- Guests
- Vendors
- Expenses
- Documents

An event belongs to one wedding.

---

# 13. Event Ownership

Each event can be assigned to:

- Bride Side
- Groom Side
- Both Sides

Example:

```text
Engagement
Side: Bride

Wedding Ceremony
Side: Both

Homecoming
Side: Groom
```

This assignment helps organize family-specific events and may affect member access.

Users should only manage events permitted by their wedding role, capabilities, and authorized side. Collaborators also require an explicit assignment to the event; its related resources are checked separately.

---

# 14. Task Management

Task management should remain intentionally simple.

The application is not intended to become a complex project-management system.

Each task should contain:

- Task name
- Description
- Related event, if applicable
- Assigned wedding member
- Due date
- Status

Task statuses:

- To Do
- In Progress
- Done

Example:

```text
Task: Confirm Photographer

Event: Wedding

Assigned To: Groom's Brother

Due Date: October 5

Status: In Progress
```

Users with appropriate permissions can create, update, assign, and complete tasks.

Tasks can also belong directly to the wedding without being assigned to a specific event.

Subtasks, dependencies, advanced workflows, and complex automation are not required for the MVP.

---

# 15. Overall Wedding Budget

Every wedding can have an overall budget.

Example:

```text
Total Wedding Budget

LKR 5,000,000
```

The application should calculate:

- Overall budget
- Total committed expenses
- Total paid
- Remaining budget
- Outstanding payments

Example:

```text
Budget: LKR 5,000,000

Committed: LKR 3,500,000

Paid: LKR 2,500,000

Remaining Budget: LKR 1,500,000

Outstanding Payments: LKR 1,000,000
```

Financial totals should be calculated from expense records to avoid inconsistent values.

Budget viewing and budget modification require separate backend permission checks. General wedding/event access or modification permission does not grant permission to view or change a budget.

---

# 16. Event Budgets

Each wedding event can have its own budget.

Example:

```text
Overall Budget
LKR 5,000,000

Wedding
LKR 2,000,000

Reception
LKR 1,500,000

Homecoming
LKR 1,000,000

Other
LKR 500,000
```

The application should show event spending against its allocated budget.

Expenses associated with an event contribute to both the event's spending and overall wedding spending.

---

# 17. Expense Management

Users can record and manage wedding expenses.

Each expense should contain:

- Expense name
- Category
- Total amount
- Paid amount
- Related event, if applicable
- Related vendor, if applicable
- Payer
- Expense date
- Notes

Payment status is derived from the amount and paid amount.

Possible statuses:

- Unpaid
- Partially Paid
- Paid

Example:

```text
Expense: Wedding Hall

Total Amount: LKR 500,000

Paid Amount: LKR 200,000

Outstanding: LKR 300,000

Event: Wedding

Paid By: Bride Family

Status: Partially Paid
```

---

# 18. Expense Responsibility

The platform must show who is responsible for wedding expenses.

Payer options:

- Bride
- Groom
- Bride Family
- Groom Family
- Shared
- Other

Example:

```text
Bride Family
LKR 1,800,000

Groom Family
LKR 2,100,000

Shared
LKR 600,000
```

These summaries help families understand their respective financial contributions.

The MVP will not process payments online.

Expenses and payments are recorded manually.

---

# 19. Vendor Management

Make My Marriage will provide simple internal vendor management.

Vendors do not have accounts.

Vendor information should include:

- Vendor name
- Vendor category
- Phone number
- Address or location
- Related events
- Agreed price
- Amount paid
- Remaining amount
- Notes
- Documents

Example:

```text
ABC Photography

Category: Photographer

Event: Wedding

Agreed Price: LKR 250,000

Paid: LKR 100,000

Remaining: LKR 150,000

Documents:
Quotation.pdf
Contract.pdf
```

A vendor may provide services for multiple wedding events.

Vendor payments should be calculated from the related expense records.

---

# 20. Vendor Categories

Suggested vendor categories include:

- Wedding Halls
- Hotels
- Photographers
- Videographers
- Caterers
- Decorators
- Makeup Artists
- Bridal Wear
- Groom Wear
- Florists
- DJs
- Bands
- Wedding Cakes
- Transport
- Jewellery
- Invitation Printing
- Other

The application should also support manually entered vendors.

---

# 21. Nearby Vendor Discovery

Users should be able to discover nearby wedding vendors.

The MVP will use Google Places for vendor discovery.

Users can search by:

- Vendor category
- Location
- Distance

Example:

```text
Category: Photographer

Location: Colombo

Distance: 10 km
```

Suggested distance options:

- 5 km
- 10 km
- 25 km
- 50 km

Vendor results may show available information such as:

- Business name
- Location
- Distance
- Phone/contact details
- Basic business information

The exact displayed fields depend on Google Places availability and applicable usage rules.

Each result should offer:

- View Details
- Add to My Wedding

---

# 22. Vendor Discovery to My Vendors

Vendor Discovery and My Vendors are separate but connected features.

User flow:

```text
Search Nearby Vendors
        ↓
View Vendor
        ↓
Add to My Wedding
        ↓
Assign to Event
        ↓
Add Agreed Price
        ↓
Track Expenses
        ↓
Upload Documents
```

Google Places is used for discovering vendors.

Make My Marriage manages the wedding-specific relationship with the selected vendor.

The MVP does not require a vendor marketplace or internal vendor directory with vendor-managed accounts.

---

# 23. Guest Management

The application supports individual guests and family invitations.

## Individual Guest

Example:

```text
Nimal Perera

Expected Count: 1
```

## Family Invitation

Example:

```text
Mr. Ruwan & Family

Expected Count: 4
```

Guest information should include:

- Guest name or family name
- Invitation type
- Bride/Groom/Both classification
- Expected guest count
- Contact number
- Assigned wedding events

Guests do not need to register for a Make My Marriage account.

---

# 24. Guest Side Classification

Each guest may belong to:

- Bride Side
- Groom Side
- Both

Example:

```text
Bride Side: 170

Groom Side: 150

Both: 30
```

The classification helps with planning, coordination, and guest statistics.

It does not mean a guest must attend every event associated with that family.

---

# 25. Event-Based Guest Lists

A guest can be invited to one or more wedding events.

Example:

```text
Mr. Ruwan & Family

Wedding: Invited

Reception: Invited

Homecoming: Not Invited
```

Each event maintains its own guest assignment.

A family can have different invited counts for different events.

Example:

```text
Mr. Ruwan & Family

Wedding: 4 Invited

Reception: 2 Invited
```

The application should not automatically assign every guest to every event.

---

# 26. Digital Invitations

The application should generate a simple digital invitation page.

Invitation content includes:

- Couple names
- Event name
- Event date
- Event time
- Event location
- RSVP button

A guest may receive one invitation link containing all events to which that guest is invited.

Digital invitation pages should follow the Make My Marriage visual identity.

They should feel elegant, modern, and easy to use on mobile devices.

Guests do not need to create accounts.

---

# 27. WhatsApp Invitation Sharing

WhatsApp will be the primary invitation-sharing channel for the MVP.

User flow:

```text
Organizer Creates Guest
        ↓
Assigns Guest to Events
        ↓
Generates Invitation
        ↓
Shares Link Through WhatsApp
        ↓
Guest Opens Invitation
        ↓
Guest Submits RSVP
```

The MVP can use ordinary WhatsApp link sharing.

Automated WhatsApp messaging, bulk campaign delivery, and WhatsApp Business API integration are not required.

---

# 28. RSVP Management

RSVP should remain simple.

Available responses:

- Attending
- Not Attending

If attending, the guest provides the number of attendees.

Example:

```text
Wedding

Attending: Yes

Number Attending: 4
```

The application should record RSVP separately for each invited event.

Example:

```text
Wedding
Attending: 4

Reception
Attending: 2

Homecoming
Not Attending
```

One invitation link can support responses for multiple events.

---

# 29. RSVP Rules

The RSVP system should:

- Allow guests to respond without creating an account.
- Only display events assigned to that invitation.
- Allow attendance responses per event.
- Record the number of attendees.
- Prevent attendance counts from exceeding the invited count.
- Support updating an existing RSVP.
- Show pending responses before the guest responds.
- Prevent revoked or invalid invitation links from being used.

Organizers should be able to view confirmed, declined, and pending responses.

---

# 30. Document Management

The application should provide a central place for wedding-related documents.

Supported document categories include:

- Quotations
- Contracts
- Invoices
- Payment receipts
- Venue documents
- Other wedding files

Documents can be associated with:

- Wedding
- Event
- Vendor
- Expense

Example:

```text
ABC Photography

Quotation.pdf

Contract.pdf

Payment-Receipt.pdf
```

Authorized users can upload, view, download, and delete documents according to their permissions. Collaborators also require explicit document assignment; access to a related event, task, or vendor does not grant access to its documents. Financial document access must also satisfy the relevant financial viewing permission.

Documents should not be publicly accessible without authorization.

---

# 31. Main Application Navigation

The authenticated application should contain the following navigation:

```text
Dashboard

Events

Tasks

Guests

Invitations & RSVP

Budget & Expenses

Vendors

Vendor Discovery

Documents

Members & Permissions

Wedding Settings
```

The interface should provide a wedding switcher for users who belong to multiple weddings.

Navigation items and actions should respect the current member's permissions.

---

# 32. Authentication Requirements

The application uses custom email/password authentication.

Required authentication features:

- Registration
- Email verification
- Login
- Logout
- Access token
- Refresh token
- Session management
- Forgot password
- Reset password

Email verification and password-reset emails will be delivered through Resend.

JWT tokens will use HttpOnly cookies.

The application will maintain a Session table for refresh-token management.

Guests use secure invitation tokens rather than regular user authentication.

---

# 33. Security and Privacy Requirements

The application should ensure that:

- Users can only access weddings they belong to.
- Roles and permissions are enforced by the backend.
- Bride/Groom/Both access restrictions are respected.
- Collaborators cannot access unrelated wedding information.
- Guest invitation links expose only invitation-safe information.
- Wedding documents remain private.
- Passwords are stored securely.
- Sensitive authentication tokens are protected.
- Financial information is visible only to authorized members.
- The backend omits restricted financial fields from all API responses, including wedding, event, vendor, dashboard, nested, list, and mutation responses.
- Budget viewing and budget modification use separate permissions; neither general module access nor resource assignment bypasses these checks.
- Admin delegation cannot exceed the Admin's own effective permissions or authorized resource scope.
- Every wedding always retains at least one active Owner.

Wedding data must be isolated between separate wedding workspaces.

A valid login alone must not grant access to another wedding's information.

---

# 34. User Experience Requirements

Make My Marriage should follow the agreed visual direction:

**70% modern SaaS + 30% premium wedding experience.**

The product should feel:

- Elegant
- Warm
- Modern
- Trustworthy
- Calm
- Organized
- Simple

The visual identity should use warm neutral colors, clean typography, restrained accents, and intuitive layouts.

The interface should avoid traditional wedding-site styling such as excessive florals, gold gradients, decorative script fonts, and overly complicated designs.

The application must be responsive and comfortable to use on mobile phones.

---

# 35. Primary User Journey

A typical user should be able to complete the following journey:

```text
Create Account
        ↓
Verify Email
        ↓
Log In
        ↓
Create Wedding
        ↓
Choose Bride / Groom / Joint
        ↓
Enter Wedding Details
        ↓
Invite Family Members
        ↓
Assign Roles and Permissions
        ↓
Create Wedding Events
        ↓
Set Budgets
        ↓
Create Tasks
        ↓
Discover Nearby Vendors
        ↓
Add Selected Vendors
        ↓
Track Expenses
        ↓
Upload Documents
        ↓
Add Guests
        ↓
Assign Guests to Events
        ↓
Generate Invitations
        ↓
Share Through WhatsApp
        ↓
Collect RSVP
        ↓
Monitor Wedding Progress
```

The flow should remain understandable even for users with limited technical experience.

---

# 36. MVP Feature Scope

The MVP contains the following core features:

1. Authentication and email verification
2. Wedding workspace creation
3. Bride Side / Groom Side / Joint management
4. Multiple weddings per user
5. Wedding members and permissions
6. Owner, Admin, Family Member, and Collaborator roles
7. Wedding dashboard
8. Unlimited wedding events
9. Custom event names
10. Event ownership
11. Task management
12. Overall wedding budget
13. Event budgets
14. Expense management
15. Expense payer tracking
16. Basic vendor management
17. Nearby vendor discovery through Google Places
18. Individual and family guest management
19. Bride/Groom/Both guest classification
20. Event-based guest lists
21. Digital invitations
22. WhatsApp invitation sharing
23. Event-level RSVP
24. Wedding document management

---

# 37. Features Outside the MVP

The following features are explicitly excluded from the current product scope:

- Notifications
- Automatic reminders
- Activity history
- Activity feed
- Wedding photo gallery
- Guest photo uploads
- Livestream hosting
- Livestream integration
- Seating/table management
- QR-code guest check-in
- Vendor accounts
- Vendor marketplace
- Vendor advertisements
- Vendor bidding
- Online vendor booking
- Online payments
- AI wedding planning assistant
- Native Android application
- Native iOS application
- Merging two existing wedding workspaces
- Advanced task automation
- Automated WhatsApp messaging

These features may be considered after the MVP is validated.

---

# 38. Success Criteria

The MVP will be considered functionally complete when a couple or family can successfully:

- Create and access a wedding workspace.
- Add family members and collaborators.
- Assign appropriate roles and permissions.
- Create unlimited wedding events.
- Manage event-related tasks.
- Define overall and individual event budgets.
- Track wedding expenses and payment responsibilities.
- Discover nearby wedding vendors.
- Add and manage selected vendors.
- Upload and manage documents.
- Add individual and family guests.
- Assign guests to selected wedding events.
- Create and share digital invitations through WhatsApp.
- Receive and manage event-level RSVP responses.
- View meaningful wedding progress information through the dashboard.

These workflows should operate without requiring users to maintain separate spreadsheets or documents for the same information.

---

# 39. Approved Technical Direction

The product will be implemented using the separately approved System Design, Database Design, and API Design.

The agreed technology stack is:

**Frontend**

- Next.js
- TypeScript
- Redux Toolkit
- Tailwind CSS
- React Hook Form
- Zod

**Backend**

- Node.js
- Express
- TypeScript
- REST APIs
- Prisma

**Database**

- PostgreSQL
- Amazon RDS

**Authentication**

- Custom email/password
- JWT access and refresh tokens
- HttpOnly cookies
- Session table
- Resend for authentication emails

**Supporting Services**

- Amazon S3 for documents
- Google Places for vendor discovery

**Deployment**

- AWS EC2
- Docker
- Docker Compose
- Amazon ECR
- Nginx
- GitHub Actions

**Repository**

- Single monorepo
- npm workspaces

The product will use a modular-monolith architecture for the MVP.

shadcn/ui will not be used. Tailwind CSS remains approved; no replacement component library is selected by this update.

---

# 40. Final Product Definition

Make My Marriage is a centralized wedding planning web application that helps couples and their families manage the operational complexity of organizing a wedding.

Its core value comes from bringing together:

```text
Wedding
   │
   ├── Family Collaboration
   │
   ├── Multiple Events
   │
   ├── Tasks
   │
   ├── Budgets
   │
   ├── Expenses
   │
   ├── Vendors
   │
   ├── Vendor Discovery
   │
   ├── Guests
   │
   ├── Invitations
   │
   ├── RSVP
   │
   └── Documents
```

The product will prioritize simplicity, collaboration, security, and a smooth user experience.

The MVP should deliver a complete and practical wedding planning experience without introducing unnecessary features or technical complexity.

**Make My Marriage — Plan your whole wedding, together.**

---

# 41. Implementation-Stage Questions

The following six groups remain open. Existing examples illustrate workflows, not final answers to these questions. Resolve each before implementing the affected behavior; do not silently add requirements or expand the MVP.

1. **Guest invitation persistence and sharing:** Should regeneration update one current invitation row or retain historical rows with one active invitation? How will database uniqueness express that choice? How can organizers share again after leaving the creation screen when only a token hash is stored and the raw token cannot be retrieved?
2. **Member invitation lifecycle:** How should expired invitations, resend/cancellation, and reinviting inactive members work while respecting the unique wedding/user membership constraint?
3. **Financial boundaries:** How should differences between vendor agreed prices and expense commitments be presented or validated? What are the currency-consistency, decimal JSON representation, overpayment, and event-budget-versus-overall-budget rules? These questions do not reopen the finalized financial authorization rules.
4. **Guest and RSVP statistics:** Which values count invitation groups versus people? How should wedding-wide totals handle guests invited to multiple events? What happens if an invited count is reduced below an existing RSVP?
5. **Incomplete API contracts within approved features:** Finalize dashboard outstanding-payment and vendor-payment details, payer summaries, Google Places View Details, and conversion of a typed location into coordinates. Do not add features beyond the approved workflows.
6. **Lifecycle and operational details:** Define archived-wedding access, dependent-record deletion, upload types/sizes and confirmation checks, S3/database failure handling, domain/HTTPS, and production secret management. Authentication now uses a 15-minute access JWT, a fixed seven-day refresh session that rotation does not extend, a 24-hour single-use email-verification token, refresh-token rotation, and protected-request Session checks for prompt revocation. One atomic refresh wins; a losing request inside a five-second concurrency window receives a non-revoking conflict, while later stale-token reuse revokes the Session. Cookie-changing authentication routes require the exact trusted web Origin. Logout-all remains optional until explicitly selected.

The finalized collaborator, wedding-creation, ownership, delegation, financial-security, and no-shadcn/ui decisions take precedence over older illustrative wording in the other documents.
