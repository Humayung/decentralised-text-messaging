import {useEffect, useState} from 'react'
import './App.css'
import Web3 from 'web3'
import {ethers} from 'ethers'
import {CONTRACT_ABI, CONTRACT_ADDRESS} from './config'
import Box from '@material-ui/core/Box'
import ChatBubble from './Components/ChatBubble'

function App() {
	const [account, setAccount] = useState()
	const [currentAccount, setCurrentAccount] = useState(null)
	const [status, setStatus] = useState(null)
	const [message, setMessage] = useState('')
	const [newContact, setNewContact] = useState('')
	const [receiverAddress, setReceiverAddress] = useState('')
	const [latestMessage, setLatestMessage] = useState('')

	const loadContract = async () => {
		const {ethereum} = window
		if (!window.ethereum) alert('Please install Metamask!')
		const provider = new ethers.providers.Web3Provider(ethereum)
		const signer = provider.getSigner()
		const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
		return contract
	}

	const loadWeb3 = async () => {
		const {ethereum} = window
		if (!ethereum) alert('Please install Metamask!')

		try {
			const accounts = await window.ethereum.enable()
			console.log(accounts)
			setCurrentAccount(accounts[0])
		} catch (err) {
			console.log(err)
		}
	}

	const getAccounts = async () => {
		const {ethereum} = window
		return await ethereum.request({method: 'eth_accounts'})
	}

	const mintNftHandler = async () => {
		const {ethereum} = window
		try {
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

				console.log('Initialized payment..')
				let txn = await contract.join()
				console.log('Mining... Please wait')
				await txn.wait()

				console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${txn.hash}`)
			} else {
				console.log("Ethereum doesn't exist!")
			}
		} catch (err) {
			console.log(err)
		}
	}

	const load = async () => {
		await loadWeb3()
	}

	const checkIfJoined = async () => {
		const {ethereum} = window
		try {
			if (ethereum) {
				const decentraChatContract = await loadContract()
				const accounts = await getAccounts()
				const status = await decentraChatContract.getStatus(accounts[0])
				return status
			}
		} catch (err) {
			console.log(err)
			return -1
		}
	}

	const createAccount = async () => {
		const {ethereum} = window
		try {
			if (ethereum) {
				const decentraChatContract = await loadContract()

				const status = await checkIfJoined()
				if (status == 0) {
					const txn = await decentraChatContract.join()
					console.log('Creating account...')
					await txn.wait()
					console.log(`Created, see transaction: https://rinkeby.etherscan.io/tx/${txn.hash}`)
					alert('Account created!')
				} else {
					console.log('Already joined!')
				}
			}
		} catch (err) {
			console.log(err)
		}
	}

	const requestConnection = async () => {
		const address = '0x1DEF120D0494FB6689D17eb1B7338eB139Fc249F'
		const {ethereum} = window
		try {
			if (ethereum) {
				const decentraChatContract = await loadContract()
				const txn = await decentraChatContract.requestConnection(address)
				console.log('Requesting connection to: ', address)
				await txn.wait()
				console.log(`Created, see transaction: https://rinkeby.etherscan.io/tx/${txn.hash}`)
				alert('Connection requested!')
			}
		} catch (err) {
			console.log(err)
		}
	}

	const acceptConnection = async () => {
		const address = '0x1DEF120D0494FB6689D17eb1B7338eB139Fc249F'
		const {ethereum} = window
		try {
			if (ethereum) {
				const decentraChatContract = await loadContract()
				const txn = await decentraChatContract.acceptConnection(address)
				console.log('Accepting connection from: ', address)
				await txn.wait()
				console.log(`Created, see transaction: https://rinkeby.etherscan.io/tx/${txn.hash}`)
				alert('Connection accepted!')
			}
		} catch (err) {
			console.log(err)
		}
	}

	const getContactsLen = async address => {
		const {ethereum} = window
		try {
			if (ethereum) {
				const decentraChatContract = await loadContract()
				const contactsLen = await decentraChatContract.getContactsLen(currentAccount)
				return contactsLen
			}
		} catch (err) {
			console.log(err)
			return -1
		}
	}

	const getConversationLen = async chatId => {
		const {ethereum} = window
		try {
			if (ethereum) {
				const decentraChatContract = await loadContract()
				const conversationLen = await decentraChatContract.getConversationLen(chatId)
				return conversationLen
			}
		} catch (err) {
			console.log(err)
			return -1
		}
	}

	const getChatId = async (addressA, addressB) => {
		const {ethereum} = window
		try {
			if (ethereum) {
				const decentraChatContract = await loadContract()
				const chatId = await decentraChatContract.getChatId(addressA, addressB)
				return chatId
			}
		} catch (err) {
			console.log(err)
			return -1
		}
	}

	const getMessage = async (chatId, position) => {
		const {ethereum} = window
		try {
			if (ethereum) {
				const decentraChatContract = await loadContract()
				const message = await decentraChatContract.getMessage(chatId, position)
				return message
			}
		} catch (err) {
			console.log(err)
			return -1
		}
	}

	const sendMessage = async (addressTo, message) => {
		const {ethereum} = window
		try {
			if (ethereum) {
				const decentraChatContract = await loadContract()
				const txn = await decentraChatContract.sendMessage(addressTo, message)
				console.log('Sending message to', addressTo)
				await txn.wait()
				console.log(`Created, see transaction: https://rinkeby.etherscan.io/tx/${txn.hash}`)
				alert('Message sent!')
			}
		} catch (err) {
			console.log(err)
		}
	}

	const getLatestMessage = async () => {
		console.log('getting message')
		const chatId = await getChatId(currentAccount, receiverAddress)
		const conversationLen = await getConversationLen(chatId)
		const position = conversationLen - 1

		const message = await getMessage(chatId, position)
		setLatestMessage(message.text)
		console.log(message.text)
	}

	const requestConnectionButton = () => {
		return (
			<button onClick={requestConnection} className='cta-button mint-nft-button'>
				Request Connection
			</button>
		)
	}

	const getLatestMessageButton = () => {
		return (
			<button onClick={getLatestMessage} className='cta-button mint-nft-button'>
				Get Latest Message
			</button>
		)
	}

	const connectWalletButton = () => {
		return (
			<button onClick={loadWeb3} className='cta-button connect-wallet-button'>
				ConnectWallet
			</button>
		)
	}
	const joinButton = () => {
		return (
			<button onClick={createAccount} className='cta-button mint-nft-button'>
				Join
			</button>
		)
	}

	const sendMessageButton = () => {
		return (
			<button onClick={() => sendMessage(receiverAddress, message)} className='cta-button mint-nft-button'>
				Send Message
			</button>
		)
	}

	useEffect(() => {
		load()
	}, [])

	const messages = [
		{
			type: 0,
			text: 'Hello! Good Morning!'
		},
		{
			type: 1,
			text: 'Hello! Good Afternoon!'
		}
	]

	const text =
		'how do you do? i know you from a film back then in my village then i go to the hospital with my girlfrient. Now i know why you are running so freaking fast'
	const text2 = 'how do you do? i know you from a film back then in my village then i go to'

	return (
		// <div>
		// 	<ChatBubble id={1} text={text} time='23:40'></ChatBubble>
		// 	<ChatBubble id={0} text={text2} time='23:41'></ChatBubble>
		// </div>
		<div className='main-app'>
			<h1>Decentralised Text Messaging</h1>
			<div>{currentAccount ? joinButton() : connectWalletButton()}</div>
			<div>{requestConnectionButton()}</div>
			<div>{sendMessageButton()}</div>
			<input placeholder='message' value={message} onInput={e => setMessage(e.target.value)} />
			<input placeholder='receiverAddress' value={receiverAddress} onInput={e => setReceiverAddress(e.target.value)} />
			<div>{getLatestMessageButton()}</div>
			<h3>{latestMessage}</h3>
		</div>
	)

	// useEffect(() => {
	// 	async function load() {
	// 		const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
	// 		const accounts = await web3.eth.requestAccounts();
	// 		setAccount(accounts[0]);

	// 		const contactList = new web3.eth.Contract(CONTACT_ABI, CONTACT_ADDRESS);

	// 		setContactList(contactList);

	// 		const counter = await contactList.methods.count().call();

	// 		for (var i = 1; i <= counter; i++) {
	// 			const contact = await contactList.methods.contacts(i).call();
	// 			setContacts((contacts) => [...contacts, contact]);
	// 		}
	// 	}

	// 	load();
	// }, []);

	// return (
	// 	<div>
	// 		Your account is: {account}
	// 		<h1>Contacts</h1>
	// 		<ul>
	// 			{Object.keys(contacts).map((contact, index) => (
	// 				<li key={`${contacts[index].name}-${index}`}>
	// 					<h4>{contacts[index].name}</h4>
	// 					<span>
	// 						<b>Phone: </b>
	// 						{contacts[index].phone}
	// 					</span>
	// 				</li>
	// 			))}
	// 		</ul>
	// 	</div>
	// );
}

export default App
