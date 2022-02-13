import Flexbox from 'flexbox-react'
import Box from '@material-ui/core/Box'
import React, {useEffect} from 'react'
import Grid from '@material-ui/core/Grid'
import ChatBubble from './ChatBubble'
class ChatRoom extends React.Component {
	constructor(props) {
		super(props)
		this.conversation = props.conversation
	}

	buildBubbles() {
		const bubbles = []
		this.conversation.forEach(text => {
			bubbles.push(
				<Grid item xs={12} key={text.text}>
					<ChatBubble id={text.id} text={text.text} time={text.time}></ChatBubble>
				</Grid>
			)
		})
		console.log(this.conversation)
		return bubbles
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.conversation !== this.conversation) {
			this.conversation = nextProps.conversation
		}
	}

	render() {
		return (
			<div>
				<Grid container spacing={1}>
					{this.buildBubbles()}
				</Grid>
			</div>
		)
	}
}

export default ChatRoom
