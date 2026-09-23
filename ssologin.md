# Corporate SSO (SAML) Integration — Complete Flow

> Status: **Design / integration guide** (no code shipped yet).
> Scope: React Native app (Android + iOS) + backend + IdP (Azure Entra ID / ADFS style SAML).
> The app already has a **"Corporate SSO"** button in `LoginScreen` wired to an empty
> `handleCorporateSSO = () => {}` stub — this doc explains exactly how to fill it in.

---

## 1. What the client gave us

The client sent five values. These are **SAML** parameters (the classic Azure Entra "Enterprise Application → Single sign-on (SAML)" screen):

| Field the client sent | SAML term | Who owns / hosts it |
| --- | --- | --- |
| **Identifier (Entity ID)** | SP Entity ID | **Our backend** (Service Provider identity) |
| **Reply URL (Assertion Consumer Service URL)** | ACS URL | **Our backend** (receives the SAML assertion) |
| **Sign on URL** | SP-initiated login start URL | **Our backend** (app opens this) |
| **Relay State** | RelayState | Round-trips through the IdP back to our ACS |
| **Logout Url** | SP SLO (Single Logout) URL | **Our backend** |

**Key takeaway:** every one of these five URLs points at **our backend**, *not* at the mobile app. SAML is a browser-redirect + form-POST protocol; a native mobile app cannot be a SAML SP directly. So the architecture is:

```
Mobile app  ──opens browser──►  Backend (SAML SP)  ◄──SAML──►  IdP (client's Azure/ADFS)
     ▲                                   │
     └────────deep-link callback─────────┘   (backend hands the app its own JWTs)
```

The app never speaks SAML. It opens the backend Sign-on URL in a browser, the backend + IdP do the SAML dance, and the backend finishes by **redirecting to a mobile deep link** carrying a short-lived code that the app exchanges for the same `access_token` / `refresh_token` pair we already use for password login.

---

## 2. Why this shape (and not "SAML in the app")

- SAML uses `HTTP-POST` binding — the IdP posts a signed XML assertion to the ACS URL. Only a web server can validate the signature against IdP metadata. → **backend must be the SP.**
- Mobile best practice (RFC 8252, "OAuth for Native Apps") is: authenticate in a **system browser / in-app browser tab**, return via a **redirect URI** (custom scheme or Universal/App Link), then exchange a one-time code for tokens. We apply the same pattern, just with SAML behind the backend.
- This keeps the app's existing session model unchanged: after SSO we still end up calling `tokenService.saveTokens(access, refresh)` → `authService.getMe()`, exactly like `authService.login()` does today.

---

## 3. End-to-end flow (sequence)

```
User taps "Corporate SSO"
        │
        ▼
App generates state = random nonce; stores it
App opens:  {SIGN_ON_URL}?relay_state={deeplink+nonce}
        │            (system browser / ASWebAuthenticationSession / Custom Tab)
        ▼
Backend (SP) builds SAML AuthnRequest → 302 to IdP
        ▼
IdP shows corporate login (MFA etc.) → user authenticates
        ▼
IdP HTTP-POSTs SAML assertion to  {ACS_URL}  (+ RelayState echoed back)
        ▼
Backend validates assertion, resolves/creates the user, mints ONE-TIME code
Backend 302 redirects to the mobile callback deep link:
        srffcb://sso/callback?code=ABC123&state={nonce}
        ▼
OS routes deep link → app foregrounds → Linking listener fires
App verifies state == stored nonce
App calls  POST /api/v1/auth/sso/exchange { code }  →  { access_token, refresh_token }
        ▼
tokenService.saveTokens(...)  →  authService.getMe()  →  fetchUserRole()
        ▼
Reset navigation to landing route (same logic as password login)
```

Logout later: call backend SLO (`LOGOUT_URL`) so the IdP session is also terminated, then clear local tokens.

---

## 4. The two moving domains: "Sign-on domain" vs "Callback domain"

