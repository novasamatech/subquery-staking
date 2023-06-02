import {CollatorStakingRewardCalculator} from "./CollatorStakingRewardCalculator";
import Big from "big.js";
import "@oak-network/api-augment"
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {BigFromINumber} from "../utils";
import {Inflation} from "./inflation/Inflation";
import {EraInfoDataSource} from "../era/EraInfoDataSource";

export class TuringRewardCalculator extends CollatorStakingRewardCalculator {

    constructor(inflation: Inflation, eraInfoDataSource: EraInfoDataSource) {
        super(inflation, eraInfoDataSource);
    }

    protected async fetchTotalIssuance(): Promise<Big> {
        const total = await api.query.balances.totalIssuance()

        let additional: Big
        if (api.query.vesting?.totalUnvestedAllocation) {
            const additionalINumber = await api.query.vesting.totalUnvestedAllocation()
            additional = BigFromINumber(additionalINumber as INumber)
        } else  {
            additional = Big(0)
        }

        return additional.plus(BigFromINumber(total))
    }
}