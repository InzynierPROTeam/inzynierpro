# Mock exams

How written mock exams are configured and started, and how an attempt and its questions are read. The decisions are in [ADR-0004](adr/0004-mock-exam-lifecycle.md) (lifecycle, blueprint and draw) and [ADR-0003](adr/0003-shared-revisions-publication-and-withdrawal.md) (revisions and withdrawal). This document covers what is implemented so far: blueprints, the preview, starting an attempt and reading it. Answers, the clock, pause, finishing and history come later. Endpoints sit under `/mock-exams/paths/:qualificationPathId` and require written access on the assignment (`PathAccessDenied`, 403, otherwise).

## Blueprints

The `mock-exams` API module owns ExamBlueprints. A blueprint has a stable identity and immutable versions. A version holds `duration_minutes`, `pass_threshold` (a count of correct answers) and ordered sections, each with a name, a question count and the documents it draws from. Database triggers refuse any update or delete of a version, its sections or their documents.

- `publishBlueprintVersion` creates the blueprint identity when needed and stores the next version under a lock on the blueprint. `assignBlueprint` assigns a path, replacing its earlier blueprint, so a path has at most one.
- Both validate before writing (`InvalidExamBlueprint`): at least one section, every section drawing a positive count from at least one document, a threshold from 1 to the total question count, no document in two sections of one version, and every document on every assigned path. A question belongs to one document, so sections never share a question; a document may still serve different sections in different blueprints. Assigning checks the latest version against the new path.
- There is no write API yet: the seed and test fixtures call these commands.

## Preview

`GET /preview` returns the latest version assigned to the path (`blueprint`, or `null`), its total `questionCount` and, per section, the `availableQuestionCount`: the path's published, non-withdrawn written questions in the section's documents. `unavailableReason` is `no-blueprint` without a blueprint, `too-few-questions` when any section has fewer available questions than it draws, and otherwise `null`. `unfinishedAttempt` is the learner's in-progress or paused attempt on the path.

## Starting an attempt

`POST /attempts` runs under the account lock. It returns the unfinished attempt when one exists; a partial unique index keeps at most one per learner and path. Otherwise it draws a new attempt from the latest version:

- Sections draw in blueprint order. Each takes its count at random (`Random.shuffle`) from its eligible questions. Sections share no document, so no question is drawn twice and the preview's per-section counts decide exactly whether a draw succeeds. There is no weighting by SRS or history.
- When a section has too few eligible questions left, start is refused with `MockExamUnavailable` (409) and the `reason` the preview reports. A path without a blueprint is refused the same way with `no-blueprint`.
- The attempt stores the blueprint version, `started_at` in backend time, the drawn questions in order with their section and current revision, and each question's shuffled option order. A newer version never changes a started attempt.

## Reading an attempt

Like study sessions, an attempt is read separately from its questions, one question per request:

- `GET /attempts/:attemptId` returns the status, start time, `questionCount` and the version's duration, threshold and sections.
- `GET /attempts/:attemptId/questions/:position` returns one question: its section, pinned body, options in the stored order and `isWithdrawn`. It never contains correctness, explanations or notes.

Another account's attempt, one on another path, or a position outside the attempt reads as `null`.

## Storage

- `exam_blueprints`, `exam_blueprint_versions`, `exam_blueprint_sections` and `exam_blueprint_section_documents`: identities and immutable versions.
- `exam_blueprint_paths`: one row per path with its blueprint.
- `mock_exam_attempts`: learner, path, blueprint version, `status` (`in-progress`, `paused`, `finished`, `abandoned`) and `started_at`.
- `mock_exam_attempt_questions` and `mock_exam_attempt_answer_options`: references to revisions and answer IDs in attempt order, never content copies.

## Client

- `/egzamin-probny` shows the preview: duration, question count, pass threshold and sections with their documents, the unavailable reason, and a start or resume button. Starting stores the attempt in its query, refreshes the preview and replaces the history entry with the attempt's first question.
- `/egzamin-probny/podejscie/$attemptId/$questionNumber` shows the shown question with its section and an answer form; its header and numbered navigation read the attempt, and the previous and next links preload their questions. Submitting the form only confirms the selection with a toast until answers are saved (#76).
- The "Egzamin próbny" tile on Start, for learners with written access, offers resuming an unfinished attempt, otherwise the exam page, or the unavailable reason.
- Queries sit under `mockExamKeys.path(userId, pathId)`; an attempt and its questions under `mockExamKeys.attempt(userId, pathId, attemptId)`.

## Seed

Technical path A has one demonstrative blueprint: "Prawo budowlane" and "Warunki techniczne", five questions each from their document, ten minutes and a threshold of 6/10. Each of its documents has eight written questions, so the draw really chooses. Other paths have no blueprint. The values are demonstrative, not a real exam configuration.
