# InżynierPRO

Domain vocabulary of the platform that prepares candidates for Polish construction licence exams (uprawnienia budowlane). Each term gives the Polish wording to use in UI copy.

## Language

**QualificationPath** (UI: _ścieżka nauki_):
A shared qualification variant defined by specialization, qualification kind and scope. It is an independent context of learning history, separate from a user's target exam session or exam access scope.

**ExamSession** (UI: _sesja egzaminacyjna_):
An official exam round organized by a chamber. It is distinct from the user's own exam date, a study session and a mock exam attempt.

**GeneralChamber** (UI: _izba krajowa_):
A national professional chamber, such as PIIB or IARP, that owns specializations and organizes exam sessions.

**DistrictChamber** (UI: _izba okręgowa_):
A regional chamber belonging to one general chamber. A user may choose one per path assignment; it filters oral questions reported in that chamber and later matches local dates and contacts.

**RegionalQuestionLink** (UI: _zgłoszenie pytania w izbie_):
A link between an oral question and a district chamber where it was reported, recording whether it comes from an exam-taker's recollection or an official pool source. It never copies question content.

**QualificationProcess** (UI: _proces kwalifikacyjny_):
The sequence of formalities and stages leading to a licence: preparing documents, submitting the application and the exams. It is broader than the exam session and than learning progress.

**QualificationProcessSchedule** (UI: _harmonogram procesu kwalifikacyjnego_):
The stages and dates of the qualification process for a given chamber scope and session, including shared parts. It describes the calendar, not a specific person's completion of formalities.

**UserQualificationChecklist** (UI: _osobista checklista formalności_):
The qualification-process actions a user declares as done. It is distinct from passing schedule deadlines and from learning progress.

**Syllabus** (UI: _wykaz egzaminacyjny_):
The official list of documents and the required depth of knowledge for a given chamber and exam session.

**SyllabusEdition** (UI: _wersja wykazu_):
A specific official version of a syllabus, kept with its original source files. It is distinct from our interpretation of its content.

**SyllabusInterpretation** (UI: _odczyt wykazu_):
The structured mapping of an official syllabus edition prepared by the system or editors. Fixing an error in it never changes the official edition.

**ApplicableSyllabus** (UI: _wykaz odniesienia_):
The syllabus against which a path's published material scope was confirmed. It may differ from the syllabus of the user's target exam session while a material update is not yet confirmed.

**ReferenceDocument** (UI: _dokument referencyjny_):
A knowledge source such as a statute, standard, code, manual or guideline. It keeps its identity across editions.

**DocumentEdition** (UI: _wydanie dokumentu_):
A specific edition of a reference document that material content and verification decisions can refer to.

**DocumentSectionAddress** (UI: _adres fragmentu dokumentu_):
The structural designation of a unit in a specific document, such as an article, paragraph, point or table. With the document identity it identifies a fragment regardless of content changes.

**DocumentSectionContent** (UI: _treść fragmentu dokumentu_):
A specific version of the content of a document unit at a given structural address.

**SectionRelocation** (UI: _przeniesienie fragmentu_):
An explicit link between document units recording a move or renumbering. It never repoints question references automatically.

**QuestionReference** (UI: _powiązanie pytania ze źródłem_):
A question's link to a document or fragment, marked as the direct basis of the answer, a supporting source or a topical relation. Editors decide whether it matters for correctness, independently of its use for navigation.

**WrittenCategory** (UI: _kategoria nauki pisemnej_):
The reference document under which a user finds a group of written questions. It is the same document that is those questions' primary place in the catalog.

**OralQuestionCategory** (UI: _kategoria pytań ustnych_):
A group of oral questions that organizes study, such as a practical topic or a group named after a document. It is distinct from the source documents its questions use.

**Question** (UI: _pytanie_):
The stable identity of an educational question whose content appears in successive revisions. One question may belong to the material of many paths, with separate learning history on each.

**WrittenQuestion** (UI: _pytanie pisemne_):
A question for the written exam, with three answer options and exactly one correct.

**OralQuestion** (UI: _pytanie ustne_):
A question for the oral exam with a prepared oral answer. It is the whole unit of material scheduled for oral reviews.

**OralAnswerRevision** (UI: _rewizja opracowania ustnego_):
A specific version of the prepared answer to an oral question. Linked knowledge checks must be compatible with it.

**OralKnowledgeCheck** (UI: _pytanie sprawdzające opracowanie ustne_):
An approved, versioned question that checks understanding of a specific oral answer, used in the optional post-session mini-quiz. It supports the rating of the whole oral question; it is neither a written exam question nor a separate review unit.

**OralSessionQuiz** (UI: _mini-quiz po sesji ustnej_):
An optional set of knowledge checks covering the material of one oral study session, with feedback after each check and no overall score. It is distinct from studying oral answers and from self-assessments.

**OralSelfAssessment** (UI: _samoocena odpowiedzi ustnej_):
The user's declaration of whether they can answer an oral question on their own: cannot, partially or fully. It is distinct from the mini-quiz result.

**QuestionRevision** (UI: _rewizja pytania_):
A specific version of a question's content and scoring data, immutable once published. A historical result refers to the revision used when answering.

**QuestionAnswer** (UI: _wariant odpowiedzi_):
An identifiable answer option belonging to one question revision, with its text and correctness. Its presentation order is chosen for the view or session. It is part of the published question content, distinct from a learner's submitted answer.