There are **two** different URLs people conflate. Keep them separate:

1. **Sign-on URL** (`https://<backend>/...`) — the page the app *opens*. Backend-hosted, HTTPS.
2. **Callback / redirect URI** — where the backend *sends the app back*. This is the "callback URL / domain integration" the task mentions. Two options:

   - **Option A — Custom URL scheme** (simplest, recommended to start):
     `srffcb://sso/callback` — no domain hosting needed, works offline of DNS. Small risk: another app could register the same scheme, so we protect the exchange with a one-time code + `state` nonce.
   - **Option B — Universal Link (iOS) / App Link (Android)** (most secure, more setup):
     `https://fcb-crmapi.srf.com/app/sso/callback` — requires hosting `apple-app-site-association` + `assetlinks.json` on the backend domain and Associated Domains / `autoVerify` in the app. The OS guarantees only our app opens it.

   **Recommendation:** ship Option A first (fast, no DNS/hosting dependency), migrate to Option B for production hardening if security review requires it.

---

## 5. Project-specific values (already in this repo)

| | Android `applicationId` | iOS bundle id | API base (`API_URL`) |
| --- | --- | --- | --- |
| **prod** (`.env.prod`) | `com.srf.fcbcrm` | `com.srf.fcbunified` | `https://fcb-crmapi.srf.com` |
| **stage** (`.env.stage`) | `com.srf.fcbcrm.stage` | `com.srf.fcbunified.stage` | `https://fcb-crmtestapi.srf.com` |
| **qa** (`.env.qa`) | `com.srf.fcbcrm.qa` | `com.srf.fcbunified.qa` | `https://fcb-crmtestapi.srf.com` |

Relevant existing files:
- Login UI + `handleCorporateSSO` stub → `src/screens/auth/LoginScreen.tsx`
- Auth API (`login`, `getMe`, `logout`, `saveRoleType`, role helpers) → `src/services/api/authService.ts`
- Token storage (Keychain, base64) → `src/services/api/tokenService.ts`
- Endpoints table → `src/services/api/endpoints.ts`
- axios client + refresh interceptor → `src/services/api/client.ts` (`baseURL = ENV.API_URL`)
- Env resolution → `src/config` (`ENV.API_URL`)
- Post-login landing/role logic → `LoginScreen.tsx` lines ~160–195 (CEO → `CeoDashboard`, hold/release → `MyActionsScreen`, complaints-only → `ComplaintStatusScreen`, else `MainTabs`)

Suggested **callback scheme**: `srffcb` (single scheme across flavors; the `state` nonce + one-time code make per-flavor schemes unnecessary, but if you want strict isolation use `srffcb`, `srffcb.stage`, `srffcb.qa`).

---

## 6. Values to hand back to the client (fill these in with the backend team)

The client's five fields must be populated with **backend** URLs. Give them this table once the backend team confirms the paths (paths below are proposals — backend owns the final routes):

| Client field | Value to provide (prod example) |
| --- | --- |
| Identifier (Entity ID) | `https://fcb-crmapi.srf.com/saml/metadata` (or a stable URN the backend chooses) |
| Reply URL (ACS URL) | `https://fcb-crmapi.srf.com/api/v1/auth/sso/saml/acs` |
| Sign on URL | `https://fcb-crmapi.srf.com/api/v1/auth/sso/saml/login` |
| Relay State | `mobile` (or leave blank; the app appends its own nonce/deep-link) |
| Logout Url | `https://fcb-crmapi.srf.com/api/v1/auth/sso/saml/logout` |

Provide the **test** variants too using `https://fcb-crmtestapi.srf.com` for qa/stage. Azure supports multiple Reply URLs, so register prod + test ACS URLs in the same Enterprise App (or use separate app registrations per environment — cleaner).

---

## 7. What we need FROM the backend team (contract)

The mobile app depends on the backend exposing:

