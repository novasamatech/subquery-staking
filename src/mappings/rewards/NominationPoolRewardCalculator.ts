import {RewardCalculator} from "./RewardCalculator";
import {EraInfoDataSource} from "../era/EraInfoDataSource";
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
    private readonly eraInfoDataSource: EraInfoDataSource

    constructor(eraInfoDataSource: EraInfoDataSource, relayChainRewardCalculator: ValidatorStakingRewardCalculator) {
        this.mainRewardCalculator = relayChainRewardCalculator
        this.eraInfoDataSource = eraInfoDataSource
    }

    async maxApy(): Promise<number> {
        const stakersApy = await this.mainRewardCalculator.getStakersApy()
        const eraStakers = await this.eraInfoDataSource.eraStakers()
        const pools = await api.query.nominationPools.bondedPools.entries()
        const poolsCommission = new Map<string, number>(await Promise.all(pools.map(async ([poolId, poolDataOption]) => {
            const poolAddress = this.derivePoolAccount(poolId.args[0].toNumber(), 0).toString()

            let poolCommission = 0
            const poolData = poolDataOption.unwrap()
            if (poolData["commission"] !== undefined && poolData["commission"]["current"].isSome) {
                poolCommission = PerbillToNumber(poolData["commission"]["current"].unwrap()[0])
            }

            return [poolAddress, poolCommission] as [string, number]
        })))
        const maxApy = eraStakers.reduce(
            (accumulator, stakeTarget) => {
                const stakerApy = stakersApy.get(stakeTarget.address) ?? 0
                
                return Math.max(accumulator, stakeTarget.others.reduce(
                    (innerAccumulator, staker) => {
                        if (poolsCommission.has(staker.address)) {
                            return Math.max(innerAccumulator, (1 - poolsCommission.get(staker.address)) * stakerApy)
                        } else {
                            return innerAccumulator
                        }
                    },
                    0
                ))
            },
            0
        )

        return maxApy
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