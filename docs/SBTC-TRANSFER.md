# sBTC Transfer Reference

## Testnet Configuration

- **Contract**: `ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token`
- **Network**: `testnet`
- **Decimals**: `8` (100,000,000 units = 1 BTC)

## Implementation

```typescript
import { request } from "@stacks/connect";
import { uintCV, standardPrincipalCV, noneCV, Pc } from "@stacks/transactions";

const CONTRACT = "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token";

// Convert to smallest unit (8 decimals)
const amountUnits = BigInt(amount * 100_000_000);

// Post-condition prevents unauthorized transfers
const postConditions = [
  Pc.principal(sender).willSendEq(amountUnits).ft(CONTRACT, "sbtc-token")
];

const res = await request("stx_callContract", {
  contract: CONTRACT,
  functionName: "transfer",
  functionArgs: [
    uintCV(amountUnits),
    standardPrincipalCV(sender),
    standardPrincipalCV(recipient),
    noneCV()
  ],
  address: sender,
  network: "testnet",
  postConditionMode: "deny",
  postConditions
});
```

## Common Issues

**Post-condition failure:**
- Verify amount calculation (8 decimals)
- Ensure sufficient sBTC balance
- Check sender matches connected wallet

**ERR_NOT_OWNER:**
- Sender must be tx-sender (connected address)
- Verify wallet is unlocked

**Network mismatch:**
- Wallet must be on Testnet
- Check API endpoint matches network
