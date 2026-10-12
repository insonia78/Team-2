# How to Update the GitHub Project Task (Best Practice)

Use this workflow whenever you ship gateway work so the board stays accurate for Codyza and your team.

## 1. Convert draft to issue (once)

On the **create gateway** card:

1. Click **Convert to issue**.
2. Paste title: `Backend: Gateway + Codyza research API`.
3. Paste description from `docs/GATEWAY-TASK-PROGRESS.md` (AC table + checklist).
4. Link the issue to the project card if not automatic.

## 2. Branch and PR (every work session)

```bash
git checkout -b feat/gateway-<short-topic>
# work, commit
git push -u origin feat/gateway-<short-topic>
gh pr create --title "feat(gateway): <topic>" --body "Closes #<issue-number>"
```

In the PR body include:

- What changed
- How to test (`curl /health`, sample POST)
- Screenshot or log snippet if relevant
- Update to `docs/GATEWAY-TASK-PROGRESS.md`

## 3. Update project fields (after merge)

On the project card / issue sidebar:

| Field | When to change |
|-------|----------------|
| **Status** | Backlog → In progress (Day 1) → In review (PR open) → Done (merged + Supabase migrated) |
| **Updated** | Automatic on edits |
| **Comment** | Add standup note: "Merged PR #X: exports + Docker" |

## 4. Comment template (paste on task)

```
Update — create gateway (@saningore)

Done:
- [list]

Verified:
- npm run typecheck && npm test
- GET /health/ready OK against Supabase

Docs:
- docs/API.md
- docs/GATEWAY-TASK-PROGRESS.md

Next:
- [list]

Blockers:
- none | describe
```

## 5. Close the loop with team

Post in Slack `#team-2-alignment`:

- PR link
- Staging/local URL
- Env vars teammates need (never post service role key in Slack — use secure share)

## 6. Codyza submission alignment

When research milestones complete, note in the task:

- Count of verified hackathons in DB
- Export links used for deliverables (CSV endpoints)

This keeps engineering work visible alongside research outcomes.
