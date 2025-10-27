# Library-Management-System

CSC 565 Group 3 Project

## Overview

This repository now showcases a **Sprint 1 circulation console wireframe** that still runs on the Sprint 0 PHP + SQLite
proof-of-concept. The PHP endpoints and database tables have been renamed to match Wilmington Public Library terminology—
students → patrons, courses → items, and enrollments → loans—so the demo reads like a circulation workflow while staying within
the same lightweight architecture.

## Sprint 1 Circulation Demo

Launch the demo UI by opening `public/index.html`. The layout mirrors the original enrollment proof-of-concept but is rethemed
for circulation staff. Client-side logic overlays policy checks that map directly to the highest-priority Sprint 1 user stories:

- **US 1.3 – Card expiration validation**: Patron cards include demo expiration dates, and the checkout form blocks transactions when the card is expired.
- **US 2.3 – Enforce item limits and fines**: The patron status panel counts active loans (limit of 20) and surfaces outstanding demo fines that must be resolved before checkout.
- **US 2.7 – Checkout guardrails and due dates**: Loan policies (books: 28 days, movies: 7 days, new movies: 3 days) determine the due date preview and the due date stored with each loan record.
- **US 3.1 & US 3.7 – Returns and reshelving**: The Active Loans card doubles as a return queue, flagging overdue items for fee assessment and reminding staff to reshelve once scanned back in.
- **US 3.5 – Activity logging**: Each checkout records its due date inside the existing loan row, illustrating the audit trail we will later expose in reports.

### How the Wireframe Reuses the POC Stack

| Sprint 0 Table | Library Concept | Where It Appears |
| --- | --- | --- |
| `patrons` | Patrons | Patron registration card and checkout dropdown |
| `items` | Library items | Catalog form and collection inventory grid |
| `loans` | Active loans | Checkout session log and return/reshelving queue |

The PHP API files now live at `api/patrons.php`, `api/items.php`, and `api/loans.php`. Front-end JavaScript consumes their JSON responses, enriches them with demo policy metadata, and provides visual guardrails that explain how we will expand the backend in future sprints.

### Running Locally

```bash
php -S 127.0.0.1:8000 -t public
```

Navigate to `http://127.0.0.1:8000/` to interact with the circulation wireframe. Add patrons, catalog items with loan durations, and simulate checkouts to observe due-date calculations and policy enforcement. Because returns and fine payments are outside Sprint 1 scope, the UI highlights those steps for later implementation while keeping the workflow grounded in the reused PHP endpoints.

## Sprint 0 Deliverables Recap

Sprint 0 focused on establishing the infrastructure, agile ceremonies, and documentation required by the course. A completed user story must provide:

- Acceptance criteria.
- Activity diagram per story and supporting system models:
  - Entity-Relationship Diagram (ERD).
  - State Machine Diagrams for objects with notable lifecycles (e.g., books).
  - Use Case Diagram for the overall system.
  - CRUD diagram linking use cases to the data model.
- Working code hosted on the Ada server (or alternate agreed location).
- Demonstration tying models and code back to the acceptance criteria.

Key Sprint 0 setup reminders:

- Secure Ada server, phpMyAdmin, and VPN access.
- Align on the LAMP toolchain and ensure the entire team can run it locally.
- Deliver a “Hello World” solution that exercises reading from and writing to the database.
- Stand up collaboration tools (GitHub, Jira/Trello, Teams/Slack, etc.) and add the instructor.
- Hold instructor-attended standups during scheduled class times.

## Student Enrollment System – Many-to-Many POC

Sprint 0 produced a three-table proof-of-concept that we repurposed for circulation. The schema now reads:

- **Patrons** (`id`, `name`, `email`)
- **Items** (`id`, `title`, `barcode`, `loan_duration_days`)
- **Loans** (`id`, `patron_id`, `item_id`, `loaned_at`, `due_date`)

The structure is still many-to-many: patrons can have multiple loans, and items can circulate to multiple patrons over time. JSON endpoints expose all three tables so we can quickly validate CRUD operations. Future sprints will evolve the schema to add patron card metadata, fine ledgers, item statuses, and return transactions while preserving this foundation.

## Sprint 1 Priority Snapshot – Core Checkout & Returns

| Priority | User Story | Summary |
| --- | --- | --- |
| 🔴 Highest | **US 2.7** | Checkout by scanning item IDs. Validate non-expired cards, no outstanding fines, and fewer than 20 items already checked out. Determine due dates based on item type (Books: 4 weeks, Movies: 1 week, New Movies: 3 days). Resolve fines/expired cards in the moment; stop the transaction if the patron already has 20 items. |
| 🔴 Highest | **US 1.3** | Automatically verify that a patron's library card is valid during checkout. |
| 🔴 Highest | **US 2.3** | Terminate the checkout when the patron already has 20 items or unresolved fines. |
| 🔴 Highest | **US 3.7** | Mark items as available (reshelved) after return processing. |
| 🔴 Highest | **US 3.1** | Process returns, remove items from the patron account, calculate/apply late fees, and move the item into a returned-but-not-available state. |
| 🟠 Medium | **US 3.5** | Automatically log all return information to keep inventory accurate. |

Additional planning priorities:

- **High** – Item search, reservations, and renewal workflows.
- **Low** – Tracking physical item damage and interim statuses (awaiting reshelving, damage bin).

## Future Release Outlook

Subsequent sprints will expand beyond circulation to deliver patron onboarding, catalog management, fines and payments, multi-branch support, and reporting as listed in the broader backlog assembled during Sprint 0.
