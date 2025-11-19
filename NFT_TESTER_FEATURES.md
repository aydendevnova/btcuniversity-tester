# NFT Certificate Testing Interface

## Overview

The BTC University tester now includes comprehensive NFT certificate management functionality, allowing instructors to issue certificates and students to view their achievements.

## New Features

### 1. Mint NFT Certificates (Instructor Only)

**Location**: NFT Certificate Management section

**Functionality**:
- Instructors can mint NFT certificates for any student
- Enter the student's Stacks address
- Click "Mint NFT Certificate" to grant the certificate
- One NFT per student per contract (prevents duplicates)

**Use Case**: After a student completes a course or program, the instructor grants them a permanent on-chain certificate.

### 2. Check NFT Status

**Location**: NFT Certificate Management section

**Functionality**:
- Check if any student address has received an NFT
- Displays token ID and minting status
- Visual indicators (HAS NFT / NO NFT)

**Use Case**: Verify certificate status for any student address.

### 3. Check My NFT (Student View)

**Location**: NFT Certificate Management section

**Functionality**:
- Students can check their own certificate status
- Automatic address detection from connected wallet
- Congratulatory message if NFT is present
- Shows token ID and minting confirmation

**Use Case**: Students view their achievement certificate with a single click.

### 4. NFT Instructor Management

**Location**: NFT Certificate Management section

**Functionality**:
- Add new instructors who can mint NFTs
- Check if an address is an NFT instructor
- "Am I Instructor?" button for quick self-check

**Use Case**: Delegate minting permissions to multiple instructors.

### 5. NFT Statistics

**Location**: NFT Certificate Management section

**Functionality**:
- View total NFTs minted across the platform
- Shows last token ID
- Reminds users about one-NFT-per-student rule

**Use Case**: Track overall platform certificate distribution.

## Technical Implementation

### New Functions in `main.ts`

```typescript
// Minting
mintNftForStudent(student, nftContractAddress?, nftContractName?)

// Instructor Management
addNftInstructor(instructor, nftContractAddress?, nftContractName?)
isNftInstructor(address, nftContractAddress?, nftContractName?)

// Student NFT Queries
hasNft(student, nftContractAddress?, nftContractName?)
getStudentTokenId(student, nftContractAddress?, nftContractName?)

// Contract Queries
getNftOwner(tokenId, nftContractAddress?, nftContractName?)
getLastNftTokenId(nftContractAddress?, nftContractName?)
```

### Optional Parameters

All NFT functions support optional contract address and name parameters:
- `nftContractAddress`: Defaults to main contract address
- `nftContractName`: Defaults to "btc-university-nft"

This allows testing with different NFT contract deployments.

## UI Components

### Input Fields
- `nft-student-address`: Student address for minting
- `check-nft-address`: Address to check NFT status
- `nft-instructor-address`: Instructor address for management

### Buttons
- `btn-mint-nft`: Mint NFT for student
- `btn-check-nft`: Check NFT status for address
- `btn-check-my-nft`: Check your own NFT
- `btn-add-nft-instructor`: Add new instructor
- `btn-check-nft-instructor`: Check instructor status
- `btn-check-am-i-instructor`: Check if you're instructor
- `btn-get-nft-stats`: View platform statistics

### Display Areas
- `nft-status`: Shows NFT certificate status
- `nft-stats`: Displays platform statistics

## User Flows

### Instructor Flow: Grant Certificate

1. Connect wallet
2. Navigate to "NFT Certificate Management" section
3. Enter student's Stacks address
4. Click "Mint NFT Certificate"
5. Approve transaction in wallet
6. Certificate is permanently recorded on-chain

### Student Flow: View Certificate

1. Connect wallet
2. Navigate to "NFT Certificate Management" section
3. Click "Check My NFT"
4. View certificate status and token ID
5. If certified, see congratulatory message

### Admin Flow: Add Instructor

1. Connect wallet as deployer/existing instructor
2. Navigate to "NFT Instructor Management"
3. Enter new instructor's address
4. Click "Add NFT Instructor"
5. New instructor can now mint certificates

## Error Handling

The interface handles common scenarios:

- **No wallet connected**: Prompts user to connect
- **Empty address fields**: Alerts to enter required information
- **Transaction failures**: Displays error message with details
- **Already minted**: Contract prevents duplicate NFT minting
- **Not authorized**: Only instructors can mint

## Security Notes

- Only authorized instructors can mint NFTs
- Contract enforces one NFT per student
- All transactions require wallet approval
- Read-only functions don't require authorization

## Testing Tips

1. **Test Minting**: Use testnet addresses to mint test certificates
2. **Verify Status**: Check certificates using both address input and "Check My NFT"
3. **Multi-Instructor**: Add multiple instructors to test delegation
4. **Duplicate Prevention**: Try minting twice for same student to verify protection
5. **Statistics**: Monitor NFT count as you mint certificates

## Future Enhancements

Potential additions for the NFT interface:
- Display NFT metadata/URI
- Show list of all NFT holders
- Export certificate data
- Visual NFT gallery view
- Certificate verification by token ID

