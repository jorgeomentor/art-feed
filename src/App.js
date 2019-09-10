import React from 'react';
import './App.css';
import 'semantic-ui-css/semantic.min.css'
import "react-image-gallery/styles/css/image-gallery.css";
import { HashRouter, Route, Link } from 'react-router-dom'
import NewArt from './NewArt';
import getEth from './getEth';
import ViewArt from './ViewArt';
import ListArtHome from './ListArtHome';
import { Menu, Container, Button } from 'semantic-ui-react';
import makeBlockie from 'ethereum-blockies-base64';

class App extends React.Component {
  state = {
    ethereumAddress:false,
    ethLoad:false,
    errorEthLoad:false
  }

  async componentDidMount(){
    try{
      const web3 = await getEth()
      const accounts = await web3.eth.getAccounts()
      const network = await web3.eth.net.getNetworkType()
      this.setState({ ethereumAddress: accounts[0], ethLoad:true, errorEthLoad:false })
    }catch(err){
      console.log(err)
      this.setState({errorEthLoad:true, ethLoad:false, ethereumAddress:false})
    }
  }

  render(){
    if(this.state.errorEthLoad) return <p align="center" style={{marginTop:30}}>Connect with a Ethereum Provider to access the dApp, reload to try again</p>
    if(this.state.ethLoad){
      return (
        <React.Fragment>
        <HashRouter basename="/">
        <Menu
        size='large'
        >
          <Container>
            <Menu.Item style={{backgroundColor:'white'}} >
              ArtFeed
            </Menu.Item>
            <Menu.Item position='right'>
              <Link to="/newart">
                <Button as='a' >
                  Register New Art
                </Button>
              </Link>
              <img style={{width:45, weight:45, borderRadius:'50%', marginLeft:10}} src={makeBlockie(this.state.ethereumAddress)} alt="User Avatar" />

            </Menu.Item>
          </Container>
        </Menu>
          <Route exact path="/" render={() => <ListArtHome  />} />
          <Route exact path="/newart" render={() => <NewArt ethereumAddress={this.state.ethereumAddress} />} />
          <Route exact path="/view/:idArt" render={(props) => <ViewArt {...props} ethereumAddress={this.state.ethereumAddress}/>} />
        </HashRouter>
        </React.Fragment>
      )
    }
    return(<p align="center" style={{marginTop:30}}>Check your Ethereum Wallet to access the dApp</p>)

  }
}

export default App;
