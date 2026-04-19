# Board Governance Module — User Journeys

> Updated through Slice 5. This document tracks end-to-end user journeys across all implemented slices.

---

## Journey 1: Proposer Submits an Agenda Item (Slices 2 + 3)

**Actor:** Authorized Proposer (Dean, HoD, Director, Treasurer, Controller of Examinations)

1. **Meeting Exists** — A Syndicate meeting has been created in the Calendar (Slice 2). The meeting status is SCHEDULED or SUBMISSIONS_OPEN.
2. **Open Submissions Tab** — Proposer navigates to Board Governance → Submissions.
3. **Select Meeting** — Proposer picks the target meeting from the dropdown (only meetings accepting submissions appear).
4. **Fill Submission Form** — Enters: title, category (academic/financial/HR/governance/other), background, issue for consideration, proposed resolution, and their name.
5. **Prerequisite Check (if applicable)**:
   - If category = academic → system requires an Academic Council (AC) resolution reference.
   - If category = financial → system requires an F&PC resolution reference.
   - If category = HR → system requires an ASRB resolution reference.
   - Without a valid reference, the item is saved as **DRAFT** (not SUBMITTED).
6. **Submit** — If prerequisites are met, item moves to **SUBMITTED** and a notification is created for the Registrar.
7. **View Status** — Proposer sees their submissions listed with status badges (DRAFT/SUBMITTED).
8. **Edit Draft** — Can update fields on DRAFT items and re-attempt submission.
9. **Withdraw** — Can withdraw a submission at any stage before it is decided.

**Exit Conditions:** AgendaItem in SUBMITTED or DRAFT state.

---

## Journey 2: Registrar Vets Submissions (Slice 4)

**Actor:** Registrar

1. **Open Triage Queue** — Navigate to Board Governance → Triage Queue.
2. **Review Queue Stats** — Dashboard shows: items in queue, submitted/vetted/returned counts, financial flags, legal flags, duplicate alerts, average completeness.
3. **Filter by Meeting** — Optionally filter to a specific meeting's items.
4. **Select an Item** — Click any SUBMITTED item to open the DSS Intelligence Dossier on the right panel.
5. **Review DSS Dossier:**
   - **Completeness Score** — Percentage based on category-specific checklist (title, background, issue, resolution, proposer, feeder reference). Missing fields highlighted in red.
   - **Implication Analysis** — Rule-based detection of financial, legal, HR, academic, and governance implications with severity levels (high/medium/low) and matched keyword terms.
   - **Duplicate Detection** — Items with >70% title word overlap flagged as potential duplicates, with their status and outcome shown.
   - **Precedent Retrieval** — Related items from the last 24 months ranked by similarity, showing historical outcomes.
   - **Risk Assessment** — Overall risk level (high/medium/low) based on flag severity counts.
6. **Take Action:**
   - **Vet** — Mark VETTED (ready for VC agenda consideration). Optional notes. Notification sent to VC.
   - **Return to Proposer** — Requires a mandatory reason. Item reverts to DRAFT. Notification sent to proposer.
   - **Route to Legal/Treasurer** — Send for advisory opinion. Routing history tracked in item metadata.
   - **Flag** — Add manual note without changing status.
7. **Include Vetted Toggle** — Can toggle to see previously vetted items alongside new submissions.

**Exit Conditions:** AgendaItem moves to VETTED, or back to DRAFT (returned), or remains SUBMITTED with routing notes.

---

## Journey 3: VC Approves the Draft Agenda (Slice 5)

**Actor:** Vice Chancellor

1. **Open VC Cockpit** — Navigate to Board Governance → VC Cockpit.
2. **Select Meeting** — Pick a meeting from the dropdown (shows meetings with VETTED items and item count).
3. **Review Stats Dashboard** — See: total items, vetted, approved, deferred, financial flags, legal flags, high-risk count, average completeness. Also upcoming APCE deadlines.
4. **Review Each Item** — Each vetted item displayed with:
   - Status badge, category, proposer name, completeness percentage.
   - Inline implication flags (Financial, Legal, HR, Academic) with severity colors.
   - Precedent count badge.
   - Expand (eye icon) to see full detail: background, issue for consideration, proposed resolution, feeder body trail, precedent decisions with outcomes, implication analysis.
