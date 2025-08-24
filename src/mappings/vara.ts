import {SubstrateEvent} from "@subql/types";
import {handleNewEra, handleNewSession, POOLED_STAKING_TYPE} from "./common";
import {RelaychainRewardCalculator} from "./rewards/Relaychain";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleRelaychainStakingReward, handleRelaychainStakingSlash} from "./rewards/history/relaychain";
import { handleRelaychainPooledStakingBondedSlash, handleRelaychainPooledStakingReward, handleRelaychainPooledStakingUnbondingSlash } from "./rewards/history/nomination_pools";

const VARA_GENESIS = "0xfe1b4c55fd4d668101126434206571a7838a8b6b93a6d1b95d607e78e6c53763"
const DIRECT_STAKING_TYPE = "relaychain"

export async function handleVaraNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        await RelaychainRewardCalculator(validatorEraInfoDataSource),
        VARA_GENESIS,
        DIRECT_STAKING_TYPE
    )
}

export async function handleVaraNewSession(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();
    let mainRewardCalculator = await RelaychainRewardCalculator(validatorEraInfoDataSource)

    await handleNewSession(
        validatorEraInfoDataSource,
        await mainRewardCalculator,
        VARA_GENESIS,
        DIRECT_STAKING_TYPE
    )
}


export async function handleVaraStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, VARA_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleVaraStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, VARA_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleVaraPoolStakingReward(
    event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingReward(event, VARA_GENESIS, POOLED_STAKING_TYPE)
}

export async function handleVaraPoolStakingBondedSlash(
    event: SubstrateEvent<[poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingBondedSlash(event, VARA_GENESIS, POOLED_STAKING_TYPE)
}

export async function handleVaraPoolStakingUnbondingSlash(
    event: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>,
): Promise<void> {
    await handleRelaychainPooledStakingUnbondingSlash(event, VARA_GENESIS, POOLED_STAKING_TYPE)
}