import axios from 'axios'

export const calculateAverage = (numbers: number[]) => {
    console.log("API函数被调用，准备发送请求", numbers)
    return axios.post('http://localhost:3000/average', { numbers })
}
// 这个函数接受一个数字数组作为参数，并向后端发送一个POST请求，包含这个数组。后端应该处理这个请求并返回平均值。