1. **`GET {SIGN_ON_URL}`** — starts SP-initiated SAML. Must accept a query param carrying the mobile redirect + nonce, e.g. `?redirect_uri=srffcb://sso/callback&state=<nonce>`. Backend stashes these against the SAML request ID / RelayState.
2. **ACS handler** — validates the assertion, resolves the user, then **302-redirects to the `redirect_uri`** with `?code=<one_time_code>&state=<nonce>` (echo the nonce back).
   - `code` = short-lived (≤60s), single-use.
3. **`POST /api/v1/auth/sso/exchange`** `{ code }` → **`{ access_token, refresh_token }`** — same token shape as `/api/v1/auth/login` so the app reuses `tokenService` + `getMe()` unchanged.
4. **`GET|POST {LOGOUT_URL}`** — SP-initiated SLO; after IdP logout, redirect to `srffcb://sso/logout` (optional) so the app can confirm.
5. **Error redirect** — on failure, redirect to `srffcb://sso/callback?error=<reason>&state=<nonce>` so the app can show a message instead of hanging.

Confirm with backend: token TTLs, whether `/exchange` needs PKCE (`code_verifier`), and whether refresh works identically for SSO users.

---

## 8. Mobile deep-link configuration

### 8.1 Android — `android/app/src/main/AndroidManifest.xml`

Add an intent-filter to the **main activity** (`.MainActivity`) for the custom scheme:

```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTask"   <!-- ensure this is singleTask so the running app receives the link -->
    ... >

    <!-- existing MAIN/LAUNCHER filter stays -->

    <!-- SSO callback (Option A: custom scheme) -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="srffcb" android:host="sso" />
    </intent-filter>
</activity>
```

- `android:launchMode="singleTask"` (or `singleTop`) is important — otherwise a fresh Activity instance is created and `Linking`'s "url" event won't fire on the running instance.
- **Option B (App Links)** instead/additionally: add `<data android:scheme="https" android:host="fcb-crmapi.srf.com" android:pathPrefix="/app/sso" />` with `android:autoVerify="true"`, and host `/.well-known/assetlinks.json` on the backend containing the app's SHA-256 signing cert fingerprints (one per flavor/signing key).

### 8.2 iOS — `ios/SRF/Info.plist`

**Option A (custom scheme):**

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>srffcb</string>
    </array>
  </dict>
</array>
```

**Option B (Universal Links):** add an **Associated Domains** entitlement `applinks:fcb-crmapi.srf.com` (per environment domain) in `ios/SRF/SRF.entitlements` and host `apple-app-site-association` (no extension, `application/json`) at `https://fcb-crmapi.srf.com/.well-known/apple-app-site-association` listing the app IDs (`<TeamID>.com.srf.fcbunified` etc.).

Also confirm `AppDelegate` forwards links to React Native `Linking` (RN 0.84 template does this by default via `RCTLinkingManager`; verify `application:openURL:` and `continueUserActivity:` are present if you customised AppDelegate).

---

## 9. Mobile app implementation

### 9.1 Dependencies

- `react-native-webview@14` is already installed. For the **recommended system-browser flow** we want an in-app browser tab that supports `ASWebAuthenticationSession` (iOS) / Chrome Custom Tabs (Android) so cookies/SSO session are shared and the redirect auto-closes the tab:
  - Add **`react-native-inappbrowser-reborn`** (`openAuth(url, redirectUrl)` handles the round-trip + returns the callback URL directly — cleanest), **or**
  - Use `Linking.openURL()` + a global deep-link listener (no extra dep, but the browser tab stays open after redirect and the user may see it flash).
- No MSAL/app-auth needed — SAML is behind our backend, not an OIDC client here.

### 9.2 New endpoints — `src/services/api/endpoints.ts`

