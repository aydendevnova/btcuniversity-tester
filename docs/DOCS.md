# BTC University Tester Documentation

## Overview

This tester interfaces with the BTC University smart contracts, which use a **trait-based security model** for sBTC token operations.

## Trait-Based Security Architecture

### The Problem with Hardcoding

Hardcoding token addresses doesn't work in Clarity:

```clarity
;; ❌ Can't do this - compile errors in test environments
(define-constant SBTC-CONTRACT 'ST1F7QA2...sbtc-token)
```

**Why?** Clarinet's simnet can't resolve live testnet/mainnet contracts. Tests would fail.

### The Trait Solution

The contract uses Clarity traits (interfaces) to accept **any** SIP-010 token:

```clarity
;; Contract accepts any SIP-010 token as parameter
(define-public (enroll-whitelist (sbtc-contract <sip010-trait>))
  (contract-call? sbtc-contract get-balance tx-sender)
)
```

**Benefits:**
- ✅ Works with real sBTC on testnet/mainnet
- ✅ Works with mock tokens for testing
- ✅ Type-safe via SIP-010 interface
- ✅ Flexible and maintainable

### Runtime Validation

The contract validates every transaction against an owner-configured address:

```clarity
;; Owner sets official sBTC once after deployment
(define-data-var sbtc-contract-address (optional principal) none)

(define-public (set-sbtc-contract (new-sbtc-contract principal))
  (begin
    (asserts! (is-eq tx-sender UNI-OWNER) ERR-OWNER-ONLY)
    (var-set sbtc-contract-address (some new-sbtc-contract))
    (ok true)))

;; Every transaction validates
(define-public (enroll-whitelist (sbtc-contract <sip010-trait>))
  (let ((configured-sbtc (unwrap! (var-get sbtc-contract-address) ERR-SBTC-NOT-SET)))
    (asserts! (is-eq (contract-of sbtc-contract) configured-sbtc) ERR-UNAUTHORIZED)
    ;; ... safe to use sbtc-contract
  ))
```

**Security Flow:**
1. Owner deploys contract
2. Owner calls `set-sbtc-contract` with official address
3. Client passes sBTC contract to functions
4. Contract validates: passed address === configured address
5. If mismatch → `ERR-UNAUTHORIZED`

### Why This Approach?

**Trait-based (flexible) + Runtime validation (secure)**

```
┌──────────────────────────────────────────────────┐
│ Without Validation (Vulnerable)                  │
├──────────────────────────────────────────────────┤
│ Client → Pass fake token → Contract accepts ❌   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ With Validation (Secure)                         │
├──────────────────────────────────────────────────┤
│ Owner → Configure official sBTC                  │
│ Client → Pass any token                          │
│ Contract → Validate → Accept or reject ✅        │
└──────────────────────────────────────────────────┘
```

## Quick Start

### 1. Run Tester

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

### 2. Configure

**Testnet sBTC (default):**
```
ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token
```

**Mainnet sBTC:**
```
SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
```

Update your deployed contract address in settings.

### 3. Test

All functions automatically pass the configured sBTC contract:
- `enrollWhitelist()` - Requires 0.001 sBTC minimum
- `enrollCourse(courseId)` - Transfers course fee
- `claimCourseFees(courseId)` - Instructor fee withdrawal

The contract validates the sBTC address server-side.

## Deployment Checklist

### 1. Deploy Contract

```bash
clarinet deployments apply --testnet
```

### 2. Initialize sBTC (CRITICAL!)

```bash
# Owner must call this immediately after deployment
stx call-contract <deployer-address> btc-university set-sbtc-contract \
  -a ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token \
  --testnet
```

### 3. Verify Configuration

```bash
stx call-read-only <deployer-address> btc-university get-sbtc-contract --testnet
```

Should return the official sBTC address.

### 4. Test Integration

Use this tester to verify:
- Correct sBTC address passes validation ✅
- Wrong sBTC address fails with `ERR-UNAUTHORIZED` ✅

## Error Codes

- `ERR-SBTC-NOT-SET (u7004)` - Owner hasn't initialized sBTC
- `ERR-UNAUTHORIZED (u108)` - Passed sBTC address doesn't match configured
- `ERR-NOT-ENOUGH-SBTC (u7002)` - Insufficient balance
- `ERR-USER-NOT-WHITELISTED (u102)` - Must enroll in whitelist first

## Testing Strategy

### Unit Tests (Smart Contract)

```bash
cd btcuniversity-contract
npm test
```

Uses mock-sbtc-token for testing. Tests initialize sBTC configuration before each suite.

### Integration Tests (This Tester)

1. Configure testnet sBTC
2. Connect wallet with testnet STX + sBTC
3. Test whitelist enrollment
4. Test course enrollment
5. Test fee claiming

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│ Trait System: Flexibility + Security                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. TRAIT PARAMETER (Flexible)                              │
│     • Accepts any SIP-010 token                             │
│     • Works with mock tokens for testing                    │
│     • Works with real sBTC in production                    │
│                                                              │
│  2. OWNER CONFIGURATION (Controlled)                        │
│     • set-sbtc-contract(address) - called once              │
│     • Owner-only function                                   │
│     • Stores official address                               │
│                                                              │
│  3. RUNTIME VALIDATION (Secure)                             │
│     • Every transaction validates passed vs configured      │
│     • Rejects mismatches immediately                        │
│     • Prevents fake token attacks                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Result:** Best of both worlds - testable contracts with production security.

