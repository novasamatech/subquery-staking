# Asset Hub Extrinsic Fixtures

Imported unchanged from [subquery-accounts PR #97](https://github.com/novasamatech/subquery-accounts/pull/97), commit `62277f48b21e20962e7924f64e35c8351d938ce8` (`scripts/tests/fixtures/`).

- `polkadot-ah-general-extrinsic.json` contains the real failing transaction from block `20494727`, its hash and reduced runtime metadata.
- `kusama-ah-metadata.json` and `westend-ah-metadata.json` contain reduced real parent-runtime metadata with native pipeline 0. The tests model a pipeline-1 upgrade using the helper from the same PR; these synthetic transactions are not on-chain samples.

Metadata retains SCALE type IDs and variant indices. Tests run offline through the existing Jest suite (`npm test -- --runInBand`).

The shared decoder in `chainTypes/assetHubExtrinsic.ts` also comes from that commit. It selects transaction extensions using v16 metadata, keeps signed origins and original bytes/hashes, and delegates signed v4 and bare v5 to the stock codec. All three Asset Hub bundles register it.

After deploying rebuilt chain-type bundles, resume the existing checkpoint. The fix does not require skipping the failing block or clearing indexed data. A dictionary HTTP 503 is a separate availability issue.
