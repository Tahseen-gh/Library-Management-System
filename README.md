# Library-Management-System

CSC 565 Group 3 Project

## Overview

This repository houses a low-fidelity **library circulation console wireframe** that runs on top of
our Sprint&nbsp;0 PHP + SQLite proof-of-concept. The UI illustrates how the team will evolve the former
student-enrollment demo into a Wilmington Public Library circulation workflow while we continue to
use the existing stack for quick iteration.

The backend endpoints and many-to-many schema (students ↔ courses ↔ enrollments) remain unchanged so
we can continue experimenting with the environment set up during Sprint&nbsp;0. The new front end maps
that foundation to library terminology and Sprint&nbsp;1 priorities without requiring additional server
work yet.

## Sprint 1 Circulation Wireframe

Open `public/index.html` to review the wireframe layout for checkout, return, and reshelving tasks.
Each panel on the page represents the widgets the team plans to build as we connect live data.

### Primary Panels &amp; Linked User Stories

- **Patron Intake &amp; Validation** – Displays scanned card details, expiration warnings, fine balance,
  and the active-loan counter so we can satisfy **US&nbsp;1.3** and **US&nbsp;2.3** before checkout begins.
- **Checkout Session** – Shows a staged queue of scanned barcodes, due-date calculations by item
  format, and policy guardrails tied to **US&nbsp;2.7** and **US&nbsp;2.3**.
- **Return Processing** – Highlights scan intake, late-fee computation, and routing decisions to
  cover **US&nbsp;3.1**, **US&nbsp;3.5**, and **US&nbsp;3.7**.
- **Return Log &amp; Activity Stream** – Captures the automated audit trail we will need for
  **US&nbsp;3.5** and downstream reporting.
- **Quick Tools &amp; Session Checklist** – Reserve space for high-priority backlog items such as search,
  reservations, and renewal prompts while keeping staff guidance visible for training.

All callouts are intentionally rendered as dashed boxes, tags, and placeholder bars to emphasize the
wireframe nature of the deliverable.

### Viewing the Wireframe Locally

```bash
php -S 127.0.0.1:8000 -t public
```

Visit `http://127.0.0.1:8000/` and resize the browser to explore the responsive layout. Because this
is a static mock-up there are no interactive controls yet—visual annotations explain where policy
checks and messaging will appear once the real circulation services are connected.

## Sprint 0 Deliverables Recap

Sprint&nbsp;0 focused on establishing the infrastructure, agile ceremonies, and documentation required by
the course. A completed user story must provide:

- Acceptance criteria.
- Activity diagram per story and supporting system models:
  - Entity-Relationship Diagram (ERD).
  - State Machine Diagrams for objects with notable lifecycles (e.g., books).
  - Use Case Diagram for the overall system.
  - CRUD diagram linking use cases to the data model.
- Working code hosted on the Ada server (or alternate agreed location).
- Demonstration tying models and code back to the acceptance criteria.

Key Sprint&nbsp;0 setup reminders:

- Secure Ada server, phpMyAdmin, and VPN access.
- Align on the LAMP toolchain and ensure the entire team can run it locally.
- Deliver a “Hello World” solution that exercises reading from and writing to the database.
- Stand up collaboration tools (GitHub, Jira/Trello, Teams/Slack, etc.) and add the instructor.
- Hold instructor-attended standups during scheduled class times.

## Student Enrollment System – Many-to-Many POC

The retained backend demonstrates a three-table many-to-many relationship:

- **Students** (`id`, `name`, `email`)
- **Courses** (`id`, `course_name`, `course_code`, `credits`)
- **Enrollments** (`id`, `student_id`, `course_id`, `grade`)

Students can enroll in multiple courses, and courses support multiple students. JSON endpoints expose
all three tables so we can quickly validate CRUD operations. Future sprints will reuse the same
structure for patrons, items, and circulation records.

## Sprint 1 Priority Snapshot – Core Checkout &amp; Returns

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

Subsequent sprints will expand beyond circulation to deliver patron onboarding, catalog management,
fines and payments, multi-branch support, and reporting as listed in the broader backlog the team
assembled during Sprint&nbsp;0.
