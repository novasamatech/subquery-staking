import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {RelaychainRewardCalculator} from "./rewards/Relaychain";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {
    handleRelaychainStakingReward, 
    handleRelaychainStakingSlash, 
    handleRelaychainPooledStakingReward, 
    handleRelaychainPooledStakingBondedSlash,
    handleRelaychainPooledStakingUnbondingSlash
} from "./rewards/history/relaychain";

const POLKADOT_GENESIS = "0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3"
const DIRECT_STAKING_TYPE = "relaychain"
const POOLED_STAKING_TYPE = "nomination-pool"

export async function handlePolkadotNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        await RelaychainRewardCalculator(validatorEraInfoDataSource),
        POLKADOT_GENESIS,
        DIRECT_STAKING_TYPE
    )
}

export async function handlePolkadotStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, POLKADOT_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handlePolkadotStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, POLKADOT_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handlePolkadotPoolStakingReward(
    event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingReward(event, POLKADOT_GENESIS, POOLED_STAKING_TYPE)
}

export async function handlePolkadotPoolStakingBondedSlash(
    event: SubstrateEvent<[poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingBondedSlash(event, POLKADOT_GENESIS, POOLED_STAKING_TYPE)
}

export async function handlePolkadotPoolStakingUnbondingSlash(
    event: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingUnbondingSlash(event, POLKADOT_GENESIS, POOLED_STAKING_TYPE)
}