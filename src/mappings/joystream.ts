import {SubstrateEvent} from "@subql/types";
import {handleNewEra, handleNewSession} from "./common";
import {createRewardCurveConfig, CustomRelaychainRewardCalculator} from "./rewards/Relaychain";
import {ValidatorStakingRewardCalculator} from "./rewards/ValidatorStakingRewardCalculator";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";
import {EraInfoDataSource} from "./era/EraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleRelaychainStakingReward, handleRelaychainStakingSlash} from "./rewards/history/relaychain";

const JOYSTREAM_GENESIS = "0x6b5e488e0fa8f9821110d5c13f4c468abcd43ce5e297e62b34c53c3346465956"
const DIRECT_STAKING_TYPE = "relaychain"

export async function JoystreamRewardCalculator(eraInfoDataSource: EraInfoDataSource): Promise<ValidatorStakingRewardCalculator> {
    const config = await createRewardCurveConfig({
        maxInflation : 0.03,
        minInflation : 0.007,
    })
    
    return CustomRelaychainRewardCalculator(eraInfoDataSource, config)
}

export async function handleJoystreamNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        await JoystreamRewardCalculator(validatorEraInfoDataSource),
        JOYSTREAM_GENESIS,
        DIRECT_STAKING_TYPE
    )
}

export async function handleJoystreamNewSession(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();
    let mainRewardCalculator = await JoystreamRewardCalculator(validatorEraInfoDataSource)

    await handleNewSession(
        validatorEraInfoDataSource,
        await mainRewardCalculator,
        JOYSTREAM_GENESIS,
        DIRECT_STAKING_TYPE
    )
}


export async function handleJoystreamStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, JOYSTREAM_GENESIS, DIRECT_STAKING_TYPE)
}

export async function handleJoystreamStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, JOYSTREAM_GENESIS, DIRECT_STAKING_TYPE)
}