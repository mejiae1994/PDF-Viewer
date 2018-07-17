import '../assets/css/App.css'
import React, { Component } from 'react'

class Search extends Component {

  render() {
    return (
      <div className="filterNames">
        <form>
				<input type="text"  placeholder="Search for pdf" onChange={this.props.list}/>
        </form>
      </div>
    );
  }
}

export default Search;
