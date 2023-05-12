import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {AlephZeroRewardCalculator} from "./rewards/AlephZero";
import {ValidatorEraInfoDataSource} from "./era/ValidatorEraInfoDataSource";

export async function handleAlephZeroNewEra(_: SubstrateEvent): Promise<void> {
    let validatorEraInfoDataSource = new ValidatorEraInfoDataSource();

    await handleNewEra(
        validatorEraInfoDataSource,
        new AlephZeroRewardCalculator(validatorEraInfoDataSource),
    )
}
