import React from 'react'
import { Grid, Card, Button, List, Modal, Input, Segment, Form, Divider, TextArea, Tab, Dimmer, Loader } from 'semantic-ui-react'
import { getArt, getArtEvents, artFeedContractFactory, isEthereumAddress, getArtFeed, getArtFeedRaw } from './contract';
import ImageGallery from 'react-image-gallery';
import "react-image-gallery/styles/css/image-gallery.css";
import makeBlockie from 'ethereum-blockies-base64';
import { Link } from 'react-router-dom'
import readImage from './readImage';
import { permawebService, getArtHistory } from './permawebService';
import Web3 from 'web3'

const readArweaveWalletFile = (data) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => {
        reader.abort()
        reject()
      }
      reader.onload = () => {
          resolve(reader.result)
      }
      reader.readAsText(data)
    })
}

class ItemFeedAdm extends React.Component{
    state = {
        add:false, view:false
    }

    async componentDidMount(){
        const { txId } = this.props.item
        const result = await this.props.listHistory.filter(function(e) {
            return e.url === txId
        })
        console.log(result)
        if(result.length > 0){
            this.setState({add:false, view:true})
        }else{
            this.setState({add:true, view:false})
        }
    }

    render(){
        const { item,openHistoryDetails,addHistoryFeed } = this.props
        const { add, view } = this.state
        return(
            <List.Item>
            <List.Content>
                <List.Description style={{maxWidth:300}}>
                    <p style={{fontSize:10, marginBottom:20}}>
                        {item.description}
                    </p>
                </List.Description>
                <List.Description>
                    <img onClick={() => openHistoryDetails('texto', item.image)} style={{maxWidth:200, maxHeight:200}} src={item.image} />
                </List.Description>
                <List.Description>
                    {add &&
                    <Button onClick={() => addHistoryFeed(item.txId)}>Add To Feed</Button>
                    }
                    {view && 
                    <Button>On Feed</Button>
                    }
               </List.Description>
            </List.Content>
            </List.Item>
        )
    }
}

class ViewArt extends React.Component{
    state = {
        loading:true,
        art: false,
        artId:false,
        artHistory:[],
        events:[],
        arDeployAddress:false,
        modalChangeOwner:false,
        newOwnerAddress: '0x',
        transactionDeploy: false,
        transactionHash:false,
        notValidAddress:false,
        modalHistoryOpen:false,
        textOpenHistory:'',
        imgOpenHistory:'',
        newHistoryDescription:'',
        modalNewHistory:false,
        arweaveAddress:'',
        imgNewHistory:false,
        transactionNewHistory:false,
        arweaveWallet:false,
        arTxFee:false,
        newArBalance:false,
        newHistoryArTxDeploy:false,
        txHashArNewHistory:false,
        artFeed:[],
        listHistory:[]
    }

    componentDidMount = async() => {
        const art = await getArt(parseInt(this.props.match.params.idArt))
        const artHistory = await getArtHistory(this.props.match.params.idArt)
        console.log(artHistory)
        const artFeed = await getArtFeed(this.props.match.params.idArt)
        const listHistory = await getArtFeedRaw(this.props.match.params.idArt)
        console.log(artFeed)
        this.setState({art,listHistory, artFeed, artHistory, artId:this.props.match.params.idArt, loading:false})     
        const events = await getArtEvents()  
        this.setState({events})
    }

    transferOwner = async() => {
        const { artId, newOwnerAddress } = this.state
        const { ethereumAddress } = this.props
        try{
            this.setState({notValidAddress:false})
            const isValid = await isEthereumAddress(newOwnerAddress)
            if(!isValid){
                this.setState({notValidAddress:true})
            }else{
                const artContract = await artFeedContractFactory()
                artContract.methods.transferArt(artId, newOwnerAddress).send({from:ethereumAddress},
                    (err, transactionHash) =>{
                        if(err){
                            console.log(err)
                            return
                        }else{
                            console.log(transactionHash)
                            this.setState({transactionDeploy:true,transactionHash})
                            return
                        }
                })
            }
        }catch(err){
            console.log(err)
        }
    }

    openHistoryDetails = (text, imgSrc) => this.setState({textOpenHistory:text, imgOpenHistory:imgSrc, modalHistoryOpen:true})

