import {useEffect, useState} from 'react'
import './App.css'
import Web3 from 'web3'
import {ethers} from 'ethers'
import {CONTRACT_ABI, CONTRACT_ADDRESS} from './config'
import Box from '@material-ui/core/Box'
import Grid from '@material-ui/core/Grid'
import ChatRoom from './Components/ChatRoom'
import Identicon from 'react-identicons'
import ScrollView from './Components/ScrollView'
import ScrollElement from './Components/ScrollElement'

import ChatBubble from './Components/ChatBubble'
function App() {
	const [account, setAccount] = useState()
	const [currentAccount, setCurrentAccount] = useState(null)
	const [contacts, setContacts] = useState(null)
	const [status, setStatus] = useState(null)
	const [typedMessage, setTypedMessage] = useState('')
	const [selectedReceiver, setSelectedReceiver] = useState('')
	const [latestMessage, setLatestMessage] = useState('')
	const [conversation, setConversation] = useState([])
	const [number, setNumber] = useState(Number)
	const [chatRoomList, setChatRoomList] = useState(null)
	const [contract, setContract] = useState(null)
	const [conversationBubbles, setConversationBubbles] = useState(null)
	const [isLoadingChatRoomList, setIsLoadingChatRoomList] = useState(Boolean)

	const loadContract = async () => {
		const {ethereum} = window
		if (!window.ethereum) alert('Please install Metamask!')
		const provider = new ethers.providers.Web3Provider(ethereum)
		const signer = provider.getSigner()
		const newContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
		setContract(newContract)
	}

	const loadWeb3 = async () => {
		const {ethereum} = window
		if (!ethereum) alert('Please install Metamask!')

		try {
			await window.ethereum.enable()
			const accounts = await ethereum.request({method: 'eth_accounts'})
			setCurrentAccount(accounts[0])
			console.log('accounts', accounts[0], currentAccount)
		} catch (err) {
			console.log(err)
		}

		await loadContract()
		console.log('Contract loaded:', contract)
	}

	const getAccounts = async () => {
		const {ethereum} = window
		return await ethereum.request({method: 'eth_accounts'})
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

	// 0x5E721F2a9b14A3bB3f727CF5bD2e7CdE594Abe96

	const messageIdOf = async sender => {
		sender = sender.toLowerCase()
		const thisAccount = currentAccount.toLowerCase()
		const messageId = sender == thisAccount ? 0 : 1
		return messageId
	}

	const parseTime = async time => {
		time = time.toNumber()
		time = new Date(time)
		time = `${time.getHours()}:${time.getMinutes()}`
		return time
	}

	const loadConversation = async () => {
		try {
			console.log(currentAccount, selectedReceiver)
			console.log('getting messages')
			const chatId = await contract.getChatId(currentAccount, selectedReceiver)
			const conversationLen = await contract.getConversationLen(chatId)

			const conversation = []
			for (let i = 0; i < conversationLen; i++) {
				const message = await contract.getMessage(chatId, i)
				const time = await parseTime(message.time)
				const messageId = await messageIdOf(message.sender)
				const text = {text: message.text, id: messageId, time: time}
				conversation.push(text)
				console.log(text)
			}
			setConversation(conversation)
		} catch (err) {
			console.log(err)
		}
		console.log(conversation)
		console.log('message loaded!')
	}

	const getChatRoomList = async () => {
		try {
			console.log('getting chatroom', contacts, contract)
			const chatRoomList = []
			for (let i = 0; i < contacts.length; i++) {
				const contact = contacts[i]
				console.log(contact)
				const chatId = await contract.getChatId(currentAccount, contact)
				const conversationLen = await contract.getConversationLen(chatId)
				const latestMessage = await contract.getMessage(chatId, conversationLen - 1)
				const messageId = await messageIdOf(latestMessage.sender)
				const latestTime = await parseTime(latestMessage.time)
				chatRoomList.push({
					chatId: chatId,
					latestMessage: latestMessage.text,
					messageId: messageId,
					contact: contact,
					latestTime: latestTime
				})
			}
			setChatRoomList(chatRoomList)
			console.log('ChatRoomList', chatRoomList)
		} catch (err) {
			console.log(err)
		}
	}

	const getContacts = async () => {
		try {
			console.log('Getting contact', currentAccount, contract)
			const contactsLen = await contract.getContactsLen(currentAccount)
			const contacts = []

			for (let i = 0; i < contactsLen; i++) {
				const contact = await contract.getContacts(currentAccount, i)
				contacts.push(contact)
			}
			setContacts(contacts)
			console.log('Contacts', contacts)
		} catch (err) {
			console.log(err)
		}
	}

	const getLatestMessage = async () => {
		try {
			const contactsLen = await contract.getContactsLen(currentAccount)
			const contacts = []

			for (let i = 0; i < contactsLen; i++) {
				const contact = await contract.getContacts(currentAccount, i)
				contacts.push(contact)
			}
			setContacts(contacts)
		} catch (err) {
			console.log(err)
		}
	}

	const sendMessage = async (addressTo, message) => {
		const {ethereum} = window
		try {
			if (ethereum) {
				const txn = await contract.sendMessage(addressTo, message)
				console.log('Sending message to', addressTo)
				await txn.wait()
				console.log(`Created, see transaction: https://rinkeby.etherscan.io/tx/${txn.hash}`)
				setTypedMessage('')
				await loadConversation()
				alert('Message sent!')
			}
		} catch (err) {
			console.log(err)
		}
	}

	// const getLatestMessage = async () => {
	// 	console.log('getting message')
	// 	const chatId = await getChatId(currentAccount, selectedReceiver)
	// 	const conversationLen = await getConversationLen(chatId)
	// 	const position = conversationLen - 1

	// 	const message = await getMessage(chatId, position)
	// 	setLatestMessage(message.text)
	// 	console.log(message.text)
	// }

	const loadConversationButton = () => {
		return (
			<button onClick={loadConversation} className='cta-button mint-nft-button'>
				Load Conversation
			</button>
		)
	}

	const requestConnectionButton = () => {
		return (
			<button onClick={requestConnection} className='cta-button mint-nft-button'>
				Request Connection
			</button>
		)
	}

	const getLatestMessageButton = () => {
		return <button className='cta-button mint-nft-button'>Get Latest Message</button>
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
			<button onClick={() => sendMessage(selectedReceiver, typedMessage)} className='cta-button mint-nft-button'>
				Send Message
			</button>
		)
	}

	const addButton = () => {
		return (
			<button onClick={() => setNumber(number + 1)} className='cta-button mint-nft-button'>
				Add
			</button>
		)
	}
	const getContactsButton = () => {
		return (
			<button onClick={getContacts} className='cta-button mint-nft-button'>
				Get Contacts
			</button>
		)
	}

	const chatRoomItem = (latestMessage, address) => {
		// <div style={{display: 'flex'}}>
		// 		<div style={{backgroundColor: '#decddd', padding: 10, float: 'left'}}>
		// 			<Identicon size='32' string={address} />
		// 		</div>
		// 		<div style={{backgroundColor: '#cedddd', padding: 10, float: 'left'}}>
		// 			<div style={{fontWeight: 'normal', marginBottom: 10}}>address</div>
		// 			<div style={{fontWeight: 'normal'}}>{latestMessage}</div>
		// 		</div>
		// 	</div>
		return <div>ini</div>
	}

	// const chatRoomList = () => {
	// 	const item = []
	// 	contacts.forEach(element => {
	// 		item.push(chatRoomItem())
	// 	})
	// }
	const buildConversationBubbles = () => {
		const bubbles = []
		conversation.forEach(text => {
			bubbles.push(
				<Grid item xs={12} key={text.text}>
					<ChatBubble id={text.id} text={text.text} time={text.time}></ChatBubble>
				</Grid>
			)
		})
		setConversationBubbles(bubbles)
	}

	useEffect(() => {
		getContacts()
	}, [currentAccount, contract])

	useEffect(() => {
		getChatRoomList()
	}, [contacts])

	useEffect(() => {
		loadWeb3()
	}, [])

	// useEffect(() => {
	// 	buildConversationBubbles()
	// }, [conversation])

	useEffect(() => {
		console.log('Selected receive changed:', selectedReceiver)
		loadConversation()
	}, [selectedReceiver])

	const items = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5]

	return (
		// <div>
		// 	<div>{currentAccount ? joinButton() : connectWalletButton()}</div>
		// 	<div>{currentAccount}</div>
		// </div>
		<div style={{display: 'flex', flexDirection: 'column'}}>
			<div style={{backgroundColor: '#888267', alignItems: 'center', justifyContent: 'center'}}>
				<div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', margin: 20, marginLeft: 30}}>
					<div style={{display: 'flex', alignItems: 'center'}}>
						<Identicon style={{borderRadius: '50%'}} size='40' string={'sdf'} />
					</div>
					<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 20}}>Connected To 0x5e72...be96</div>
				</div>
			</div>
			<div style={{display: 'flex', flexDirection: 'row'}}>
				<div style={{display: 'flex', flexDirection: 'column', width: '40%', height: '100%', backgroundColor: '#6F6B5A'}}>
					<div style={{display: 'flex', flexDirection: 'row', backgroundColor: '#6F6B5A', marginLeft: 25, marginTop: 6, marginBottom: 6}}>
						<div style={{display: 'flex', alignItems: 'center', backgroundColor: '#6F6B5A'}}>
							<Identicon style={{borderRadius: '50%'}} size='40' string={'sdf'} />
						</div>
						<div style={{backgroundColor: '#6F6B5A', padding: 5}}>
							<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 5}}>Address</div>
							<div style={{fontWeight: 'normal', fontSize: 12, marginLeft: 5}}>You: Yes?</div>
						</div>
					</div>
					<div style={{display: 'flex', flexDirection: 'row', backgroundColor: '#6F6B5A', marginLeft: 25, marginTop: 6, marginBottom: 6}}>
						<div style={{display: 'flex', alignItems: 'center', backgroundColor: '#6F6B5A'}}>
							<Identicon style={{borderRadius: '50%'}} size='40' string={'sdf'} />
						</div>
						<div style={{backgroundColor: '#6F6B5A', padding: 5}}>
							<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 5}}>Address</div>
							<div style={{fontWeight: 'normal', fontSize: 12, marginLeft: 5}}>You: Yes?</div>
						</div>
					</div>
					<div style={{display: 'flex', flexDirection: 'row', backgroundColor: '#6F6B5A', marginLeft: 25, marginTop: 6, marginBottom: 6}}>
						<div style={{display: 'flex', alignItems: 'center', backgroundColor: '#6F6B5A'}}>
							<Identicon style={{borderRadius: '50%'}} size='40' string={'sdf'} />
						</div>
						<div style={{backgroundColor: '#6F6B5A', padding: 5}}>
							<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 5}}>Address</div>
							<div style={{fontWeight: 'normal', fontSize: 12, marginLeft: 5}}>You: Yes?</div>
						</div>
					</div>
					<div style={{display: 'flex', flexDirection: 'row', backgroundColor: '#6F6B5A', marginLeft: 25, marginTop: 6, marginBottom: 6}}>
						<div style={{display: 'flex', alignItems: 'center', backgroundColor: '#6F6B5A'}}>
							<Identicon style={{borderRadius: '50%'}} size='40' string={'sdf'} />
						</div>
						<div style={{backgroundColor: '#6F6B5A', padding: 5}}>
							<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 5}}>Address</div>
							<div style={{fontWeight: 'normal', fontSize: 12, marginLeft: 5}}>You: Yes?</div>
						</div>
					</div>
					<div style={{display: 'flex', flexDirection: 'row', backgroundColor: '#6F6B5A', marginLeft: 25, marginTop: 6, marginBottom: 6}}>
						<div style={{display: 'flex', alignItems: 'center', backgroundColor: '#6F6B5A'}}>
							<Identicon style={{borderRadius: '50%'}} size='40' string={'sdf'} />
						</div>
						<div style={{backgroundColor: '#6F6B5A', padding: 5}}>
							<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 5}}>Address</div>
							<div style={{fontWeight: 'normal', fontSize: 12, marginLeft: 5}}>You: Yes?</div>
						</div>
					</div>
					<div style={{display: 'flex', flexDirection: 'row', backgroundColor: '#6F6B5A', marginLeft: 25, marginTop: 6, marginBottom: 6}}>
						<div style={{display: 'flex', alignItems: 'center', backgroundColor: '#6F6B5A'}}>
							<Identicon style={{borderRadius: '50%'}} size='40' string={'sdf'} />
						</div>
						<div style={{backgroundColor: '#6F6B5A', padding: 5}}>
							<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 5}}>Address</div>
							<div style={{fontWeight: 'normal', fontSize: 12, marginLeft: 5}}>You: Yes?</div>
						</div>
					</div>
					<div style={{display: 'flex', flexDirection: 'row', backgroundColor: '#6F6B5A', marginLeft: 25, marginTop: 6, marginBottom: 6}}>
						<div style={{display: 'flex', alignItems: 'center', backgroundColor: '#6F6B5A'}}>
							<Identicon style={{borderRadius: '50%'}} size='40' string={'sdf'} />
						</div>
						<div style={{backgroundColor: '#6F6B5A', padding: 5}}>
							<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 5}}>Address</div>
							<div style={{fontWeight: 'normal', fontSize: 12, marginLeft: 5}}>You: Yes?</div>
						</div>
					</div>
					<div style={{display: 'flex', flexDirection: 'row', backgroundColor: '#6F6B5A', marginLeft: 25, marginTop: 6, marginBottom: 6}}>
						<div style={{display: 'flex', alignItems: 'center', backgroundColor: '#6F6B5A'}}>
							<Identicon style={{borderRadius: '50%'}} size='40' string={'sdf'} />
						</div>
						<div style={{backgroundColor: '#6F6B5A', padding: 5}}>
							<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 5}}>Address</div>
							<div style={{fontWeight: 'normal', fontSize: 12, marginLeft: 5}}>You: Yes?</div>
						</div>
					</div>
				</div>

				<div
					style={{
						overflowY: 'scroll',
						scrollBehavior: 'smooth',
						height: 600,
						display: 'flex',
						flexDirection: 'column',
						width: '60%',
						backgroundColor: '#BFB99B'
					}}>
					<div style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-end', borderRadius: 15, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>You wanna trade some?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div
						style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-start', borderRadius: 15, minWidth: 100, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>yes?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-end', borderRadius: 15, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>You wanna trade some?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div
						style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-start', borderRadius: 15, minWidth: 100, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>yes?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-end', borderRadius: 15, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>You wanna trade some?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div
						style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-start', borderRadius: 15, minWidth: 100, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>yes?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-end', borderRadius: 15, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>You wanna trade some?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div
						style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-start', borderRadius: 15, minWidth: 100, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>yes?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-end', borderRadius: 15, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>You wanna trade some?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div
						style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-start', borderRadius: 15, minWidth: 100, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>yes?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-end', borderRadius: 15, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>You wanna trade some?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div
						style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-start', borderRadius: 15, minWidth: 100, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>yes?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-end', borderRadius: 15, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>You wanna trade some?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div
						style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-start', borderRadius: 15, minWidth: 100, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>yes?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-end', borderRadius: 15, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>You wanna trade some?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
					<div
						style={{backgroundColor: '#676D88', color: 'white', alignSelf: 'flex-start', borderRadius: 15, minWidth: 100, padding: 10, margin: 10}}>
						<div style={{fontSize: 15, fontWeight: 'normal'}}>yes?</div>
						<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:40</div>
					</div>
				</div>
			</div>
		</div>
	)

	{
		/* <div width='50%' style={{float: 'right'}}>
				<Box paddingY={1} paddingX={2} color='white' bgcolor='#676D88' borderRadius={17}>
					<div style={{fontSize: 15, fontWeight: 'normal'}}>hey</div>
					<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:50</div>
				</Box>
			</div>
			<div width='50%' style={{float: 'left'}}>
				<Box paddingY={0} paddingX={2} color='white' bgcolor='#676D88' borderRadius={17}>
					<div style={{fontSize: 15, fontWeight: 'normal'}}>hey</div>
					<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:50</div>
				</Box>
			</div>
			<div width='50%' style={{float: 'right'}}>
				<Box paddingY={1} paddingX={2} color='white' bgcolor='#676D88' borderRadius={17}>
					<div style={{fontSize: 15, fontWeight: 'normal'}}>hey</div>
					<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>23:50</div>
				</Box>
			</div> */
	}
	{
		/* <Grid container>
				<Grid item xs={6}>
					{chatRoomList &&
						chatRoomList.map(chatRoom => {
							return (
								<div key={chatRoom.contact} style={{display: 'flex'}} onClick={() => setSelectedReceiver(chatRoom.contact)}>
									<div style={{backgroundColor: '#decddd', padding: 10, float: 'left'}}>
										<Identicon size='32' string={chatRoom.contact} />
									</div>
									<div style={{backgroundColor: '#cedddd', padding: 10, float: 'left'}}>
										<div style={{fontWeight: 'normal', marginBottom: 10}}>{chatRoom.contact}</div>
										<div style={{fontWeight: 'normal'}}>
											{chatRoom.messageId == 0 ? 'You: ' : ''}
											{chatRoom.latestMessage}
										</div>
									</div>
								</div>
							)
						})}
				</Grid>
				<Grid item xs={6}>
					<div>{conversation && <ChatRoom conversation={conversation} />}</div>
					<input value={typedMessage} placeholder='Message goes here' onChange={evt => setTypedMessage(evt.target.value)} type='text' />
					<button onClick={() => sendMessage(selectedReceiver, typedMessage)}>Send</button>
				</Grid>
			</Grid> */
	}
	{
		/* // <div>
		// 	<div className='main-app'>
		// 		<h1>Decentralised Text Messaging</h1>
		// 		<div>{currentAccount ? joinButton() : connectWalletButton()}</div>
		// 		<div>{requestConnectionButton()}</div>
		// 		<div>{sendMessageButton()}</div>
		// 		<input placeholder='message' value={message} onInput={e => setMessage(e.target.value)} />
		// 		<input placeholder='selectedReceiver' value={selectedReceiver} onInput={e => setSelectedReceiver(e.target.value)} />
		// 		<div>{loadConversationButton()}</div>
		// 		<div>{getLatestMessageButton()}</div>
		// 		<div>{addButton()}</div>
		// 		<div>{getContactsButton()}</div>
		// 		<h3>{latestMessage}</h3>
		// 		<h3>{number}</h3>
		// 	</div>
		// 	<div>
		// 		<div>
		// 			<Identicon style={{borderRadius: '50%'}} size='40' string='0x5E721F2a9b14A3bB3f727CF5bD2e7CdE594Abe96' />
		// 		</div>
		// 		<div>
		// 			<div style={{fontWeight: 'normal', marginBottom: 10}}>0x5E721F2a9b14A3bB3f727CF5bD2e7CdE594Abe96</div>
		// 			<div style={{fontWeight: 'normal'}}>got some bayc lol</div>
		// 			{/* <ChatRoom conversation={conversation} /> */
	}
	// 		</div>
	// 	</div>
	// </div> */}

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
