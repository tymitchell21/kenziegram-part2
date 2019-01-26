const express = require('express')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const cors = require('cors')

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

app.use(express.static('./public'))
app.use(cors())

app.get('/', (req, res) => {
    fs.readdir('./public/uploads', function(err, items) {
        if (items) res.send(items)
        else res.send()
    })
})

app.post('/uploads', (req, res) => {
    upload(req, res, (err) => {
        let response = '<a style="display: flex; color: black; justify-content: center; align-items: center; width: 100px; height: 50px; background-color: lightgrey; border: 1px solid black; border-radius: 5px; text-decoration: none;" href="http://localhost:5500/index.html">Back</a>\n'
        if(err) {
            response += `<h1>${err}</h1>\n`
        } else {
            if(req.file === undefined) {
                response += `<h1>No Photo Selected</h1>\n`
            } else {
                response += `<h1>Photo Uploaded</h1>`
                response += `<img style="width: 400px;" src="./uploads/${req.file.filename}">`
            }
        }
        res.send(response)
    })
})

app.listen(3000, () => {
    console.log("App started on port: 3000!")
})