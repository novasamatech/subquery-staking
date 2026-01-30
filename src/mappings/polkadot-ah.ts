import {SubstrateEvent} from "@subql/types";
import {handleEraAssetHub, POOLED_STAKING_TYPE} from "./common";
import {CustomPolkadotRewardCalculator} from "./rewards/Relaychain";
import {NominationPoolRewardCalculator} from "./rewards/NominationPoolRewardCalculator";
import {ValidatorStakingRewardCalculator} from "./rewards/ValidatorStakingRewardCalculator";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";
import {EraInfoDataSource} from "./era/EraInfoDataSource";
import type {Codec} from "@polkadot/types-codec/types";
import type {INumber} from "@polkadot/types-codec/types";
import {handleRelaychainStakingReward, handleRelaychainStakingSlash} from "./rewards/history/relaychain";
import {
    handleRelaychainPooledStakingReward, 
    handleRelaychainPooledStakingBondedSlash,
    handleRelaychainPooledStakingUnbondingSlash
} from "./rewards/history/nomination_pools";
import {shouldProcessPageIndex} from "./utils";

const POLKADOT_AH_GENESIS = "0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f"
const DIRECT_STAKING_TYPE = "relaychain"

export async function PolkadotAHRewardCalculator(eraInfoDataSource: EraInfoDataSource): Promise<ValidatorStakingRewardCalculator> {

    return CustomPolkadotRewardCalculator(eraInfoDataSource)
}

export async function handlePolkadotAHPagedElectionProceeded(event: SubstrateEvent): Promise<void> {
    if (!shouldProcessPageIndex(event)) {
        return;
    }
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();
    let mainRewardCalculator = await PolkadotAHRewardCalculator(validatorEraInfoDataSource)
    let poolRewardCalculator = new NominationPoolRewardCalculator(validatorEraInfoDataSource, mainRewardCalculator)

    await handleEraAssetHub(
        validatorEraInfoDataSource,
        mainRewardCalculator,
        POLKADOT_AH_GENESIS,
        DIRECT_STAKING_TYPE,
        poolRewardCalculator
    )
}

export async function handlePolkadotAHStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, POLKADOT_AH_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handlePolkadotAHStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, POLKADOT_AH_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handlePolkadotAHPoolStakingReward(
    event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingReward(event, POLKADOT_AH_GENESIS, POOLED_STAKING_TYPE)
}

export async function handlePolkadotAHPoolStakingBondedSlash(
    event: SubstrateEvent<[poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingBondedSlash(event, POLKADOT_AH_GENESIS, POOLED_STAKING_TYPE)
}

export async function handlePolkadotAHPoolStakingUnbondingSlash(
    event: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingUnbondingSlash(event, POLKADOT_AH_GENESIS, POOLED_STAKING_TYPE)
}