    closeHistorydetails = () => this.setState({textOpenHistory:'',imgOpenHistory:'',modalHistoryOpen:false})

    closeNewHistoryModal = () => this.setState({newHistoryArTxDeploy: false, txHashArNewHistory:false, modalNewHistory:false, imgNewHistory:false, newHistoryDescription:false})

    removeImgNewHistory = () => this.setState({imgNewHistory:false})

    loadImgNewHistory = async(event) => {
        try{
            const img = await readImage(event.target.files[0])
            if(img){
                this.setState({imgNewHistory: img})
            }else{
                alert('Not a image')
            }
        }catch(err){
            console.log(err)
            return
        }
    }

    generateNewHistoryArTx = async() => {
        const { artId, newHistoryDescription, imgNewHistory, arweaveWallet} = this.state
        try{
            const data = await JSON.stringify({
                description: newHistoryDescription,
                image: imgNewHistory
              })
              let transaction = await permawebService.createTransaction({
                data
            }, arweaveWallet)
            transaction.addTag('permadApp', 'art-history')
            transaction.addTag('id', artId)
            const arweaveAddress = await permawebService.wallets.jwkToAddress(arweaveWallet)
            const userWinstonBalance =  await permawebService.wallets.getBalance(arweaveAddress)
            const newBalance = parseInt(userWinstonBalance) - parseInt(transaction.reward)
            if(newBalance>=0){                
                const newArBalance = await permawebService.ar.winstonToAr(newBalance)
                const arTxFee = await permawebService.ar.winstonToAr(transaction.reward)
                console.log(arTxFee)
                this.setState({transactionNewHistory: transaction, arTxFee, newArBalance })
            }else{
                alert('Insuficient AR balance')
            }
        }catch(err){
            console.log(err)
        }
    }

    executeNewHistoryArTx = async() => {
        const { transactionNewHistory, arweaveWallet } = this.state
        try{
            await permawebService.transactions.sign(transactionNewHistory, arweaveWallet);
            console.log(transactionNewHistory.id)            
            const response = await permawebService.transactions.post(transactionNewHistory);
            this.setState({newHistoryArTxDeploy:true, txHashArNewHistory:transactionNewHistory.id, transactionNewHistory:null, arTxFee:false, newArBalance:false, arweaveWallet:false, imgNewHistory:false, newHistoryDescription:false})
        }catch(err){
            console.log(err)
        }
    }

    loadArweaveAccount = async(e) => {
        try{
          this.setState({loading:true})
          const raw = await readArweaveWalletFile(e.target.files[0])
          const arweaveWallet = JSON.parse(raw)    
          this.setState({arweaveWallet})
        }catch(err){
          console.log(err)
          this.setState({loading:false})
          alert('Error Loading Wallet')
          return
        }
      }

      addHistoryFeed = async(transactionHash) => {
        const { artId } = this.state
        const { ethereumAddress } = this.props
        try{
            let artFeedContract = await artFeedContractFactory()
            const transactionHashHex = await Web3.utils.toHex(transactionHash)
            artFeedContract.methods.newHistory(artId, transactionHashHex).send({from:ethereumAddress},
                (err, transactionHash) =>{
                    if(err){
                        alert('Error on transaction')
                    }else{
                        console.log(transactionHash)
                        alert('Transaction Send')
                    }
                })

        }catch(err){
            console.log(err)
        }
      }

