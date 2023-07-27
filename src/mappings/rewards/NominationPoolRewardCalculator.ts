import {RewardCalculator} from "./RewardCalculator";
import {ValidatorStakingRewardCalculator} from "./ValidatorStakingRewardCalculator";
import { bnToU8a, stringToU8a, u8aConcatStrict } from '@polkadot/util';
import {max} from "../utils";
import { u8aToHex } from "@polkadot/util";
import { AccountId32 } from "@polkadot/types/interfaces";
import { PerbillToNumber } from "../utils"

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
        const poolsApy = await Promise.all(pools.map(async ([poolId, poolDataOption]) => {
            const poolAddress = this.derivePoolAccount(poolId.args[0].toNumber(), 0)

            let poolCommission = 0
            const poolData = poolDataOption.unwrap()
            if (poolData["commission"] !== undefined && poolData["commission"]["current"].isSome) {
                poolCommission = PerbillToNumber(poolData["commission"]["current"].unwrap()[0])
            }

            const poolActiveNominations = (await api.query.staking.nominators(poolAddress))
            if (poolActiveNominations.isSome) {
                let poolAPY = max(poolActiveNominations.unwrap().targets.map((stakeTargetId) => stakersApy.get(stakeTargetId.toString()) ?? 0))                
                return (1 - poolCommission) * poolAPY
            } else {
                return 0
            }
            
        }))

        return max(poolsApy)
    }

    private derivePoolAccount(poolId: number, accountType: number) : AccountId32 {
        let palletId = api.consts.nominationPools.palletId.toU8a();
        return api.registry.createType('AccountId32', u8aToHex(u8aConcatStrict([
            MOD_PREFIX,
            palletId,
            new Uint8Array([accountType]),
            bnToU8a(poolId, U32_OPTS),
            EMPTY_H256
        ])));
    }
    
}