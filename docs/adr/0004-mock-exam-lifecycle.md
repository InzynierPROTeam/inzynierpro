# Mock exam lifecycle

During a mock exam the user gets no feedback and may return to questions and change answers until the attempt ends. Study and exam therefore have different lifecycles rather than one rule of irreversible submission: study gives immediate feedback (ADR-0002), the exam lets the user revise answers without revealing correctness.

Draft exam answers are saved continuously and survive a page refresh or lost connection. Ending the attempt fixes the result from the last saved answers; earlier selections are neither study attempts nor errors in statistics. Explanations, personal notes and correct answers are hidden during the exam. Afterwards the user may review their answers, the correct solutions and explanations.

A write from a stale view must not silently overwrite a newer answer. The client is told about the conflict and fetches the current state.

## Explicit pause

A mock exam may be paused and resumed any number of times without lowering the score. An explicit pause stops the clock and hides the questions; while paused the user cannot view questions or change answers. Closing the app or losing the connection does not pause the clock. The backend controls elapsed time and pause state and, when the limit runs out, ends the attempt from the last saved answers.

We chose interruptible practice over a strictly uninterrupted simulation. To keep results comparable, the summary shows that a pause was used, and the attempt keeps its solving time, total pause time and pause count.
