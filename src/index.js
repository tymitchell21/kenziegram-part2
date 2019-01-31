const imageContainer = document.querySelector('#image-container')
let pageLoadTime = new Date().getTime()
let errCount = 0

const getLatestImages = () => {
    let interval = setInterval(() => {
        fetch('/latest', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({after: pageLoadTime})
        })
            .then(res => res.json())
            .then(data => {
                console.log('Photos Updated')
                errCount = 0
                pageLoadTime = data.timestamp
                data.images.forEach(photo => {
                    const aTag = document.createElement('a')
                    aTag.href = `./photos/${photo}`
                    const img = document.createElement('img')
                    img.src = `./uploads/${photo}`
                    img.classList.add("responsive-img")
                    img.style = "margin-bottom: 20px; border: 5px solid black;"

                    aTag.appendChild(img)

                    imageContainer.prepend(aTag)
                })
            })
            .catch(err => {
                errCount++
                if(errCount > 1) {
                    console.log('Lost connection, further updating has stopped.')
                    clearInterval(interval)
                }
            })
    }, 5000)
}

getLatestImages()
