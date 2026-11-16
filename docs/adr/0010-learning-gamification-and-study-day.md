# Learning gamification and the study day

## Scope

The first release has Learning XP, a daily goal, a streak, basic badges and rankings for the week, the month, the exam session and all time. Contribution points and reputation come later as separate mechanisms. High XP never grants permission to approve material; prizes and sponsors come later.

## Ranking and profile privacy

Every user takes part in the ranking; participation is not optional. A profile is public by default and shows the profile name, the sign-in photo (or initials), XP, badges, the current streak and the active paths with their target exam session. Path progress, accuracy, plans, exam results, detailed answer history, archived paths, e-mail and private notes are never public.

A profile may be set to private. It still has a ranking row with its name and score, but other users cannot open its profile page. Privacy never changes placement or scoring.

The first release shows rankings to signed-in users in the app; a public ranking on the website may later become a separate view with a chosen subset of data. A period ranking counts XP earned in that week or month, and total account XP is kept. A new period never resets history, streak or badges. The exam-session ranking counts XP recorded with that session: every XP event, including a badge, is triggered by activity on a path and stores the session of that path's goal at award time, so changing the goal never moves earlier XP.

Publicly the user appears under their profile name, which they can change at any time, and their sign-in photo, falling back to initials. There is no separate pseudonym. Names do not have to be unique, because profiles are addressed by user ID.

The user may deliberately generate and share an image with their streak or mock-exam result. This never publishes the data on the profile.

## XP

XP and streak are per account and aggregate written and oral study across paths; history, rounds and SRS stay separate. A meaningful submitted attempt may earn base XP even when wrong. Independent correctness and due reviews may earn bonus points; an assisted answer gets no independent-success bonus. Opening the app, a question or an explanation earns nothing. Rules limit repeated points for the same question or action. Values and limits are shared backend configuration. A question earns XP at most once per study day and study kind across modes and paths, so repeating it cannot farm points. Completing a learning round earns a large one-off reward, because a round can span thousands of questions. XP lives in an append-only ledger whose unique award keys give idempotency and deduplication, and period totals are projected in the same transaction. The starting values are in the specification (#83).

## Daily goal and streak

The daily goal is a number of questions, separate for written and oral on a path, as in V1. It plans the pass through the material up to the chosen date and is never expressed in XP. Regular-study answers that advance the pass count towards the goal regardless of correctness; in oral study this is a submitted self-assessment. Reviews, favourites, exams and mini-quizzes may feed XP and streak but never count towards the pass.

The backend proposes questions per day from the remaining material and the chosen preparation end date, and the user may change the plan. The calculation is shared by clients. Today's accepted goal stays fixed during study; changing it is a deliberate plan update. The system may propose a change for the following days after the pace or date changes. Earlier goals and their completion are kept.

The streak requires a small fixed minimum of qualifying activity, independent of the daily goal, so an ambitious goal never makes the streak harder to keep. Signing in alone does not count. The threshold is a number of answers per day in any mode, regardless of correctness, configured in the backend. Draft exam answers never count.

## Study day

Daily goal, streak and ranking periods use Europe/Warsaw based on backend time, so web and mobile show the same study day. SRS uses the real time between attempts; midnight never resets review state. A per-user time zone may come later.

## Plan and reset

We distinguish remaining material, today's fixed plan and work left today. A completed pool is not mastery, and due reviews are separate. There is no manual "current mode": written and oral needs are computed separately within the user's access.

Resetting the private history of one path never removes earned lifetime or monthly XP or their contribution to rankings. A minimal reward ledger remains so a reset cannot replay first-achievement bonuses or limits; it keeps no deleted answers or progress. The assignment, goal, other paths and shared notes and favourites remain. The XP ledger is that minimal ledger: its keys hold identifiers and dates only. A reset keeps the streak and badges, removes the path's plan history, and leaves anonymous aggregate statistics untouched. The plan moves to the next round from the day after a round closes.
