# Nexar Network Token List

Official [Uniswap Token List](https://github.com/Uniswap/token-lists) compatible with PancakeSwap and other aggregators that consume the standard schema.

## Token

| Field | Value |
|-------|-------|
| Project | Nexar Network |
| Name | Nexar Network |
| Symbol | NXR |
| Chain ID | 56 |
| Network | BNB Smart Chain |
| Decimals | 18 |
| Contract | `0xc37c9eeAB826e5bcB4ed2b798123915Cd596c909` |
| Logo | https://www.nexarnetwork.org/logo.png |
| Website | https://www.nexarnetwork.org |

## Files

- `tokenlist.json` — publish this file at a stable HTTPS URL for PancakeSwap / Uniswap list imports.

## Publish on GitHub

1. Create a public repository (for example `nexarnetwork1/token-list`).
2. Copy `tokenlist.json` to the repository root.
3. Enable GitHub Pages or serve the raw file from the default branch.
4. Use the raw HTTPS URL as your list URI, for example:
   `https://raw.githubusercontent.com/nexarnetwork1/token-list/main/tokenlist.json`

## Import on PancakeSwap

1. Open PancakeSwap → **Manage Tokens** → **Import Token** → **Manage Lists**.
2. Paste your published `tokenlist.json` URL.
3. Confirm the list and import **NXR**.

## Validation

Validate against the official schema before publishing:

```bash
npx @uniswap/token-lists validate nexar-token-list/tokenlist.json
```

## Versioning

Update the `version` object in `tokenlist.json` when adding or changing tokens:

- **patch** — metadata or logo updates
- **minor** — new tokens on the same chain
- **major** — breaking list structure changes

## License

Token metadata is provided for wallet and DEX integration. Verify the contract address on [BscScan](https://bscscan.com/token/0xc37c9eeAB826e5bcB4ed2b798123915Cd596c909) before trading.