**QuestionVerification** (UI: _weryfikacja pytania_):
A decision on the correctness of a specific question revision against the relevant source versions and checked scope, with author and reasoning. It is distinct from closing editorial work and from publication.

**ContentWithdrawal** (UI: _wycofanie treści_):
An authorized person's explicit decision to stop using a faulty material revision for further answers, including in started sessions. It keeps historical content, answers and the reason.

**UserQualificationPath** (UI: _ścieżka nauki_):
A user's persistent association with a shared qualification path. It has an exam access scope and can be active or archived; it is distinct from both the shared path and the user's exam goal.

**ExamAccessScope** (UI: _dostęp do egzaminu_):
The written, oral or combined learning access granted on a user's assigned path. It restricts both interfaces and data access.

**UserExamGoal** (UI: _cel przygotowań_):
A user's preparation target on one assigned qualification path, including the target exam session and personal preparation dates. One version is current; later changes preserve earlier goal versions and learning history.

**UserExamGoalVersion**:
A historical version of a user's target exam session and personal preparation dates on one assigned path. Later changes do not change the goal associated with earlier activity.

**StudySession** (UI: _sesja nauki_):
An interruptible, resumable regular-study session over one document or category, with a fixed set of question revisions chosen at the start. The user submits an answer to a question at most once per session and gets the result immediately; it is distinct from SRS-selected reviews.
_Avoid_: exam session (_sesja egzaminacyjna_)

**ReviewSession** (UI: _sesja powtórek_):
A separate session whose questions are selected by the review system from the user's SRS state on a path. By default it may span every document or category of that path.

**LearningRound** (UI: _runda nauki_):
One pass through the whole material of a path in regular study, category by category. It is complete when every published, non-withdrawn question of the path has a regular-study answer in it, and the next round starts automatically. It is internal: users start and continue sessions without managing rounds.

**SessionPreview** (UI: _podgląd sesji_):
The proposed material scope and available settings shown before a session is created. The user picks settings within the currently available material and the mode's rules.

**StudyAnswerAttempt** (UI: _próba odpowiedzi w nauce_):
A user's submitted answer to a question in a specific study session and path. A later session allows a new attempt at the same question.

**NewQuestion** (UI: _nowe pytanie_):
A question the user has not yet answered in regular study on a path. Newness concerns that mode's history, not the publication date or activity in exams, favourites and reviews.

**FirstPassCompletion** (UI: _ukończenie pierwszego przejścia_):
At least one submitted regular-study answer to every question of a scope on a path. It means the scope was covered, not mastered.

**UserReviewState** (UI: _stan powtórek użytkownika_):
The current learning state of one unit of material for a user on a path, used to schedule reviews. It includes activity from every mode and is separate from regular-study round progress.

**LearningEvent** (UI: _zdarzenie nauki_):
An immutable record of a user's actual activity on a specific material revision in the context of a path and study kind, with its result, time and circumstances. It feeds progress and review scheduling; its meaning depends on assistance and mode, among others.

**AssistedAnswer** (UI: _odpowiedź udzielona z pomocą_):
A written study attempt preceded by opening the explanation or a non-empty personal note for the question. Its assistance level is note or explanation, the explanation winning when both were opened. It is correct or wrong but is not evidence of fully independent mastery; a note weighs less than the explanation.

**MockExamAttempt** (UI: _podejście do egzaminu próbnego_):
A separate attempt at a mock exam without ongoing feedback. Until it ends the user may return to questions, change answers, and explicitly pause and resume.
_Avoid_: exam session (_sesja egzaminacyjna_)

**FavoriteQuestion** (UI: _ulubione pytanie_):
A question the user marked as a favourite, shared across all their paths.

**PersonalQuestionNote** (UI: _własna notatka do pytania_):
A user's private note on a question, shared across their paths. It stays available after the question changes, with a notice that it may refer to earlier wording.

**WorkItem** (UI: _zadanie redakcyjne_):
Work to be done for a report or for material maintenance, with its own status, priority, assignee and history. It is distinct from the report content, the correctness decision and publication.

**QuestionIssueReport** (UI: _zgłoszenie błędu pytania_):
A user's report of a problem with a specific question revision, with problem type, study context and optional comment. It is input to editorial work.

**RecalledExamQuestion** (UI: _pytanie zapamiętane po egzaminie_):
Content a user recalled after a real exam, with path, district chamber and exam session context when known, and any uncertainty about the wording. It is a submission to develop, not an approved question or an official confirmation of a chamber's question pool.

**ExamFeedback** (UI: _feedback po egzaminie_):
Voluntary information about a real exam and the platform's usefulness, separate for the written and oral parts. It holds declarations and opinions, not verified exam results.

**LearningXP** (UI: _punkty za naukę_):
Motivational account points for learning activity across study kinds and paths. They are distinct from material progress, SRS state and editorial permissions.

**ContributionPoints** (UI: _punkty za wkład_):
Points for approved contributions to the material or the platform. They are distinct from learning points and reputation.

**TrustReputation** (UI: _reputacja_):
A measure of a contributor's or reviewer's trustworthiness based on the quality of their contributions. It is distinct from learning activity and learning points.

**DailyGoal** (UI: _dzienny cel nauki_):
The number of questions planned for a day, separately for written and oral study on a path. It plans the pass through the material up to the chosen date and is distinct from account XP and streak.

**Streak** (UI: _seria dni nauki_):
The number of consecutive days meeting the learning-activity condition, shared by the account. It motivates; it does not measure knowledge.
