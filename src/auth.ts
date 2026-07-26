import config from '@payload-config'
import { getPayload } from 'payload'
import { getAuthjsInstance } from 'payload-authjs'

/**
 * The Auth.js instance is created by the authjsPlugin during Payload's onInit,
 * so Payload has to be initialized before it can be retrieved.
 */
const payload = await getPayload({ config })

export const { handlers, signIn, signOut, auth } = getAuthjsInstance(payload)
