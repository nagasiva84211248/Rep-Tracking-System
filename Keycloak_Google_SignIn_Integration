# Keycloak Google Sign-In Integration for Incredible India Flutter App

## Table of Contents
1. [Overview](#overview)
2. [Architecture Comparison](#architecture-comparison)
3. [Existing Assets](#existing-assets)
4. [Implementation Guide](#implementation-guide)
5. [Backend API Contract](#backend-api-contract)
6. [Flow Diagram](#flow-diagram)
7. [Configuration Requirements](#configuration-requirements)
8. [Migration Checklist](#migration-checklist)

---

## Overview

This document outlines how to migrate from the current **Google SDK-based authentication** to **Keycloak-based Google authentication** using the Authorization Code Flow with PKCE (Proof Key for Code Exchange).

### Objective
Enable Google Sign-In via Keycloak where:
- Users are authenticated through Keycloak's Google Identity Provider
- Authorization code is validated by backend
- Users are auto-registered or logged in
- No password required for Google users

---

## Architecture Comparison

### Current Implementation (Google SDK)

```
User → Google SDK (Native) → Google Account
                ↓
        ID Token + User Info
                ↓
        Flutter App → Backend API (check/register user)
```

**Characteristics:**
- Uses `google_sign_in` Flutter package
- Native SDK handles authentication
- Client receives ID token directly
- App sends token to backend for validation

### New Implementation (Keycloak)

```
User → Keycloak Auth URL (Browser/WebView)
                ↓
        Google Identity Provider (via Keycloak)
                ↓
        Authorization Code (redirect to app)
                ↓
        Flutter App → Backend API (exchange code)
                ↓
        Backend validates with Keycloak → Returns App Session
```

**Characteristics:**
- Uses `flutter_web_auth_2` package (already in project)
- Browser-based authentication
- Client receives authorization code only
- Backend handles all token exchange (more secure)

---

## Existing Assets

| Asset | Location | Reusable |
|-------|----------|----------|
| Deep Link Scheme | `incredibleindia://` | ✅ Yes |
| `flutter_web_auth_2` package | `pubspec.yaml` | ✅ Yes |
| PKCE Implementation | `twitter_sign_in_service.dart` | ✅ Yes (same pattern) |
| HTTP Interceptor | `http_interceptor.dart` | ✅ Yes |
| Basic Auth (staging) | `http_interceptor.dart` | ✅ Yes |
| Notification Service | `notification_services.dart` | ✅ Yes |
| Preference Manager | `preferences_manager.dart` | ✅ Yes |

---

## Implementation Guide

### Step 1: Configuration Constants

**File:** `lib/core/config/keycloak_config.dart`

```dart
/// Keycloak configuration for Google Sign-In
class KeycloakConfig {
  KeycloakConfig._();

  // ============================================================
  // KEYCLOAK SERVER DETAILS (Get from backend team)
  // ============================================================

  /// Keycloak server base URL
  static const String keycloakDomain = 'https://auth.incredibleindia.gov.in';

  /// Keycloak realm name
  static const String realm = 'incredible-india';

  /// Public client ID for Flutter app
  static const String clientId = 'flutter-mobile-app';

  // ============================================================
  // REDIRECT URI (Uses existing deep link scheme)
  // ============================================================

  /// Callback URL for OAuth redirect
  static const String redirectUri = 'incredibleindia://auth/google/callback';

  /// URL scheme for deep link handling
  static const String urlScheme = 'incredibleindia';

  // ============================================================
  // OAUTH ENDPOINTS
  // ============================================================

  /// Authorization endpoint
  static String get authorizationUrl =>
      '$keycloakDomain/realms/$realm/protocol/openid-connect/auth';

  /// Token endpoint (used by backend)
  static String get tokenUrl =>
      '$keycloakDomain/realms/$realm/protocol/openid-connect/token';

  /// User info endpoint (used by backend)
  static String get userInfoUrl =>
      '$keycloakDomain/realms/$realm/protocol/openid-connect/userinfo';

  // ============================================================
  // OAUTH SCOPES
  // ============================================================

  /// Required OAuth scopes
  static const List<String> scopes = ['openid', 'profile', 'email'];

  /// Scopes as space-separated string
  static String get scopeString => scopes.join(' ');

  // ============================================================
  // IDENTITY PROVIDER
  // ============================================================

  /// Keycloak IDP hint for Google (forces Google login)
  static const String idpHint = 'google';
}
```

---

### Step 2: Create Keycloak Google Sign-In Service

**File:** `lib/services/keycloak_google_service.dart`

```dart
import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import '../core/config/keycloak_config.dart';
import '../utils/secure_logger.dart';

/// Service for handling Google Sign-In via Keycloak
/// Uses Authorization Code Flow with PKCE
class KeycloakGoogleService {
  // Singleton instance
  static final KeycloakGoogleService _instance = KeycloakGoogleService._internal();
  factory KeycloakGoogleService() => _instance;
  KeycloakGoogleService._internal();

  // PKCE code verifier (stored temporarily during auth flow)
  String? _codeVerifier;

  // ============================================================
  // PKCE HELPERS
  // ============================================================

  /// Generate cryptographically secure random string
  String _generateRandomString(int length) {
    const charset =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    final random = Random.secure();
    return List.generate(
      length,
      (_) => charset[random.nextInt(charset.length)],
    ).join();
  }

  /// Generate PKCE code challenge from verifier using SHA256
  String _generateCodeChallenge(String verifier) {
    final bytes = utf8.encode(verifier);
    final digest = sha256.convert(bytes);
    return base64Url.encode(digest.bytes).replaceAll('=', '');
  }

  // ============================================================
  // MAIN SIGN-IN METHOD
  // ============================================================

  /// Initiate Google Sign-In via Keycloak
  ///
  /// Returns [KeycloakAuthResult] containing authorization code and PKCE verifier
  /// Returns null if user cancels or error occurs
  Future<KeycloakAuthResult?> signIn() async {
    try {
      // Step 1: Generate PKCE values
      _codeVerifier = _generateRandomString(128);
      final codeChallenge = _generateCodeChallenge(_codeVerifier!);
      final state = _generateRandomString(32);

      SecureLogger.info(
        'Initiating Keycloak Google Sign-In',
        tag: 'KeycloakGoogle',
      );

      // Step 2: Build Keycloak authorization URL
      final authUrl = Uri.parse(KeycloakConfig.authorizationUrl).replace(
        queryParameters: {
          'response_type': 'code',
          'client_id': KeycloakConfig.clientId,
          'redirect_uri': KeycloakConfig.redirectUri,
          'scope': KeycloakConfig.scopeString,
          'state': state,
          'code_challenge': codeChallenge,
          'code_challenge_method': 'S256',
          'kc_idp_hint': KeycloakConfig.idpHint, // Force Google login
        },
      );

      SecureLogger.info(
        'Opening Keycloak auth URL in browser',
        tag: 'KeycloakGoogle',
      );

      // Step 3: Open browser for authentication
      final result = await FlutterWebAuth2.authenticate(
        url: authUrl.toString(),
        callbackUrlScheme: KeycloakConfig.urlScheme,
        options: const FlutterWebAuth2Options(
          timeout: 120, // 2 minute timeout
          preferEphemeral: true, // Don't share cookies with Safari
        ),
      );

      // Step 4: Parse callback URL
      final uri = Uri.parse(result);
      final code = uri.queryParameters['code'];
      final returnedState = uri.queryParameters['state'];
      final error = uri.queryParameters['error'];
      final errorDescription = uri.queryParameters['error_description'];

      // Step 5: Handle errors
      if (error != null) {
        SecureLogger.error(
          'Keycloak auth error: $error - $errorDescription',
          tag: 'KeycloakGoogle',
        );
        return null;
      }

      if (code == null) {
        SecureLogger.error(
          'No authorization code received in callback',
          tag: 'KeycloakGoogle',
        );
        return null;
      }

      // Step 6: Validate state to prevent CSRF attacks
      if (returnedState != state) {
        SecureLogger.error(
          'State mismatch - possible CSRF attack',
          tag: 'KeycloakGoogle',
        );
        return null;
      }

      SecureLogger.info(
        'Authorization code received successfully',
        tag: 'KeycloakGoogle',
      );

      // Step 7: Return result for backend exchange
      return KeycloakAuthResult(
        authorizationCode: code,
        codeVerifier: _codeVerifier!,
        redirectUri: KeycloakConfig.redirectUri,
      );

    } on Exception catch (e) {
      // Handle user cancellation
      if (e.toString().contains('CANCELED') ||
          e.toString().contains('cancelled')) {
        SecureLogger.info(
          'User cancelled Google Sign-In',
          tag: 'KeycloakGoogle',
        );
      } else {
        SecureLogger.error(
          'Keycloak Google Sign-In failed',
          tag: 'KeycloakGoogle',
          error: e,
        );
      }
      return null;
    }
  }

  /// Clear any stored PKCE data
  void clearSession() {
    _codeVerifier = null;
  }
}

// ============================================================
// RESULT CLASSES
// ============================================================

/// Result containing data needed for backend token exchange
class KeycloakAuthResult {
  /// Authorization code from Keycloak
  final String authorizationCode;

  /// PKCE code verifier (required for token exchange)
  final String codeVerifier;

  /// Redirect URI used in authorization request
  final String redirectUri;

  KeycloakAuthResult({
    required this.authorizationCode,
    required this.codeVerifier,
    required this.redirectUri,
  });

  /// Convert to JSON for API request
  Map<String, String> toJson() => {
    'code': authorizationCode,
    'code_verifier': codeVerifier,
    'redirect_uri': redirectUri,
  };

  @override
  String toString() => 'KeycloakAuthResult(code: ${authorizationCode.substring(0, 10)}...)';
}
```

---

### Step 3: Backend API Integration

**File:** `lib/core/api/api_service.dart` (add new method)

```dart
/// Keycloak Google Login
///
/// Sends authorization code to backend for token exchange
/// Backend handles:
/// 1. Exchange code with Keycloak for tokens
/// 2. Extract user info from ID token
/// 3. Check if user exists in database
/// 4. Register new user or login existing user
/// 5. Return app session tokens
Future<Map<String, dynamic>> keycloakGoogleLogin({
  required String authorizationCode,
  required String codeVerifier,
  required String redirectUri,
}) async {
  try {
    final response = await httpInterceptor.post(
      Uri.parse('${ApiEndpoints.baseUrl}/api/auth/keycloak-google'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Type': 'mobile',
      },
      body: jsonEncode({
        'code': authorizationCode,
        'code_verifier': codeVerifier,
        'redirect_uri': redirectUri,
      }),
    );

    final responseBody = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode == 200 || response.statusCode == 201) {
      return {
        'success': true,
        ...responseBody,
      };
    } else {
      return {
        'success': false,
        'responseCode': response.statusCode,
        'responseMessage': responseBody['message'] ?? 'Login failed',
        'errorCode': responseBody['errorCode'],
      };
    }
  } catch (e) {
    SecureLogger.error('Keycloak Google login API error', error: e);
    return {
      'success': false,
      'responseMessage': 'Network error. Please try again.',
    };
  }
}
```

---

### Step 4: Update Login Screen Handler

**File:** `lib/login/login_screen.dart` (replace `_handleGoogleSignIn`)

```dart
/// Handle Google Sign-In via Keycloak
Future<void> _handleGoogleSignIn() async {
  setState(() => _isGoogleSignInProgress = true);

  try {
    // Step 1: Initiate Keycloak Google Sign-In
    final keycloakService = KeycloakGoogleService();
    final result = await keycloakService.signIn();

    // Handle cancellation
    if (result == null) {
      setState(() => _isGoogleSignInProgress = false);
      // Don't show error for user cancellation
      return;
    }

    setState(() => _isGoogleSignInProgress = false);

    if (!mounted) return;
    LoadingDialog.show(context);

    // Step 2: Send authorization code to backend
    final response = await ApiService().keycloakGoogleLogin(
      authorizationCode: result.authorizationCode,
      codeVerifier: result.codeVerifier,
      redirectUri: result.redirectUri,
    );

    if (!mounted) return;
    LoadingDialog.hide(context);

    // Step 3: Handle response
    if (response['success'] == true) {
      // Save user session data
      await PreferenceManager.saveUserData(
        uuid: response['uuid'] ?? '',
        emailId: response['email'] ?? '',
        firstName: response['firstName'] ?? '',
        lastName: response['lastName'] ?? '',
        encodeProfile: response['encodeProfile'] ?? '',
        encryptedProfileDetails: response['encryptedProfileDetails'] ?? '',
        encryptedRefreshToken: response['encryptedRefreshToken'] ?? '',
        emailVerified: response['emailVerified'] ?? true,
      );

      // Reload wishlist for logged-in user
      if (mounted) {
        context.read<GlobalWishlistProvider>().reload();
      }

      // Navigate based on user status
      if (!mounted) return;

      if (response['isNewUser'] == true) {
        // New user - show interests selection
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const MyInterestScreen()),
        );
      } else {
        // Existing user - go to home
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
        );
      }
    } else {
      // Handle specific error codes
      final errorCode = response['errorCode'];
      String errorMessage;

      switch (errorCode) {
        case 'INVALID_CODE':
          errorMessage = 'Authentication failed. Please try again.';
          break;
        case 'CODE_EXPIRED':
          errorMessage = 'Session expired. Please try again.';
          break;
        case 'ACCOUNT_DISABLED':
          errorMessage = 'Your account has been disabled.';
          break;
        case 'EMAIL_NOT_VERIFIED':
          errorMessage = 'Please verify your email address.';
          break;
        default:
          errorMessage = response['responseMessage'] ??
              'Login failed. Please try again.';
      }

      NotificationService.showError(context, errorMessage);
    }
  } catch (e) {
    setState(() => _isGoogleSignInProgress = false);

    if (mounted) {
      LoadingDialog.hide(context);
      NotificationService.showError(
        context,
        'Something went wrong. Please try again.',
      );
    }
  }
}
```

---

### Step 5: Deep Link Configuration

#### Android Configuration

**File:** `android/app/src/main/AndroidManifest.xml`

```xml
<manifest>
    <application>
        <activity
            android:name=".MainActivity"
            android:launchMode="singleTop">

            <!-- Deep Link Intent Filter -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />

                <!-- Handle incredibleindia:// scheme -->
                <data android:scheme="incredibleindia" />
            </intent-filter>

        </activity>
    </application>
</manifest>
```

#### iOS Configuration

**File:** `ios/Runner/Info.plist`

```xml
<dict>
    <!-- URL Schemes for Deep Links -->
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleTypeRole</key>
            <string>Editor</string>
            <key>CFBundleURLName</key>
            <string>com.incredibleindia.app</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>incredibleindia</string>
            </array>
        </dict>
    </array>

    <!-- Allow HTTP for local testing (remove in production) -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSAllowsArbitraryLoadsInWebContent</key>
        <true/>
    </dict>
</dict>
```

---

## Backend API Contract

### Request

```http
POST /api/auth/keycloak-google
Content-Type: application/json
X-Client-Type: mobile

{
  "code": "authorization_code_from_keycloak",
  "code_verifier": "pkce_code_verifier_string",
  "redirect_uri": "incredibleindia://auth/google/callback"
}
```

### Success Response - Existing User (200 OK)

```json
{
  "success": true,
  "responseCode": 200,
  "responseMessage": "Login successful",
  "isNewUser": false,
  "emailVerified": true,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "encodeProfile": "base64_encoded_profile_data",
  "encryptedProfileDetails": "encrypted_profile_string",
  "encryptedRefreshToken": "encrypted_refresh_token"
}
```

### Success Response - New User (201 Created)

```json
{
  "success": true,
  "responseCode": 201,
  "responseMessage": "Account created successfully",
  "isNewUser": true,
  "emailVerified": true,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "encodeProfile": "base64_encoded_profile_data",
  "encryptedProfileDetails": "encrypted_profile_string",
  "encryptedRefreshToken": "encrypted_refresh_token"
}
```

### Error Responses

#### Invalid Authorization Code (401)
```json
{
  "success": false,
  "responseCode": 401,
  "responseMessage": "Invalid or expired authorization code",
  "errorCode": "INVALID_CODE"
}
```

#### Account Exists with Different Provider (409)
```json
{
  "success": false,
  "responseCode": 409,
  "responseMessage": "This email is registered with email/password login",
  "errorCode": "ACCOUNT_EXISTS_WITH_PASSWORD",
  "email": "user@gmail.com"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "responseCode": 500,
  "responseMessage": "Internal server error",
  "errorCode": "SERVER_ERROR"
}
```

### Response Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes | Overall success flag |
| `responseCode` | integer | Yes | HTTP-like status code |
| `responseMessage` | string | Yes | Human-readable message |
| `isNewUser` | boolean | On success | True if user was just registered |
| `emailVerified` | boolean | On success | Always true for Google users |
| `uuid` | string | On success | Unique user identifier |
| `email` | string | On success | User's email address |
| `firstName` | string | On success | User's first name |
| `lastName` | string | On success | User's last name |
| `encodeProfile` | string | On success | Base64 encoded profile data |
| `encryptedProfileDetails` | string | On success | Encrypted profile for API calls |
| `encryptedRefreshToken` | string | On success | Encrypted refresh token |
| `errorCode` | string | On error | Machine-readable error code |

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUTTER APP                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. User taps "Continue with Google"
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  KeycloakGoogleService.signIn()                                  │
│  - Generate PKCE (code_verifier, code_challenge)                 │
│  - Generate state (CSRF protection)                              │
│  - Build authorization URL                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 2. Open browser with Keycloak URL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        KEYCLOAK SERVER                           │
│  URL: /realms/{realm}/protocol/openid-connect/auth               │
│  - kc_idp_hint=google (auto-select Google)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Redirect to Google
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        GOOGLE OAUTH                              │
│  - User selects Google account                                   │
│  - User grants permissions                                       │
│  - Google returns tokens to Keycloak                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 4. Keycloak processes Google tokens
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        KEYCLOAK SERVER                           │
│  - Creates/updates user in Keycloak                              │
│  - Generates authorization code                                  │
│  - Redirects to: incredibleindia://auth/google/callback?code=... │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 5. Deep link opens app
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FLUTTER APP                               │
│  flutter_web_auth_2 catches callback                             │
│  - Extract authorization code                                    │
│  - Validate state parameter                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 6. Send code to backend
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER                            │
│  POST /api/auth/keycloak-google                                  │
│  Body: { code, code_verifier, redirect_uri }                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 7. Backend exchanges code with Keycloak
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        KEYCLOAK SERVER                           │
│  POST /realms/{realm}/protocol/openid-connect/token              │
│  - Validates code + code_verifier (PKCE)                         │
│  - Returns: access_token, id_token, refresh_token                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 8. Backend processes tokens
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER                            │
│  - Decode id_token (get user info)                               │
│  - Check user in database                                        │
│  - Create new user OR login existing user                        │
│  - Generate app session tokens                                   │
│  - Return response to Flutter                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 9. Flutter receives response
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FLUTTER APP                               │
│  - Save user data to PreferenceManager                           │
│  - Navigate to Home (existing user)                              │
│  - Navigate to Interests (new user)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration Requirements

### Information Needed from Backend Team

| Item | Description | Example |
|------|-------------|---------|
| Keycloak Domain | Base URL of Keycloak server | `https://auth.incredibleindia.gov.in` |
| Realm Name | Keycloak realm for the app | `incredible-india` |
| Client ID | Public client identifier | `flutter-mobile-app` |
| IDP Hint | Parameter to force Google login | `google` |
| API Endpoint | Backend endpoint for code exchange | `/api/auth/keycloak-google` |
| Scopes | Required OAuth scopes | `openid profile email` |

### Keycloak Client Configuration (Backend Team)

The Keycloak client should be configured with:

```
Client ID: flutter-mobile-app
Client Protocol: openid-connect
Access Type: public
Standard Flow Enabled: ON
Direct Access Grants Enabled: OFF
Valid Redirect URIs: incredibleindia://auth/google/callback
Web Origins: *
PKCE: S256 (required)
```

---

## Migration Checklist

### Phase 1: Setup
- [ ] Get Keycloak configuration from backend team
- [ ] Create `lib/core/config/keycloak_config.dart`
- [ ] Create `lib/services/keycloak_google_service.dart`
- [ ] Add `keycloakGoogleLogin` method to `ApiService`

### Phase 2: Integration
- [ ] Update `_handleGoogleSignIn` in `login_screen.dart`
- [ ] Update `_handleGoogleSignIn` in `signup_screen.dart`
- [ ] Verify deep link configuration (Android)
- [ ] Verify deep link configuration (iOS)

### Phase 3: Testing
- [ ] Test on Android device
- [ ] Test on Android emulator
- [ ] Test on iOS device
- [ ] Test on iOS simulator
- [ ] Test new user registration flow
- [ ] Test existing user login flow
- [ ] Test error handling (cancel, network error, etc.)

### Phase 4: Cleanup (Optional)
- [ ] Remove `google_sign_in` package from `pubspec.yaml`
- [ ] Remove `GoogleSignInService` class
- [ ] Update documentation

---

## Advantages of Keycloak Approach

| Aspect | Google SDK | Keycloak |
|--------|-----------|----------|
| **Token Exchange** | Client-side | Backend (more secure) |
| **User Management** | Separate system | Centralized in Keycloak |
| **Multi-provider** | Separate integration | Single integration point |
| **Session Control** | Limited | Full backend control |
| **Security** | Token on device | Only auth code on device |
| **Scalability** | Per-platform config | Single configuration |
| **SSO Support** | No | Yes (via Keycloak) |

---

## Troubleshooting

### Common Issues

#### 1. Deep link not working on Android
- Verify `intent-filter` in `AndroidManifest.xml`
- Check if another app is handling the scheme
- Test with: `adb shell am start -a android.intent.action.VIEW -d "incredibleindia://test"`

#### 2. Deep link not working on iOS
- Verify `CFBundleURLSchemes` in `Info.plist`
- Check Associated Domains if using universal links
- Test with: Open Safari, type `incredibleindia://test`

#### 3. PKCE validation fails
- Ensure `code_verifier` is exactly 128 characters
- Verify SHA256 hashing is correct
- Check base64url encoding (no padding `=`)

#### 4. State mismatch error
- Don't regenerate state between auth and callback
- Check for URL encoding issues

#### 5. Browser doesn't close after auth
- Set `preferEphemeral: true` for iOS
- Check `callbackUrlScheme` matches redirect URI scheme

---

## Security Considerations

1. **PKCE is mandatory** - Prevents authorization code interception
2. **State parameter** - Prevents CSRF attacks
3. **Backend token exchange** - Tokens never touch the mobile device
4. **Ephemeral browser session** - Don't share cookies with Safari
5. **HTTPS only** - All Keycloak communication over HTTPS
6. **No client secret** - Public client, no secret to leak

---

## References

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
- [flutter_web_auth_2 Package](https://pub.dev/packages/flutter_web_auth_2)
- [OpenID Connect Specification](https://openid.net/connect/)

---

*Document Version: 1.0*
*Last Updated: March 2026*
*Author: Incredible India Flutter Team*
