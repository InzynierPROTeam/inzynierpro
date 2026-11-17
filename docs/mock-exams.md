# Mock exams

How written mock exams are configured and started, and how an attempt and its questions are read. The decisions are in [ADR-0004](adr/0004-mock-exam-lifecycle.md) (lifecycle, blueprint and draw) and [ADR-0003](adr/0003-shared-revisions-publication-and-withdrawal.md) (revisions and withdrawal). This document covers what is implemented so far: blueprints, the preview, starting an attempt, reading it, draft answers with flags, the clock and timeout, finishing and result history. Explicit pause comes later. Endpoints sit under `/mock-exams/paths/:qualificationPathId` and require written access on the assignment (`PathAccessDenied`, 403, otherwise).

## Blueprints

The `mock-exams` API module owns ExamBlueprints. A blueprint has a stable identity and immutable versions. A version holds `duration_minutes`, `pass_threshold` (a count of correct answers) and ordered sections, each with a name, a question count and the documents it draws from. Database triggers refuse any update or delete of a version, its sections or their documents.

- `publishBlueprintVersion` creates the blueprint identity when needed and stores the next version under a lock on the blueprint. `assignBlueprint` assigns a path, replacing its earlier blueprint, so a path has at most one.
- Both validate before writing (`InvalidExamBlueprint`): at least one section, every section drawing a positive count from at least one document, a threshold from 1 to the total question count, no document in two sections of one version, and every document on every assigned path. A question belongs to one document, so sections never share a question; a document may still serve different sections in different blueprints. Assigning checks the latest version against the new path.
- There is no write API yet: the seed and test fixtures call these commands.

## Preview

`GET /preview` returns the latest version assigned to the path (`blueprint`, or `null`), its total `questionCount` and, per section, the `availableQuestionCount`: the path's published, non-withdrawn written questions in the section's documents. `unavailableReason` is `no-blueprint` without a blueprint, `too-few-questions` when any section has fewer available questions than it draws, and otherwise `null`. `unfinishedAttempt` is the learner's in-progress or paused attempt on the path.

## Starting an attempt

`POST /attempts` runs under the account lock. It returns the unfinished attempt when one exists; a partial unique index keeps at most one per learner and path. Otherwise it draws a new attempt from the latest version:

- Each section takes its required count at random (`Random.shuffle`) from its eligible questions. The combined draw is then shuffled across all sections before question positions are stored. Sections share no document, so no question is drawn twice and the preview's per-section counts decide exactly whether a draw succeeds. There is no weighting by SRS or history.
- When a section has too few eligible questions left, start is refused with `MockExamUnavailable` (409) and the `reason` the preview reports. A path without a blueprint is refused the same way with `no-blueprint`.
- The attempt stores the blueprint version, `started_at` in backend time, the drawn questions in order with their section and current revision, and each question's shuffled option order. A newer version never changes a started attempt.

## Reading an attempt

Like study sessions, an attempt is read separately from its questions, one question per request:

- `GET /attempts/:attemptId` returns the status, start time, `deadline`, the backend's `serverTime`, `endReason`, `questionCount`, the version's duration, threshold and sections, and `questions`: each position with `isAnswered` and `isFlagged`, for the navigator.
- `GET /attempts/:attemptId/questions/:position` returns one question: its section, pinned body, options in the stored order, `isWithdrawn`, and the draft state `selectedAnswerId`, `isFlagged` and `version`. It never contains correctness, explanations or notes.

Another account's attempt, one on another path, or a position outside the attempt reads as `null`.

## Clock and timeout

The backend owns time. The deadline is `started_at` plus the version's duration plus the attempt's total pause time (zero until pause exists). Closing the app or losing the connection never stops the clock.

- Every read or write of an attempt first locks it and, when it is in progress and past its deadline, finishes it from the last saved answers with end reason `time-expired`, `finished_at` at the deadline and the full duration as active time. This covers the attempt, question, review and history reads, answer and flag writes, finishing, the preview and starting, so an expired attempt is never offered for resuming and starting draws a new one.
- Answer and flag writes are then refused with `MockExamAttemptNotInProgress` (409) when the attempt is not in progress or its deadline has passed. A finish request after the deadline stores `time-expired` instead of `submitted`.
- Starting an attempt offers a job on the `mock-exam-attempt-deadlines` queue, delayed until the deadline, with only the attempt, learner and path IDs and the deadline it was scheduled for. The worker finishes the attempt if it is still in progress and due. A job that finds the attempt missing, finished, paused or with a later deadline does nothing; one delivered before the deadline fails and is retried.
- All finishing paths lock the attempt row and check its status first, so concurrent lazy, explicit and worker finishing store one result.

## Draft answers and flags

Each attempt question holds an optional selected option, a "come back later" flag and a version that starts at 1. An answer can be selected and changed to another option any number of times, but not cleared: once a question is answered it stays answered.