5. **Reorder Agenda** — Use up/down arrows to manually reorder items. Or click "DSS Suggested" to apply the intelligence engine's recommended ordering (high-severity items first, then by completeness).
6. **Save Order** — Persist the custom ordering.
7. **Per-Item Actions (VETTED items only):**
   - **Approve** (green check) — Moves to APPROVED_FOR_AGENDA. Notification to Registrar.
   - **Defer** (clock icon) — Opens modal. Item moves to next meeting's candidate pool. Notifications to Registrar and Proposer.
   - **Return** (arrow down) — Opens modal requiring reason. Item reverts to DRAFT. Notification to Proposer.
8. **Approve Full Agenda** — Bulk action: approves all VETTED items, updates meeting status to AGENDA_APPROVED. Notification to Registrar that working paper preparation may begin.

**Exit Conditions:** Items move to APPROVED_FOR_AGENDA or DEFERRED. Meeting status becomes AGENDA_APPROVED.

---

## Journey 4: Meeting Calendar & APCE Events (Slice 2)

**Actor:** Registrar / System Administrator

1. **Open Calendar** — Navigate to Board Governance → Calendar.
2. **Create Meeting** — Click "+ New Meeting". Enter title, date, location, online link, quorum.
3. **APCE Auto-Generation** — On creation, system auto-generates 10 time-bound APCE events with offsets from meeting date:
   - T+0: Meeting Scheduled
   - T-21: Submission Reminder
   - T-14: Submission Cut-off
   - T-10: VC Agenda Approval Due
   - T-7: Circulation
   - T-1: Pre-Meeting Query Close
   - T+0 (post): Meeting Concluded
   - T+7: Minutes Draft Due
   - T-14 (of next): Minutes Confirmation
   - T+7: ATR Review
4. **View APCE Timeline** — Click a meeting to see all events with their scheduled dates and status (PENDING/TRIGGERED/COMPLETED/SKIPPED).
5. **Trigger/Complete/Skip Events** — Manually update event status. Triggering generates in-app notifications to relevant roles.
6. **Edit Meeting** — Change date → APCE events auto-recompute.
7. **Delete Meeting** — Cascades to APCE events and notifications.

**Exit Conditions:** Meeting in calendar with APCE timeline. Notifications dispatched.

---

## Journey 5: End-to-End Happy Path (Slices 2–5)

**Combined workflow demonstrating all slices working together:**

1. **Registrar creates** Meeting #47 for June 15, 2026 → 10 APCE events generated.
2. **Dean of Engineering submits** "Approval of BS Computer Science Revised Curriculum" (category: academic, AC resolution ref: 42) → Status: SUBMITTED.
3. **Treasurer submits** "Budget Reallocation for Library Expansion" (category: financial, F&PC resolution ref: 15) → Status: SUBMITTED.
4. **Registrar opens Triage Queue:**
   - Curriculum item: 85% completeness, academic implication flag (medium), no duplicates. → **Vets it.**
   - Budget item: 90% completeness, financial implication flag (high), no duplicates. → **Routes to Treasurer** for opinion, then **Vets it.**
5. **VC opens Cockpit:**
   - Sees 2 vetted items. DSS suggests Budget item first (high-severity flag).
   - Reviews precedent: similar budget reallocation approved 8 months ago.
   - **Approves both items** via "Approve Full Agenda".
   - Meeting status → AGENDA_APPROVED.
6. **Registrar notified** — Working paper preparation may begin (Slice 6, future).

---

## Journey Map by Slice

| Slice | Stage | Actor | Key Actions |
|-------|-------|-------|-------------|
| 2 | Stage 1: Call Notice | Registrar | Create meeting, APCE auto-generates deadlines |
| 3 | Stage 2: Submission | Proposer | Submit item with prerequisite validation |
| 4 | Stage 3: Vetting | Registrar | Triage with DSS scoring, vet/return/route |
| 5 | Stage 4: VC Approval | Vice Chancellor | Review, reorder, approve/defer/return, bulk approve |
| 6 | Stage 5: Working Papers | Registrar | *(Future)* Author working papers with auto-population |
| 7 | Stage 6: Circulation | Member | *(Future)* Read papers, submit queries, RSVP |
| 8 | Stage 7: Post-Meeting | Registrar/VC | *(Future)* Minutes, decisions, ATR tracking |
| 9 | Intelligence | System | *(Future)* ML classifiers, advanced scoring |
| 10 | Compliance | Registrar | *(Future)* Regulatory export, audit trail |
