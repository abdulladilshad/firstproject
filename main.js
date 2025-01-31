const { log } = require('console')
const express=require('express')
const app=express()
const Path =require('path') 
const connectDb=require('./ConnectDb/db')
const user=require('./routers/user')
const admin=require('./routers/admin')
const passport = require('./ConnectDb/passport')
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


app.use(passport.initialize());
app.use(passport.session());


app.use('/',user)
app.use('/admin',admin)

app.listen(process.env.PORT, () => {
    console.log('PORT connected in http://localhost:3002');
})
