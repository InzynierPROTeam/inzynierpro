# Shared immutable revisions, single publication and withdrawal

## Immutable revisions

Every change to a published question or oral answer creates a new revision, typo fixes included. Draft material before publication may be edited. Revisions are shared between users, sessions and paths, so history points at the content actually shown. We keep reproducibility instead of editing published content in place.

A started session stores references to specific revisions of questions and their explanations, plus the user's work state; we do not copy content per session. Publishing a newer revision does not change a started session; new sessions use the currently published material. Referenced revisions must stay available for history.

## One catalog, single publication

Question content is shared between paths. Selection uses the path's scope, documents for written study and the oral catalog, with the grouping from ADR-0008. An approved revision is published once, and new sessions on every path whose source scope it fits pick it up. There is no ContentRelease per path: it would share content but force every release to move its pointers after a shared fix. The revision guarantees consistency of question, answers and explanation; the session's fixed reference set guarantees reproducibility. Batch releases may be reconsidered when a related set of materials must be published together. Shared content identity does not merge progress or SRS state between paths or study kinds. Compatibility of one revision with different syllabi follows from its verification evidence (ADR-0007).

## Cosmetic and substantive changes

Editors classify a change as cosmetic or substantive by meaning, not by the number of characters changed. Typos and formatting keep learning state. Changing the correct answer or an important part of an oral answer sends the material back for the user to re-check: history is kept, but knowing the old content does not confirm knowing the new. A substantively changed question becomes eligible again for regular study in the current round, even if the earlier revision was answered; it may appear in the next new session, never added to a started set. A cosmetic change does not do this. The exact SRS state transition still needs to be specified.

## Withdrawal

An authorized person may explicitly withdraw a faulty revision, which blocks further answers to it even in started sessions. This is the one exception to revision pinning; a regular publication still never changes running sessions. Withdrawal keeps historical answers and the reason.

In a study session the withdrawn question is skipped and not replaced. It is neither a wrong nor a submitted answer, and the summary explains the lower number of scored questions. If every remaining question is withdrawn, the session ends with a notice and the standard next step.

In a mock exam the user may finish the remaining questions, but the attempt is marked incomplete and gets no pass/fail result against the original blueprint. Answers and results for valid questions are kept, and the withdrawn question does not count as an error. The summary explains why there is no complete scored simulation.

## Written answer options

An answer option is a separate QuestionAnswer entity belonging to one QuestionRevision, with its own ID, text and correctness and no global presentation position. Publication requires three distinct options with exactly one correct. Option data is immutable after publication, including after withdrawal. A new revision gets its own options and IDs; history is never tied to mutable options shared across revisions.
