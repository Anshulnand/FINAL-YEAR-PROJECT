# DECAID Testing Guide

Complete step-by-step guide to test the DECAID system and verify all features work correctly.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Health Checks](#health-checks)
3. [End-to-End Test Workflow](#end-to-end-test-workflow)
4. [API Testing with cURL](#api-testing-with-curl)
5. [UI Testing Steps](#ui-testing-steps)
6. [Expected Results](#expected-results)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before testing, ensure all services are running:

```bash
# 1. Blockchain Node (Terminal 1)
cd blockchain
npx hardhat node --port 8545

# 2. Deploy Smart Contract (Terminal 2)
cd blockchain
npx hardhat run scripts/deploy.js --network localhost

# 3. AI Service (Terminal 3)
cd ai-service
python -m uvicorn main:app --port 8000

# 4. Backend (Terminal 4)
cd backend
npm run dev

# 5. Frontend (Terminal 5)
cd frontend
npm run dev
```

---

## Health Checks

Run these commands to verify all services are up:

```bash
# Check Backend
curl http://localhost:5000/health
# Expected: {"ok":true,"service":"backend",...}

# Check AI Service
curl http://localhost:8000/health
# Expected: {"ok":true,"service":"ai-service",...}

# Check Frontend (open in browser)
open http://localhost:3000
```

---

## End-to-End Test Workflow

### Step 1: Issue a Credential (Institution)

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/credentials/issue \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT-001",
    "issuerId": "UNIVERSITY-2024",
    "credentialData": "Bachelor of Computer Science - First Class Honours"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "credentialHash": "abc123...",
  "blockchain": {
    "exists": true,
    "revoked": false,
    "txHash": "0x..."
  },
  "risk": {
    "riskScore": 25,
    "model": "isolation_forest"
  },
  "trustRank": 4,
  "did": "did:decaid:..."
}
```

**Save the `credentialHash` for the next steps.**

---

### Step 2: Verify the Credential (Employer)

Replace `YOUR_HASH` with the credential hash from Step 1:

```bash
curl "http://localhost:5000/api/verify/by-hash/YOUR_HASH?studentId=STUDENT-001&issuerId=UNIVERSITY-2024"
```

**Expected Response:**
```json
{
  "ok": true,
  "credentialHash": "abc123...",
  "blockchain": {
    "exists": true,
    "revoked": false
  },
  "risk": {
    "riskScore": 25,
    "category": "Low Risk"
  },
  "trustRank": 4,
  "status": "✅ Active"
}
```

---

### Step 3: Generate Zero-Knowledge Proof (Student)

```bash
curl -X POST http://localhost:5000/api/zkp/generate \
  -H "Content-Type: application/json" \
  -d '{
    "credentialHash": "YOUR_HASH",
    "studentId": "STUDENT-001"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "commitment": "def456...",
  "nonce": "uuid-string-here",
  "algorithm": "SHA-256-commitment-v1"
}
```

**Save both `commitment` and `nonce`.**

---

### Step 4: Verify ZKP (Employer)

```bash
curl -X POST http://localhost:5000/api/zkp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "credentialHash": "YOUR_HASH",
    "studentId": "STUDENT-001",
    "nonce": "YOUR_NONCE",
    "commitment": "YOUR_COMMITMENT"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "valid": true,
  "recomputed": "def456...",
  "message": "ZKP verified: credential is authentic"
}
```

---

### Step 5: View Student Profile

```bash
curl http://localhost:5000/api/students/STUDENT-001/profile
```

**Expected Response:**
```json
{
  "ok": true,
  "studentId": "STUDENT-001",
  "did": "did:decaid:...",
  "credentials": [
    {
      "hash": "abc123...",
      "data": "Bachelor of Computer Science - First Class Honours",
      "issuer": "UNIVERSITY-2024",
      "riskScore": 25,
      "status": "active"
    }
  ],
  "totalCredentials": 1
}
```

---

### Step 6: Check Institution Stats

```bash
curl http://localhost:5000/api/issuers/UNIVERSITY-2024/stats
```

**Expected Response:**
```json
{
  "ok": true,
  "issuerId": "UNIVERSITY-2024",
  "totalIssued": 1,
  "totalRevoked": 0,
  "successRate": 100,
  "trustRank": 4,
  "averageRiskScore": 25
}
```

---

### Step 7: Batch Upload Test

```bash
curl -X POST http://localhost:5000/api/institutions/batches \
  -H "Content-Type: application/json" \
  -d '{
    "issuerId": "UNIVERSITY-2024",
    "batchName": "CS Graduates 2024",
    "credentials": [
      {"studentId": "STUDENT-002", "credentialData": "Master of AI - Distinction"},
      {"studentId": "STUDENT-003", "credentialData": "PhD in Data Science"}
    ]
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "batchId": "batch-...",
  "count": 2
}
```

---

### Step 8: Revoke a Credential (Test Revocation)

```bash
curl -X POST http://localhost:5000/api/credentials/revoke \
  -H "Content-Type: application/json" \
  -d '{
    "credentialHash": "YOUR_HASH",
    "issuerId": "UNIVERSITY-2024"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "credentialHash": "abc123...",
  "blockchain": {
    "revoked": true,
    "txHash": "0x..."
  },
  "status": "revoked"
}
```

Now verify again - it should show `revoked: true` with a high risk score.

---

## UI Testing Steps

### 1. Institution Portal (Issue Credentials)

1. Open http://localhost:3000
2. Click **Institution Portal** tab
3. Enter:
   - **Issuer ID:** `UNIVERSITY-2024`
   - **Student ID:** `TEST-STUDENT-001`
   - **Credential Data:** `Bachelor of Engineering`
4. Click **Issue Credential**
5. **Verify:** Success message appears with credential hash

### 2. Student Identity (View Credentials)

1. Click **Student Identity** tab
2. Enter **Student ID:** `TEST-STUDENT-001`
3. Click **Load Profile**
4. **Verify:**
   - DID is displayed
   - Credential appears in the list
   - Risk score is shown (20-40 range)

### 3. ZKP Tools (Privacy Verification)

1. Click **ZKP Tools** tab
2. Enter:
   - **Credential Hash:** (from Step 1)
   - **Student ID:** `TEST-STUDENT-001`
3. Click **Generate ZKP Proof**
4. **Verify:**
   - Commitment is generated
   - Nonce is generated
   - Both values are displayed

### 4. Employer Verification

1. Click **Employer Verification** tab
2. Enter:
   - **Credential Hash:** (from Step 1)
   - **Student ID:** `TEST-STUDENT-001`
   - **Issuer ID:** `UNIVERSITY-2024`
3. Click **Verify Credential**
4. **Verify:**
   - ✅ Blockchain status shows "Exists"
   - ✅ Status shows "Active"
   - Risk score is displayed
   - Trust rank is shown (1-5 stars)

---

## Expected Results

### Risk Score Categories

| Score Range | Category | Meaning |
|-------------|----------|---------|
| 0-30 | 🟢 Low Risk | Normal credential |
| 31-60 | 🟡 Medium Risk | Slightly suspicious |
| 61-80 | 🟠 High Risk | Suspicious patterns |
| 81-100 | 🔴 Critical Risk | Likely fraudulent |

### Test Scenarios & Expected Outcomes

| Test | Expected Result |
|------|-----------------|
| Issue valid credential | ✅ Success, risk score 20-40 |
| Verify valid credential | ✅ Exists, ✅ Active, risk score 20-40 |
| Verify revoked credential | ✅ Exists, 🔴 Revoked, risk score 70+ |
| Verify non-existent hash | ❌ Not Found |
| Issue duplicate credential | ✅ Exists, ⚠️ Duplicate flag, elevated risk |
| ZKP with correct nonce | ✅ ZKP Verified |
| ZKP with wrong nonce | ❌ ZKP Invalid |
| Batch upload 100+ credentials | ✅ Success, risk scores elevated for bulk pattern |

---

## Troubleshooting

### "Failed to fetch" Error
**Cause:** Backend not running or wrong port
**Fix:**
```bash
cd backend
npm run dev
```

### "Contract not deployed" Error
**Cause:** Smart contract needs deployment
**Fix:**
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

### Risk Score Not Appearing
**Cause:** AI service not running
**Fix:**
```bash
cd ai-service
python -m uvicorn main:app --port 8000
```

### "Nonce too low" Error
**Cause:** Hardhat was restarted
**Fix:** Restart backend after deploying contract
```bash
cd backend
npm run dev
```

---

## Quick Test Script

Save this as `test.sh` and run it:

```bash
#!/bin/bash

echo "=== DECAID Quick Test ==="

# Health checks
echo "Checking services..."
curl -s http://localhost:5000/health | jq .
curl -s http://localhost:8000/health | jq .

# Issue credential
echo "Issuing credential..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/credentials/issue \
  -H "Content-Type: application/json" \
  -d '{"studentId":"TEST-001","issuerId":"UNI-TEST","credentialData":"Test Degree"}')

HASH=$(echo $RESPONSE | jq -r '.credentialHash')
echo "Hash: $HASH"

# Verify
echo "Verifying..."
curl -s "http://localhost:5000/api/verify/by-hash/$HASH?studentId=TEST-001&issuerId=UNI-TEST" | jq .

echo "=== Test Complete ==="
```

---

## Summary

If all tests pass, your DECAID system is working correctly:

- ✅ Credentials can be issued and stored on blockchain
- ✅ AI fraud detection provides risk scores
- ✅ Zero-knowledge proofs enable privacy-preserving verification
- ✅ Student DIDs aggregate credentials
- ✅ Institution trust rankings work
- ✅ Batch uploads function correctly
- ✅ Revocation marks credentials properly
