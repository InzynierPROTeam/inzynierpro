# Written study

How a written study session runs from preview to summary. The decisions behind it are in [ADR-0002](adr/0002-study-session-lifecycle.md) (session lifecycle) and [ADR-0003](adr/0003-shared-revisions-publication-and-withdrawal.md) (revisions and withdrawal); this document describes how they are implemented. Endpoints below sit under `/study/paths/:qualificationPathId`.

## Reads

A read that finds nothing for the learner returns HTTP 200 with `null`: preview, latest session, session, question and summary. Category details keep 404. Authentication and access failures stay errors.

| Endpoint                                  | Returns                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `GET /documents/:documentId`              | One category with the learner's progress in the current round, independent of the preview.                   |
| `GET /preview`                            | The proposed document, its `questionSelection` and the count settings.                                       |
| `GET /latest-session[?documentId=]`       | The most recently used session of the path or document, with status, progress and document.                  |
| `GET /sessions/:sessionId`                | Status and progress: `total`, `answered`, `skipped`, `percent` and `currentQuestion` to continue from.       |
| `GET /sessions/:sessionId/questions/:pos` | The pinned revision with options in session order, their correctness, the explanation and the stored answer. |
| `GET /sessions/:sessionId/summary`        | An ended session's correct, incorrect and assisted counts and its score.                                     |
| `GET /sessions/:sessionId/results`        | A cursor page of positions, each with its answer or withdrawal. Empty until the session ends.                |

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

## Storage

Written study has its own tables, separate from future oral study (ADR-0005).

- `written_study_sessions`: a partial unique index keeps one unfinished session per user, path and document. A session stores the UserExamGoal version active at its start and its `current_position`.
- `written_study_session_questions` and `written_study_session_answer_options`: references to revisions and answer IDs in session order, never content copies.
- `written_study_answers`: one answer per session question.
- `written_learning_events`: one LearningEvent per answer, with result, revision, path, the session's goal version, mode (`study`, later `review` and `favourites`), assistance level (`none`, `note` or `explanation`) and `answered_at` in backend time.
- `written_review_states`: the UserReviewState per learner, path and question: the FSRS card, the event and `rules_version` that produced it, and the substantive revision it was built on.
- `written_learning_rounds`: the learner's stored round per path; without a row it is round 1.
- `written_question_coverage`: per learner, path and question, the revision and round of the latest regular-study answer, for rounds, previews and progress.
- `question_revisions.change_kind` and `substantive_revision_id`: the revision whose substantive content a revision carries, its own unless the change is cosmetic. Coverage compares these instead of publication times.

Extending access, changing the goal, archiving and restoring an assignment keep all of these.

## Answering

Selecting an option is a draft kept in the form: it is no attempt and a reload clears it.

`POST .../questions/:pos/answer` takes the revision the client showed and an answer ID. In one transaction under the account lock it checks access, ownership, session state, revision, option and withdrawal, then stores the answer, its LearningEvent, the question's review state, coverage in the current round, the next round when this answer covers the last question, and the new continue point: the first open question after this one, wrapping around, or this one when none is open.

- Repeating the stored answer returns it, so a retry after a lost response is safe.
- A different answer is refused with `SessionAnswerAlreadySubmitted` (409) and never overwrites the first.
- Answering never ends a session.

**Assistance.** The hint button shows the explanation already in the question read. The client posts `.../questions/:pos/assistance` only while the opening can still mark an answer: unanswered, not recorded yet, not withdrawn, session active. The backend records `explanation_opened_at` once, and the answer is assisted when that record exists; the client's own view never decides it. Checking waits for a pending record.

## Withdrawn questions

Publishing a newer revision never changes a started session. A withdrawal (`withdrawRevision`, with a required reason, only for a published revision and final once stored) blocks answers to the pinned revision even in started sessions.

- The answer command rechecks withdrawal under the lock, so a question the client opened before the withdrawal is refused with `SessionQuestionWithdrawn` (409).
- An answer stored before the withdrawal stays readable and scored.
- A question withdrawn before its answer and before the session ended is **skipped**: it counts in `progress.skipped` and leaves the progress percent and the score (`scoredQuestionCount` in `@inzpro/domain`). It is never counted as incorrect. A withdrawal after the session ended leaves its summary unchanged.
- The continue point passes over withdrawn questions. When none is left open (`hasOpenQuestions`), the session can only end.

