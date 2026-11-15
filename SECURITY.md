# 🛡️ SilverSync Security Policy & Threat Mitigation

SilverSync is built to handle sensitive healthcare, medication, and family delegation workflows. Security is built into every architectural layer rather than patched on top.

---

## 1. Threat Model & Defensive Controls

| Threat Vector | Mitigation Strategy | Implementation Details |
| :--- | :--- | :--- |
| **Unauthorized Data Access** | Server-side Firebase ID Token verification on every route | `src/middleware/auth.ts` verifies cryptographic token signatures via Firebase Admin SDK. |
| **Privilege Escalation** | Granular server-side permission middleware | `src/middleware/requireCircleMember.ts` and `requirePermission.ts` query Firestore directly; never trust client role claims. |
| **Brute-Force Passcode Guessing**| Rate limiting + Hashed invite codes + constant-time comparison | 5 wrong attempts per IP/user per 15 min (`express-rate-limit`). Codes stored only as SHA-256 hashes. Codes compared using `crypto.timingSafeEqual`. |
| **Injection (SQL/NoSQL/Code)** | Strict Zod schema validation on every request | Every body, query param, and route param is validated against Zod schemas before reaching business logic. |
| **Prompt Injection (AI)** | User content bounded by XML delimiters + Instruction Hierarchy | Prompts isolate user input inside `<untrusted_clinical_data>` tags. System instructions forbid prompt overrides. Outputs validated via strict JSON schema. |
| **Cross-Site Scripting (XSS)** | Helmet headers + Content-Security-Policy + HTML escaping | Express configured with `helmet()`. Email templates escape all user text using `he` / HTML entities before dispatch. |
| **Cross-Origin Attacks (CORS)** | Strict CORS allowlist | Only the client URL (e.g. `CLIENT_URL`) is allowed; wildcard `*` is strictly prohibited. |
| **Denial of Service (DoS)** | Tiered rate limiters & bounded queries | Rate limiters configured for Auth (10 req/15min), Invites (5 req/15min), AI routes (5 req/min), and General API (100 req/min). |
| **Unauthorized Cron Triggering** | Cryptographic shared secret header verification | Internal cron endpoints (`/internal/cron/*`) require `x-cron-secret` compared using `crypto.timingSafeEqual`. |
| **Data Leakage in Errors / Logs** | Centralized error handler + Zero PII logging | Production errors return only `{error: {code, message}}`. Stack traces and personal health identifiers (names, diagnoses) are never written to server logs. |
| **Stolen Invite Codes** | Single-use and 24-hour expiration window | Unambiguous 8-character alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), immediately marked `usedAt` upon redemption. |

---

## 2. Secure Joining Flow Guarantees

1. **Unambiguous Alphabet**: Invite codes use base-32 excluding easily confused characters (`0`, `O`, `1`, `I`, `l`) preventing visual misreading by elderly users or family.
2. **Zero Plaintext Storage**: The server never stores the invite code in plaintext. Only the SHA-256 hash is persisted in Firestore.
3. **Pending Gate**: Redeeming a code does NOT grant immediate access to patient health data. The invitee is placed in `pending` state until the elder explicitly approves the member and assigns permissions.

---

## 3. Dependency & Supply Chain Security

- All dependencies are audited via `npm audit` in the automated GitHub Actions CI pipeline.
- High and critical vulnerabilities fail the CI build immediately.
- Container builds run as a non-privileged `node` user with a read-only root filesystem wherever possible.

---

## 4. Reporting a Security Vulnerability

If you discover a security vulnerability in SilverSync, please report it privately to the maintainers rather than opening a public issue. We will triage, patch, and release an advisory within 48 hours.
