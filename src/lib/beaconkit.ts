/**
 * BeaconKit page-count beacon. Pure helpers so the decisions are testable in
 * isolation; src/components/beaconkit.tsx wires them to the router.
 *
 * Sends the path, the referrer, and the project key — no query string, no
 * cookies, no storage, no identifiers.
 */

export interface BeaconkitConfig {
  endpoint: string;
  projectId: string;
  apiKey: string;
}

export interface Hit {
  path: string;
  referrer: string | null;
}

const PROJECT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Issued by BeaconKit as sk_<16 hex id>_<48 hex secret>.
const API_KEY = /^sk_[0-9a-f]{16}_[0-9a-f]{48}$/;

/** Mirrors ADS_ENABLED: a malformed config ships dormant, never half-working. */
export function beaconkitEnabled({ endpoint, projectId, apiKey }: BeaconkitConfig): boolean {
  return endpoint.startsWith("https://") && PROJECT_ID.test(projectId) && API_KEY.test(apiKey);
}

/**
 * What to record for a route, or null if it isn't a new page view. On the
 * landing page the referrer is the external one; after a client-side
 * navigation it is the previous page on this site.
 */
export function hitFor(
  pathname: string,
  previousPath: string | null,
  documentReferrer: string,
  origin: string,
): Hit | null {
  if (pathname === previousPath) return null;
  return {
    path: pathname,
    referrer: previousPath === null ? documentReferrer || null : origin + previousPath,
  };
}

/**
 * Fire-and-forget. text/plain keeps the request CORS-"simple" (no preflight);
 * keepalive lets it finish if the visitor is already leaving.
 */
export function sendHit(config: BeaconkitConfig, hit: Hit, fetchImpl: typeof fetch = fetch): void {
  try {
    fetchImpl(`${config.endpoint}/v1/track`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ apiKey: config.apiKey, projectId: config.projectId, path: hit.path, referrer: hit.referrer }),
    }).catch(() => {});
  } catch {
    // A blocked or missing fetch must never break the game.
  }
}
