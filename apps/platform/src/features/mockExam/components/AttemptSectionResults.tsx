import type { MockExamResult } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import { Progress, ProgressLabel } from '@inzpro/ui/components/progress'
import type React from 'react'
import { cx } from 'tailwind-variants'

const sectionColors = [
  'bg-primary',
  'bg-violet-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-rose-500',
] as const

type AttemptSectionResultsProps = { result: MockExamResult }

export const AttemptSectionResults: React.FC<AttemptSectionResultsProps> = ({ result }) => (
  <section
    className="flex flex-col gap-6"
    aria-labelledby="exam-section-results"
  >
    <h3
      id="exam-section-results"
      className="font-medium"
    >
      Wyniki poszczególnych części
    </h3>
    <div className="flex flex-col gap-3">
      <div
        className="flex h-4 gap-1 overflow-hidden rounded-full"
        role="img"
        aria-label={result.sections
          .map(section => `${section.name}: ${section.questionCount} pytań`)
          .join(', ')}
      >
        {result.sections.map((section, index) => (
          <div
            key={section.position}
            className={sectionColors[index % sectionColors.length]}
            style={{ flexGrow: section.questionCount, flexBasis: 0 }}
          />
        ))}
      </div>
      <div
        className="flex gap-1"
        aria-hidden
      >
        {result.sections.map((section, index) => (
          <div
            key={section.position}
            className="min-w-0 text-center text-xs"
            style={{ flexGrow: section.questionCount, flexBasis: 0 }}
          >
            <span
              className={cx(
                'mr-1 inline-block size-2 rounded-full',
                sectionColors[index % sectionColors.length],
              )}
            />
            <span>{section.name}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex flex-col gap-5">
      {result.sections.map(section => (
        <Progress
          key={section.position}
          variant="success"
          size="sm"
          value={ratioToPercent(calculateCompletionRatio(section.correct, section.questionCount))}
          aria-label={`Wynik części ${section.name}`}
        >
          <ProgressLabel>{section.name}</ProgressLabel>
          <span className="ml-auto text-sm tabular-nums">
            {section.correct} / {section.questionCount}
          </span>
        </Progress>
      ))}
    </div>
  </section>
)
