import { AccumulatedReward, Reward, RewardType } from '../src/types';
import { handleRelaychainPooledStakingBondedSlash } from "../src/mappings/rewards/history/relaychain"
import { SubstrateTestEventBuilder, mockNumber, mockAddress } from "./utils/mockFunctions"


const MOCK_GENESIS = "0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe"
const DIRECT_STAKING_TYPE = "relaychain"
const POOLED_STAKING_TYPE = "nomination-pool"

const mockBondedPools = {
	42: {
		unwrap : function() {
			return {points: mockNumber(1000)}
		}
	}
}

// Mock the API object using Jest
let mockAPI = {
	queryMulti: jest.fn((data) => {return data}),
	query: {
		staking: {
			payee: {
				isStaked: true,
			}
		},
		nominationPools: {
			bondedPools: async function(poolId) {
				return mockBondedPools[poolId]
			},

			poolMembers: {
				entries: async function() {
					return [
						[
							mockAddress("JHXFqYWQFFr5RkHVzviRiKhY7tutyGcYQb6kUyoScSir862"),
							{
								points: mockNumber(100)
							}
						]
					]
				}
			}
		}
	},
};

describe('handlePoolBondedSlash', () => {
	let rewardEvent
	let poolId
	let slashAmount

	beforeAll(() => {
		(global as any).api = mockAPI;
		poolId = mockNumber(42)
		slashAmount = mockNumber(1000)

		rewardEvent = new SubstrateTestEventBuilder().buildEventForPoolSlashed(poolId, slashAmount)
	});

	it('Slash for account calculated correctly', async () => {
		jest.spyOn(AccumulatedReward, "get").mockResolvedValue(undefined)
		jest.spyOn(AccumulatedReward.prototype, "save").mockImplementation(function (this: AccumulatedReward) {
			console.log(this)
			return Promise.resolve()
		})
		jest.spyOn(Reward.prototype, "save").mockImplementation(function (this: Reward) {
			expect(this.amount).toBe(BigInt(100))
			return Promise.resolve()
		})

		await handleRelaychainPooledStakingBondedSlash(rewardEvent, MOCK_GENESIS, POOLED_STAKING_TYPE);
	});
});