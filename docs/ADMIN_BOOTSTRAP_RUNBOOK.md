# Initial administrator bootstrap runbook

This is an operations-only runbook. It must be executed only after the migration has been applied to the intended Supabase project and the target user has completed normal sign-in and profile creation.

1. Confirm the production Supabase project URL, project ref, and a current backup. Do not run against Preview or a copied project.
2. Confirm the target user's UUID from Supabase Auth and the matching `public.profiles` row. Confirm the identity with the intended administrator through an independent channel.
3. An operator with direct database-console access runs a one-time, parameterized SQL statement to set that exact profile to `role = 'admin'` and `status = 'active'`.
4. In the same transaction, insert an `audit_log` entry with actor `null`, action `admin.bootstrap`, a change ticket/reference, and old/new role values. The app, browser clients, and service role must not have a route to run this operation.
5. Have the new administrator sign out and sign in again. Before enabling administration, require their Supabase Auth MFA enrollment and verify an MFA-backed session on a protected admin route.
6. Record the operator, timestamp, target UUID, and the backup reference outside the repository. Do not record access tokens, email secrets, or SQL console credentials.

Subsequent role changes must be a dedicated audited operation with a required reason, reauthentication, and immediate session/token invalidation for the affected user. It is not part of a normal profile update.
