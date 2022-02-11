export const CONTRACT_ADDRESS = '0x30E5cCd019bF5a9b0C219DC6b01F076b84d8B867'

export const CONTRACT_ABI = [
	{
		inputs: [{internalType: 'address', name: 'target', type: 'address'}],
		name: 'acceptConnection',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{internalType: 'address', name: 'a', type: 'address'},
			{internalType: 'address', name: 'b', type: 'address'}
		],
		name: 'getChatId',
		outputs: [{internalType: 'bytes', name: '', type: 'bytes'}],
		stateMutability: 'pure',
		type: 'function'
	},
	{
		inputs: [
			{internalType: 'address', name: 'from', type: 'address'},
			{internalType: 'address', name: 'to', type: 'address'}
		],
		name: 'getConnection',
		outputs: [{internalType: 'enum DecentraChat.Status', name: '', type: 'uint8'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{internalType: 'address', name: 'addr', type: 'address'},
			{internalType: 'uint256', name: 'position', type: 'uint256'}
		],
		name: 'getContacts',
		outputs: [{internalType: 'address', name: '', type: 'address'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{internalType: 'address', name: 'addr', type: 'address'}],
		name: 'getContactsLen',
		outputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{internalType: 'bytes', name: 'chatId', type: 'bytes'}],
		name: 'getConversationLen',
		outputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{internalType: 'bytes', name: 'chatId', type: 'bytes'},
			{internalType: 'uint256', name: 'position', type: 'uint256'}
		],
		name: 'getMessage',
		outputs: [
			{
				components: [
					{internalType: 'string', name: 'text', type: 'string'},
					{internalType: 'address', name: 'sender', type: 'address'},
					{internalType: 'address', name: 'receiver', type: 'address'},
					{internalType: 'uint256', name: 'time', type: 'uint256'}
				],
				internalType: 'struct DecentraChat.Message',
				name: 'message',
				type: 'tuple'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{internalType: 'address', name: 'addr', type: 'address'}],
		name: 'getStatus',
		outputs: [{internalType: 'enum DecentraChat.Status', name: '', type: 'uint8'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'join',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{internalType: 'address', name: 'target', type: 'address'}],
		name: 'requestConnection',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{internalType: 'address', name: 'to', type: 'address'},
			{internalType: 'string', name: 'message', type: 'string'}
		],
		name: 'sendMessage',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	}
]
