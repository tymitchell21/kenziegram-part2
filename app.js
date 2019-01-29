const express = require('express')
const fs = require('fs')
const pug = require('pug')
const multer = require('multer')
const path = require('path')
const cors = require('cors')
const comments = require('./public/comments')

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000},
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

app.get('/', (req, res) => {
    fs.readdir('./public/uploads', function(err, items) {
        items.reverse()
        res.render('index', {
            photos: items
        })
    })
})

app.get('/photos/:photoName', (req, res) => {
    res.render('photo', {
        photo: req.params.photoName,
        comments: comments[req.params.photoName]
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
    if (!comments[req.body.photo]) {
        comments[req.body.photo] = [{
            username: req.body.username,
            comment: req.body.comment
        }]
    } else {
        comments[req.body.photo].push({
            username: req.body.username,
            comment: req.body.comment
        })
    }
    res.render('commentSubmit', {
        photo: req.body.photo,
        username: req.body.username,
        comment: req.body.comment
    })
})

app.listen(3000, () => {
    console.log("App started on port: 3000!")
})