## Ending and the summary

`POST /sessions/:sessionId/end` ends a session under the account lock and keeps its answers, events and coverage. Ending it again changes nothing, and an ended session accepts no answers. A new session for the document starts from its preview.

The score is the share of correct answers among the scored questions, so unanswered ones count against it and skipped ones do not. Percentages go through `calculateCompletionRatio` and `ratioToPercent`, rounded as in V1.

## Client

Routes:

- `/nauka/start` shows the preview and keeps the V1 search fields `akt-prawny`, `obecny-akt-prawny` and `liczba-pytan`. For a category with an active session it links to that session instead.
- `/nauka/sesja/$sessionId/$questionNumber` shows one question. Its header reads only the session and the question card only the question.
- `/nauka/sesja/$sessionId/podsumowanie` shows an ended session's score ring, its counts, the result of every position and the next preview from the session's document.
- The Start tile, the top of `/nauka` and the category card offer to start, continue, or start again after the latest session ended.

Navigation: starting replaces the preview's history entry and moving between questions replaces the current one, so back returns to where the preview was opened.

On a question:

- An answered question shows the chosen option locked with its result and the explanation.
- An unanswered withdrawn question shows its options disabled with an informational notice. When no question is left open, one notice says the remaining questions were withdrawn instead.
- "Następne pytanie" goes to the following position. The last question, and any question once none is left open, offers "Zobacz podsumowanie", which ends the session. In an ended session the button leads to the summary.
- "Zakończ sesję" in the session menu ends the session at any point; once it has ended, the menu links to the summary.

Caching:

- Session queries sit under `studyKeys.session(userId, pathId, sessionId)` inside the path group.
- Answering and recording assistance update the question and session caches in `onMutate`, replace them with the response on success and refetch them on error. The answer then refreshes `studyKeys.progress(userId, pathId)`: documents, preview and latest session.
- A submission refused because the question was withdrawn shows the question as withdrawn at once, with no error toast and no second attempt.
- Ending a session refreshes the whole path group.

## SRS

Every SRS-feeding answer updates the question's UserReviewState in the answer transaction ([ADR-0005](adr/0005-srs-evidence-and-written-oral-separation.md#initial-mapping)). Today that is regular study; reviews and favourites will feed it the same way and never move coverage or rounds. There is no read or UI yet.

- The scheduler is the pinned `ts-fsrs` 6 with its default model (FSRS-7) and parameters, desired retention 0.9 and no fuzzing, so replaying the same LearningEvents gives the same state. `rules_version` names the mapping and algorithm; a change to either gets a new version.
- The answer's assistance level comes from the backend's records: `explanation` when the explanation was opened, otherwise `none`. `note` arrives with personal notes.
- Mapping: an independent correct answer is Good, a correct answer after the note Hard, a correct answer after the explanation Again for a new card and no change for an existing one, and a wrong answer Again regardless of assistance.
- The unit of review is the question's current substantive content. A state belongs to the substantive revision it was built on; once the question's current revision carries other substantive content, the state reads as a new card on every path, while a cosmetic revision keeps it. History is never changed.
- An answer to a revision whose content was replaced, for example one pinned by a session started before the substantive revision, stays in history only and never rates the new content.
- Only the first answer to the current content on a Europe/Warsaw study day (backend time, per path) rates it; later answers that day stay in history only, except that a wrong one still applies Again. An answer that changed nothing still counts as the day's first; answers to replaced content earlier that day do not.
- The reset is read, not written: nothing deletes states at publication, so learning content never writes study data (ADR-0012). It relies on the current revision only moving forward by publishing; restoring earlier wording means publishing a new substantive revision.
- Recomputing a state needs only LearningEvents and revisions: take the path's events of the question whose revision carries the current substantive content, in `answered_at` order, and apply the same rules and scheduler. Nothing performs it yet; a new `rules_version` will.
- A retry of the stored answer returns it without applying SRS again, and a failure anywhere in the transaction keeps neither the answer nor the state.

Goals and XP will join the answer transaction.
