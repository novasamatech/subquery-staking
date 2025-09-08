import {SubstrateEvent} from "@subql/types";
import {handleNewEra, handleNewSession, POOLED_STAKING_TYPE} from "./common";
import {RelaychainRewardCalculator} from "./rewards/Relaychain";
import {NominationPoolRewardCalculator} from "./rewards/NominationPoolRewardCalculator";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleRelaychainStakingReward, handleRelaychainStakingSlash} from "./rewards/history/relaychain";
import {
    handleRelaychainPooledStakingReward, 
    handleRelaychainPooledStakingBondedSlash,
    handleRelaychainPooledStakingUnbondingSlash
} from "./rewards/history/nomination_pools";

const WESTEND_AH_GENESIS = "0x67f9723393ef76214df0118c34bbbd3dbebc8ed46a10973a8c969d48fe7598c9"
const DIRECT_STAKING_TYPE = "relaychain"

export async function handleWestendAHNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        await RelaychainRewardCalculator(validatorEraInfoDataSource),
        WESTEND_AH_GENESIS,
        DIRECT_STAKING_TYPE
    )
}

export async function handleWestendAHNewSession(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();
    let mainRewardCalculator = await RelaychainRewardCalculator(validatorEraInfoDataSource)
    let poolRewardCalculator = new NominationPoolRewardCalculator(validatorEraInfoDataSource, mainRewardCalculator)

    await handleNewSession(
        validatorEraInfoDataSource,
        await mainRewardCalculator,
        WESTEND_AH_GENESIS,
        DIRECT_STAKING_TYPE,
        poolRewardCalculator
    )
}

export async function handleWestendAHStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, WESTEND_AH_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleWestendAHStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, WESTEND_AH_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleWestendAHPoolStakingReward(
    event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingReward(event, WESTEND_AH_GENESIS, POOLED_STAKING_TYPE)
}

export async function handleWestendAHPoolStakingBondedSlash(
    event: SubstrateEvent<[poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingBondedSlash(event, WESTEND_AH_GENESIS, POOLED_STAKING_TYPE)
}

export async function handleWestendAHPoolStakingUnbondingSlash(
    event: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingUnbondingSlash(event, WESTEND_AH_GENESIS, POOLED_STAKING_TYPE)
}