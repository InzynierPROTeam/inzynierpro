import { onboardingRouteApi } from '../utils/route-api'
import { updateOnboardingSearch } from '../utils/search'
import { AppSessionStep } from './AppSessionStep'
import { ExamStep } from './ExamStep'
import { KindStep } from './KindStep'
import { OnboardingWizard } from './OnboardingWizard'
import { ScopeStep } from './ScopeStep'
import { SpecializationStep } from './SpecializationStep'
import { Steps } from './Steps'

export const OnboardingSection = () => {
  const draft = onboardingRouteApi.useSearch()
  const navigate = onboardingRouteApi.useNavigate()
  const step = draft.krok ?? 1

  return (
    <section className="app-layout-section @container max-md:pb-40!">
      <OnboardingWizard>
        <Steps
          current={step}
          onSelect={krok => void navigate({ search: updateOnboardingSearch(draft, { krok }) })}
        />
        {step === 1 && (
          <SpecializationStep
            initialValue={draft.specjalnosc}
            onNext={id =>
              navigate({
                search: updateOnboardingSearch(draft, {
                  specjalnosc: id,
                  rodzaj: undefined,
                  zakres: undefined,
                  egzamin: undefined,
                  sesja: undefined,
                  krok: 2,
                }),
              })
            }
          />
        )}
        {step === 2 && draft.specjalnosc !== undefined && (
          <KindStep
            initialValue={draft.rodzaj}
            specializationId={draft.specjalnosc}
            onNext={id =>
              navigate({
                search: updateOnboardingSearch(draft, {
                  rodzaj: id,
                  zakres: undefined,
                  egzamin: undefined,
                  sesja: undefined,
                  krok: 3,
                }),
              })
            }
            onBack={() => void navigate({ search: updateOnboardingSearch(draft, { krok: 1 }) })}
          />
        )}
        {step === 3 && draft.specjalnosc !== undefined && draft.rodzaj !== undefined && (
          <ScopeStep
            initialValue={draft.zakres}
            specializationId={draft.specjalnosc}
            qualificationKindId={draft.rodzaj}
            onNext={id =>
              navigate({
                search: updateOnboardingSearch(draft, {
                  zakres: id,
                  egzamin: undefined,
                  sesja: undefined,
                  krok: 4,
                }),
              })
            }
            onBack={() => void navigate({ search: updateOnboardingSearch(draft, { krok: 2 }) })}
          />
        )}
        {step === 4 && draft.specjalnosc !== undefined && (
          <ExamStep
            initialValue={draft.egzamin}
            specializationId={draft.specjalnosc}
            onNext={scope =>
              navigate({
                search: updateOnboardingSearch(draft, {
                  egzamin: scope,
                  sesja: undefined,
                  krok: 5,
                }),
              })
            }
            onBack={() => void navigate({ search: updateOnboardingSearch(draft, { krok: 3 }) })}
          />
        )}
        {step === 5 && <AppSessionStep />}
      </OnboardingWizard>
    </section>
  )
}
