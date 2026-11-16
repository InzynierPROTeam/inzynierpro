# Study session lifecycle

## Answering

In regular study a user submits an answer to a question once per session and gets the result immediately. A new session allows another attempt. A session has a fixed question set chosen when it starts and can be resumed after the app is closed. Immediate feedback is the point of study; the mock exam uses a different lifecycle (ADR-0004).

A user may keep several unfinished sessions on one path, for example one for the Construction Law and one for the Water Law. Moving to other material does not end an earlier session. There is at most one unfinished session per user, mode, path and document or category. The main "Continue learning" opens the most recently used session, and opening a specific document resumes that document's session. The UI leads into study with one button rather than a list of parallel sessions, and the preview of an existing session shows its saved settings. "Start over" ends the current session and lets the user configure a new one; earlier answers stay in history.

## Scope and session rules

Regular study covers one document or one category at a time; users do not combine documents freely. A session preview shows the scope and question count, and the session is created only after the preview is confirmed. Written study defaults to all matching questions, with a changeable count above 25. Oral study defaults to 10 questions, or all available when there are fewer, and the user may change the limit when more are available. Modes such as reviews and favourites may span documents or categories and have their own count rules.

The backend owns session-creation rules. The preview returns the available scope, default count, whether it can be changed and the allowed values; clients present them and the backend validates the choice again on creation. Thresholds are defined once on the backend so a change reaches already released clients through data, provided the API contract stays compatible. A shared code package alone would require a client release, so it cannot propagate such settings. Configuration changes apply to new sessions only: a started session keeps its question count, time limit and scoring rules, just as it keeps its content revisions (ADR-0003). We do not promise to swap settings in every open UI at once; how a preview refreshes after a configuration change is still open.

## Rounds

A new question has no submitted regular-study attempt on the current path. Answering every question in scope completes the first pass, not mastery: wrong and assisted answers are not evidence of knowledge. Regular study moves through categories in order and stays separate from SRS-selected reviews. After the whole material is covered, another full round starts through the standard preview and start flow, keeping history, statistics and SRS state. The backend keeps a round number per user, path and study kind and records coverage with that number. A round is complete when every published, non-withdrawn question of the path has a regular-study answer in it; the answer that covers the last question advances the round in the same transaction. A question added during a round belongs to the current round as uncovered, and a substantive revision (ADR-0003) makes the question uncovered in the current round. A path without questions never completes a round. There is no round-completion message and no round-management control; both, and switching regular study to SRS selection automatically, were rejected.

## Review mode

Reviews have their own tile on the home screen and by default draw due questions from all categories of the current path. A review session defaults to up to 25 questions due by SRS; the user may change the count within the available material and the values the backend allows. There is no separate return-after-a-break mode. Fewer due questions mean a smaller session, never padded with random questions. With nothing due, the UI shows that reviews are done and when the next one is scheduled. The same mechanism supports an optional restriction to one document or category using the path's shared SRS state rather than a per-document schedule; the main tile applies no restriction. Due means an SRS due time at or before the current time for a published, non-withdrawn question still on the path; the most overdue come first. There is at most one unfinished review session per user, path and scope (the whole path or one document).

## Favourites and continuing

FavoriteQuestion is a personal mark shared across paths, set on the question screen in any mode and in session results. The favourites mode spans the marked questions of the current path in catalogue order; its set is fixed at start, so unmarking during the session changes nothing. There is at most one unfinished favourites session per user and path, and with no marked questions no session is created. The main "Continue learning" covers regular study only; reviews and favourites resume their unfinished sessions from their own tiles. Every finished session offers one next step, which the backend decides from the learner's state at that moment. After a review it offers further due reviews of the same scope, then of the whole path, while any are due. After regular study it offers a review of the path once a full review session (25 questions) is due, so reviews do not pile up unnoticed. Otherwise it offers regular study: the most recently used unfinished regular-study session, or else the next session after the latest studied document. After favourites it offers regular study the same way. There is no separate difficult mark: SRS covers questions the user finds hard.

## Answer option order

QuestionAnswer has no global position. Written study, mock exams and reviews shuffle answer options when the session set is created, and the session stores the chosen order of answer IDs for each question. Reloads, resumption, other devices and history use that order; a new session may get a different permutation. Rendering never reshuffles. Presentation letters follow the session order, while scoring uses the answer ID and its revision. Outside sessions the order is stable by `createdAt, id`.

## Assistance

Viewing the explanation or the user's own note before submitting is allowed. Each written answer has an assistance level: none, note or explanation. Opening a saved, non-empty personal note before submitting gives the note level; opening the explanation gives the explanation level, which wins when both were opened. An assisted answer stays correct or wrong but is not evidence of fully independent mastery: a note is the user's own memory aid and weighs less than the explanation. The note control is always available, so the user can add or edit a note at any time; opening an empty note records nothing. SRS rules are in ADR-0005 and XP rules in ADR-0010.

Study question reads include each option's correctness and the explanation, as in V1, so clients can show feedback immediately. A learner who reads the answer key early only skips their own study; scoring, history and SRS still come from the backend by answer ID and revision, never from a result sent by the client. Because the explanation and the note are already on the client, opening either before submitting is reported as a separate event that the backend records for the question with its kind; the backend records a note opening only when a non-empty note is saved. The submitted answer takes its assistance level from those records, never from a client flag. Mock exams keep hiding correct answers (ADR-0004).

## Conflicts between devices

The backend resolves conflicts between devices using the same session. The first submitted answer wins, and retrying the same request does not award SRS or XP again.

## Missing session reads

A learning-session or preview lookup with no matching result returns HTTP 200 with `null`. Absence is a successful empty state that can refresh into session data through the query cache; clients use an empty fallback rather than an error boundary or forced component remount. Authentication, authorization and infrastructure failures retain their error responses. This convention does not change 404 responses for missing category details or other resource point lookups.
