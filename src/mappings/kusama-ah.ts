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

const KUSAMA_AH_GENESIS = "0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a"
const DIRECT_STAKING_TYPE = "relaychain"

// staking-async: PagedElectionProceeded is not emitted for every page on the
// success path anymore, while EraPaid still fires at every rotation and the
// just-started active era always has complete exposures in state.
export async function handleKusamaAHEraPaid(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ActiveEraValidatorEraInfoDataSource();
    let mainRewardCalculator = await RelaychainRewardCalculator(validatorEraInfoDataSource)
    let poolRewardCalculator = new NominationPoolRewardCalculator(validatorEraInfoDataSource, mainRewardCalculator)

    await handleEraAssetHub(
        validatorEraInfoDataSource,
        mainRewardCalculator,
        KUSAMA_AH_GENESIS,
        DIRECT_STAKING_TYPE,
        poolRewardCalculator
    )
}

export async function handleKusamaAHStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, KUSAMA_AH_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleKusamaAHStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, KUSAMA_AH_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleKusamaAHPoolStakingReward(
    event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingReward(event, KUSAMA_AH_GENESIS, POOLED_STAKING_TYPE)
}

export async function handleKusamaAHPoolStakingBondedSlash(
    event: SubstrateEvent<[poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingBondedSlash(event, KUSAMA_AH_GENESIS, POOLED_STAKING_TYPE)
}

export async function handleKusamaAHPoolStakingUnbondingSlash(
    event: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingUnbondingSlash(event, KUSAMA_AH_GENESIS, POOLED_STAKING_TYPE)
}