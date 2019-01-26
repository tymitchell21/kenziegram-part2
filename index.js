const form = document.querySelector('#form')
const imageInput = document.querySelector('#image-input')
const imagesContainer = document.querySelector('#images')
const imagePath = './public/uploads/'

async function loadPhotos () {
    fetch('http://localhost:3000/')
        .then(res => res.json())
        .then(data => {
            data = data.reverse()
            data.forEach(imageName => {
                const img = document.createElement('img')
                img.src = imagePath + imageName
                img.classList.add('responsive-img')
                imagesContainer.appendChild(img)
            })
        })
}

loadPhotos()