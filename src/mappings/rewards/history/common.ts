import {AccumulatedReward, Reward, RewardType} from "../../../types";
import {SubstrateBlock, SubstrateEvent} from "@subql/types";

export interface RewardArgs {

    amount: bigint

    address: string

    type: RewardType

    chainId: string
}

export async function handleReward(rewardProps: RewardArgs, event: SubstrateEvent) {
    const accumulatedReward = await updateAccumulatedReward(rewardProps)

    let accountAddress = rewardProps.address
    let id = eventIdWithNetworkId(event, rewardProps.chainId)

    let accountReward = Reward.create({
        id: id,
        accumulatedAmount: accumulatedReward.amount,
        address: accountAddress,
        amount: rewardProps.amount,
        type: rewardProps.type,
        timestamp: timestamp(event.block),
        blockNumber: blockNumber(event),
        networkId: rewardProps.chainId
    });

    await accountReward.save()
}

async function updateAccumulatedReward(rewardProps: RewardArgs): Promise<AccumulatedReward> {
    let accountAddress = rewardProps.address
    let id = accumulatedRewardId(accountAddress, rewardProps.chainId);

    let accumulatedReward = await AccumulatedReward.get(id);
    if (!accumulatedReward) {
        accumulatedReward = new AccumulatedReward(id);
        accumulatedReward.amount = BigInt(0)
        accumulatedReward.networkId = rewardProps.chainId
        accumulatedReward.address = accountAddress
    }

    const newAmount = rewardProps.type == RewardType.reward ? rewardProps.amount : -rewardProps.amount
    accumulatedReward.amount = accumulatedReward.amount + newAmount

    await accumulatedReward.save()

    return accumulatedReward
}

function accumulatedRewardId(accountAddress: string, chainId: string): string {
    return `${accountAddress}-${chainId}`
}

export function eventIdWithNetworkId(event: SubstrateEvent, chainId: string): string {
    return `${eventId(event)}-${chainId}`
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