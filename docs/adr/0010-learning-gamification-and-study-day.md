# Learning gamification and the study day

## Scope

The first release has Learning XP, a daily goal, a streak, basic badges and a monthly ranking. Contribution points and reputation come later as separate mechanisms. High XP never grants permission to approve material; prizes and sponsors come later.

## Ranking and profile privacy

Every user takes part in the ranking; participation is not optional. A profile is public by default but shows only the name, XP, badges and an optional avatar chosen by the user. Path progress, accuracy, goals, exam results, detailed answer history, streak, e-mail and private notes are never public.

A profile may be set to private. It still has a ranking row with pseudonym and score, but other users cannot open its profile page. Privacy never changes placement or scoring.

The first release shows the ranking to signed-in users in the app; a public ranking on the website may later become a separate view with a chosen subset of data. The monthly ranking counts XP earned in that month, and total account XP is kept. A new month never resets history, streak or badges.

Publicly the user appears under a changeable pseudonym, assigned automatically at first so no extra form precedes study. Name and photo from Google or Apple sign-in are never published automatically; the user sets the public pseudonym and avatar in the profile.

The user may deliberately generate and share an image with their streak or mock-exam result. This never publishes the data on the profile.

## XP

XP and streak are per account and aggregate written and oral study across paths; history, rounds and SRS stay separate. A meaningful submitted attempt may earn base XP even when wrong. Independent correctness and due reviews may earn bonus points; an assisted answer gets no independent-success bonus. Opening the app, a question or an explanation earns nothing. Rules limit repeated points for the same question or action. Values and limits are shared backend configuration; detailed scoring rules are still open.

## Daily goal and streak

The daily goal is a number of questions, separate for written and oral on a path, as in V1. It plans the pass through the material up to the chosen date and is never expressed in XP. Regular-study answers that advance the pass count towards the goal regardless of correctness; in oral study this is a submitted self-assessment. Reviews, favourites, exams and mini-quizzes may feed XP and streak but never count towards the pass.

The backend proposes questions per day from the remaining material and the chosen preparation end date, and the user may change the plan. The calculation is shared by clients. Today's accepted goal stays fixed during study; changing it is a deliberate plan update. The system may propose a change for the following days after the pace or date changes. Earlier goals and their completion are kept.

The streak requires a small fixed minimum of qualifying activity, independent of the daily goal, so an ambitious goal never makes the streak harder to keep. Signing in alone does not count. The exact threshold is set with the initial scoring.

## Study day

Daily goal, streak and ranking periods use Europe/Warsaw based on backend time, so web and mobile show the same study day. SRS uses the real time between attempts; midnight never resets review state. A per-user time zone may come later.

## Plan and reset

We distinguish remaining material, today's fixed plan and work left today. A completed pool is not mastery, and due reviews are separate. There is no manual "current mode": written and oral needs are computed separately within the user's access.

Resetting the private history of one path never removes earned lifetime or monthly XP or their contribution to rankings. A minimal reward ledger remains so a reset cannot replay first-achievement bonuses or limits; it keeps no deleted answers or progress. The assignment, goal, other paths and shared notes and favourites remain. Scoring, streak, analytics after a reset and later planning rounds need their own specifications before implementation.
