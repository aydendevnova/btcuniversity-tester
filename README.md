# BTC University Tester

Testing interface for the BTC University smart contracts on Stacks blockchain with sBTC payments.

## Overview

Web-based testing interface for BTC University smart contracts with **secure owner-controlled sBTC**:

- **Whitelist Management**: Self-enrollment with sBTC balance check
- **Course Management**: Create and manage courses
- **Course Enrollment**: Enroll in courses with sBTC payments (validated)
- **Fee Claiming**: Instructors claim accumulated sBTC fees (validated)
- **Course Completion**: Track student progress

**✅ sBTC testnet contract auto-configured** - Ready to test immediately!  
**🔒 Security**: Contract validates sBTC address server-side (see `SECURITY-NOTE.md`)

## Smart Contracts

The BTC University platform consists of:

1. **btcuni.clar** - Main contract with course and enrollment management
2. **btcuni-trait.clar** - Trait definition for BTC University
3. **btcuniNft.clar** - NFT contract for course certificates
4. **btcuninfttrait.clar** - NFT trait definition

## Features

### Whitelist Functions

- **Self-Enrollment**: Users with ≥0.001 BTC (100,000 satoshis) in sBTC can self-enroll to whitelist
- **Admin Management**: Owner can add/remove users from whitelist
- **Status Check**: Check whitelist status for any address

### Course Functions

- **Add Course**: Owner creates new courses with pricing and limits
- **View Courses**: Browse all available courses
- **Get Details**: Fetch specific course information

### Enrollment Functions

- **Enroll**: Pay with sBTC to enroll in courses (requires whitelist)
- **Check Status**: Verify enrollment status
- **Get Enrollments**: List all courses a student is enrolled in
- **Complete Course**: Instructors mark students as complete

### Fee Management

- **Claim Fees**: Instructors claim accumulated sBTC from enrollments

## Setup

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to access the testing interface.

## Configuration

The tester auto-configures for testnet with these defaults:

- **Network**: testnet
- **BTC Uni Contract**: `STHJGT945DGCQH08X9KB04V2DBHERWTQZCN5BVJS.btc-university`
- **sBTC Token**: `ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token` ✅ Auto-filled

**Important Setup:**

1. Update your deployed contract address in the interface
2. Make sure contract owner has called `set-sbtc-contract` after deployment
3. Verify configured sBTC matches (use "Check Configured sBTC" button)

## Testing Workflow

### 1. Connect Wallet

Connect your Stacks wallet (Leather, Xverse, etc.)

### 2. Whitelist Enrollment

Option A: Self-enroll if you have ≥10 USD in sBTC
Option B: Owner adds you to whitelist manually

### 3. Course Management (Owner)

- Add courses with name, details, price, instructor, and max students
- View all courses or specific course details

### 4. Course Enrollment

- Select a course ID
- Click "Enroll in Course" (transfers sBTC to contract)
- Verify enrollment status

### 5. Course Completion (Instructor/Owner)

- Mark students as complete for courses
- Students can then mint completion NFTs

### 6. Fee Claiming (Instructor)

- View accumulated fees for your courses
- Claim sBTC fees to your wallet

## Contract Integration

The tester uses `@stacks/connect` for wallet interactions and `@stacks/transactions` for read-only calls.

### Key Functions

```typescript
// Security: Check configured sBTC
BtcUniversity.getConfiguredSbtcContract(); // Returns owner-set sBTC address

// Whitelist (auto-passes sBTC contract, validated by contract)
BtcUniversity.enrollWhitelist();
BtcUniversity.addWhitelist(student);
BtcUniversity.isWhitelisted(student);

// Courses
BtcUniversity.addCourse(name, details, instructor, price, maxStudents);
BtcUniversity.getAllCourses();
BtcUniversity.getCourseDetails(courseId);

// Enrollment (auto-passes sBTC contract, validated by contract)
BtcUniversity.enrollCourse(courseId);
BtcUniversity.isEnrolled(courseId, student);
BtcUniversity.getEnrolledIds(student);

// Fees (auto-passes sBTC contract, validated by contract)
BtcUniversity.claimCourseFees(courseId);
```

## Build

```bash
npm run build
```

Outputs to `dist/` directory with:

- `sbtc-payments.iife.js` - Standalone library
- Type definitions for TypeScript projects

## Development

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

## License

MIT
