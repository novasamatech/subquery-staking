import {SubstrateEvent} from "@subql/types";
import {handleNewEra, handleNewSession, POOLED_STAKING_TYPE} from "./common";
import {AlephZeroRewardCalculator} from "./rewards/AlephZero";
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

const ALEPH_ZERO_GENESIS = "0x70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0344e"
const DIRECT_STAKING_TYPE = "aleph-zero"

export async function handleAlephZeroNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        new AlephZeroRewardCalculator(validatorEraInfoDataSource),
        ALEPH_ZERO_GENESIS,
        DIRECT_STAKING_TYPE
    )
}

export async function handleAlephZeroNewSession(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();
    let mainRewardCalculator = new AlephZeroRewardCalculator(validatorEraInfoDataSource)
    let poolRewardCalculator = new NominationPoolRewardCalculator(mainRewardCalculator)

    await handleNewSession(
        validatorEraInfoDataSource,
        new AlephZeroRewardCalculator(validatorEraInfoDataSource),
        ALEPH_ZERO_GENESIS,
        DIRECT_STAKING_TYPE,
        poolRewardCalculator
    )
}


export async function handleAlephZeroStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, ALEPH_ZERO_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleAlephZeroStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, ALEPH_ZERO_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleAlephZeroPoolStakingReward(
    event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingReward(event, ALEPH_ZERO_GENESIS, POOLED_STAKING_TYPE)
}

export async function handleAlephZeroPoolStakingBondedSlash(
    event: SubstrateEvent<[poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingBondedSlash(event, ALEPH_ZERO_GENESIS, POOLED_STAKING_TYPE)
}

export async function handleAlephZeroPoolStakingUnbondingSlash(
    event: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingUnbondingSlash(event, ALEPH_ZERO_GENESIS, POOLED_STAKING_TYPE)
}