import type { Access, FieldAccess } from 'payload'

type UserWithRole = {
  id: number | string
  role?: 'admin' | 'patient' | null
}

export const isAdmin = (user: UserWithRole | null | undefined): boolean =>
  user?.role === 'admin'

export const isPatient = (user: UserWithRole | null | undefined): boolean =>
  user?.role === 'patient'

export const adminOnly: Access = ({ req: { user } }) => isAdmin(user as UserWithRole)

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const adminOrSelf: Access = ({ req: { user } }) => {
  const u = user as UserWithRole | null
  if (!u) return false
  if (isAdmin(u)) return true
  return { id: { equals: u.id } }
}

export const adminFieldOnly: FieldAccess = ({ req: { user } }) =>
  isAdmin(user as UserWithRole)

export const anyoneCanCreateFirstUser: Access = async ({ req }) => {
  const { totalDocs } = await req.payload.count({ collection: 'users' })
  if (totalDocs === 0) return true
  return isAdmin(req.user as UserWithRole)
}
