import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { AttemptQuestionPosition } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { Button } from '@inzpro/ui/components/button'
import { Link } from '@tanstack/react-router'
import type React from 'react'

type ResumeMockExamButtonProps = { attemptId: MockExamAttemptId }

export const ResumeMockExamButton: React.FC<ResumeMockExamButtonProps> = ({ attemptId }) => (
  <Button
    nativeButton={false}
    render={
      <Link
        to="/egzamin-probny/podejscie/$attemptId/$questionNumber"
        params={{ attemptId, questionNumber: AttemptQuestionPosition.make(1) }}
      />
    }
  >
    Wróć do egzaminu
  </Button>
)
