import {AccumulatedReward, Reward, RewardSource, RewardType} from "../../../types";
import {SubstrateBlock, SubstrateEvent} from "@subql/types";

export interface RewardArgs {

    amount: bigint

    address: string

    type: RewardType

    chainId: string

    stakingType: string

    source: RewardSource

    poolId?: number
}

export async function handleReward(rewardProps: RewardArgs, event: SubstrateEvent) {
    const accumulatedReward = await updateAccumulatedReward(rewardProps)

    let accountAddress = rewardProps.address
    let id = generateRewardId(event, rewardProps.chainId, rewardProps.stakingType, rewardProps.source)

    let accountReward = Reward.create({
        id: id,
        accumulatedAmount: accumulatedReward.amount,
        address: accountAddress,
        amount: rewardProps.amount,
        type: rewardProps.type,
        timestamp: timestamp(event.block),
        blockNumber: blockNumber(event),
        networkId: rewardProps.chainId,
        stakingType: rewardProps.stakingType,
        source: rewardProps.source
    });

    if (rewardProps.poolId !== undefined) {
        accountReward.poolId = rewardProps.poolId
    }

    await accountReward.save()
}

async function updateAccumulatedReward(rewardProps: RewardArgs): Promise<AccumulatedReward> {
    let accountAddress = rewardProps.address
    let id = accumulatedRewardId(accountAddress, rewardProps.chainId, rewardProps.stakingType, rewardProps.source);

    let accumulatedReward = await AccumulatedReward.get(id);
    if (!accumulatedReward) {
        accumulatedReward = new AccumulatedReward(id);
        accumulatedReward.amount = BigInt(0)
        accumulatedReward.networkId = rewardProps.chainId
        accumulatedReward.stakingType = rewardProps.stakingType
        accumulatedReward.address = accountAddress
        accumulatedReward.source = rewardProps.source
    }

    const newAmount = rewardProps.type == RewardType.reward ? rewardProps.amount : -rewardProps.amount
    accumulatedReward.amount = accumulatedReward.amount + newAmount

    await accumulatedReward.save()

    return accumulatedReward
}

function accumulatedRewardId(accountAddress: string, chainId: string, stakingType: string, source: string): string {
    return `${accountAddress}-${chainId}-${stakingType}-${source}`
}

export function generateRewardId(event: SubstrateEvent, chainId: string, stakingType: string, source: string): string {
    return `${eventId(event)}-${chainId}-${stakingType}-${source}`
}
export function eventId(event: SubstrateEvent): string {
    return `${blockNumber(event)}-${event.idx}`
}

export function blockNumber(event: SubstrateEvent): number {
    return event.block.block.header.number.toNumber()
}

export function timestamp(block: SubstrateBlock): bigint {
    return BigInt(Math.round(block.timestamp ? block.timestamp.getTime() / 1000 : -1))
}