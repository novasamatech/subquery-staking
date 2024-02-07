import {SubstrateEvent} from "@subql/types";
import {handleNewEra, handleNewSession} from "./common";
import {RelaychainRewardCalculator} from "./rewards/Relaychain";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleRelaychainStakingReward, handleRelaychainStakingSlash} from "./rewards/history/relaychain";

const DOCK_GENESIS = "0x6bfe24dca2a3be10f22212678ac13a6446ec764103c0f3471c71609eac384aae"
const DIRECT_STAKING_TYPE = "relaychain"

export async function handleDockNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        await RelaychainRewardCalculator(validatorEraInfoDataSource),
        DOCK_GENESIS,
        DIRECT_STAKING_TYPE
    )
}

export async function handleDockNewSession(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();
    let mainRewardCalculator = await RelaychainRewardCalculator(validatorEraInfoDataSource)

    await handleNewSession(
        validatorEraInfoDataSource,
        await mainRewardCalculator,
        DOCK_GENESIS,
        DIRECT_STAKING_TYPE
    )
}


export async function handleDockStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, DOCK_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleDockStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, DOCK_GENESIS, DIRECT_STAKING_TYPE)
}