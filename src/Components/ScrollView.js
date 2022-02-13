import React, {Component} from 'react'
import PropTypes from 'prop-types'

class ScrollView extends Component {
	static childContextTypes = {
		scroll: PropTypes.object
	}
	register = (name, ref) => {
		this.elements[name] = ref
	}
	unregister = name => {
		delete this.elements[name]
	}
	getChildContext() {
		return {
			scroll: {
				register: this.register,
				unregister: this.unregister
			}
		}
	}
	render() {
		return React.Children.only(this.props.children)
	}
}

export default ScrollView
