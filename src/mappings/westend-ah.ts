import {SubstrateEvent} from "@subql/types";
import {handleEraAssetHub, POOLED_STAKING_TYPE} from "./common";
import {RelaychainRewardCalculator} from "./rewards/Relaychain";
import {NominationPoolRewardCalculator} from "./rewards/NominationPoolRewardCalculator";
import {ActiveEraValidatorEraInfoDataSource} from "./era/ActiveEraValidatorEraInfoDataSource";
import type {Codec} from "@polkadot/types-codec/types";
import type {INumber} from "@polkadot/types-codec/types";
import {handleRelaychainStakingReward, handleRelaychainStakingSlash} from "./rewards/history/relaychain";
import {
    handleRelaychainPooledStakingReward, 
    handleRelaychainPooledStakingBondedSlash,
    handleRelaychainPooledStakingUnbondingSlash
} from "./rewards/history/nomination_pools";

const WESTEND_AH_GENESIS = "0x67f9723393ef76214df0118c34bbbd3dbebc8ed46a10973a8c969d48fe7598c9"
const DIRECT_STAKING_TYPE = "relaychain"

// staking-async: PagedElectionProceeded is not emitted for every page on the success
// path anymore, while EraPaid fires at every rotation and the just-started active era
// always has complete exposures in state - see ActiveEraValidatorEraInfoDataSource for
// the polkadot-sdk reference and details.
export async function handleWestendAHEraPaid(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ActiveEraValidatorEraInfoDataSource();
    let mainRewardCalculator = await RelaychainRewardCalculator(validatorEraInfoDataSource)
    let poolRewardCalculator = new NominationPoolRewardCalculator(validatorEraInfoDataSource, mainRewardCalculator)

    await handleEraAssetHub(
        validatorEraInfoDataSource,
        mainRewardCalculator,
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