```ts
AUTH: {
  // ...existing...
  SSO_LOGIN: '/api/v1/auth/sso/saml/login',     // Sign-on URL path
  SSO_EXCHANGE: '/api/v1/auth/sso/exchange',    // code -> tokens
  SSO_LOGOUT: '/api/v1/auth/sso/saml/logout',   // SLO
},
```

### 9.3 SSO config — `src/config` (add to ENV, driven by `.env.*`)

Add `SSO_REDIRECT_URI=srffcb://sso/callback` (or Option B https URL) per env file, exposed as `ENV.SSO_REDIRECT_URI`. The Sign-on base is just `ENV.API_URL + ENDPOINTS.AUTH.SSO_LOGIN`.

### 9.4 `authService.loginWithSSO` — `src/services/api/authService.ts`

Add alongside `login`, reusing the exact same token + profile path:

```ts
loginWithSSO: async (code: string): Promise<UserProfile> => {
  const { data } = await apiClient.post<TokenResponse>(
    ENDPOINTS.AUTH.SSO_EXCHANGE,
    { code },
  );
  try {
    tokenService.saveTokens(data.access_token, data.refresh_token);
  } catch (error) {
    if (__DEV__) console.error('[AuthService] saveTokens failed:', error);
  }
  return authService.getMe(data.access_token);
},
```

### 9.5 Build + open the auth URL, capture the callback

Recommended with `react-native-inappbrowser-reborn`:

```ts
// src/services/ssoService.ts
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { ENV } from '../config';
import { ENDPOINTS } from './api/endpoints';

export const startCorporateSSO = async (): Promise<string> => {
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const redirect = ENV.SSO_REDIRECT_URI; // srffcb://sso/callback
  const authUrl =
    `${ENV.API_URL}${ENDPOINTS.AUTH.SSO_LOGIN}` +
    `?redirect_uri=${encodeURIComponent(redirect)}&state=${state}`;

  const result = await InAppBrowser.openAuth(authUrl, redirect, {
    ephemeralWebSession: false, // keep IdP/MFA cookies for smoother re-login
    showTitle: false,
    enableUrlBarHiding: true,
  });

  if (result.type !== 'success' || !result.url) {
    throw new Error('SSO cancelled');
  }
  const url = new URL(result.url);
  if (url.searchParams.get('error')) throw new Error(url.searchParams.get('error')!);
  if (url.searchParams.get('state') !== state) throw new Error('State mismatch');
  const code = url.searchParams.get('code');
  if (!code) throw new Error('No code returned');
  return code;
};
```

> If you go dependency-free instead: `Linking.openURL(authUrl)`, keep `state` in a module variable, and resolve a promise from a `Linking.addEventListener('url', ...)` handler registered at app root. `InAppBrowser.openAuth` is preferred because it auto-dismisses the tab and returns the URL without a global listener.

### 9.6 Wire the button — `src/screens/auth/LoginScreen.tsx`

Replace the empty stub:

```ts
const handleCorporateSSO = async () => {
  setIsLoading(true);
  try {
    const code = await startCorporateSSO();
    const profile = await authService.loginWithSSO(code);

    let roleType: string | undefined;
    try {
      roleType = (await dashboardService.fetchUserRole()).role_type?.toLowerCase();
    } catch { /* non-fatal */ }
    authService.saveRoleType(roleType);

    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [resolveLandingRoute(profile, roleType)] }),
    );
  } catch (e) {
    ToastService.error('Corporate sign-in failed. Please try again.', 'SSO');
  } finally {
    setIsLoading(false);
  }
};
```

> **Refactor note:** the landing/role logic currently inline in `handleSignIn` (CEO → `CeoDashboard`, hold/release → `MyActionsScreen`, complaints-only → `ComplaintStatusScreen`, else `MainTabs`) should be extracted into a shared `resolveLandingRoute(profile, roleType)` helper and reused by **both** password login and SSO so behaviour stays identical. Do this refactor as part of the SSO PR.

### 9.7 Logout (Single Logout)

