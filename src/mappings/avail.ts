import {SubstrateEvent} from "@subql/types";
import {handleNewEra, handleNewSession, POOLED_STAKING_TYPE} from "./common";
import {createRewardCurveConfig, CustomRelaychainRewardCalculator} from "./rewards/Relaychain";
import {NominationPoolRewardCalculator} from "./rewards/NominationPoolRewardCalculator";
import {ValidatorStakingRewardCalculator} from "./rewards/ValidatorStakingRewardCalculator";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";
import {EraInfoDataSource} from "./era/EraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleRelaychainStakingReward, handleRelaychainStakingSlash} from "./rewards/history/relaychain";
import {
    handleRelaychainPooledStakingReward, 
    handleRelaychainPooledStakingBondedSlash,
    handleRelaychainPooledStakingUnbondingSlash
} from "./rewards/history/nomination_pools";

const AVAIL_GENESIS = "0xd3d2f3a3495dc597434a99d7d449ebad6616db45e4e4f178f31cc6fa14378b70"
const DIRECT_STAKING_TYPE = "avail"

export async function AvailRewardCalculator(eraInfoDataSource: EraInfoDataSource): Promise<ValidatorStakingRewardCalculator> {
    const config = await createRewardCurveConfig({
        parachainReservedSupplyFraction: 0.2,
    })
    
    return CustomRelaychainRewardCalculator(eraInfoDataSource, config)
}

export async function handleAvailNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        await AvailRewardCalculator(validatorEraInfoDataSource),
        AVAIL_GENESIS,
        DIRECT_STAKING_TYPE
    )
}

export async function handleAvailNewSession(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();
    let mainRewardCalculator = await AvailRewardCalculator(validatorEraInfoDataSource)
    let poolRewardCalculator = new NominationPoolRewardCalculator(validatorEraInfoDataSource, mainRewardCalculator)

    await handleNewSession(
        validatorEraInfoDataSource,
        await mainRewardCalculator,
        AVAIL_GENESIS,
        DIRECT_STAKING_TYPE,
        poolRewardCalculator
    )
}


export async function handleAvailStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, AVAIL_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleAvailStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, AVAIL_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleAvailPoolStakingReward(
    event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingReward(event, AVAIL_GENESIS, POOLED_STAKING_TYPE)
}

export async function handleAvailPoolStakingBondedSlash(
    event: SubstrateEvent<[poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingBondedSlash(event, AVAIL_GENESIS, POOLED_STAKING_TYPE)
}

export async function handleAvailPoolStakingUnbondingSlash(
    event: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingUnbondingSlash(event, AVAIL_GENESIS, POOLED_STAKING_TYPE)
}