# Mock exam lifecycle

During a mock exam the user gets no feedback and may return to questions and change answers until the attempt ends. Study and exam therefore have different lifecycles rather than one rule of irreversible submission: study gives immediate feedback (ADR-0002), the exam lets the user revise answers without revealing correctness.

Draft exam answers are saved continuously and survive a page refresh or lost connection. Ending the attempt fixes the result from the last saved answers; earlier selections are neither study attempts nor errors in statistics. Explanations, personal notes and correct answers are hidden during the exam. Afterwards the user may review their answers, the correct solutions and explanations.

A write from a stale view must not silently overwrite a newer answer. Each question in an attempt carries a version number, every write sends the version the client last saw, and a stale write is refused with the current state, which the client then shows.

## Blueprint and draw

An ExamBlueprint has a stable identity and immutable versions. Paths are assigned to it, and several paths may share one. A version holds the duration, a pass threshold as a count of correct answers, and sections, each with a question count and the documents it draws from. Sections reference documents directly instead of a global exam group on a document, so the same document can play different roles in different blueprints. A new attempt uses the latest version and keeps it.

Each section draws its questions at random from the path's published, non-withdrawn questions in its documents, with no weighting by SRS. When a section has too few questions, the exam is unavailable instead of shrunk, because a smaller exam would not be comparable to the real one. At most one unfinished attempt exists per user and path.

## Ending an attempt

An attempt ends when the user finishes it, when time runs out, or when the user abandons it. A finished attempt counts unanswered questions as wrong and is scored against the threshold. Its final answers feed written SRS as exam-mode learning events. Unanswered questions create no events. An abandoned attempt keeps no score and creates no learning events, so starting by mistake costs nothing. It stays in history as abandoned. An attempt containing a withdrawn question is incomplete and gets no pass/fail (ADR-0003).

Time-out finishing does not depend on the user returning. The first read or write after the deadline finishes the attempt, and a worker job scheduled for the deadline finishes it otherwise. Both paths are idempotent.

## Explicit pause

A mock exam may be paused and resumed any number of times without lowering the score. An explicit pause stops the clock and hides the questions; while paused the user cannot view questions or change answers. Closing the app or losing the connection does not pause the clock. The backend controls elapsed time and pause state and, when the limit runs out, ends the attempt from the last saved answers.

We chose interruptible practice over a strictly uninterrupted simulation. To keep results comparable, the summary shows that a pause was used, and the attempt keeps its solving time, total pause time and pause count.
