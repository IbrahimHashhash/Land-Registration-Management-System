# Workflow / State Machine

LRMIS enforces a strict state machine on every land application. Allowed
transitions are declared in `backend/app/features/applications/workflow.py`
(`ALLOWED_NEXT`).

## Main flow

```
submitted -> pre_checked -> survey_required -> surveyed -> legal_review
          -> approved   -> certificate_issued -> closed
```

## Alternative states

```
rejected           (terminal; reason required)
on_hold            (resumable to pre_checked / survey_required / surveyed / legal_review)
missing_documents  (back to submitted or pre_checked, or rejected)
under_objection    (back to legal_review / approved / on_hold / rejected)
```

## Allowed transitions (full table)

| From                  | Allowed targets |
|-----------------------|-----------------|
| `submitted`           | `pre_checked`, `missing_documents`, `on_hold`, `rejected` |
| `pre_checked`         | `survey_required`, `legal_review`, `missing_documents`, `on_hold`, `rejected` |
| `survey_required`     | `surveyed`, `on_hold`, `rejected` |
| `surveyed`            | `legal_review`, `on_hold`, `rejected` |
| `legal_review`        | `approved`, `under_objection`, `on_hold`, `rejected` |
| `approved`            | `certificate_issued`, `rejected` |
| `certificate_issued`  | `closed` |
| `closed`              | _terminal_ |
| `rejected`            | _terminal_ |
| `on_hold`             | `pre_checked`, `survey_required`, `surveyed`, `legal_review` |
| `missing_documents`   | `submitted`, `pre_checked`, `rejected` |
| `under_objection`     | `legal_review`, `approved`, `on_hold`, `rejected` |

## Rule enforcement

These checks run in `applications/service._check_rules()` before any allowed
transition is applied:

| Target           | Required condition |
|------------------|--------------------|
| `pre_checked`    | `applicant_ref.applicant_id`, `parcel.parcel_no`, `parcel.zone_id` all present |
| `survey_required`| `parcel.parcel_no`, `parcel.zone_id`, and a non-empty `parcel.geometry` |
| `surveyed`       | A `survey_reports` document exists for the application |
| `legal_review`   | At least one document uploaded into `application_documents` |

Additional rules enforced elsewhere:

- `rejected` requires a non-empty `reason` (in `transition`/`reject` handlers).
- `on_hold` requires a non-empty `reason` (in `hold` handler).
- A certificate can only be issued when the current status is `approved`.
- `POST /applications/{id}/objections` automatically forces the application
  into `under_objection` regardless of the current state, per spec ("applications
  with objections must move to under_objection").
- `PATCH /applications/{id}/registrar-review` enforces `ALLOWED_NEXT`; the
  registrar cannot skip steps in the workflow.

## Side effects per transition

Every transition writes:

1. The new state into `land_applications.status` and
   `land_applications.workflow.current_state`.
2. Updated `workflow.allowed_next` from the table above.
3. A timestamp into the corresponding `timestamps.*_at` field.
4. An event into the `performance_logs` document for that application
   (`event_stream` array, with `type`, `by.actor_type`, `by.actor_id`, `at`,
   `meta`).

Status-change notifications are sent to the applicant via email or SMS stub
(`backend/app/utils/notifications.py`), respecting their
`preferences.notifications` flags and `preferences.preferred_contact`.

## Surveyor task milestones

Independent of the application status, every `survey_tasks` document tracks
field milestones in this order
(`backend/app/features/staff/schemas.MILESTONE_ORDER`):

```
assigned -> visit_scheduled -> arrived_on_site -> survey_started
        -> survey_completed -> report_uploaded -> registrar_reviewed
```

`PATCH /applications/{id}/survey-milestone` only accepts the four manually
driven steps (`visit_scheduled`, `arrived_on_site`, `survey_started`,
`survey_completed`). The other three are written by the system:

- `assigned` is written when the surveyor is auto-assigned.
- `report_uploaded` is written by `POST /applications/{id}/survey-report`,
  which also moves the application to `surveyed`.
- `registrar_reviewed` is written by `PATCH /applications/{id}/registrar-review`.

Milestone updates are monotonic: a milestone earlier than the current one
cannot be added.