In `authService.logout`, before/after clearing local tokens, optionally open `ENV.API_URL + ENDPOINTS.AUTH.SSO_LOGOUT` in the browser tab so the IdP session ends too (otherwise the next SSO login silently re-authenticates the same user). Make SLO best-effort — always clear local tokens regardless.

---

## 10. Security checklist

- ✅ **One-time `code` + `state` nonce** — never let tokens ride in the deep link directly; exchange a single-use code over HTTPS POST.
- ✅ **Verify `state`** on return (done in `startCorporateSSO`) to defend against a rogue app hijacking the custom scheme (Option A).
- ✅ **Prefer Universal/App Links (Option B)** for production if security review requires guaranteed app ownership of the callback.
- ✅ **Tokens in Keychain** — already handled by `tokenService`/`secureStorageService` (react-native-keychain). No change.
- ✅ **HTTPS only** for Sign-on/ACS/exchange (all `srf.com` — fine).
- ✅ **Short code TTL** (≤60s, single use) — backend responsibility; confirm.
- ✅ Consider **PKCE** on `/exchange` (send `code_challenge` on start, `code_verifier` on exchange) if backend supports it.

---

## 11. Testing

**Android (simulate the callback deep link):**
```bash
adb shell am start -a android.intent.action.VIEW \
  -d "srffcb://sso/callback?code=TESTCODE&state=TESTSTATE" \
  com.srf.fcbcrm.qa    # match the flavor applicationId
```

**iOS Simulator:**
```bash
xcrun simctl openurl booted "srffcb://sso/callback?code=TESTCODE&state=TESTSTATE"
```

**Full manual pass:**
1. Tap "Corporate SSO" → browser tab opens on the backend Sign-on URL.
2. Complete IdP login (MFA) → tab auto-closes, app foregrounds.
3. App exchanges code → lands on the correct role route.
4. Kill + relaunch app → still logged in (tokens persisted).
5. Logout → SLO fires → next SSO login prompts IdP again.
6. Cancel mid-flow → app returns to Login gracefully (no spinner stuck).
7. Repeat per flavor (qa/stage/prod) — schemes/bundle ids differ.

---

## 12. Open decisions (confirm before coding)

| # | Decision | Owner |
| --- | --- | --- |
| 1 | Callback style: custom scheme (`srffcb://`) vs Universal/App Links | Mobile + Security |
| 2 | Final backend paths for login / ACS / exchange / logout | Backend |
| 3 | Does `/exchange` require PKCE? | Backend |
| 4 | One Enterprise App with multiple Reply URLs, or per-env app registrations | Client IdP admin |
| 5 | Which roles are allowed via SSO (all, or internal only)? | Product |
| 6 | SLO required on logout, or local-only logout acceptable? | Product + Security |
| 7 | Add `react-native-inappbrowser-reborn` vs dependency-free `Linking` | Mobile |

---

## 13. Task summary for the mobile PR

1. Add `SSO_LOGIN` / `SSO_EXCHANGE` / `SSO_LOGOUT` to `endpoints.ts`; add `SSO_REDIRECT_URI` to `.env.*` + `ENV`.
2. Add `authService.loginWithSSO(code)` and `ssoService.startCorporateSSO()`.
3. Extract `resolveLandingRoute()` from `handleSignIn` and reuse it.
4. Implement `handleCorporateSSO` in `LoginScreen`.
5. Android: intent-filter + `singleTask` in `AndroidManifest.xml`.
6. iOS: `CFBundleURLTypes` in `Info.plist` (+ Associated Domains if Option B).
7. (Optional) SLO in `authService.logout`.
8. Add `react-native-inappbrowser-reborn` (if chosen); `pod install`.
9. Test matrix in §11 across qa/stage/prod flavors.

> ⚠️ All backend URLs, the five client fields (§6), and the deep-link decisions (§12) must be finalised with the backend + client IdP admin **before** implementation — the mobile side is ~1 day of work once the contract is fixed.
