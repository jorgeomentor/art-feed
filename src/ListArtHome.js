import React from 'react'
import { Grid, Card } from 'semantic-ui-react'
import { getArtInfoBlockchain } from './contract';
import { Link } from 'react-router-dom'
import { getArweaveTxData } from './permawebService';
import Web3 from 'web3'
import ImageGallery from 'react-image-gallery';
import "react-image-gallery/styles/css/image-gallery.css";

class ListArtHome extends React.Component{
    state = {
        load:false,
        artList:[]
    }               

    getFullArtData = async() => {
        try{
            let arrayHelper = []
            const artList = await getArtInfoBlockchain()
            artList.map((art) => {
                const tx = Web3.utils.hexToUtf8(art.artData)
                arrayHelper.push(getArweaveTxData(tx))
            })
            const info = await Promise.all(arrayHelper)
            console.log(info)
            const result = artList.map((art, index) => {
                art.artData = info[index]
                return art
            })
            return result
        }catch(err){
            console.log(err)
            return []
        }
    }



    async componentDidMount(){
        try{
            const artList = await this.getFullArtData()
            this.setState({load:true, artList})
        }catch(err){
            console.log(err)
            return
        }
    }

   
 

    render(){
        if(!this.state.load){
            return <p align="center">Loading</p>
        }
        return(
         <Grid centered>
            {/* <Grid.Row>
                <Link to="/newart">
                    <Button style={{margin:30}}>Register New Art</Button>
                </Link>
            </Grid.Row> */}
            <Grid.Row>
                <p align="center" style={{fontSize:28, fontWeight:700,margin:15}}>Art Feed</p>
            </Grid.Row>
            {this.state.artList.map((item, index) => {
                if(!item.artData.photos){
                    return null
                }
                return(
                    <Card style={{margin:10}}>
                    <ImageGallery showPlayButton={false} showFullscreenButton={false} items={[{
                        original: item.artData.photos[0],
                        thumbnail: item.artData.photos[0]
                        },{
                            original: item.artData.photos[1],
                            thumbnail: item.artData.photos[1]
                        }]
                        } />
                    <Link to={`/view/${index}`}>
                    <Card.Content>
                      <Card.Header style={{padding:10, color:'black', fontSize:18}}>{item.artData.title}</Card.Header>
                      {/* <Card.Description>{item.artData.description}</Card.Description> */}
                    </Card.Content>
                    </Link>
                  </Card>
                )
            })}
         </Grid>
        )
    }
}

export default ListArtHome