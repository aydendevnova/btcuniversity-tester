# BTC University Testing Guide

Comprehensive guide for testing the BTC University smart contracts.

## Prerequisites

1. **Stacks Wallet**: Leather, Xverse, or compatible wallet
2. **Testnet STX**: For transaction fees
3. **Testnet sBTC**: For course enrollment payments
4. **Contract Deployment**: btcuni contract deployed to testnet

## Test Scenarios

### 1. Whitelist Self-Enrollment

**Requirements:**

- At least 0.001 BTC (100,000 satoshis) in sBTC balance
- Connected wallet

**Steps:**

1. Connect wallet
2. Ensure you have at least 100,000 satoshis of sBTC
3. Click "Self-Enroll to Whitelist"
4. Approve transaction in wallet
5. Wait for confirmation
6. Verify whitelist status

**Expected Outcome:**

- Transaction succeeds
- User is added to whitelist map
- `is-whitelisted-beta` returns true

**Error Cases:**

- `ERR-NOT-ENOUGH-SBTC` (u7002): Insufficient sBTC balance (need ≥100,000 sats)
- `ERR-READING-SBTC-BALANCE` (u7001): Failed to read sBTC balance

### 2. Admin Whitelist Management

**Requirements:**

- Contract owner wallet connected

**Steps:**

1. Enter target student address
2. Click "Add to Whitelist"
3. Approve transaction
4. Verify whitelist status

**Expected Outcome:**

- Student added to whitelist
- Print event logged
- Status check returns true

**Error Cases:**

- `ERR-OWNER-ONLY` (u100): Not contract owner
- Already whitelisted: u104

### 3. Course Creation

**Requirements:**

- Contract owner wallet
- Valid course information

**Steps:**

1. Fill course details:
   - Name: "Bitcoin Basics 101"
   - Details: "Learn fundamentals..."
   - Instructor address
   - Price: 10000000 (1 USD in micro units)
   - Max students: 50
2. Click "Add Course"
3. Approve transaction
4. Note returned course ID

**Expected Outcome:**

- New course-id incremented
- Course stored in courses map
- Print event logged with course ID

**Error Cases:**

- `ERR-OWNER-ONLY` (u100): Not contract owner
- String length validation failures

### 4. Course Enrollment

**Requirements:**

- Whitelisted wallet
- Sufficient sBTC for course price
- Course exists and has capacity

**Steps:**

1. Get course details to check price
2. Ensure you're whitelisted
3. Enter course ID
4. Click "Enroll in Course"
5. Approve sBTC transfer transaction
6. Wait for confirmation

**Expected Outcome:**

- sBTC transferred from student to contract escrow
- Enrollment record created: `{paid: true, enrolled: true, completion: false}`
- Course fees map updated with enrollment price
- Transaction succeeds

**Error Cases:**

- `ERR-USER-NOT-WHITELISTED` (u102): Not on whitelist
- `ERR-COURSE-NOT-FOUND` (u101): Invalid course ID
- `ERR-ALREADY-ENROLLED` (u104): Student already enrolled
- `ERR-NOT-ENOUGH-SBTC` (u7002): Insufficient sBTC balance

**Test Transaction:**

```clarity
(contract-call? .btcuni enroll-course u1)
```

### 5. Enrollment Verification

**Steps:**

1. Enter course ID and student address
2. Click "Check Enrollment"
3. View enrollment status
4. Click "Get My Enrolled Course IDs"
5. Verify course appears in list

**Expected Outcome:**

- `is-enrolled` returns true
- `get-enrolled-ids` includes the course ID
- Enrollment data shows paid and enrolled flags

### 6. Course Completion

**Requirements:**

- Instructor or owner wallet
- Student enrolled in course

**Steps:**

1. Connect as instructor or owner
2. Enter course ID and student address
3. Click "Mark Course as Complete"
4. Approve transaction

**Expected Outcome:**

