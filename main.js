const { log } = require('console')
const express=require('express')
const app=express()
const Path =require('path') 
const connectDb=require('./ConnectDb/db')
const user=require('./routers/user')
const admin=require('./routers/admin')
const nocache = require('nocache')
const session = require('express-session')
const morgan = require('morgan')






app.set('views', Path.join(__dirname,'views'))
app.set('view engine','ejs')
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

app.use(express.static('public'))
app.use(morgan('dev'))
connectDb()




app.use(nocache())

app.use(session({
    secret:"mysecretkey",
    resave:false,
    saveUninitialized:true,
    cookie:{
    maxAge:1000*60*60*24
    }
}))

app.use('/user',user)
app.use('/admin',admin)

app.listen(3002, () => {
    console.log('Server is running on http://localhost:3002');
})
