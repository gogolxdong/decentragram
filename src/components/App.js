import Decentragram from '../abis/Decentragram.json'
import React, { Component } from 'react';
import Identicon from 'identicon.js';
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';
// import DeviceInfo from './getDeviceInfo.min.js';

// const DeviceInfo = require('./getDeviceInfo.min.js')
//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
    this.getLongLat()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  // async getDeviceInfo() {
  //   DeviceInfo.getDeviceInfo({
  //     domain: 'http://127.0.0.1',
  //   }, (infoResult) => {
  //     let infoHtml = []
  //     for (let i in infoResult) {
  //       infoHtml.push(
  //         '<li>' +
  //         '   <span>' + i + '</span>' +
  //         '   <span style="margin:0 1px;">:</span>' +
  //         '   <span style="color: red;">' + infoResult[i] + '</span>' +
  //         '</li>')
  //     }
  //     document.querySelector('#info_box').innerHTML = '<ul style="margin: 5px;">' + infoHtml.join('') + '</ul>'
  //   })
  // }
  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = Decentragram.networks[networkId]
    if (networkData) {
      const decentragram = new web3.eth.Contract(Decentragram.abi, networkData.address)
      this.setState({ decentragram })
      const imagesCount = await decentragram.methods.imageCount().call()
      this.setState({ imagesCount })
      // Load images
      for (var i = 1; i <= imagesCount; i++) {
        const image = await decentragram.methods.images(i).call()
        this.setState({
          images: [...this.state.images, image]
        })
      }
      // Sort images. Show highest tipped images first
      this.setState({
        images: this.state.images.sort((a, b) => b.tipAmount - a.tipAmount)
      })
      this.setState({ loading: false })
    } else {
      window.alert('Decentragram contract not deployed to detected network.')
    }
  }

  getLongLat() {
    var longitude = document.getElementById("longtitude");
    var latitude = document.getElementById("latitude");

    if (!navigator.geolocation) {
      alert("<p>您的浏览器不支持地理位置</p>");
      return;
    }

    function success(position) {
      latitude.value = position.coords.latitude;
      longitude.value = position.coords.longitude;
    };
    function error() {
      alert("<p>无法获取您的位置</p>");
    };
    navigator.geolocation.getCurrentPosition(success, error);
  }

  captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  uploadImage = info => {
    console.log(info)
    this.state.decentragram.events.ImageCreated('latest', (error, event) => {
      window.location.reload();
      if (error) {
        console.log(error);
      }
      console.log(event)
      console.log("交易hash:" + event.transactionHash);
      console.log("区块高度:" + event.blockNumber);

    })
    ipfs.add(this.state.buffer, (error, result) => {
      if (error) {
        console.error(error)
        return
      }
      this.setState({ loading: true })
      this.state.decentragram.methods.uploadImage(result[0].hash, info).send({ from: this.state.account })
        .on('transactionHash', (hash) => {
          this.setState({ loading: false })
        })
      // .on('confirmation', (hash) => {
      //   window.location.reload();
      // })
    })
  }

  tipImageOwner(id, tipAmount) {
    this.setState({ loading: true })
    this.state.decentragram.methods.tipImageOwner(id).send({ from: this.state.account, value: tipAmount })
      .on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    // .on('confirmation', (hash) => {
    //   window.location.reload();
    // })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      decentragram: null,
      images: [],
      loading: true
    }

    this.uploadImage = this.uploadImage.bind(this)
    this.tipImageOwner = this.tipImageOwner.bind(this)
    this.captureFile = this.captureFile.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        {this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
            images={this.state.images}
            captureFile={this.captureFile}
            uploadImage={this.uploadImage}
            tipImageOwner={this.tipImageOwner}
          />
        }
      </div>
    );
  }
}

export default App;