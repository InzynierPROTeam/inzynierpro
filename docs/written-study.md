# Written study

How a written study session runs from preview to summary, for regular study, review sessions and favourites sessions, and how personal notes assist answers. The decisions behind it are in [ADR-0002](adr/0002-study-session-lifecycle.md) (session lifecycle) and [ADR-0003](adr/0003-shared-revisions-publication-and-withdrawal.md) (revisions and withdrawal); this document describes how they are implemented. Endpoints below sit under `/study/paths/:qualificationPathId`.

## Reads

A read that finds nothing for the learner returns HTTP 200 with `null`: preview, latest session, review and favourites previews (for a document not on the path), review session, favourites session, session, next step, question and summary. Category details keep 404. Authentication and access failures stay errors.

| Endpoint                                  | Returns                                                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /documents/:documentId`              | One category with the learner's progress in the current round, independent of the preview.                                                         |
| `GET /preview`                            | The proposed document, its `questionSelection` and the count settings.                                                                             |
| `GET /latest-session[?documentId=]`       | The most recently used regular-study session of the path or document, with status, progress and document.                                          |
| `GET /review-preview[?documentId=]`       | The due question count, the next due time and the count settings of reviews of the path or one document.                                           |
| `GET /review-session[?documentId=]`       | The unfinished review session of the path or one document.                                                                                         |
| `GET /favorites-preview[?documentId=]`    | The count of the learner's FavoriteQuestions on the path or one document and the count settings.                                                   |
| `GET /favorites-session[?documentId=]`    | The unfinished favourites session of the path or one document.                                                                                     |
| `GET /sessions/:sessionId`                | Status and progress: `total`, `answered`, `skipped`, `percent` and `currentQuestion` to continue from.                                             |
| `GET /sessions/:sessionId/next-step`      | The one step after the session, decided from the learner's state now (see [Next step](#next-step)).                                                |
| `GET /sessions/:sessionId/questions/:pos` | The pinned revision with options in session order, their correctness, the explanation as rich content, the stored answer, `isFavorite` and `note`. |
| `GET /sessions/:sessionId/summary`        | An ended session's correct, incorrect and assisted counts and its score.                                                                           |
| `GET /sessions/:sessionId/results`        | A cursor page of positions, each with its answer or withdrawal. Empty until the session ends.                                                      |

"Most recently used" is `last_activity_at`: starting or answering, never reading. A document's unfinished session is always its latest.

## Learning rounds

Regular study moves through repeated LearningRounds ([ADR-0002](adr/0002-study-session-lifecycle.md#rounds)). There is no round UI and no completion message; the round only decides what previews offer and what progress counts.

- The learner starts in round 1. A question is **covered** in a round when a regular-study answer in that round covered a revision carrying the question's current substantive content. Any submitted answer covers, even a wrong or assisted one.
- A round is complete when every published, non-withdrawn question of the path is covered in it. A withdrawn question leaves the round, a question added during it is uncovered, and a path without questions never completes one.
- The answer that covers the last question stores the next round in the answer transaction, under the account lock, so concurrent answers to the last two questions advance it once. When a withdrawal completes the stored round, reads already treat the next round as current and the next answer stores it.
- Each published revision records its `change_kind` ([ADR-0003](adr/0003-shared-revisions-publication-and-withdrawal.md#cosmetic-and-substantive-changes)): the first is `initial`, later ones `cosmetic` or `substantive`. A substantive revision makes the question uncovered in the current round on every path; a cosmetic one carries the substantive content of the revision before it and changes nothing. History is never changed.

Document progress (`completedQuestionCount`), previews and session candidates all count the current round.

## Preview and start

The preview picks a document:

- `documentId` asks for that document.
- `fromDocumentId` continues regular study: the first document in catalogue order from that one, wrapping around, with questions uncovered in the current round. In a new round, before anything is covered in it, the document after it comes first, so study goes on through the categories after the one that completed the round.
- Neither: the first document with uncovered questions.

`questionSelection` is `uncovered` while the document has questions uncovered in the current round. A document already covered in this round, chosen with `documentId`, offers all its questions again as `covered`; answering them keeps it covered.

`POST /sessions` confirms a preview under the account lock. It revalidates access, the document, the selection and the count against the current settings, then stores the current published revision of each selected question (in catalogue order) with a shuffled option order.

- `StudySessionAlreadyStarted` (409, with the session ID and position): the document already has an unfinished session. The client offers to open it.
- `StaleSessionPreview` (409): the count or scope changed since the preview. The client refreshes the path's study queries.

## Review sessions

A review session ([ADR-0002](adr/0002-study-session-lifecycle.md#review-mode)) draws questions due by SRS instead of the round. It covers the whole path or one document and uses the path's shared review states, never a per-document schedule.

- **Due**: a UserReviewState whose `due_at` is at or before backend time, for a question still on the path whose current revision is published, not withdrawn and carries the substantive content the state was built on. A state reset by a substantive revision reads as a new card and is never due. A question whose current content was already answered on the current study day is not due before the next study day starts (Europe/Warsaw midnight), even when FSRS schedules it within minutes: no later answer that day would rate it, so a review would only repeat it.
- **Preview**: `dueQuestionCount`, `nextDueAt` (the earliest time after now at which a question becomes due, or `null`) and `settings`: up to 25 questions by default, any count from 1 to the due count. It is never padded with questions that are not due. With nothing due `settings` is `null` and no session can start.
- **Start**: `POST /review-sessions` with an optional `documentId` and the count confirms the preview under the account lock. It stores the most overdue questions first (by `due_at`, then question), pins their current revisions and shuffles their options as regular study does. An unfinished review session of the same scope refuses it with `StudySessionAlreadyStarted`; a count outside the current settings, including anything when nothing is due, with `StaleSessionPreview`; a document that is not on the path with `DocumentNotFound`.
- Reading, answering, assistance, withdrawal, ending, the summary and the results use the session endpoints below. A review answer records its LearningEvent with mode `review` and updates the review state, but never covers questions or moves the round.
- "Continue learning" (`/latest-session`) stays with regular study. The Powtórka tile and a category resume their unfinished review session through `/review-session`.

## Favourites

A FavoriteQuestion ([ADR-0002](adr/0002-study-session-lifecycle.md#favourites-and-continuing)) is a personal mark on a question identity, shared across the learner's paths.

- **Marks**: `PUT /favorites/:questionId` marks and `DELETE /favorites/:questionId` unmarks; both return `{ questionId, isFavorite }` and repeating either changes nothing. Marking requires the question to be on the path the request names (`QuestionNotFound`, 404, otherwise), but the mark shows on every path the question is on. Unmarking only needs access to the path, so a learner can always remove their own mark, for example from an older session's results. Question reads return the mark as it is now (`isFavorite`), so it can be set on the question screen in any mode, including a question opened from a summary.
- **Scope**: the whole path, or with `documentId` one document on it, as for reviews. The Start tile covers the whole path and a category's card that category.
- **Preview**: `favoriteQuestionCount` counts the marked questions in the scope whose current revision is published and not withdrawn; `document` is the scope's document or `null`. `settings` is regular study's: all of them by default, any count from 1 when there are more than 25. With nothing marked `settings` is `null` and no session can start.
- **Start**: `POST /favorites-sessions` with an optional `documentId` and the count confirms the preview under the account lock. It stores the first marked questions in catalogue order (document, then question), pins their current revisions and shuffles their options. The set is fixed here: marking or unmarking later never changes a started session. An unfinished favourites session of the same scope refuses it with `StudySessionAlreadyStarted`; a count outside the current settings, including anything with nothing marked, with `StaleSessionPreview`; a document that is not on the path with `DocumentNotFound`.
- A favourites session of the whole path has no document. Its answers record LearningEvents with mode `favourites` and update the review state, but never cover questions or move the round.

## Personal notes

A PersonalQuestionNote ([ADR-0002](adr/0002-study-session-lifecycle.md#assistance)) is the learner's plain-text note on a question identity, shared across their paths.

- **Saving**: `PUT /notes/:questionId` with `{ text }` replaces the whole note and stores the question's current revision with it; `DELETE /notes/:questionId` clears it. Both return `{ questionId, note }`, `note` being `null` once cleared, and clearing again changes nothing. The text is `QuestionNoteText` from `@inzpro/domain`: up to 2000 characters with some non-whitespace text; anything else is refused with the generic `invalid_request` (400), which never echoes the note. The client trims the text and clears a blank note instead of saving it. Saving requires the question to be on the path the request names (`QuestionNotFound`, 404, otherwise); clearing only needs access to the path, as for favourites.
- **Reading**: question reads return the learner's note as it is now (`note`: `text`, `updatedAt` and `refersToEarlierWording`), so it shows on the question screen in any mode, before and after answering. Nobody else's note is ever read.
- **Older wording**: `refersToEarlierWording` is true when the question's current revision carries other substantive content than the revision stored at the last edit. A cosmetic revision keeps it false; editing the note stores the current revision again.
- **Privacy**: note text never reaches logs or telemetry ([ADR-0022](adr/0022-diagnostics-and-telemetry.md)). A refused payload is answered without its content, and a failed note write logs only the kind of database failure (`QuestionNoteWriteError`), because a constraint error's detail may quote the row.

## Storage

Written study has its own tables, separate from future oral study (ADR-0005).

- `written_study_sessions`: its `kind` is `study`, `review` or `favourites`. Regular study always has a document; a review or favourites session of the whole path has none. A partial unique index keeps one unfinished session per user, path, kind and document, with no document counting as one scope (`NULLS NOT DISTINCT`). A session stores the UserExamGoal version active at its start and its `current_position`.
- `written_study_session_questions` and `written_study_session_answer_options`: references to revisions and answer IDs in session order, never content copies.
- `written_study_answers`: one answer per session question.
- `written_learning_events`: one LearningEvent per answer, with result, revision, path, the session's goal version, mode (`study`, `review` or `favourites`), assistance level (`none`, `note` or `explanation`) and `answered_at` in backend time.
- `written_review_states`: the UserReviewState per learner, path and question: the FSRS card, the event and `rules_version` that produced it, and the substantive revision it was built on.
- `written_favorite_questions`: one row per learner and marked question, with no path, so a mark is shared across paths. Unmarking deletes it.
- `written_question_notes`: one PersonalQuestionNote per learner and question, with no path, its text and the question's revision current at its last edit. Clearing deletes it.
- `written_study_session_questions.explanation_opened_at` and `note_opened_at`: the recorded openings that decide an answer's assistance level.
- `written_learning_rounds`: the learner's stored round per path; without a row it is round 1.
- `written_question_coverage`: per learner, path and question, the revision and round of the latest regular-study answer, for rounds, previews and progress.
- `question_revisions.change_kind` and `substantive_revision_id`: the revision whose substantive content a revision carries, its own unless the change is cosmetic. Coverage compares these instead of publication times.

Extending access, changing the goal, archiving and restoring an assignment keep all of these.

## Answering

Selecting an option is a draft kept in the form: it is no attempt and a reload clears it.

`POST .../questions/:pos/answer` takes the revision the client showed and an answer ID. In one transaction under the account lock it checks access, ownership, session state, revision, option and withdrawal, then stores the answer, its LearningEvent in the session's mode, the question's review state, for regular study coverage in the current round and the next round when this answer covers the last question, and the new continue point: the first open question after this one, wrapping around, or this one when none is open.

- Repeating the stored answer returns it, so a retry after a lost response is safe.
- A different answer is refused with `SessionAnswerAlreadySubmitted` (409) and never overwrites the first.
- Answering never ends a session.

**Assistance.** The hint button shows the explanation already in the question read, rendered from [rich content](rich-content.md), and the note button the learner's note. The client posts `.../questions/:pos/assistance` with `kind` `explanation` or `note` only while the opening can still mark an answer: unanswered, not recorded yet, not withdrawn, session active, and for the note only when one is saved. Under the account lock the backend records `explanation_opened_at` or `note_opened_at` once; a note opening is kept only when a non-empty note is saved at that moment, so opening an empty note records nothing. Opening either after answering, in an ended session or on a withdrawn question changes nothing. The answer's level is `explanation` when the explanation was opened, otherwise `note` when the note was, otherwise `none`; it is assisted at any level but `none`, and the client's own view never decides it. Checking waits for any pending record.

## Withdrawn questions

Publishing a newer revision never changes a started session. A withdrawal (`withdrawRevision`, with a required reason, only for a published revision and final once stored) blocks answers to the pinned revision even in started sessions.

- The answer command rechecks withdrawal under the lock, so a question the client opened before the withdrawal is refused with `SessionQuestionWithdrawn` (409).
- An answer stored before the withdrawal stays readable and scored.
- A question withdrawn before its answer and before the session ended is **skipped**: it counts in `progress.skipped` and leaves the progress percent and the score (`scoredQuestionCount` in `@inzpro/domain`). It is never counted as incorrect. A withdrawal after the session ended leaves its summary unchanged.
- The continue point passes over withdrawn questions. When none is left open (`hasOpenQuestions`), the session can only end.

## Ending and the summary

`POST /sessions/:sessionId/end` ends a session under the account lock and keeps its answers, events and coverage. Ending it again changes nothing, and an ended session accepts no answers. A new session for the document starts from its preview.

The score is the share of correct answers among the scored questions, so unanswered ones count against it and skipped ones do not. Percentages go through `calculateCompletionRatio` and `ratioToPercent`, rounded as in V1.

## Next step

`GET /sessions/:sessionId/next-step` suggests one step after a session ([ADR-0002](adr/0002-study-session-lifecycle.md#favourites-and-continuing)), from the learner's state when it is read, so it changes as they study. The first that applies wins:

1. `review` (`document`, `dueQuestionCount`): after a review session, its scope while questions there are due, then the whole path while anything is due; after regular study, the whole path once 25 questions are due, a full review session. After a favourites session never.
2. `continue-study` (`session`): the most recently used unfinished regular-study session of the path, in any document.
3. `start-study` (`preview`): the next regular-study preview after the session's document, or after the latest regular-study document when the session was a review or favourites session.

It is `null` when nothing applies or the session belongs to another account. The client keys it under the progress group, so an answer refreshes it.

## Client

Routes:

- `/nauka/start` shows the preview and keeps the V1 search fields `akt-prawny`, `obecny-akt-prawny` and `liczba-pytan`. For a category with an active session it links to that session instead.
- `/nauka/sesja/$sessionId/$questionNumber` shows one question. Its header reads only the session and the question card only the question.
- `/nauka/powtorka` shows the review preview of the path, or of one category with `akt-prawny`, and keeps `liczba-pytan`. With nothing due it says reviews come later, or, with none scheduled, how they get scheduled; it does not show the next due time. With an unfinished review session of the scope it links to that session instead.
- `/nauka/ulubione` shows the favourites preview of the path, or of one category with `akt-prawny`, and keeps `liczba-pytan`. With nothing marked it explains how to mark questions and creates no session. With an unfinished favourites session of the scope it links to that session instead.
- `/nauka/sesja/$sessionId/$questionNumber` and the summary serve every kind.
- `/nauka/sesja/$sessionId/podsumowanie` shows an ended session's score ring, its counts, the result of every position and the next step from `GET /sessions/:sessionId/next-step`.
- The Start tile, the top of `/nauka` and the category card offer to start, continue, or start again after the latest regular-study session ended.
- The Ulubione pytania tile on the Start screen and the Ulubione z kategorii card of a category show the unfinished favourites session to continue, otherwise the marked count with a link to `/nauka/ulubione`, or how to mark questions.
- The star on the question screen marks or unmarks the question and shows the change at once.
- The note button on the question screen is always available. Without a note it opens a form to write one; with a note it shows the text, a notice when it may refer to earlier wording, and editing. Saving a blank note clears it. Opening a saved note before answering records the note opening.
- The Powtórka tile on the Start screen and the Powtórka card of a category show the unfinished review session to continue, otherwise the due count with a link to the review preview, or the same message as the preview with nothing due.

Navigation: starting replaces the preview's history entry and moving between questions replaces the current one, so back returns to where the preview was opened.

On a question:

- An answered question shows the chosen option locked with its result and the explanation.
- An unanswered withdrawn question shows its options disabled with an informational notice. When no question is left open, one notice says the remaining questions were withdrawn instead.
- "Następne pytanie" goes to the following position. The last question, and any question once none is left open, offers "Zobacz podsumowanie", which ends the session. In an ended session the button leads to the summary.
- "Zakończ sesję" in the session menu ends the session at any point; once it has ended, the menu links to the summary.

Caching:

- Session queries sit under `studyKeys.session(userId, pathId, sessionId)` inside the path group, except session questions, which sit in `studyKeys.questions(userId)` because they show the mark and the note.
- Answering and recording assistance update the question and session caches in `onMutate`, replace them with the response on success and refetch them on error. The answer then refreshes `studyKeys.progress(userId, pathId)`: documents, preview and latest session.
- A submission refused because the question was withdrawn shows the question as withdrawn at once, with no error toast and no second attempt.
- Ending a session refreshes the whole path group.
- The favourites session read sits in the progress group. The favourites previews sit in `studyKeys.favorites(userId)` and session questions in `studyKeys.questions(userId)`, both outside any path, because a mark or a note changes them on every path. Marking or unmarking sets the question read in `onMutate`, replaces it with the response on success and refetches it on error, then marks the favourites and questions groups stale without refetching: the previews and the question in other sessions refetch when shown again, and the session and progress reads are left alone.
- Saving or clearing a note sets the question read with the stored note on success, then marks only the questions group stale without refetching.

## SRS

Every SRS-feeding answer updates the question's UserReviewState in the answer transaction ([ADR-0005](adr/0005-srs-evidence-and-written-oral-separation.md#initial-mapping)): regular study, review sessions and favourites sessions. Reviews and favourites never move coverage or rounds. Review sessions read the states as described above.

- The scheduler is the pinned `ts-fsrs` 6 with its default model (FSRS-7) and parameters, desired retention 0.9 and no fuzzing, so replaying the same LearningEvents gives the same state. `rules_version` names the mapping and algorithm; a change to either gets a new version.
- The answer's assistance level comes from the backend's records: `explanation` when the explanation was opened, otherwise `note` when a saved note was opened, otherwise `none`.
- Mapping: an independent correct answer is Good, a correct answer after the note Hard, a correct answer after the explanation Again for a new card and no change for an existing one, and a wrong answer Again regardless of assistance.
- The unit of review is the question's current substantive content. A state belongs to the substantive revision it was built on; once the question's current revision carries other substantive content, the state reads as a new card on every path, while a cosmetic revision keeps it. History is never changed.
- An answer to a revision whose content was replaced, for example one pinned by a session started before the substantive revision, stays in history only and never rates the new content.
- Only the first answer to the current content on a Europe/Warsaw study day (backend time, per path) rates it; later answers that day stay in history only, except that a wrong one still applies Again. An answer that changed nothing still counts as the day's first; answers to replaced content earlier that day do not.
- The reset is read, not written: nothing deletes states at publication, so learning content never writes study data (ADR-0012). It relies on the current revision only moving forward by publishing; restoring earlier wording means publishing a new substantive revision.
- Recomputing a state needs only LearningEvents and revisions: take the path's events of the question whose revision carries the current substantive content, in `answered_at` order, and apply the same rules and scheduler. Nothing performs it yet; a new `rules_version` will.
- A retry of the stored answer returns it without applying SRS again, and a failure anywhere in the transaction keeps neither the answer nor the state.

Goals and XP will join the answer transaction.
