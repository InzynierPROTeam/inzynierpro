import { appNameKebabCase } from '@inzpro/config/app'
import { getCookie, setCookie } from '@inzpro/react-utils/tanstack-start/cookies'
import { Duration } from 'effect'

const answerVisibleKey = `${appNameKebabCase}.oral-answer-visible`
export const ORAL_ANSWER_VISIBILITY_EVENT_NAME = 'oral_answer_visibility_update'

// The choice stays on this device and is never study assistance (ADR-0006).
export const oralAnswerVisibilityStore = {
  get: () => getCookie(answerVisibleKey) === 'true',
  set: (visible: boolean) => {
    setCookie(answerVisibleKey, String(visible), { maxAge: Duration.days(365) })
    window.dispatchEvent(new Event(ORAL_ANSWER_VISIBILITY_EVENT_NAME))
  },
}

const scaleExplainedKey = `${appNameKebabCase}.oral-difficulty-scale-explained`
export const ORAL_SCALE_EXPLAINED_EVENT_NAME = 'oral_difficulty_scale_explained_update'

export const oralScaleExplainedStore = {
  get: () => getCookie(scaleExplainedKey) === 'true',
  markExplained: () => {
    setCookie(scaleExplainedKey, 'true', { maxAge: Duration.days(365) })
    window.dispatchEvent(new Event(ORAL_SCALE_EXPLAINED_EVENT_NAME))
  },
}
