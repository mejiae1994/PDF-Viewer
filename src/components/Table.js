import '../assets/css/App.css'
import React, { Component } from 'react'

class Table extends Component {
 
  render() {
    return (
      <div className="grid-item">
        {
					<div onDoubleClick={this.props.openPdf}>
						<img width='200' height='300' ref="image" src={this.props.imgUrl}/>
						<h4> {this.props.name} </h4>
					</div>
				}
      </div>
    );
  }
}

export default Table;
