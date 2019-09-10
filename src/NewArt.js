import React from 'react';
import { artFeedContractFactory } from './contract';
import { Input, Grid, TextArea, Form, Divider, Button } from 'semantic-ui-react'
import { permawebService } from './permawebService';
import Web3 from 'web3'
import { Link } from 'react-router-dom'


const readImageFile = async (fileInput) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => {
          reader.abort();
          reject();
        };
        reader.onload = () => {
            resolve(reader.result)
        }
        reader.readAsDataURL(fileInput);
      });
}


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


class NewArt extends React.Component{
    state = {
        titleArt:'',
        descriptionArt:'',
        firstPhoto:false,
        secondPhoto:false,
        arweaveAddress:false,
        arweaveWallet:false,
        arweaveBalance:false,
        sendArtTransaction:false,
        newArBalance:false,
        arTxFee:false,
        newArtSend:false
    }

    generateSendArtTx = async() => {
        const { arweaveWallet, descriptionArt, firstPhoto, secondPhoto  } = this.state
        if(!arweaveWallet || !descriptionArt || !firstPhoto || !secondPhoto){
            alert('Complete the Form')
            return
        }
        try{
            this.setState({modal:true})
            const data = JSON.stringify({
              title:this.state.titleArt,
              description:this.state.descriptionArt,
              photos:[this.state.firstPhoto, this.state.secondPhoto]
            })
         
            let sendArtTransaction = await permawebService.createTransaction({
                data
            }, arweaveWallet);
            const arweaveAddress = await permawebService.wallets.jwkToAddress(arweaveWallet)
            const userWinstonBalance =  await permawebService.wallets.getBalance(arweaveAddress)
            const newBalance = parseInt(userWinstonBalance) - parseInt(sendArtTransaction.reward)
            if(newBalance>=0){                
                const newArBalance = await permawebService.ar.winstonToAr(newBalance)
                const arTxFee = await permawebService.ar.winstonToAr(sendArtTransaction.reward)
                this.setState({sendArtTransaction, arTxFee, newArBalance })

            }else{
                alert('Insuficient AR balance')
            }
        }catch(err){
            console.log(err)
        }
    }

    sendArt = async() => {
        //Mudar nome dos states
        const{ ethereumAddress } = this.props
        const { arweaveWallet, sendArtTransaction } = this.state
        try{
            await permawebService.transactions.sign(sendArtTransaction, arweaveWallet);
            const response = await permawebService.transactions.post(sendArtTransaction);
            
            const artDataBytes = await Web3.utils.toHex(sendArtTransaction.id)
            let artFeedContract = await artFeedContractFactory()
            const expectedFee = await artFeedContract.methods.newArt(artDataBytes).estimateGas()
            console.log(expectedFee)
            artFeedContract.methods.newArt(artDataBytes).send({from:ethereumAddress},
                (err, transactionId) =>{
                    if(err){
                        console.log(err)
                        return
                    }
                    console.log(transactionId)
                    this.setState({NewHelpConfirm:true, newArtSend:true})
                    return
                })
        }catch(err){
            console.log(err)
            return err
        }
    }

    loadFirstImg = async(event) => {
        try{
            if(event.target.files[0] && event.target.files[0]['type'].split('/')[0] === 'image'){
                const imageData = await readImageFile(event.target.files[0])
                if(imageData){
                    this.setState({firstPhoto: imageData})
                }
            }else{
                alert('Invalid IMG')
            }
        }catch(err){
            alert('Error IMG')
            console.log(err)
            return
        }
    }

    loadSecondImg = async(event) => {
        try{
            if(event.target.files[0] && event.target.files[0]['type'].split('/')[0] === 'image'){
                const imageData = await readImageFile(event.target.files[0])
                if(imageData){
                    this.setState({secondPhoto: imageData})
                }
            }else{
                alert('Invalid IMG')
            }
        }catch(err){
            alert('Invalid IMG')
            console.log(err)
            return
        }
    }

    loadArweaveAccount = async(event) => {
        try{
            const arweave = permawebService
            const wallet = await readArweaveWalletFile(event.target.files[0])
            const arweaveWallet = JSON.parse(wallet)
            const arweaveAddress = await arweave.wallets.jwkToAddress(arweaveWallet)
            const winstonBalance =  await arweave.wallets.getBalance(arweaveAddress)
            const arweaveBalance = await arweave.ar.winstonToAr(winstonBalance)
            this.setState({arweaveAddress, arweaveBalance, arweaveWallet})
        }catch(err){
            console.log(err)
            return
        }
    }
    
    render(){
        if(this.state.newArtSend){
            return(
                <Grid centered>
                    <p align="center">New Art Send to the Blockchain, wait for the confirmation on Arweave and Ethereum for view your registry.</p>
                    <Link to={"/"}>
                        <Button>Back to Home</Button>
                    </Link>
                </Grid>
            )
        }
        return(
            <React.Fragment>
                <Link to="/">
            <p style={{color:'grey', fontStyle:'italic',display: 'inline', paddingLeft:10}}>Home </p>
            </Link>
            <p style={{color:'grey', fontStyle:'italic', display: 'inline' }}> / New Art</p>

            <Grid centered>
                <Form style={{margin:30}}>
                    <Grid.Row style={{marginTop:5, marginBottom:20}}>
                    <Divider />
                        <Form.Field>
                        <label>Title</label>
                                <Input onChange={(e) => this.setState({ titleArt: e.target.value })} placeholder='Search...' />
                        </Form.Field>
                    </Grid.Row>           
                    <Grid.Row style={{marginTop:5, marginBottom:20}}>
                    <Divider />
                        <Form.Field>
                            <label>Description</label>
                            <TextArea onChange={(e) => this.setState({ descriptionArt: e.target.value })} placeholder='Tell us more' />
                        </Form.Field>
                    </Grid.Row>
                    <Grid.Row style={{marginTop:5, marginBottom:20}}>
                    <Divider />
                        <Form.Field>
                            <label>First Image</label>
                            <Input type="file" accept="image/*"  onChange={(e) => this.loadFirstImg(e)}/>
                            {this.state.firstPhoto && <img style={{maxWidth:250, maxHeight:250}} src={this.state.firstPhoto} />}
                        </Form.Field>
                    </Grid.Row>
                    <Grid.Row style={{marginTop:5, marginBottom:20}}>
                    <Divider />
                        <Form.Field>
                            <label>Second Image</label>
                            <Input type="file" accept="image/*"  onChange={(e) => this.loadSecondImg(e)} />
                            {this.state.secondPhoto && <img style={{maxWidth:250, maxHeight:250}} src={this.state.secondPhoto} />}
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
                        </Form.Field>
                        {/* <p>Store your Arweave Wallet in a secure way, you only can be add new photos with the actual wallet</p> */}
                    </Grid.Row>
                    <Grid.Row style={{marginTop:5, marginBottom:20}}>
                    <Divider />
                    {this.state.sendArtTransaction ?
                    <Form.Field>
                        <p>AR Fee: {this.state.arTxFee}</p>
                        <p>New AR Balance: {this.state.newArBalance}</p>
                        <Button onClick={this.sendArt}>Confirm</Button>
                    </Form.Field>
                    :
                        <Form.Field>
                            <Button onClick={this.generateSendArtTx}>Advance</Button>
                        </Form.Field>
                    }
                        
                    </Grid.Row>
                </Form>
          </Grid>

          </React.Fragment>

        )
    }
}

//Props:
//Receive Ethereum Wallet 
//Receive Arweave Wallet

export default NewArt