    render(){
        const { art, events, modalChangeOwner, modalNewHistory, newOwnerAddress, notValidAddress, transactionDeploy, 
            transactionHash, artFeed, imgOpenHistory, textOpenHistory,modalHistoryOpen, imgNewHistory, listHistory
        } = this.state
        if(!art) {
            return(
                <Grid centered>
                  <Dimmer active>
                    <Loader />
                  </Dimmer>
                </Grid>
            )
        }
        if(transactionDeploy){
            return(
                <Grid centered>
                       <Link to="/">
            <p style={{color:'grey', fontStyle:'italic',display: 'inline', paddingLeft:10}}>Home </p>
            </Link>
            <p style={{color:'grey', fontStyle:'italic', display: 'inline' }}> / View Art / Change Ownership</p>

                    <p align="center" style={{marginTop:25}}>The Transaction has been sent, wait the confirmation to view the update information</p>
                    <p align="center" style={{marginTop:20}}>{transactionHash}</p>
                </Grid>
            )
        }
        return(
            <React.Fragment>
                    <Link to="/">
            <p style={{color:'grey', fontStyle:'italic',display: 'inline', paddingLeft:10}}>Home </p>
            </Link>
            <p style={{color:'grey', fontStyle:'italic', display: 'inline' }}> / Art Details</p>
            <Grid centered>
               {(this.props.ethereumAddress === art[0]) &&                         
                <Segment>
                    <p>Art Owner Painel</p>
                    <Button onClick={() => this.setState({modalChangeOwner:true})}>Transfer Ownership</Button>
                    <Button onClick={() => this.setState({modalNewHistory:true})}>New History</Button>
                </Segment>
               }
                <Grid container centered>
                    <p style={{fontSize:20, fontWeight:600, marginTop:20}} align="center">{art[1].title}</p>
                </Grid>
                <Grid container centered>
                    <p style={{fontSize:16, fontWeight:200, color:'grey', fontStyle:'italic', marginTop:5, marginBottom:15}} align="center">{art[1].description}</p> 
                    </Grid>
             <Grid.Row stackable centered columns={2}>
                <Grid.Column>
                        <Card  style={{marginLeft:'auto', marginRight:0}}>                    
                        <Card.Content>
                        <ImageGallery showPlayButton={false} showFullscreenButton={false} items={[{
                            original: art[1].photos[0],
                            thumbnail: art[1].photos[0]
                            },{
                                original: art[1].photos[1],
                                thumbnail: art[1].photos[1]
                            }]
                            } />
                        </Card.Content>
                    </Card>
                </Grid.Column>
                <Grid.Column>
                      <p>Artist:</p> 
                      <img style={{width:75, weight:75}} src={makeBlockie(art[2])} alt="Artist Avatar" />
                      <p style={{wordBreak:'break-all', fontSize:10}}>{art[2]}</p>
                      <p>Owner:</p> 
                      <img style={{width:75, weight:75}} src={makeBlockie(art[0])} alt="Owner Avatar" />
                     <p style={{wordBreak:'break-all', fontSize:10}}>{art[0]}</p>
                   
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <p aling='center' style={{fontSize:23, fontWeight:500}}>History</p>
            </Grid.Row>
            <Grid container centered>
                <List>
                        {events.map((event) => {
                            let dateObj = new Date(event.timestamp * 1000); 
                            let utcString = dateObj.toUTCString(); 
                            return(
                                <Segment>
                                    <List.Item>
                                    <List.Content>
                                        <List.Header as='a'>Change Owner</List.Header>
                                        <List.Description>
                                        <p style={{fontSize:10}}>
                                            {event.returnValues.newOwner} is the new owner
                                        </p>
                                        </List.Description>
                                        <List.Description>
                                            <p style={{fontSize:10}}>{utcString}</p>
                                        </List.Description>
                                    </List.Content>
                                    </List.Item>
                                </Segment>
                            )
                        })}

                </List>
            </Grid>

            <Grid.Row>
                <p aling='center' style={{fontSize:23, fontWeight:500}}>Art Memories</p>
            </Grid.Row>
            <Grid container centered>
                <List>
                        {artFeed.map((event) => {
                            return(
                                <Segment>
                                    <List.Item>
                                    <List.Content>
                                        <List.Description>
                                        <p style={{fontSize:12}}>
                                            {event.data.description}
                                        </p>
                                        </List.Description>
                                        <List.Description>
                                            <img src={event.data.image} style={{maxWidth:300, maxHeight:300, padding:10}} />
                                        </List.Description>
                                    </List.Content>
                                    </List.Item>
                                </Segment>
                            )
                        })}

                </List>
            </Grid>

            <Modal open={modalNewHistory} onClose={this.closeNewHistoryModal}>
                <Modal.Content>
                <Grid centered>
                {this.state.newHistoryArTxDeploy ? 
                    <React.Fragment>
                        <p>You send a new history, wait the confirmation on Arweave Network</p>
                        <p>{this.state.txHashArNewHistory}</p>
                    </React.Fragment>
                :
                <Tab menu={{ secondary: true, pointing: true }} panes={
                    [
                        {
                          menuItem: 'Feed Adm',
                          render: () => 
                          <Tab.Pane attached={false}>
                            {this.state.artHistory.map((item) => (
                                 <Segment>
                                     <ItemFeedAdm openHistoryDetails={this.openHistoryDetails} addHistoryFeed={this.addHistoryFeed} item={item} listHistory={listHistory} />
                                 {/* <List.Item>
                                 <List.Content>
                                     <List.Description style={{maxWidth:300}}>
                                         <p style={{fontSize:10, marginBottom:20}}>
                                             {item.description}
                                         </p>
                                     </List.Description>
                                     <List.Description>
                                         <img onClick={() => this.openHistoryDetails('texto', item.image)} style={{maxWidth:200, maxHeight:200}} src={item.image} />
                                     </List.Description>
                                     <List.Description>
                                         <Button onClick={() => this.addHistoryFeed(item.txId)}>Add To Feed</Button>
                                    </List.Description>
                                 </List.Content>
                                 </List.Item> */}
                             </Segment>
                            ))}
                          </Tab.Pane>,
                        },
                        {
                          menuItem: 'New History',
                          render: () => 
                          <Tab.Pane attached={false}>
                             <Form style={{margin:30}}>          
                                <Grid.Row style={{marginTop:5, marginBottom:20}}>
                                <Divider />
                                    <Form.Field>
                                        <label>Description</label>
                                        <TextArea onChange={(e) => this.setState({ newHistoryDescription: e.target.value })} placeholder='Tell us more' />
                                    </Form.Field>
                                </Grid.Row>
                                <Grid.Row style={{marginTop:5, marginBottom:20}}>
                                <Divider />
                                    <Form.Field>
                                        <label>Image</label>
                                        {imgNewHistory ?
                                            <React.Fragment>
                                            <img style={{maxWidth:250, maxHeight:250}} src={imgNewHistory} />
                                            <p onClick={this.removeImgNewHistory} style={{color:'red'}}>Remove Image</p>
                                            </React.Fragment>
                                            :
                                            <Input type="file" accept="image/*"  onChange={(e) => this.loadImgNewHistory(e)}/>
                                        }
                                    </Form.Field>
                                </Grid.Row>
                                <Grid.Row style={{marginTop:5, marginBottom:20}}>
                                <Divider />
                                    <Form.Field>
                                        <label>Arweave Wallet</label>
                                        {this.state.arweaveAddress ? 
                                        <p>{this.state.arweaveAddress}</p>
                                        :
                                        <Input type="file"  onChange={(e) => this.loadArweaveAccount(e)} />
                                        }
                                        {this.state.transactionNewHistory ? 
                                            <React.Fragment>
                                                <p>Fee: {this.state.arTxFee}</p>
                                                <p>New AR Balance: {this.state.newArBalance}</p>
                                                <Button onClick={this.executeNewHistoryArTx}>Confirm Transaction</Button>
                                            </React.Fragment>
                                            :
                                            <Button onClick={this.generateNewHistoryArTx}>Advance</Button>
                                        }
                                    </Form.Field>
                                </Grid.Row>
                            </Form>
                          </Tab.Pane>,
                        }
                      ]
                } />

                   
                }
                </Grid>
                </Modal.Content>
            </Modal>

            <Modal open={modalHistoryOpen} onClose={this.closeHistorydetails}>
                <Modal.Content>
                    <p align="center" style={{fontSize:18, marginBottom:20}}>{textOpenHistory}</p>
                    <Grid centered>
                    <img src={imgOpenHistory} alt="History Expand" style={{padding:20, maxWidth:900, maxHeight:1200}} />
                    </Grid>
                </Modal.Content>
            </Modal>

            <Modal open={modalChangeOwner}>
                <Modal.Header>Transfer Ownership</Modal.Header>
                <Modal.Content>
                    <p>Are you sure you want to transfer the ownership of the Art Registry?</p>
                    <p style={{color:'grey', fontSize:12, padding:0, margin:0}}>New Owner Address</p>
                    <Input value={newOwnerAddress} onChange={(e) => this.setState({newOwnerAddress:e.target.value})} focus placeholder='New Owner Address' />
                    {notValidAddress && <p style={{color:'red'}}>Not Valid Address</p>}
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={() => this.setState({modalChangeOwner:false})} negative>Cancel</Button>
                    <Button onClick={this.transferOwner} positive>Confirm</Button>
                </Modal.Actions>
            </Modal>


    
            </Grid>
            </React.Fragment>
        )
    }
}

export default ViewArt