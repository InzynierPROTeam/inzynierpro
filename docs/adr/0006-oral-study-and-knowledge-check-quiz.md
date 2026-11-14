# Oral study and the optional post-session quiz

## Session flow

An oral answer is hidden at first; the user may reveal it without a forced wait or recording. The visibility choice is remembered locally per client across questions and sessions, not stored on the account or synced. Revealing the answer is a normal oral step and never makes an answer "assisted".

Oral self-assessment has three levels: cannot answer, partially, and fully. Submitting it moves to the next question, or to the summary after the last one, without confirmation. We do not carry over V1's independent manual "know / don't know" flag; we store self-assessments of individual attempts and the computed learning state. Favourite and difficult remain independent marks.

## Optional mini-quiz

The mini-quiz is offered after an oral study session finishes and checks the material from that session. The session is closed and its progress saved before the quiz is offered. The user may take it or continue studying; skipping or abandoning the quiz never revokes session completion. "Check your knowledge" is an optional action beside the standard next step. Separating practice from testing keeps oral study simple; quizzes after individual questions were rejected.

The quiz has at most 5 knowledge checks, a backend-configurable limit, covering different oral questions from the session where possible. With fewer approved checks available, we offer fewer, without requiring every oral answer to be covered. Knowledge checks are prepared, approved, versioned content tied to a specific oral answer revision; changing an oral answer requires re-checking its linked quiz questions. AI may help draft them in the editorial workflow (ADR-0009). Initial formats are single choice with a varying number of options, true/false and multiple choice, each with a correct solution and an explanation.

The quiz is created only when the user chooses "Check your knowledge". A finished oral session has one quiz: starting it fixes its question set and answers are saved continuously. Returning after an interruption resumes the same set, and after completion shows the result; the quiz is never re-drawn for the same session.

## Answering and scoring

In every format the user selects an answer and confirms it with "Check". Selections are saved as drafts; the check, result and explanation appear only after confirmation, and the answer cannot change afterwards. This matches the select-and-check flow of written study, except that the quiz offers no explanation before checking, while written study allows it as assistance (ADR-0002).

Multiple choice is scored binary: correct means every correct option selected and no wrong one. Feedback shows missed correct options and wrong selections. The full answer set is kept for analytics and future SRS strategies. How the quiz affects SRS is in ADR-0005.

## Client support

The backend selects only formats the requesting client supports. Without suitable approved checks, or when the client supports none of their formats, "Check your knowledge" is not shown; completion and the standard next step stay available, with no extra self-assessment. If a started quiz contains a format the resuming client does not support, the fixed set is kept and the user is asked to update the app or continue in a supported client; replacement questions are never drawn. This blocks only that quiz.
