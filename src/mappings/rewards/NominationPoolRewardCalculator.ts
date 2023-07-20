import {RewardCalculator} from "./RewardCalculator";
import {ValidatorStakingRewardCalculator} from "./ValidatorStakingRewardCalculator";
import { bnToU8a, stringToU8a, u8aConcat } from '@polkadot/util';
import {max} from "../utils";

const EMPTY_H256 = new Uint8Array(32);
const MOD_PREFIX = stringToU8a('modl');
const U32_OPTS = { bitLength: 32, isLe: true };

export class NominationPoolRewardCalculator implements RewardCalculator {

    private readonly mainRewardCalculator: ValidatorStakingRewardCalculator

    constructor(relayChainRewardCalculator: ValidatorStakingRewardCalculator) {
        this.mainRewardCalculator = relayChainRewardCalculator
    }

    async maxApy(): Promise<number> {
        const stakersApy = await this.mainRewardCalculator.getStakersApy()
        const pools = await api.query.nominationPools.bondedPools.entries()
        const poolsApy = await Promise.all(pools.map(async ([poolId, poolData]) => {
            logger.error(`${poolId.args[0].toNumber()}`)
            const poolAddress = this.derivePoolAccount(poolId.args[0].toNumber(), 0)
            logger.error(`${poolAddress}`)

            logger.error(`${poolData}`)
            const poolCommission = 0 // poolData.unwrap()["commission"].current ?? 0 
            logger.error(`${poolCommission}`)

            const poolActiveNominations = (await api.query.staking.nominators(poolAddress)).unwrap()
            logger.error(`${poolActiveNominations.targets}`)
            let poolAPY = max(poolActiveNominations.targets.map((stakeTargetId) => stakersApy[stakeTargetId.toString()]))
            logger.error(`${poolAPY}`)
            
            return (1 - poolCommission) * poolAPY
        }))

        return max(poolsApy)
    }

    private derivePoolAccount(poolId: number, accountType: number) : string {
        let palletId = api.consts.nominationPools.palletId.toU8a();

        return api.registry.createType('AccountId32', u8aConcat(
            MOD_PREFIX,
            palletId,
            new Uint8Array([accountType]),
            bnToU8a(poolId, U32_OPTS),
            EMPTY_H256
          )).toString();
    }
    
}