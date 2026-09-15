import { Metadata, TypeRegistry } from "@polkadot/types";
import { getSpecAlias, getSpecExtensions, getSpecTypes } from "@polkadot/types-known";
import { decorateExtrinsics } from "@polkadot/types/metadata/decorate/extrinsics";
import type { GenericExtrinsic } from "@polkadot/types/extrinsic/Extrinsic";
import type { RegisteredTypes } from "@polkadot/types/types";
import polkadotTypes from "../chainTypes/polkadotAhChaintypes";
import kusamaTypes from "../chainTypes/kusamaAhChaintypes";
import westendTypes from "../chainTypes/westendAhChaintypes";
import polkadot from "./fixtures/polkadot-ah-general-extrinsic.json";
import kusama from "./fixtures/kusama-ah-metadata.json";
import westend from "./fixtures/westend-ah-metadata.json";

const { encodeGeneral, envelope, projectPipeline } = require("./utils/transactionPipeline");

interface Snapshot {
  source: { chain: string; specName?: string; specVersion: number };
  metadata: string;
}

function createRegistry(snapshot: Snapshot, types: RegisteredTypes = {}, metadata = snapshot.metadata) {
  const { chain, specName = "statemint", specVersion } = snapshot.source;
  const registry = new TypeRegistry();
  registry.setKnownTypes(types);
  registry.register(getSpecTypes(registry, chain, specName, specVersion));
  registry.register(types.types || {});
  registry.knownTypes.typesAlias = getSpecAlias(registry, chain, specName);
  registry.setMetadata(new Metadata(registry, Buffer.from(metadata.slice(2), "hex")),
    undefined, getSpecExtensions(registry, chain, specName), true);
  return registry;
}

const ACCOUNT = "0x4c2545283514c51c1b5aeac53e68694cbd5913c14044657db192a3e014d8df66";
const SIGNATURE = "0x" + "11".repeat(64);
const extensionValues = {
  VerifyMultiSignature: { Signed: { account: ACCOUNT, signature: { Sr25519: SIGNATURE } } },
  CheckMortality: "0x4607",
  CheckNonce: 334,
  ChargeAssetTxPayment: { tip: 0, assetId: null },
  CheckMetadataHash: { mode: "Disabled" },
};

test("stock decoder reproduces Mortal era on the production transaction", () => {
  const registry = createRegistry(polkadot);
  expect(() => registry.createType("Extrinsic", polkadot.extrinsic)).toThrow("Invalid data passed to Mortal era");
});

test("Polkadot block 20494727 preserves the real staking call, signer, bytes and hash", () => {
  const registry = createRegistry(polkadot, polkadotTypes);
  const ex = registry.createType("Extrinsic", polkadot.extrinsic);
  expect(ex.isGeneral()).toBe(true);
  expect(ex.type).toBe(5);
  expect(ex.version).toBe(0x45);
  expect(ex.isSigned).toBe(true);
  expect(ex.signer.toString()).toBe(registry.createType("AccountId", ACCOUNT).toString());
  expect(ex.signature.toHex()).toBe("0xe89a5ce385d8186d9649b75f8007ac4be2a27e01cd3451be557d00e653ccab55b6053c58faedd4e04b4fb85d59cba2139ad5426875785fdeb592349bd053aa83");
  expect(ex.method.section).toBe("utility");
  expect(ex.method.method).toBe("forceBatch");
  const innerCall = ex.method.args[0][0];
  expect(innerCall.section).toBe("staking");
  expect(innerCall.method).toBe("payoutStakers");
  expect(innerCall.args[1].toNumber()).toBe(2288);
  expect(ex.nonce.toNumber()).toBe(334);
  expect(ex.era.asMortalEra.period.toNumber()).toBe(128);
  expect(ex.era.asMortalEra.phase.toNumber()).toBe(116);
  expect(ex.toHex()).toBe(polkadot.extrinsic);
  expect(ex.hash.toHex()).toBe(polkadot.extrinsicHash);
  expect(registry.createType("Extrinsic", ex).toHex()).toBe(polkadot.extrinsic);
  expect(ex.toHuman()).toMatchObject({ isSigned: true });

  // Decode concatenated extrinsics as chain_getBlock does, including the
  // following extrinsic to detect an incorrect General-v5 byte length.
  const bare = envelope(registry, Buffer.concat([Buffer.from([5]), ex.method.toU8a()]));
  const encoded = Buffer.concat([
    registry.createType("Compact<u32>", 4).toU8a(), bare, bare, ex.toU8a(), bare,
  ]);
  const extrinsics = registry.createType("Vec<Extrinsic>", encoded);
  expect(extrinsics).toHaveLength(4);
  expect(extrinsics[2].hash.toHex()).toBe(polkadot.extrinsicHash);
  expect(Buffer.from(extrinsics.toU8a())).toEqual(encoded);
});