- Enrollment completion flag set to true
- Student eligible for NFT certificate mint
- Transaction succeeds

**Error Cases:**

- `ERR-USER-NOT-ENROLLED` (u103): Student not enrolled
- `ERR-COURSE-NOT-FOUND` (u101): Invalid course
- Unauthorized (u401): Not instructor or owner

### 7. Fee Claiming

**Requirements:**

- Instructor wallet
- Accumulated fees from enrollments

**Steps:**

1. Connect as course instructor
2. Enter course ID
3. Click "Claim Course Fees"
4. Approve transaction

**Expected Outcome:**

- Total accumulated sBTC transferred from contract to instructor
- Course fees map reset to 0
- Transaction returns total fees claimed

**Error Cases:**

- `ERR-UNAUTHORIZED` (u108): Not course instructor
- `ERR-COURSE-NOT-FOUND` (u101): Invalid course ID
- `ERR-NOT-ENOUGH-SBTC` (u7002): Contract balance insufficient

## Contract Constants

```clarity
MIN-SBTC-BALANCE: u100000      ;; 0.001 BTC (100,000 satoshis) minimum for whitelist
COURSE-PRICE: u10000000        ;; Default 1 USD in micro units
ERR-OWNER-ONLY: u100
ERR-COURSE-NOT-FOUND: u101
ERR-USER-NOT-WHITELISTED: u102
ERR-USER-NOT-ENROLLED: u103
ERR-ALREADY-ENROLLED: u104
ERR-NOT-ENOUGH-SBTC: u7002
```

## Integration Testing

### Test Flow 1: Complete Student Journey

1. Self-enroll to whitelist (with sBTC)
2. Browse available courses
3. Enroll in course (transfer sBTC)
4. Verify enrollment status
5. Complete course (as instructor)
6. (Future) Mint completion NFT

### Test Flow 2: Instructor Journey

1. Owner creates course with instructor
2. Students enroll (fees accumulate)
3. Instructor checks course details
4. Instructor marks students complete
5. Instructor claims accumulated fees

### Test Flow 3: Admin Management

1. Owner adds course
2. Owner manually whitelists students
3. Owner monitors enrollments
4. Owner can mark completions

## Debugging

### Check Contract State

**Get course count:**

```clarity
(contract-call? .btcuni get-course-count)
```

**Get specific course:**

```clarity
(contract-call? .btcuni get-course-details u1)
```

**Check whitelist status:**

```clarity
(contract-call? .btcuni is-whitelisted-beta 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

**Check enrollment:**

```clarity
(contract-call? .btcuni is-enrolled u1 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

### Common Issues

**Transaction Fails with "Not enough balance"**

- Check sBTC balance is sufficient
- Verify correct sBTC token contract
- Ensure post-conditions allow transfer

**"User not whitelisted" error**

- Verify whitelist status
- Check sBTC balance meets minimum
- Owner can manually whitelist

**"Course not found"**

- Verify course ID exists
- Check course-count first
- IDs start at 1, not 0

**"Already enrolled"**

- Check enrollment status before enrolling
- Student can only enroll once per course

## Performance Testing

### Load Testing

- Test with multiple concurrent enrollments
- Verify course capacity limits enforced
- Monitor gas costs for operations

### Stress Testing

- Maximum students per course
- Maximum number of courses
- Large fee accumulations

## Security Considerations

1. **sBTC Transfer Security**: Post-conditions should prevent unexpected transfers
2. **Access Control**: Only owner can create courses and manage whitelist
3. **Instructor Authorization**: Only course instructor can claim fees
4. **Double Enrollment Prevention**: Contract prevents duplicate enrollments
5. **Balance Verification**: Direct sBTC balance check for whitelist enrollment

## Next Steps

After successful testing:

1. Deploy to mainnet
2. Integrate NFT minting for completions
3. Add course metadata and rich content
4. Implement student progress tracking
5. Add course reviews and ratings
