# BTC University Tester

Testing interface for the BTC University smart contracts on Stacks blockchain with sBTC payments.

## Overview

This project provides a web-based testing interface for the BTC University smart contracts, enabling:

- **Whitelist Management**: Self-enrollment and admin whitelist operations
- **Course Management**: Create, view, and manage courses
- **Course Enrollment**: Enroll in courses with sBTC payments
- **Fee Claiming**: Instructors can claim accumulated course fees
- **Course Completion**: Track student progress and completions

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

Update the contract addresses in the interface:

- **Network**: testnet or mainnet
- **BTC Uni Contract**: Your deployed btcuni contract address
- **sBTC Token**: The sBTC token contract address
- **Oracle**: DIA oracle for sBTC price feeds

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
// Whitelist
BtcUniversity.enrollWhitelist();
BtcUniversity.addWhitelist(student);
BtcUniversity.isWhitelisted(student);

// Courses
BtcUniversity.addCourse(name, details, instructor, price, maxStudents);
BtcUniversity.getAllCourses();
BtcUniversity.getCourseDetails(courseId);

// Enrollment
BtcUniversity.enrollCourse(courseId);
BtcUniversity.isEnrolled(courseId, student);
BtcUniversity.getEnrolledIds(student);

// Fees
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
