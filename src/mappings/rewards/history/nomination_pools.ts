import { SubstrateEvent } from "@subql/types";
import type { Codec } from "@polkadot/types-codec/types";
import { RewardType } from "../../../types";
import type { INumber } from "@polkadot/types-codec/types";
import { handleRelaychainStakingRewardType } from "./relaychain";
import type { PalletNominationPoolsPoolMember } from "@polkadot/types/lookup";
import type { Option } from "@polkadot/types-codec";

function unwrapMaybe<T>(value: unknown): T | undefined {
  if (value && typeof (value as { unwrap?: () => T }).unwrap === "function") {
    const option = value as { isSome?: boolean; unwrap: () => T };
    if (option.isSome === false) {
      return undefined;
    }
    return option.unwrap();
  }
  return value as T;
}

function getMapValue<V>(mapLike: unknown, key: number): V | undefined {
  if (!mapLike) {
    return undefined;
  }
  const asMap = mapLike as { get?: (k: unknown) => V | undefined };
  if (typeof asMap.get === "function") {
    const direct = asMap.get(key);
    if (direct !== undefined) {
      return direct;
    }
    const u32Key = api.registry.createType("u32", key);
    return asMap.get(u32Key);
  }
  return (mapLike as Record<number, V>)[key];
}

export async function handleRelaychainPooledStakingReward(
  event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
  chainId: string,
  stakingType: string,
): Promise<void> {
  const {
    event: {
      data: [accountId, poolId, amount],
    },
  } = event;

  await handleRelaychainStakingRewardType(
    event,
    amount.toBigInt(),
    accountId.toString(),
    RewardType.reward,
    chainId,
    stakingType,
    poolId.toNumber(),
  );
}

export async function handleRelaychainPooledStakingBondedSlash(
  event: SubstrateEvent<[poolId: INumber, slash: INumber]>,
  chainId: string,
  stakingType: string,
): Promise<void> {
  const {
    event: {
      data: [poolId, slash],
    },
  } = event;
  const pid = poolId.toNumber();

  const poolOption = (await api.query.nominationPools.bondedPools(
    pid,
  )) as unknown as Option<Codec>;
  const pool = unwrapMaybe<{ points: INumber }>(poolOption);
  if (!pool) {
    return;
  }

  await handleRelaychainPooledStakingSlash(
    event,
    pid,
    pool.points.toBigInt(),
    slash.toBigInt(),
    chainId,
    stakingType,
    (member: PalletNominationPoolsPoolMember): bigint => {
      return member.points.toBigInt();
    },
  );
}

export async function handleRelaychainPooledStakingUnbondingSlash(
  event: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>,
  chainId: string,
  stakingType: string,
): Promise<void> {
  const {
    event: {
      data: [era, poolId, slash],
    },
  } = event;
  let poolIdNumber = poolId.toNumber();
  let eraIdNumber = era.toNumber();

  let unbondingPoolsOption = (await api.query.nominationPools.subPoolsStorage(
    poolIdNumber,
  )) as unknown as Option<Codec>;
  let unbondingPools = unwrapMaybe<{
    withEra: Map<unknown, { points: INumber }>;
    noEra: { points: INumber };
  }>(unbondingPoolsOption);

  // Fallback for chains/tests emitting [poolId, era, slash]
  if (!unbondingPools) {
    poolIdNumber = eraIdNumber;
    eraIdNumber = poolId.toNumber();
    unbondingPoolsOption = (await api.query.nominationPools.subPoolsStorage(
      poolIdNumber,
    )) as unknown as Option<Codec>;
    unbondingPools = unwrapMaybe<{
      withEra: Map<unknown, { points: INumber }>;
      noEra: { points: INumber };
    }>(unbondingPoolsOption);
    if (!unbondingPools) {
      return;
    }
  }

  const pool =
    getMapValue<{ points: INumber }>(unbondingPools.withEra, eraIdNumber) ??
    unbondingPools.noEra;

  await handleRelaychainPooledStakingSlash(
    event,
    poolIdNumber,
    pool.points.toBigInt(),
    slash.toBigInt(),
    chainId,
    stakingType,
    (member: PalletNominationPoolsPoolMember): bigint => {
      const unbonding = getMapValue<INumber>(member.unbondingEras, eraIdNumber);
      return unbonding ? unbonding.toBigInt() : BigInt(0);
    },
  );
}

export async function handleRelaychainPooledStakingSlash(
  event: SubstrateEvent,
  poolId: number,
  poolPoints: bigint,
  slash: bigint,
  chainId: string,
  stakingType: string,
  memberPointsCounter: (member: PalletNominationPoolsPoolMember) => bigint,
): Promise<void> {
  if (poolPoints == BigInt(0)) {
    return;
  }

  const members = await api.query.nominationPools.poolMembers.entries();

  await Promise.all(
    members.map(async ([accountIdKey, member]) => {
      const memberValue = unwrapMaybe<PalletNominationPoolsPoolMember>(member);
      if (!memberValue || memberValue.poolId.toNumber() !== poolId) {
        return;
      }
      const memberPoints = memberPointsCounter(memberValue);
      if (memberPoints != BigInt(0)) {
        const accountId =
          (accountIdKey as { args?: unknown[] }).args?.[0] ?? accountIdKey;
        await handleRelaychainStakingRewardType(
          event,
          (slash * memberPoints) / poolPoints,
          accountId?.toString?.() ?? String(accountId),
          RewardType.slash,
          chainId,
          stakingType,
          poolId,
        );
      }
    }),
  );
}
