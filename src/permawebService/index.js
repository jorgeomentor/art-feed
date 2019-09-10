import Arweave from 'arweave/web';

const permawebService = Arweave.init({
    host: 'arweave.net',
    port: 80,           
    protocol: 'https',
    timeout: 40000,
    logging: false,
});

async function getArweaveTxData(txId){
    return new Promise(async function(resolve, reject){
      try{
        const tx = await permawebService.transactions.get(txId)
        const owner = await permawebService.wallets.ownerToAddress(tx.owner)
        let data = await JSON.parse(tx.get('data', {decode: true, string: true}))
        data.txId = txId
        data.arAddress = owner
        resolve(data)
      }catch(err){
        resolve({error:true, err})
      }
    })
}


const getArtHistory = async(artId) => {
  try{
     
    const query = {
      op: "and",
      expr1: {
        op: "equals",
        expr1: "permadApp",
        expr2: 'art-history'
      },
      expr2: {
          op: 'equals',
          expr1: 'id',
          expr2: artId
        }
    }
    
  
    const list = await permawebService.arql(query);

    if(list.length === 0){
      return []
    }else{
      let dataHistory = []
      for (let txId of list){
        const x = await getArweaveTxData(txId)
        dataHistory.push(x)
      }
      return dataHistory
    }
  }catch(err){
    console.log(err)
    return err
  }
}


export{
    permawebService,
    getArweaveTxData,
    getArtHistory
}