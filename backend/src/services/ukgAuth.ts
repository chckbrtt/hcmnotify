/**
 * UKG Ready authentication service.
 * Handles v1 login, JWT decoding, and OIDC discovery.
 */

interface AuthResult {
  success: boolean;
  token?: string;
  decoded?: {
    cid: string;
    sub: string;
    exp: number;
    iss: string;
    iat: number;
    [key: string]: any;
  };
  error?: string;
  responseMs: number;
}

interface OIDCDiscovery {
  authorization_endpoint?: string;
  token_endpoint?: string;
  jwks_uri?: string;
  issuer?: string;
  scopes_supported?: string[];
  grant_types_supported?: string[];
  [key: string]: any;
}

/**
 * Authenticate against UKG Ready v1 login endpoint
 */
export async function testAuth(
  baseUrl: string,
  apiKey: string,
  username: string,
  password: string,
  company: string
): Promise<AuthResult> {
  const cleanBase = baseUrl.replace(/\/+$/, '').replace(/\/v[12]\/?$/, '');
  const start = Date.now();

  try {
    const res = await fetch(`${cleanBase}/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        credentials: { username, password, company },
      }),
    });

    const responseMs = Date.now() - start;

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        success: false,
        error: `HTTP ${res.status}: ${text.substring(0, 300)}`,
        responseMs,
      };
    }

    const data: any = await res.json();
    const token = data.token;

    if (!token) {
      return { success: false, error: 'No token in response', responseMs };
    }

    // Decode JWT (no verification — we trust UKG's response)
    const decoded = decodeJwt(token);

    return { success: true, token, decoded, responseMs };
  } catch (err: any) {
    return {
      success: false,
      error: `Connection failed: ${err.message}`,
      responseMs: Date.now() - start,
    };
  }
}

/**
 * Run OIDC discovery for a UKG Ready tenant
 */
export async function discoverOIDC(
  baseUrl: string,
  companyId: string,
  token: string
): Promise<{ success: boolean; data?: OIDCDiscovery; error?: string; responseMs: number }> {
  const cleanBase = baseUrl.replace(/\/+$/, '').replace(/\/v[12]\/?$/, '');
  const start = Date.now();

  try {
    const res = await fetch(
      `${cleanBase}/v2/companies/${companyId}/oauth2/.well-known/openid-configuration`,
      {
        headers: {
          'Authentication': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    const responseMs = Date.now() - start;

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { success: false, error: `HTTP ${res.status}: ${text.substring(0, 300)}`, responseMs };
    }

    const data = (await res.json()) as OIDCDiscovery;
    return { success: true, data, responseMs };
  } catch (err: any) {
    return { success: false, error: err.message, responseMs: Date.now() - start };
  }
}

/**
 * Decode JWT payload without verification
 */
function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
