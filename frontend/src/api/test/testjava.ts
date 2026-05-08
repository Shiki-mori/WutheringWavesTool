import request from "../request"

request.get('/hello')
    .then(res => console.log(res.data))
    .catch(err => console.log(err))