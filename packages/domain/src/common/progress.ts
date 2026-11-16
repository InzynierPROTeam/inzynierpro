import { Ratio } from '~domain/common/percent.js'

export const calculateCompletionRatio = (completed: number, total: number): Ratio =>
  Ratio.make(total > 0 ? Math.min(Math.max(completed, 0), total) / total : 0)
