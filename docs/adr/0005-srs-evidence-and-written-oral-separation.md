# SRS evidence, FSRS and written/oral separation

## Separate written and oral models

Written and oral study have separate rounds, study sessions, review sessions and SRS state. Written progress never moves the oral round and vice versa. Global reviews cover every category of one study kind on the current path and never mix written and oral practice in one session. The separation is reflected in separate tables for sessions, answers, rounds and SRS state, with foreign keys and constraints that prevent attaching a question, attempt or SRS state to the wrong study kind. Truly identical technical mechanisms are shared; separate models allow different evaluation sources and review strategies.

## What feeds SRS and what moves the round

SRS uses submitted answers from regular study, favourites and reviews, and the final answers of a finished mock exam. Draft selections and answer changes during an exam do not update SRS. Mode, assistance and exam pauses are kept as context.

Only regular-study answers move the current round. Exams, favourites and reviews never complete questions in the round, even though they feed SRS. Regular study keeps a predictable pass through the material while the review schedule benefits from activity in every mode. Both states are per path, and result history is kept.

## FSRS

FSRS schedules both written and oral reviews. We use an existing implementation rather than our own memory algorithm, and users do not configure it. Separate written and oral strategies translate results into algorithm input, taking mode, assistance, self-assessment, mini-quizzes and finished exams into account.

We keep an immutable log of learning events with the actual result, context, time and material revision, together with the versions of the rules used to compute SRS state. Interpretation rules for application events are versioned too. This explains a schedule and allows recomputing current state after a rule or algorithm change without losing the original data. Recomputing never changes historical answers or exam results. Immutability protects results from being overwritten in normal operation; it does not prevent deleting private history with the account (ADR-0023).

## Initial mapping

- An independent correct written answer is Good and a wrong one is Again. Ease is not inferred from click speed, there is no extra self-assessment after written answers, and Easy is not part of the initial strategy.
- In oral study, "cannot answer" and "partially" both map to Again, because the user cannot yet answer sufficiently on their own; "fully" maps to Good. All three self-assessments are kept in history. An incomplete answer is not Hard, which means a successful but difficult recall.
- A correct assisted written answer is kept as correct but does not earn the standard interval extension. A new question gets an early independent check. An existing state is not pushed out by an answer given after viewing help; a wrong answer still records the failure.

## Oral mini-quiz signal

The oral review unit is the whole oral question; knowledge checks have no schedules of their own. Self-assessment and quiz result are separate events, and the quiz never overwrites the user's declaration. A knowledge-check result affects only the SRS state of its linked oral question; other oral answers in the session keep the rating from self-assessment and history. The quiz total is shown in the summary but is not applied as a shared rating for every oral answer in the session.

A quiz taken right after the session is extra verification of the same exposure, so a correct quiz answer is not a second independent success that extends the interval. A wrong answer may correct the knowledge estimate and bring the review forward without changing the historical declaration. A quiz taken after a longer gap must account for the actual interval.

## Still open

The FSRS implementation and model version, parameters, interval details for assisted answers, the time threshold and combination of quiz signals, and the interpretation of immediate re-solving are strategy configuration still to be specified.
