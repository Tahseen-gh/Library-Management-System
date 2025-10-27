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
