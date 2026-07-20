import config from '@payload-config'
import { getPayload } from 'payload'

/** Cached Payload Local API client for use in server components and route handlers. */
export async function getPayloadClient() {
  return getPayload({ config })
}
