import Web3 from 'web3'
import getEth from "../getEth";
import ART_FEED_ABI from './ArtFeedABI.json'
import { getArweaveTxData } from '../permawebService';

const ART_FEED_ADDRESS = "0x2b35cebfcc070837c1161f1ca1c0e078f96201c6"

const artFeedContractFactory = () => new Promise(async (resolve, reject) => {
    try {
      const web3 = await getEth()
      const contract = new web3.eth.Contract(ART_FEED_ABI, ART_FEED_ADDRESS)
      resolve(contract)
    } catch (err) {
      console.log(err)
      reject(err)
    }
})

const getArtInfoBlockchain = () => new Promise(async(resolve, reject) => {
  try{
    const contract = await artFeedContractFactory()
    const result = await contract.methods.getArtObjects().call()
    resolve(result)
  }catch(err){
    console.log(err)
    reject(err)
  }
})

const getArt = (artId) => new Promise(async(resolve, reject) => {
  try{
    const contract = await artFeedContractFactory()
    const result = await contract.methods.getArt(artId).call()
    const dataUrl = await Web3.utils.hexToUtf8(result[1])
    const info = await getArweaveTxData(dataUrl)
    info.id = artId
    result[1] = info
    resolve(result)
  }catch(err){
    reject(err)
  }
})

const getArtFeed = (artId) => new Promise(async(resolve, reject) => {
  try{
    const contract = await artFeedContractFactory()
    const rawDataArray = await contract.methods.getArtHistory(artId).call()
    let result = []
    for (let item of rawDataArray){
      const url = await Web3.utils.hexToUtf8(item)
      const data = await getArweaveTxData(url)
      result.push({data, url})
    }
    resolve(result)
  }catch(err){
    reject(err)
  }
})

const getArtFeedRaw = (artId) => new Promise(async(resolve, reject) => {
  try{
    const contract = await artFeedContractFactory()
    const rawDataArray = await contract.methods.getArtHistory(artId).call()
    let result = []
    for (let item of rawDataArray){
      const url = await Web3.utils.hexToUtf8(item)
      const data = await getArweaveTxData(url)
      result.push({data, url})
    }
    resolve(result)
  }catch(err){
    reject(err)
  }
})


const getArtEvents = artId => new Promise(async(resolve, reject) => {
  try{
    const contract = await artFeedContractFactory()
    const data = await contract.getPastEvents('changeOwnerArt',{
      filter: {artId: artId},
      fromBlock:4861951,
      toBlock: 'latest'
    })
    const web3 = await getEth()
    for(let [index, obj] of data.entries()){
      const block = await web3.eth.getBlock(obj.blockNumber)
      data[index].timestamp = block.timestamp
    }
    resolve(data)
  }catch(err){
    reject(err)
  }
})
  
const isEthereumAddress = async(ethereumAddress) => {
  const web3 = await getEth()
  const result = await web3.utils.isAddress(ethereumAddress)
  return result
}

export{
    ART_FEED_ADDRESS,
    artFeedContractFactory,
    getArtInfoBlockchain,
    getArt,
    getArtEvents,
    isEthereumAddress,
    getArtFeed,
    getArtFeedRaw
}