import Box from '@material-ui/core/Box'
import React from 'react'
class ChatBubble extends React.Component {
	constructor(props) {
		super(props)
		this.id = props.id
		this.text = props.text
		this.time = props.time
	}

	render() {
		return (
			<div>
				{this.id === 1 ? (
					<div width='100%' style={{float: 'left'}}>
						<Box paddingY={1} paddingX={2} color='white' bgcolor='#676D88' borderRadius={17}>
							<div flexShr style={{fontSize: 15, fontWeight: 'normal'}}>
								{this.text}
							</div>
							<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>{this.time}</div>
						</Box>
					</div>
				) : (
					<div width='50%' style={{float: 'right'}}>
						<Box paddingY={1} paddingX={2} color='white' bgcolor='#676D88' borderRadius={17}>
							<div style={{fontSize: 15, fontWeight: 'normal'}}>{this.text}</div>
							<div style={{fontSize: 11, fontWeight: 'normal', color: '#BCBCBC', paddingTop: 3}}>{this.time}</div>
						</Box>
					</div>
				)}
			</div>
		)
	}
}

export default ChatBubble
