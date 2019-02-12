const express = require('express')
const fs = require('fs')
const pug = require('pug')
const multer = require('multer')
const path = require('path')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const uuidv1 = require('uuid/v1')

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    limits:{fileSize: 10000000},
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb)
    }
}).single('myImage')

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)

    if (mimetype && extname) {
        return cb(null, true)
    } else {
        cb('Error: Images Only!')
    }
}

const app = express()

app.set('view engine', 'pug')
app.use(cors())
app.use(express.static('./public'))

app.use(cookieParser())

app.get('/', (req, res) => {
    fs.readdir('./public/uploads', function(err, items) {
        items.reverse()

        fs.readFile('public/sessions.json', 'utf8', function(err, data) {

            const sessions = JSON.parse(data)

            const user = sessions[req.cookies.sessionId]

            if(user) {
                res.render('index', {
                    photos: items,
                    loggedIn: true
                })
            } else {
                res.render('index', {
                    photos: items,
                    loggedIn: false
                })
            }
        })

    })
})

app.get('/photos/:photoName', (req, res) => {
    fs.readFile('public/comments.json', 'utf8', function(err, data) {
        if (err) throw err

        const comments = JSON.parse(data)

        fs.readFile('public/sessions.json', 'utf8', function(err, data) {

            const sessions = JSON.parse(data)

            const user = sessions[req.cookies.sessionId]

            res.render('photo', {
                photo: req.params.photoName,
                comments: comments[req.params.photoName],
                user: user
            })
        })
        
    })
})

app.use(express.json())

app.post('/latest', (req, res) => {
    const after = req.body.after
    
    fs.readdir('./public/uploads', function(err, items) {
        let timestamp = 0
        let newImages = []
        items.map(photo => {
            const modified = fs.statSync(`./public/uploads/${photo}`).mtimeMs
            
            if (parseInt(modified) > parseInt(timestamp)) timestamp = modified
            if (parseInt(modified) > parseInt(after)) {
                newImages.push(photo)
            }
        })

        res.send({
            images: newImages,
            timestamp: timestamp
        })
    })
})

app.post('/uploads', (req, res) => {
    upload(req, res, (err) => {
        if(err) {
            res.render('photo', {
                photo: err
            })
        } else {
            if(req.file === undefined) {
                res.render('photo', {
                    photo: 'Photos only!'
                })
            } else {
                res.render('photo', {
                    photo: req.file.filename
                })
            }
        }
    })
})

app.use(express.urlencoded())

app.post('/comments', (req, res) => {
    fs.readFile('public/comments.json', 'utf8', function(err, data) {
        if (err) throw err

        const comments = JSON.parse(data)

        fs.readFile('public/sessions.json', 'utf8', function(err, data) {

            const sessions = JSON.parse(data)

            if (!comments[req.body.photo]) {
                comments[req.body.photo] = [{
                    username: sessions[req.cookies.sessionId],
                    comment: req.body.comment
                }]
            } else {
                comments[req.body.photo].push({
                    username: sessions[req.cookies.sessionId],
                    comment: req.body.comment
                })
            }

            fs.writeFile('public/comments.json', JSON.stringify(comments), 'utf8', (err) => {
                if(err) throw err
                console.log('the file has been saved!')
            })
    
            res.render('photo', {
                photo: req.body.photo,
                comments: comments[req.body.photo]
            })
        })
    })
})

app.get('/login', (req, res) => {
    res.render('login', {type: 'Sign in!', call: '/login'})
})

app.get('/logout', (req, res) => {
    
    res.clearCookie('sessionId')

    fs.readFile('public/sessions.json', 'utf8', function(err, data) {

        const sessions = JSON.parse(data)

        delete sessions[req.cookies.sessionId]

        fs.writeFile('public/sessions.json', JSON.stringify(sessions), 'utf8', (err) => {
            if(err) throw err
            console.log('the file has been saved!')
        })
    })

    res.render('index', {
        login: false
    })
})

app.get('/register' , (req, res) => {
    res.render('login', {type: 'Register here!', call: '/register'})
})

app.use(express.urlencoded())

app.post('/login' , (req, res) => {
    fs.readFile('public/users.json', 'utf8', function(err, data) {
        if (err) throw err

        const users = JSON.parse(data)

        if (!users[req.body.username]) {
            res.render('login', {type: 'Username not registered.  Try again.', call: '/login'})
        } else {
            if(users[req.body.username].password === req.body.password) {

                const uuid = uuidv1()
                res.cookie("sessionId", uuid)

                fs.readFile('public/sessions.json', 'utf8', function(err, data) {

                    const sessions = JSON.parse(data)

                    sessions[uuid] = req.body.username

                    fs.writeFile('public/sessions.json', JSON.stringify(sessions), 'utf8', (err) => {
                        if(err) throw err
                        console.log('the file has been saved!')
                    })
                })

                fs.readdir('./public/uploads', function(err, items) {
                    items.reverse()
                    res.render('index', {
                        photos: items,
                        loggedIn: true
                    })
                })
            } else {
                res.render('login', {type: 'Incorrect password.  Try again.', call: '/login'})
            }
        }
    })
})

app.post('/register' , (req, res) => {
    fs.readFile('public/users.json', 'utf8', function(err, data) {
        if (err) throw err

        const users = JSON.parse(data)

        if (!users[req.body.username]) {

            users[req.body.username] = {
                username: req.body.username,
                password: req.body.password
            }

            const uuid = uuidv1()
            res.cookie("sessionId", uuid)

            fs.readFile('public/sessions.json', 'utf8', function(err, data) {

                const sessions = JSON.parse(data)

                sessions[uuid] = req.body.username

                fs.writeFile('public/sessions.json', JSON.stringify(sessions), 'utf8', (err) => {
                    if(err) throw err
                    console.log('the file has been saved!')
                })
            })

            fs.writeFile('public/users.json', JSON.stringify(users), 'utf8', (err) => {
                if(err) throw err;
                console.log('the file has been saved!')
            })

            fs.readdir('./public/uploads', function(err, items) {
                items.reverse()
                res.render('index', {
                    photos: items,
                    loggedIn: true
                })
            })
        } else {
            res.render('login', {type: 'Username taken, please try a different one.', call: '/register'})
        }
    })
})

app.listen(3000, () => {
    console.log("App started on port: 3000!")
})