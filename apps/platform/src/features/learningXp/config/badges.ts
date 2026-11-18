import type { BadgeCode } from '@inzpro/domain/modules/learning-xp/badge'

export const badgeNames = {
  first_finished_session: 'Pierwsza ukończona sesja',
  streak_7: 'Seria 7 dni nauki',
  streak_30: 'Seria 30 dni nauki',
  streak_100: 'Seria 100 dni nauki',
  first_written_round: 'Pierwsza runda nauki pisemnej',
  first_oral_round: 'Pierwsza runda nauki ustnej',
  first_passed_mock_exam: 'Pierwszy zdany egzamin próbny',
  xp_1000: '1000 punktów za naukę',
  xp_10000: '10 000 punktów za naukę',
} satisfies Record<BadgeCode, string>