describe.each([
  { chain: "Polkadot", fixture: polkadot, types: polkadotTypes },
  { chain: "Kusama", fixture: kusama, types: kusamaTypes },
  { chain: "Westend", fixture: westend, types: westendTypes },
])("$chain Asset Hub", ({ chain, fixture, types }) => {
  // Kusama/Westend fixtures advertise pipeline 0. Model the known pipeline-1
  // upgrade while preserving each chain's native types and call indices.
  const metadata = chain === "Polkadot" ? fixture.metadata
    : projectPipeline(fixture.metadata, polkadot.metadata, 1, { Metadata, TypeRegistry });
  const registry = createRegistry(fixture, types, metadata);
  const tx = decorateExtrinsics(registry, registry.metadata, 16);
  const call = tx.utility.forceBatch([tx.system.remark("0x01020304")]);
  const bytes = encodeGeneral(registry, 1, extensionValues, call);

  test("pipeline 1 fixes the stock decoder failure and preserves nested calls", () => {
    const stock = createRegistry(fixture, {}, metadata);
    expect(() => stock.createType("Extrinsic", bytes)).toThrow("Invalid data passed to Mortal era");
    const ex = registry.createType("Extrinsic", bytes);
    expect(ex.isGeneral()).toBe(true);
    expect(ex.isSigned).toBe(true);
    expect(ex.signer.toString()).toBe(registry.createType("AccountId", ACCOUNT).toString());
    expect(ex.method.toHex()).toBe(call.toHex());
    expect(ex.method.args[0][0].method).toBe("remark");
    expect(ex.nonce.toNumber()).toBe(334);
    expect(Buffer.from(ex.toU8a())).toEqual(bytes);
    expect(ex.hash.toHex()).toBe(registry.hash(bytes).toHex());
  });

  test("native pipeline 0 retains its unsigned origin and exact encoding", () => {
    const native = createRegistry(fixture, types);
    const value = encodeGeneral(native, 0, extensionValues, call);
    const ex = native.createType("Extrinsic", value);
    expect(ex.isGeneral()).toBe(true);
    expect(ex.isSigned).toBe(false);
    expect(ex.nonce.toNumber()).toBe(334);
    expect(ex.method.toHex()).toBe(call.toHex());
    expect(Buffer.from(ex.toU8a())).toEqual(value);
    expect(ex.hash.toHex()).toBe(native.hash(value).toHex());
  });

  test("disabled signature verification does not invent a signed origin", () => {
    const value = encodeGeneral(registry, 1, { ...extensionValues, VerifyMultiSignature: "Disabled" }, call);
    const ex = registry.createType("Extrinsic", value);
    expect(ex.isSigned).toBe(false);
    expect(ex.method.toHex()).toBe(call.toHex());
    expect(Buffer.from(ex.toU8a())).toEqual(value);
    expect(ex.hash.toHex()).toBe(registry.hash(value).toHex());
  });

  test.each([ ["Ed25519", 64], ["Sr25519", 64], ["Ecdsa", 65] ] as const)(
    "%s signatures and fee assets use metadata types", (kind, length) => {
      const signature = "0x" + "ab".repeat(length);
      const value = encodeGeneral(registry, 1, {
        ...extensionValues,
        VerifyMultiSignature: { Signed: { account: ACCOUNT, signature: { [kind]: signature } } },
        ChargeAssetTxPayment: { tip: 123, assetId: { parents: 0, interior: { X1: [{ GeneralIndex: 1984 }] } } },
        CheckMetadataHash: { mode: "Enabled" },
      }, call);
      const ex = registry.createType("Extrinsic", value);
      expect(ex.isSigned).toBe(true);
      expect(ex.signer.toString()).toBe(registry.createType("AccountId", ACCOUNT).toString());
      expect(ex.signature.toHex()).toBe(signature);
      expect(ex.tip.toNumber()).toBe(123);
      expect(ex.assetId.unwrap().toJSON()).toEqual({ parents: 0, interior: { x1: [{ generalIndex: 1984 }] } });
      expect(ex.mode.toNumber()).toBe(1);
      expect(ex.metadataHash.isNone).toBe(true);
      expect(Buffer.from(ex.toU8a())).toEqual(value);
      expect(ex.hash.toHex()).toBe(registry.hash(value).toHex());
    },
  );

  test("signed v4 and bare v5 retain stock behavior", () => {
    const native = createRegistry(fixture, types);
    const stock = createRegistry(fixture, { ...types, types: { NovaAssetId: types.types.NovaAssetId } });
    const Legacy = native.createClassUnsafe<GenericExtrinsic>("GenericExtrinsic");
    const v4 = new Legacy(native, { method: call }, { version: 4 });
    v4.addSignature(ACCOUNT, native.createType("MultiSignature", { Sr25519: SIGNATURE }).toHex(),
      {
        era: "0x4607", nonce: 334, tip: 0, assetId: null, mode: 0,
        blockHash: native.createType("Hash").toHex(),
        genesisHash: native.createType("Hash").toHex(),
        method: call.toHex(), specVersion: fixture.source.specVersion, transactionVersion: 0,
      });
    const bare = envelope(native, Buffer.concat([Buffer.from([5]), call.toU8a()]));
    for (const value of [v4.toU8a(), bare]) {
      const expected = stock.createType("Extrinsic", value);
      for (const decoder of [native, registry]) {
        const ex = decoder.createType("Extrinsic", value);
        expect(ex.isGeneral()).toBe(false);
        expect(ex.isSigned).toBe(expected.isSigned);
        expect(ex.signer.toHex()).toBe(expected.signer.toHex());
        expect(ex.toHex()).toBe(expected.toHex());
        expect(ex.hash.toHex()).toBe(expected.hash.toHex());
      }
    }
  });

  test("unknown pipelines, truncated payloads and trailing bytes fail explicitly", () => {
    const offset = registry.createType("Compact<u32>", bytes).encodedLength;
    const unknown = Buffer.from(bytes);
    unknown[offset + 1] = 99;
    expect(() => registry.createType("Extrinsic", unknown)).toThrow("Unknown Asset Hub transaction extension version: 99");
    expect(() => registry.createType("Extrinsic", bytes.subarray(0, -1))).toThrow(/length less than remainder|Invalid Asset Hub/);
    const trailing = envelope(registry, Buffer.concat([bytes.subarray(offset), Buffer.from([0])]));
    expect(() => registry.createType("Extrinsic", trailing)).toThrow("length does not match its metadata");
  });
});
