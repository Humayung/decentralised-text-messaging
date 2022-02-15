import {useEffect, useState} from 'react'
import './App.css'
import {ethers} from 'ethers'
import Web3 from 'web3';
import {CONTRACT_ABI, CONTRACT_ADDRESS} from './config'
import Box from '@material-ui/core/Box'
import Identicon from 'react-identicons'
import SendIcon from './img/send-icon.svg'
import EmojiIcon from './img/emoji-icon.svg'
import SearchIcon from './img/search-icon.svg'
import PlusIcon from './img/plus-icon.svg'
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
	const [prevSelectedReceiver, setPrevSelectedReceiver] = useState('')
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
				if (status === 0) setJoinShowModal(true)
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
		const messageId = sender === thisAccount ? 0 : 1
		return messageId
	}

	const parseTime = async time => {
		time = time.toNumber()
		time = time * 1000
		time = new Date(time)

		const hours = '' + time.getHours()
		const minutes = '0' + time.getMinutes()
		time = `${hours.substring(hours.length - 2, hours.length)}:${minutes.substring(minutes.length - 2, minutes.length)}`
		return time
	}

	const loadConversation = async => {
		return new Promise(async resolve => {
			try {
				console.log(currentAccount, selectedReceiver, contract)
				console.log('getting messages')
				const chatId = await getChatId(currentAccount, selectedReceiver)
				const conversationLen = await contract.getConversationLen(chatId)
				console.log('lastMessage', indexOfLastMessage)
				const newConversation = []
				let index = 0
				if (prevSelectedReceiver !== selectedReceiver) {
					index = 0
				} else {
					index = indexOfLastMessage
					setIndexOfLastMessage(Math.max(conversationLen, 0))
				}
				for (let i = index; i < conversationLen; i++) {
					const message = await contract.getMessage(chatId, i)
					const time = await parseTime(message.time)
					console.log(message.time)
					const messageId = await messageIdOf(message.sender)
					const text = {text: message.text, id: messageId, time: time}
					newConversation.push(text)
					console.log(text)
				}
				console.log('newConversation', newConversation)

				if (prevSelectedReceiver !== selectedReceiver) {
					setConversation(newConversation)
				} else {
					setConversation(oldConversation => [...oldConversation, ...newConversation])
				}

				console.log(conversation)
				console.log('message loaded!')
				resolve('loaded')
			} catch (err) {
				console.log(err)
			}
		})
	}
	// useEffect(() => {
	// 	const interval = setInterval(async () => {
	// 		await loadConversation()
	// 		console.log('conversation updated')
	// 	}, 4000)

	// 	return () => clearInterval(interval)
	// }, [])

	const getChatId = async (a, b) => {
		return await contract.getChatId(a, b)
		let chatId = ''
		if (a > b) {
			chatId = Web3.utils.soliditySha3(a, b)
		} else {
			chatId = Web3.utils.soliditySha3(b, a)
		}
		return chatId
	}
	const getChatRoomList = async () => {
		try {
			console.log('getting chatroom', contacts, contract)
			const newChatRoomList = []
			console.log('lastChatRoom', indexOfLastChatRoom)
			for (let i = indexOfLastChatRoom; i < contacts.length; i++) {
				console.log('iii', i)
				const contact = contacts[i]
				console.log(contact)
				const chatId = await getChatId(currentAccount, contact)
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
			setChatRoomLoading(true)
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
	const sendMessage = async (addressTo, message) => {
		const {ethereum} = window
		try {
			if (message === '') return
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

	useEffect(() => {
		console.log('Selected receive changed:', selectedReceiver)
		if (selectedReceiver) {
			toast.promise(loadConversation(), {
				pending: 'Updating conversation',
				success: 'Conversation updated!',
				error: 'Failed updating conversation!'
			})
			console.log('receiver', selectedReceiver, prevSelectedReceiver)
			setPrevSelectedReceiver(selectedReceiver)
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
						<img src={PlusIcon} alt='add contact' />
					</div>
				</div>
			</div>
			<div style={{height: '90vh', display: 'flex'}}>
				<div style={{display: 'flex', flexDirection: 'column', minWidth: '35vw'}}>
					<div style={{backgroundColor: '#6F6B5A', padding: 20}}>
						<Box style={{display: 'flex', backgroundColor: '#6F6B5A', padding: 10, borderRadius: 30}} border={2} borderColor='#A09B7D'>
							<img src={SearchIcon} alt='search' style={{paddingRight: 10}} />
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
						chatRoomLoading !== true &&
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
													{chatRoom.id === 0 ? 'You:' : ''} {chatRoom.latestMessage}
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
						{selectedReceiver === '' && (
							<div style={{margin: 'auto', textJustify: 'auto', fontSize: 25, fontWeight: 'bold'}}>Select a contact to show messages</div>
						)}
						{conversation &&
							conversation.map(function (text) {
								return (
									<div
										style={{
											backgroundColor: '#676D88',
											color: 'white',
											alignSelf: text.id === 1 ? 'flex-start' : 'flex-end',
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
							<img src={EmojiIcon} alt='emoji' style={{paddingRight: 10}} />
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
}

export default App
