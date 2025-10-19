## sBTC Transfer (Stacks Testnet)

### Contract & Network

- **Contract**: `ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token`
- **Network**: `testnet` (API `https://api.testnet.hiro.so`)
- **Explorer**: `https://explorer.hiro.so/?chain=testnet`

### SIP-010 Transfer Signature

```
transfer(amount uint, sender principal, recipient principal, memo (optional (buff 34)))
```

- Asserts: `(or (is-eq tx-sender sender) (is-eq contract-caller sender))` → sender must be `tx-sender` or `contract-caller`.
- Decimals: `get-decimals` returns `u8`. Use 8 if the read-only call is unavailable.

### Amount Handling

- Parse user amount to smallest unit using token decimals (default to 8):
  - `amountUnits = parseAmountToUnits(amountInput, decimals)`

### Wallet Connect

```ts
import { AppConfig, UserSession } from "@stacks/auth";
import { showConnect } from "@stacks/connect";

const userSession = new UserSession({
  appConfig: new AppConfig(["store_write"]),
});

await new Promise<void>((resolve) =>
  showConnect({
    appDetails: { name: "sBTC Transfer", icon: "/vite.svg" },
    userSession,
    onFinish: () => resolve(),
  })
);
```

### Preferred Contract Call (WBIP/SIP-030)

```ts
import { request } from "@stacks/connect";
import { uintCV, standardPrincipalCV, noneCV, Pc } from "@stacks/transactions";

const CONTRACT = "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token";

// sender: current testnet address; amountUnits: bigint in smallest unit
const postConditions = [
  Pc.principal(sender).willSendEq(amountUnits).ft(CONTRACT, "sbtc-token"),
];

const res = await request("stx_callContract", {
  contract: CONTRACT,
  functionName: "transfer",
  functionArgs: [
    uintCV(amountUnits),
    standardPrincipalCV(sender),
    standardPrincipalCV(recipient),
    noneCV(),
  ],
  address: sender,
  network: "testnet",
  postConditionMode: "deny",
  postConditions,
});

const txid = res?.txid || res?.transaction?.txid;
```

### Key Fixes Applied (and Why)

- **Explicit FT post-condition**: Without it, Deny mode can roll back with “would have succeeded but was rolled back by a supplied post-condition.” We add:
  - `Pc.principal(sender).willSendEq(amountUnits).ft(CONTRACT, 'sbtc-token')`
- **Popup/gesture preservation**: Avoid async before opening wallet to prevent browser popup blocking. Cache decimals ahead of time; default to 8 at call-time.
- **Network hint**: Pass `network: 'testnet'` to wallet request; ensure wallet is on Testnet.
- **Sender correctness**: Pass the authenticated STX address as both the recommended `address` and the `sender` Clarity arg to satisfy `ERR_NOT_OWNER` guard.

### Troubleshooting

- No popup or callbacks: allow popups; ensure wallet installed/unlocked; check console logs.
- Post-condition failure: verify `amountUnits`, post-condition token `asset`, and correct `sender`.
- `ERR_NOT_OWNER`: ensure `sender === tx-sender` (the connected address) and the account has sufficient sBTC balance.
- Network mismatch: wallet must be on Testnet.

### References

- sBTC contract (testnet): `ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token`
- Hiro API Testnet: `https://api.testnet.hiro.so`
- Explorer: `https://explorer.hiro.so/?chain=testnet`

<!-- TODO: add production notes (mainnet contract when available), and optional decimals caching strategy. -->
