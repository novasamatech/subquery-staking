import {AccumulatedReward, Reward, RewardType} from "../../../types";
import {SubstrateBlock, SubstrateEvent} from "@subql/types";
import {Codec} from "@polkadot/types/types";

export interface RewardArgs {

    amount: bigint

    address: string

    type: RewardType

    chainId: string

    stakingType: string

    poolId?: number
}

export async function handleReward(rewardProps: RewardArgs, event: SubstrateEvent) {
    const accumulatedReward = await updateAccumulatedReward(rewardProps)

    let accountAddress = rewardProps.address
    let id = generateRewardId(event, rewardProps.chainId, rewardProps.stakingType)

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
    });

    if (rewardProps.poolId !== undefined) {
        accountReward.poolId = rewardProps.poolId
    }

    await accountReward.save()
}

async function updateAccumulatedReward(rewardProps: RewardArgs): Promise<AccumulatedReward> {
    let accountAddress = rewardProps.address
    let id = accumulatedRewardId(accountAddress, rewardProps.chainId, rewardProps.stakingType);

    let accumulatedReward = await AccumulatedReward.get(id);
    if (!accumulatedReward) {
        accumulatedReward = new AccumulatedReward(
            id,
            rewardProps.chainId,
            rewardProps.stakingType,
            accountAddress,
            BigInt(0),
        );
    }

    const newAmount = rewardProps.type == RewardType.reward ? rewardProps.amount : -rewardProps.amount
    accumulatedReward.amount = accumulatedReward.amount + newAmount

    await accumulatedReward.save()

    return accumulatedReward
}

function accumulatedRewardId(accountAddress: string, chainId: string, stakingType: string): string {
    return `${accountAddress}-${chainId}-${stakingType}`
}

export function generateRewardId(event: SubstrateEvent, chainId: string, stakingType: string): string {
    return `${eventId(event)}-${chainId}-${stakingType}`
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

export function getRewardData(event: SubstrateEvent): [Codec, Codec] {
    const {event: {data: innerData}} = event
    let account: Codec, amount: Codec;
    if (innerData.length == 2) {
        [account, amount] = innerData
    } else {
        [account, ,amount] = innerData
    }
    return [account, amount]
}