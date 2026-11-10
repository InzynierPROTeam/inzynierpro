import { ProfilePaths } from './components/ProfilePaths'
import { profileRouteApi } from './utils'

export const ProfilePage = () => {
  const { user } = profileRouteApi.useRouteContext()

  return (
    <section className="layout-section space-y-6">
      <h1 className="text-2xl font-semibold">Twój profil</h1>
      <p>Zalogowano jako {user.email}</p>
      <ProfilePaths userId={user.id} />
    </section>
  )
}
