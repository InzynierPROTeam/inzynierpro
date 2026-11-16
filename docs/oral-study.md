# Oral study

How oral material is stored and how the oral catalogue is read. Oral sessions, rounds, reviews and the mini-quiz follow in later stages of [#56](https://github.com/InzynierPROTeam/inzynierpro/issues/56). The decisions are [ADR-0003](adr/0003-shared-revisions-publication-and-withdrawal.md) (revisions and withdrawal), [ADR-0006](adr/0006-oral-study-and-knowledge-check-quiz.md) (oral study) and [ADR-0008](adr/0008-written-document-groups-and-oral-categories.md) (oral categories).

## Content model

The `learning-content` module owns the oral tables:

- `oral_question_categories`: name and `sort_order`, the catalogue order.
- `oral_questions`: the stable identity, its one primary category and its `category_position` in it, and the current revision.
- `oral_revisions`: the question `body` and the prepared `answer`, both [rich content](rich-content.md), with `change_kind` and `substantive_revision_id` as for written revisions.
- `path_oral_questions`: the per-question assignment to paths. A category is never assigned to a path; it appears on a path through its questions.

The `protect_published_oral_revision` trigger enforces ADR-0003: a draft may be edited, a published revision rejects every change and deletion except the one-time withdrawal (`withdrawn_at` and `withdrawal_reason`), which is final. Writes go through `LearningContentRepository` and reject an image whose asset is not stored.

## Catalogue

`GET /study/paths/:qualificationPathId/oral` requires oral access and returns a cursor page of the path's oral categories in catalogue order. A category is listed when it has at least one question assigned to the path whose current revision is published and not withdrawn; `availableQuestionCount` counts those questions. `completedQuestionCount` stays 0 until oral rounds exist (#59).

`/ustny` lists the categories with their counts and progress, and keeps the empty state when the path has none.

## Seed

The technical seed has three oral categories with four questions each, assigned to every catalogue path except the first technical path, which keeps the empty state. Answers use headings, lists and tables, and the question on the expiry of a building permit has a substantive second revision.
