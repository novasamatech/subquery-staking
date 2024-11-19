import {Inflation, StakedInfo} from "./Inflation";
import {BigFromINumber} from "../../utils";

export class PolkadotStakingInflation implements Inflation {

    async from(stakedInfo: StakedInfo): Promise<number> {
        try {
            const inflationInfo = await api.call.inflation.experimentalInflationPredictionInfo()
            const nextMint = BigFromINumber((inflationInfo as any).nextMint[0])
            
            return nextMint.mul(365).div(stakedInfo.totalIssuance).toNumber()
        } catch (e) {
            logger.warn("Failed to get experimental inflation info, error: " + e)
            return 0
        }
    }
}