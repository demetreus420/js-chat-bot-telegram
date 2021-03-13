const {MongoClient} = require('mongodb')
const client = new MongoClient('mongodb+srv://admin:admin@cluster0.fhjr9.mongodb.net/mongo?retryWrites=true&w=majority', { useUnifiedTopology: true })

const dbUpdate = async (data) => {
    try {
        await client.connect()
        const rates = await client.db().collection('rates') ?
            await client.db().collection('rates')
            :
            await client.db().createCollection('rates')
            && await client.db().collection('rates')
        
        await rates.deleteMany({})
        await rates.insertOne({...data.rates, date: Date.now()})
    } catch (err) {
        console.log('\n\tERRROR\n', err)
    }
};

const dbGetRates = async () => {
    try {
        await client.connect()
        const rate = await client.db().collection('rates').findOne({});
    
        return await rate

    } catch (err) {
        console.log('\n\tERROR\n', err)
    }
}

const dbCheckTime = async () => {
    try {
        await client.connect()
        
        const rates = await client.db().collection('rates')
        const rate = await rates.findOne({})

        return rate.date;

    } catch (err) {
        console.log('\n\tERRROR\n', err)
    }
};

module.exports = {
    dbCheckTime,
    dbGetRates,
    dbUpdate
}