import { Ratio } from '~domain/common/percent.js'

/** The completed share of a total, clamped to it; an empty total counts as nothing completed. */
export const calculateCompletionRatio = (completed: number, total: number): Ratio =>
  Ratio.make(total > 0 ? Math.min(Math.max(completed, 0), total) / total : 0)
