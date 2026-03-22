import request from "./request"

//定义返回的数据结构(根据抽卡网页控制台响应)
export interface GachaItem {//每一条抽卡记录的结构
    cardPoolType: string;
    resouceId: string;
    qualityLevel: number;
    resourceType: string;
    name: string;
    count: number;
    time: string;
}

export interface GachaResponse {//整个响应的结构
    code: number;
    message: string;
    data: GachaItem[];//
}

export function getGachaData(url: string): Promise<GachaResponse> {
    return request({
        url: "/api/gacha/proxy",
        method: "post",
        data: {
            url
        }
    });
}
// 该函数接受一个URL字符串作为输入，调用后端的代理接口来获取抽卡数据。
// 函数使用了request函数来发送HTTP POST请求，请求的URL是"/api/gacha/proxy"，请求体中包含了一个字段url，其值就是传入的URL参数。
// 函数返回一个Promise对象，解析后会得到一个GachaResponse类型的数据结构，其中包含了抽卡记录的详细信息。