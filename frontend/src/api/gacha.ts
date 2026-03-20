import request from "./request"

//定义返回的数据结构(根据抽卡网页控制台响应)
export interface GachaItem {
    cardPoolType: string;
    resouceId: string;
    qualityLevel: number;
    resourceType: string;
    name: string;
    count: number;
    time: string;
}

export interface GachaResponse {
    code: number;
    message: string;
    data: GachaItem[];
}

export function getGachaData(url: string) :Promise<GachaResponse> {
    return request({
        url: "/api/gacha/proxy",
        method: "post",
        data: {
            url
        }
    });
}
