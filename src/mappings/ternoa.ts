import {SubstrateEvent} from "@subql/types";
import {handleNewEra, handleNewSession} from "./common";
import {RelaychainRewardCalculator} from "./rewards/Relaychain";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleRelaychainStakingReward, handleRelaychainStakingSlash} from "./rewards/history/relaychain";

const TERNOA_GENESIS = "0x6859c81ca95ef624c9dfe4dc6e3381c33e5d6509e35e147092bfbc780f777c4e"
const STAKING_TYPE = "relaychain"

export async function handleTernoaNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        await RelaychainRewardCalculator(validatorEraInfoDataSource),
        TERNOA_GENESIS,
        STAKING_TYPE
    )
}

export async function handleTernoaNewSession(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewSession(
        validatorEraInfoDataSource,
        await RelaychainRewardCalculator(validatorEraInfoDataSource),
        TERNOA_GENESIS,
        STAKING_TYPE
    )
}

export async function handleTernoaStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, TERNOA_GENESIS, STAKING_TYPE)
}

export async function handleTernoaStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, TERNOA_GENESIS, STAKING_TYPE)
}