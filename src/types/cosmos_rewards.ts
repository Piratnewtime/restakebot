export type cosmos_rewards = ({
	validator_address: string,
	reward: ({
		denom: string,
		amount: string
	})[]
})[]