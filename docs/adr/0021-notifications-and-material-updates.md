# Notifications and material updates

The first release shows study reminders in the app; messages needed for sign-in work from the start. Push reminders come later. Study reminders are never sent by e-mail.

The user picks one reminder path, independent of the path last opened in the app. With one path the choice is implicit; with several, it is set in reminder settings, and switching views never changes it.

Before sending, the backend re-checks the current settings, path availability and whether the preparation goal is still current. Removing the path, finishing preparation or disabling reminders cancels pending sends. Reminders never rely on an open-ended local schedule independent of the account and goal. Opening a reminder leads to its path after re-checking availability; if the context is gone, the home screen shows a short notice instead of silently redirecting to another path.

Push is opt-in with one chosen hour, interpreted in Europe/Warsaw, and at most one reminder a day. Before handing it to the provider the backend checks whether the chosen path still has an unmet written or oral daily goal or due reviews; if both goals are met and nothing is due, the send is skipped.

Push permission on a device is tied to the signed-in account and revoked on sign-out, so switching accounts never leaves the previous user's reminders. Even a delayed notification checks the account and context availability before showing path data.

Important material updates on the active path appear as a short in-app notice that expands to details. Changes are grouped rather than announced per correction. The notice never blocks study; withdrawal of faulty content is still handled directly in started sessions (ADR-0003).
