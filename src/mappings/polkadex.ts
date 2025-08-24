import {SubstrateEvent} from "@subql/types";
import {handleNewEra, handleNewSession, POOLED_STAKING_TYPE} from "./common";
import {RelaychainRewardCalculator} from "./rewards/Relaychain";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleRelaychainStakingReward, handleRelaychainStakingSlash} from "./rewards/history/relaychain";
import { handleRelaychainPooledStakingBondedSlash, handleRelaychainPooledStakingReward, handleRelaychainPooledStakingUnbondingSlash } from "./rewards/history/nomination_pools";

const POLKADEX_GENESIS = "0x3920bcb4960a1eef5580cd5367ff3f430eef052774f78468852f7b9cb39f8a3c"
const STAKING_TYPE = "relaychain"

export async function handlePolkadexNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        await RelaychainRewardCalculator(validatorEraInfoDataSource),
        POLKADEX_GENESIS,
        STAKING_TYPE
    )
}

export async function handlePolkadexNewSession(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewSession(
        validatorEraInfoDataSource,
        await RelaychainRewardCalculator(validatorEraInfoDataSource),
        POLKADEX_GENESIS,
        STAKING_TYPE
    )
}

export async function handlePolkadexStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, POLKADEX_GENESIS, STAKING_TYPE)
}

export async function handlePolkadexStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, POLKADEX_GENESIS, STAKING_TYPE)
}

export async function handlePolkadexPoolStakingBondedSlash(
    event: SubstrateEvent<[poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingBondedSlash(event, POLKADEX_GENESIS, POOLED_STAKING_TYPE)
}

export async function handlePolkadexPoolStakingUnbondingSlash(
    event: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingUnbondingSlash(event, POLKADEX_GENESIS, POOLED_STAKING_TYPE)
}

export async function handlePolkadexPoolStakingReward(
    event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingReward(event, POLKADEX_GENESIS, POOLED_STAKING_TYPE)
}
