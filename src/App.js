import {useEffect, useState} from 'react'
import './App.css'
import Web3 from 'web3'
import {ethers} from 'ethers'
import {CONTRACT_ABI, CONTRACT_ADDRESS} from './config'
import Box from '@material-ui/core/Box'
import Grid from '@material-ui/core/Grid'
import Identicon from 'react-identicons'
import SendIcon from './img/send-icon.svg'
import EmojiIcon from './img/emoji-icon.svg'
import SearchIcon from './img/search-icon.svg'
import PlusIcon from './img/plus-icon.svg'
import ChatBubble from './Components/ChatBubble'
import Popup from './Components/popup/popup'
import {ToastContainer, toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ReactLoading from 'react-loading'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
function App() {
	const [currentAccount, setCurrentAccount] = useState(null)
	const [contacts, setContacts] = useState([])
	const [typedMessage, setTypedMessage] = useState('')
	const [selectedReceiver, setSelectedReceiver] = useState('')
	const [conversation, setConversation] = useState([])
	const [chatRoomList, setChatRoomList] = useState([])
	const [contract, setContract] = useState(null)
	const [indexOfLastMessage, setIndexOfLastMessage] = useState(0)
	const [indexOfLastChatRoom, setIndexOfLastChatRoom] = useState(0)
	const [indexOfLastContact, setIndexOfLastChatContact] = useState(0)
	const [addContactShoModal, setShowModal] = useState(false)
	const [joinShowModal, setJoinShowModal] = useState(false)
	const [typedNewContact, setTypedNewContact] = useState('')
	const [chatRoomLoading, setChatRoomLoading] = useState(true)

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
				const accounts = await getAccounts()
				const status = await contract.getStatus(accounts[0])
				if (status == 0) setJoinShowModal(true)
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
				const txn = await contract.join()
				console.log('Creating account...')
				await toast.promise(txn.wait(), {
					pending: 'Creating account',
					success: 'Account created!',
					error: 'Failed creating account!'
				})
				console.log(`Created, see transaction: https://rinkeby.etherscan.io/tx/${txn.hash}`)
				console.log('Account created')
				setJoinShowModal(false)
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
		return new Promise(async resolve => {
			try {
				console.log(currentAccount, selectedReceiver)
				console.log('getting messages')
				const chatId = await contract.getChatId(currentAccount, selectedReceiver)
				const conversationLen = await contract.getConversationLen(chatId)
				console.log('lastMessage', indexOfLastMessage)
				const newConversation = []
				for (let i = indexOfLastMessage; i < conversationLen; i++) {
					const message = await contract.getMessage(chatId, i)
					const time = await parseTime(message.time)
					const messageId = await messageIdOf(message.sender)
					const text = {text: message.text, id: messageId, time: time}
					newConversation.push(text)
					console.log(text)
				}
				console.log('newConversation', newConversation)
				setIndexOfLastMessage(Math.max(conversationLen, 0))
				setConversation(oldConversation => [...oldConversation, ...newConversation])
				resolve('loaded')
				console.log(conversation)
				console.log('message loaded!')
			} catch (err) {
				console.log(err)
			}
		})
	}

	const getChatRoomList = async () => {
		try {
			setChatRoomLoading(true)
			console.log('getting chatroom', contacts, contract)
			const newChatRoomList = []
			console.log('lastChatRoom', indexOfLastChatRoom)
			for (let i = indexOfLastChatRoom; i < contacts.length; i++) {
				console.log('iii', i)
				const contact = contacts[i]
				console.log(contact)
				const chatId = await contract.getChatId(currentAccount, contact)
				const conversationLen = await contract.getConversationLen(chatId)
				let latestMessage = ''
				let messageId = ''
				let latestTime = ''
				if (conversationLen > 0) {
					latestMessage = await contract.getMessage(chatId, conversationLen - 1)
					messageId = await messageIdOf(latestMessage.sender)
					latestTime = await parseTime(latestMessage.time)
				}

				newChatRoomList.push({
					chatId: chatId,
					latestMessage: latestMessage.text,
					messageId: messageId,
					contact: contact,
					latestTime: latestTime
				})
			}
			setIndexOfLastChatRoom(Math.max(contacts.length, 0))
			setChatRoomList(oldChatRoomList => [...oldChatRoomList, ...newChatRoomList])
			console.log('ChatRoomList', newChatRoomList)
			setChatRoomLoading(false)
		} catch (err) {
			console.log(err)
		}
	}

	const getContacts = async () => {
		try {
			console.log('Getting contact', currentAccount, contract)
			const contactsLen = await contract.getContactsLen(currentAccount)
			const newContacts = []

			for (let i = indexOfLastContact; i < contactsLen; i++) {
				const contact = await contract.getContacts(currentAccount, i)
				newContacts.push(contact)
			}
			setIndexOfLastChatContact(Math.max(contactsLen, 0))
			setContacts(oldContacts => [...oldContacts, ...newContacts])
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
			if (message == '') return
			if (ethereum) {
				const txn = await contract.sendMessage(addressTo, message)
				console.log('Sending message to', addressTo)
				await toast.promise(txn.wait(), {
					pending: 'Sending message',
					success: 'Message sent!',
					error: 'Failed sending message!'
				})
				console.log(`Created, see transaction: https://rinkeby.etherscan.io/tx/${txn.hash}`)
				setTypedMessage('')

				await toast.promise(loadConversation(), {
					pending: 'Updating conversation',
					success: 'Conversation updated!',
					error: 'Failed updating conversation!'
				})
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
	//
	const addContact = async () => {
		const {ethereum} = window
		try {
			if (ethereum) {
				const txn = await contract.requestConnection(typedNewContact)
				console.log('Requesting connection to: ', typedNewContact)
				await toast.promise(txn.wait(), {
					pending: 'Adding contact',
					success: 'Contact requested!',
					error: 'Failed adding contact!'
				})
				console.log(`Created, see transaction: https://rinkeby.etherscan.io/tx/${txn.hash}`)
				await getChatRoomList()
				console.log('connection requested!')
				setShowModal(false)
			}
		} catch (err) {
			console.log(err)
		}
	}

	const connectedAccount = () => {
		if (currentAccount) {
			const shorten =
				'Connected ' + currentAccount.substring(0, 7) + '...' + currentAccount.substring(currentAccount.length - 5, currentAccount.length)
			return shorten
		} else {
			return 'Not connected'
		}
	}

	useEffect(() => {
		checkIfJoined()
	}, [contract, currentAccount])

	useEffect(() => {
		getContacts()
	}, [currentAccount, contract])

	useEffect(() => {
		console.log('contactss', contacts)
		getChatRoomList()
	}, [contacts])

	useEffect(() => {
		loadWeb3()
	}, [])

	const showToast = message => {
		console.log('toasted')
		toast.info('message', {
			position: 'top-right',
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined
		})
	}

	// useEffect(() => {
	// 	buildConversationBubbles()
	// }, [conversation])

	useEffect(() => {
		console.log('Selected receive changed:', selectedReceiver)
		if (selectedReceiver) {
			toast.promise(loadConversation(), {
				pending: 'Updating conversation',
				success: 'Conversation updated!',
				error: 'Failed updating conversation!'
			})
		}
	}, [selectedReceiver])

	return (
		<div style={{display: 'flex', flexDirection: 'column'}}>
			<ToastContainer autoClose={2000} />
			{addContactShoModal && (
				<Popup
					content={
						<>
							<div style={{color: 'white', textAlign: 'center', fontSize: 20, marginBottom: 20, marginTop: 10}}>Enter rinkeby ethereum address</div>
							<div>
								<Box
									style={{display: 'flex', backgroundColor: 'transparent', padding: 10, borderRadius: 10, marginBottom: 50}}
									border={2}
									borderColor='#6E6B5A'>
									<TextField
										style={{
											width: '100%',
											backgroundColor: 'transparent',
											color: 'white'
										}}
										value={typedNewContact}
										placeholder='Address'
										onChange={evt => setTypedNewContact(evt.target.value)}
										type='text'
									/>
								</Box>
							</div>
							<div style={{display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'flex-end'}}>
								<Button
									onClick={() => setShowModal(false)}
									style={{
										backgroundColor: '#6E6B5A',
										color: 'white',
										fontSize: 15,
										borderRadius: 10,
										padding: 5,
										paddingLeft: 15,
										paddingRight: 15,
										marginRight: 15
									}}>
									CANCEL
								</Button>
								<Button
									onClick={() => addContact()}
									style={{backgroundColor: '#6E6B5A', color: 'white', fontSize: 15, borderRadius: 10, padding: 5, paddingLeft: 30, paddingRight: 30}}>
									ADD
								</Button>
							</div>
						</>
					}
					handleClose={() => setShowModal(false)}
				/>
			)}
			{joinShowModal && (
				<Popup
					content={
						<>
							<div style={{color: 'white', textAlign: 'center', fontSize: 20, marginBottom: 20, marginTop: 10}}>Click to create account</div>
							<Button
								onClick={() => createAccount()}
								style={{
									backgroundColor: '#6E6B5A',
									color: 'white',
									fontSize: 15,
									borderRadius: 10,
									padding: 5,
									paddingLeft: 30,
									paddingRight: 30,
									marginBottom: 20
								}}>
								Create Account
							</Button>
						</>
					}
					handleClose={() => setShowModal(false)}
				/>
			)}
			<div style={{backgroundColor: '#888267', alignItems: 'center', justifyContent: 'center'}}>
				<div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', margin: 20, marginLeft: 30}}>
					<div style={{display: 'flex', alignItems: 'center'}}>
						<Identicon style={{borderRadius: '50%'}} size='40' string={currentAccount} />
					</div>
					<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 20}}>{connectedAccount()}</div>
					<div style={{alignSelf: 'center', marginLeft: 160}} onClick={() => setShowModal(true)}>
						<img src={PlusIcon} />
					</div>
				</div>
			</div>
			<div style={{height: '90vh', display: 'flex'}}>
				<div style={{display: 'flex', flexDirection: 'column', minWidth: '35vw'}}>
					<div style={{backgroundColor: '#6F6B5A', padding: 20}}>
						<Box style={{display: 'flex', backgroundColor: '#6F6B5A', padding: 10, borderRadius: 30}} border={2} borderColor='#A09B7D'>
							<img src={SearchIcon} style={{paddingRight: 10}} />
							<TextField
								style={{
									'&:hover,&:focus': {
										outline: 'none'
									},
									width: '100%',
									backgroundColor: 'transparent',
									color: 'white'
								}}
								value={''}
								placeholder='Search'
								onChange={evt => setTypedMessage(evt.target.value)}
								type='text'
							/>
							{/* <Button onClick={() => sendMessage(selectedReceiver, typedMessage)}>Send</Button> */}
						</Box>
					</div>
					{chatRoomLoading && (
						<div style={{display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center'}}>{<ReactLoading type='spin' />}</div>
					)}
					{chatRoomList &&
						chatRoomLoading != true &&
						chatRoomList.map(function (chatRoom) {
							return (
								<div className='table-col' style={{width: '35vw'}} onClick={() => setSelectedReceiver(chatRoom.contact)}>
									<div
										id='eventsContainer'
										style={{display: 'flex', height: '100%', flexDirection: 'column', width: '100%', backgroundColor: '#6F6B5A'}}>
										<div style={{display: 'flex', flexDirection: 'row', backgroundColor: '#6F6B5A', marginLeft: 25, marginTop: 6, marginBottom: 6}}>
											<div style={{display: 'flex', alignItems: 'center', backgroundColor: '#6F6B5A'}}>
												<Identicon style={{borderRadius: '50%'}} size='40' string={chatRoom.contact} />
											</div>
											<div style={{backgroundColor: '#6F6B5A', padding: 5}}>
												<div style={{fontWeight: 'normal', marginBottom: 5, marginLeft: 5}}>{chatRoom.contact}</div>
												<div style={{fontWeight: 'normal', fontSize: 12, marginLeft: 5}}>
													{chatRoom.id == 0 ? 'You:' : ''} {chatRoom.latestMessage}
												</div>
											</div>
										</div>
									</div>
								</div>
							)
						})}
				</div>

				<div id='eventsContainer' className='table-col' style={{display: 'flex', height: '100%', flexDirection: 'column'}}>
					<div
						style={{
							height: '100%',
							overflow: 'auto',
							display: 'flex',
							flexDirection: 'column',
							backgroundColor: '#BFB99B'
						}}>
						{selectedReceiver == '' && (
							<div style={{margin: 'auto', textJustify: 'auto', fontSize: 25, fontWeight: 'bold'}}>Select a contact to show messages</div>
						)}
						{conversation &&
							conversation.map(function (text) {
								return (
									<div
										style={{
											backgroundColor: '#676D88',
											color: 'white',
											alignSelf: text.id == 1 ? 'flex-start' : 'flex-end',
											borderRadius: 15,
											minWidth: 100,
											padding: 10,
											margin: 10
										}}>
										<div style={{fontSize: 15, fontWeight: 'normal'}}>{text.text}</div>
										<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>{text.time}</div>
									</div>
								)
							})}
					</div>
					<div style={{backgroundColor: '#888267', padding: 20}}>
						<Box style={{display: 'flex', backgroundColor: '#6E6B5A', padding: 10, borderRadius: 30}} border={2} borderColor='#A09B7D'>
							<img src={EmojiIcon} style={{paddingRight: 10}} />
							<TextField
								fullWidth
								style={{
									'&:hover,&:focus': {
										outline: 'none'
									},
									width: '100%',
									backgroundColor: 'transparent',
									color: 'white'
								}}
								value={typedMessage}
								placeholder='Message goes here'
								onChange={evt => setTypedMessage(evt.target.value)}
								type='text'
							/>
							<img style={{paddingLeft: 5, alignSelf: 'center'}} src={SendIcon} onClick={() => sendMessage(selectedReceiver, typedMessage)} />
						</Box>
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
					<Button onClick={() => sendMessage(selectedReceiver, typedMessage)}>Send</Button>
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
