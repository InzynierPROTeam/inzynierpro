# Oral study

How oral material is stored, how the oral catalogue is read and how an oral study session runs from preview to summary. Oral SRS, reviews, favourites, notes and the mini-quiz follow in later stages of [#56](https://github.com/InzynierPROTeam/inzynierpro/issues/56). The decisions are [ADR-0002](adr/0002-study-session-lifecycle.md) (session lifecycle and rounds), [ADR-0003](adr/0003-shared-revisions-publication-and-withdrawal.md) (revisions and withdrawal), [ADR-0005](adr/0005-srs-evidence-and-written-oral-separation.md) (separate oral tables), [ADR-0006](adr/0006-oral-study-and-knowledge-check-quiz.md) (oral study) and [ADR-0008](adr/0008-written-document-groups-and-oral-categories.md) (oral categories). Endpoints below sit under `/study/paths/:qualificationPathId/oral` and require oral access.

## Content model

The `learning-content` module owns the oral tables:

- `oral_question_categories`: name and `sort_order`, the catalogue order.
- `oral_questions`: the stable identity, its one primary category and its `category_position` in it, and the current revision.
- `oral_revisions`: the question `body` and the prepared `answer`, both [rich content](rich-content.md), with `change_kind` and `substantive_revision_id` as for written revisions.
- `path_oral_questions`: the per-question assignment to paths. A category is never assigned to a path; it appears on a path through its questions.

The `protect_published_oral_revision` trigger enforces ADR-0003: a draft may be edited, a published revision rejects every change and deletion except the one-time withdrawal (`withdrawn_at` and `withdrawal_reason`), which is final. Writes go through `LearningContentRepository` and reject an image whose asset is not stored.

## Catalogue

`GET /oral` returns a cursor page of the path's oral categories in catalogue order. A category is listed when it has at least one question assigned to the path whose current revision is published and not withdrawn; `availableQuestionCount` counts those questions and `completedQuestionCount` those covered in the learner's current oral round.

`/ustny` lists the categories with their counts and progress, each linking to its session preview, and keeps the empty state when the path has none.

## Oral rounds

Oral study moves through its own LearningRounds, stored per learner and path in `oral_learning_rounds` and `oral_question_coverage`, separate from written rounds. They follow the [written mechanism](written-study.md#learning-rounds):

- A question is covered in a round when a self-assessment in it covered a revision carrying the question's current substantive content. Any self-assessment covers, „Trudne” included.
- A round is complete when every published, non-withdrawn oral question of the path is covered in it. A withdrawn question leaves the round, a question added during it is uncovered, and a path without oral questions never completes one.
- The self-assessment that covers the last question stores the next round in its transaction, under the account lock, so concurrent self-assessments of the last two questions advance it once. When a withdrawal completes the stored round, reads already treat the next round as current.
- A substantive oral revision makes the question uncovered in the current round; a cosmetic one does not.

## Preview and start

`GET /preview` picks a category:

- `categoryId` asks for that category.
- `fromCategoryId` continues oral study: the first category in catalogue order from that one, wrapping around, with questions uncovered in the current round. In a new round, before anything is covered in it, the category after it comes first.
- Neither: the first category with uncovered questions.

It returns the category with its counts and `settings`: 10 questions by default, or all of them when there are fewer; with more than 10 any count from 1 to all (ADR-0002). A session draws the category's questions uncovered in the current round first, then the covered ones, each group in catalogue order (`category_position`).

`POST /sessions` with `categoryId` and `questionCount` confirms the preview under the account lock. It revalidates access, the category and the count, then pins the current published revision of each drawn question.

- `OralSessionAlreadyStarted` (409, with the session ID and position): the category already has an unfinished session. A partial unique index keeps at most one per user, path and category.
- `StaleSessionPreview` (409): the count is no longer allowed or the drawn set changed.
- `OralCategoryNotFound` (404): the category has no studyable questions on the path.

## Reads

A read that finds nothing for the learner returns HTTP 200 with `null`.

| Endpoint                                  | Returns                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `GET /latest-session[?categoryId=]`       | The most recently used oral session of the path or category, with its category, status and progress.          |
| `GET /sessions/:sessionId`                | Status and progress: `total`, `answered` (self-assessed), `skipped`, `percent` and `currentQuestion`.         |
| `GET /sessions/:sessionId/questions/:pos` | The pinned revision: `body` and `answer` as rich content, `isWithdrawn` and the stored `selfAssessment`.      |
| `GET /sessions/:sessionId/summary`        | An ended session with its count per self-assessment (`hard`, `medium`, `easy`).                               |
| `GET /sessions/:sessionId/results`        | A cursor page of positions, each with its self-assessment or withdrawal. Empty until the session ends.        |
| `GET /sessions/:sessionId/next-step`      | `continue-study` with the most recently used unfinished oral session, otherwise `start-study` with a preview. |

The next step continues from the session's category as `fromCategoryId` does. Oral reviews join it in [#61](https://github.com/InzynierPROTeam/inzynierpro/issues/61).

## Self-assessment

`POST .../questions/:pos/self-assessment` takes the revision the client showed and `selfAssessment` on a three-step difficulty scale: `hard` („Trudne”), `medium` („Średnie”) or `easy` („Łatwe”); see [ADR-0006](adr/0006-oral-study-and-knowledge-check-quiz.md). In one transaction under the account lock it checks access, ownership, session state, revision and withdrawal, then stores the self-assessment (`oral_study_self_assessments`), coverage in the current round, the next round when this covers the last question, and the continue point: the first open question after this one, wrapping around.

- Repeating the stored value returns it, so a retry after a lost response is safe.
- A different value is refused with `OralSelfAssessmentAlreadySubmitted` (409) and never overwrites the first.
- A revision other than the pinned one is refused with `InvalidOralSelfAssessment` (422), an ended session with `StudySessionEnded` (409), and a withdrawn question with `SessionQuestionWithdrawn` (409).

Withdrawal, skipping and ending follow [written study](written-study.md#withdrawn-questions): a question withdrawn before its self-assessment is skipped, `POST /sessions/:sessionId/end` ends a session and ending it again changes nothing.

## Client

- `/ustny/start` shows the preview and keeps `kategoria`, `obecna-kategoria` and `liczba-pytan` in the search. For a category with an unfinished session it links to that session instead.
- `/ustny/sesja/$sessionId/$questionNumber` shows the question with its answer collapsed in an accordion, as in V1. Expanding or collapsing it is remembered in a cookie on this device, so it applies to the following questions and sessions and the server renders the same state. It is never stored on the account and never counts as assistance.
- „Oceń trudność pytania” explains the scale, and that harder questions return sooner in reviews, inline until the learner's first self-assessment on this device (also kept in a cookie); afterwards the explanation opens from the help button beside the heading, by click or tap. Tapping „Trudne”, „Średnie” or „Łatwe” saves the self-assessment and moves to the next open question, or ends the session and opens the summary once none is left. Returning to a self-assessed question shows its value read-only.
- `/ustny/sesja/$sessionId/podsumowanie` shows the count per self-assessment, the list of questions with their self-assessment and one next step.
- The oral tile on the Start screen continues the latest unfinished oral session, or after an ended one continues from its category.

Oral session reads sit in `studyKeys.oralSession(userId, pathId, sessionId)` and the oral catalogue, preview, latest session and next step in `studyKeys.oralProgress(userId, pathId)`. A self-assessment replaces the question and session reads with the response and refreshes the oral progress group.

## Seed

The technical seed has three oral categories with four questions each, assigned to every catalogue path except the first technical path, which keeps the empty state. Answers use headings, lists and tables, and the question on the expiry of a building permit has a substantive second revision.