- `PUT /attempts/:attemptId/questions/:position/answer` with `answerId` and `expectedVersion` selects an option; `PUT .../flag` with `isFlagged` and `expectedVersion` sets the flag. Both return the question.
- A write locks the attempt row. When the question already reflects the requested value, the write succeeds without a new version, so a retry is safe. Otherwise a stale `expectedVersion` is refused with `AttemptQuestionConflict` (409) carrying the current question, and nothing is overwritten. A matching write increments the version.
- Writes are refused with `AttemptQuestionNotFound` (404) for another account's attempt or a missing position, `MockExamAttemptNotInProgress` (409) unless the attempt is in progress, `AttemptQuestionWithdrawn` (409) for an answer to a withdrawn question and `InvalidAttemptAnswer` (422) for an option outside the question. A withdrawn question can still be flagged.
- Draft answers are not study attempts: they create no learning events and never reach coverage, reviews or statistics.

## Finishing and review

`POST /attempts/:attemptId/finish` authorizes the owner, locks the attempt and stores the submitted result in one transaction. Repeating it returns the stored result. Unanswered questions count as wrong, and the threshold is inclusive. A withdrawn question makes the result incomplete (`passed: null`). The stored total and section scores remain stable after later content changes. Active time is measured by the backend from the start to the finish time, less pause time; pause count and time are zero until explicit pause is implemented. `endReason` is `submitted` or `time-expired`.

`GET /attempts/:attemptId/review` returns a cursor page in attempt order, with the pinned question revision, stored option order, selected and correct answers, resolved rich explanation, current favourite mark and personal note. Unfinished, missing and foreign attempts return an empty page. Notes and favourites reuse the written-study actions and remain shared across paths. `GET /history` returns the owner's attempts on the path, newest first, with a date, status and saved result. Both collections accept `cursor` and `limit`.

The stable owner-only summary URL is `/egzamin-probny/podejscie/$attemptId/podsumowanie`. Its result card uses the learning summary animation and displays pass/fail or incomplete, counts, solving time, pauses and section scores. Question cards below show the selected answer, the correct answer after a mistake or omission, the explanation and note, with favourite and note-editing actions. The exam panel shows the last attempt and links to its result or unfinished questions, then cursor-paginated history. Starting a new exam first opens `/egzamin-probny/start`, which shows the blueprint preview. Every infinite list loads its next cursor page when its sentinel enters the viewport; only failed page loads offer an explicit retry. Finishing requires confirmation showing unanswered and flagged counts.

## Storage

- `exam_blueprints`, `exam_blueprint_versions`, `exam_blueprint_sections` and `exam_blueprint_section_documents`: identities and immutable versions.
- `exam_blueprint_paths`: one row per path with its blueprint.
- `mock_exam_attempts`: learner, path, blueprint version, `status` (`in-progress`, `paused`, `finished`, `abandoned`) and `started_at`, with the immutable result, finish time and `end_reason`. `mock_exam_attempt_section_results` stores the section scores.
- `mock_exam_attempt_questions` and `mock_exam_attempt_answer_options`: references to revisions and answer IDs in attempt order, never content copies. A question row also holds the draft `selected_answer_id`, which must be one of its stored options, `is_flagged` and `version`.

## Client

- `/egzamin-probny/start` shows the preview: duration, question count, pass threshold and sections with their documents, the unavailable reason, and a start or resume button. Starting stores the attempt in its query, marks preview/history stale without refetching them and replaces the history entry with the attempt's first question.
- `/egzamin-probny/podejscie/$attemptId/$questionNumber` shows the question with its section, an answer form and an icon toggle to come back later; its header and numbered navigation read the attempt, and the previous and next links preload their questions. The navigator marks answered and flagged questions.
- The attempt header counts down from `deadline` minus `serverTime`, measured from when the attempt was read, so the device clock's offset does not matter; each refetch restarts it from the server's values. At zero it refetches the attempt, which finishes it on the backend. Whenever the question page's attempt reads as finished, whether by timeout, the worker, another device or "Zakończ egzamin", the page marks the panel and review stale and replaces itself with the summary. The summary notes that time ran out.
- "Zapisz odpowiedź" sends the selected option with the version the question was read at and moves to the next question at once, without waiting for the response. On an answered question the form offers "Następne pytanie" until another option is selected. A write optimistically updates the question and navigator. Its response caches the saved question; after success or failure, the current question and attempt are refetched to reconcile their state. Other question caches stay fresh, so next/previous render preloads are reused when navigating.
- The "Egzamin próbny" tile on Start, for learners with written access, offers resuming an unfinished attempt, otherwise the exam page, or the unavailable reason.
- Route loaders preload the panel history, preview, current attempt/question and summary/review with exactly the options their views consume. Next/previous links preload their questions on render.
- Draft queries sit under `mockExamKeys.path(userId, pathId)` and `mockExamKeys.attempt(userId, pathId, attemptId)`. Finished review questions sit under `mockExamKeys.reviewQuestions(userId)` so shared note/favourite writes can patch them without fetching result data.

## Seed

Technical path A has one demonstrative blueprint: "Prawo budowlane" and "Warunki techniczne", five questions each from their document, ten minutes and a threshold of 6/10. Each of its documents has eight written questions, so the draw really chooses. Other paths have no blueprint. The values are demonstrative, not a real exam configuration.
