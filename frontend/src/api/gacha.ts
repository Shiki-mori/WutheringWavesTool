import request from "./request"

export function getGachaData(url:string){
    return request({
        url:"/api/gacha",
        method:"get",
        params:{
            url
        }
    });
}
