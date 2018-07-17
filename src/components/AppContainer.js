import '../assets/css/App.css'
import React, { Component } from 'react'
import Search from './SearchBar';
import Table from './Table';
import {ipcRenderer} from 'electron';


class AppContainer extends Component {
	constructor(props) {
		super(props);

		this.handleDoubleClick = this.handleDoubleClick;
		this.filterList = this.filterList.bind(this);
		
		this.state = {
			pdfFiles: [],
			pdfNames: [],
			initialPdfState: [],
			imgUrls: [],
			initialImageState: [],
			imageDictionary: {}
		};
	}
	//handle double click events
	handleDoubleClick(e) {
		console.log(this.state.pdfFiles[e]);
		const reply = ipcRenderer.sendSync('openfile', this.state.pdfFiles[e]);		
	}
		
	//communicates with the ipcmain to obtain pdf files in the current directory
	componentWillMount() {
		const self = this;
		ipcRenderer.on('ping', (event, files, urls) => {
			self.setState({pdfFiles: files, pdfNames: self.getPdfName(files), initialPdfState: 											 self.getPdfName(files), imgUrls: urls, initialImageState: urls});
			self.fillImgDict(self.getPdfName(files), urls);
		})
	}

	//populate dictionary
	fillImgDict(names, urls) {
		const self = this;
		let tempImageDict = {}
		names.forEach((element, index) => {
			tempImageDict[element] = self.returnImgPath(urls[index]);
		});
		this.setState({imageDictionary: tempImageDict});
		console.log(this.state.imageDictionary);
	}

	//get pdfNames without extra info
	//replace(/_/g, ' '); add this to replace _ for ' '(space)
	getPdfName(unfilteredNames) {
		const filteredNames = unfilteredNames.map(name => {
			name = name.substring(name.lastIndexOf('\\') + 1, name.length);
			return name.replace('.pdf', '')
		});
		return filteredNames;
	}

	//onChange event trigers this function to filter the pdfs rendered
	filterList(e) {
		var changedlist = this.state.initialPdfState;
		changedlist = changedlist.filter(item => {
			return item.toLowerCase().search(
				e.target.value.toLowerCase()) !== -1;
		});
		this.setState({pdfNames: changedlist});
	}

	returnImgPath(imgName) {
		let thing =  require(`../imgs/${imgName}`);
		return thing;
	}

  render() {
		
    return (
      <div className="AppContainer">
				<Search name="Search" list={this.filterList}/>
				<div className="grid-container">
				{
					this.state.pdfNames? this.state.pdfNames.map( (name, index) => {
						return <Table 
						imgUrl={this.state.imageDictionary[name]}
						name={name} 
						key={index}
						openPdf={this.handleDoubleClick.bind(this, index)} //binds one handle click for each table and its key value
										/>
					}) : <em>loading...</em>
					
				}
				</div>
      </div>
    );
  }
}

export default AppContainer;
