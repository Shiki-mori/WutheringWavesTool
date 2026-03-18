import axios from 'axios'

const request=axios.create({
    baseURL:'http://localhost:3000',
})

request.interceptors.response.use(
    response=>response,
    error=>{

        if(!error.response){
            return Promise.reject("无法连接到服务器，请检查服务器是否正在运行")
        }

        return Promise.reject(error.response.data.error || "请求失败")
    }
)

export default request