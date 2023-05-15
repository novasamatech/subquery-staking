import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {AlephZeroRewardCalculator} from "./rewards/AlephZero";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleRelaychainStakingReward, handleRelaychainStakingSlash} from "./rewards/history/relaychain";

const ALEPH_ZERO_GENESIS = "0x70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0344e"

export async function handleAlephZeroNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        new AlephZeroRewardCalculator(validatorEraInfoDataSource),
        ALEPH_ZERO_GENESIS
    )
}

export async function handleAlephZeroStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleRelaychainStakingReward(event, ALEPH_ZERO_GENESIS)
}

export async function handleAlephZeroStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
): Promise<void> {
    await handleRelaychainStakingSlash(event, ALEPH_ZERO_GENESIS)
}