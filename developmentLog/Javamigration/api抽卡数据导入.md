## 整体思路

输入抽卡链接，解析转发请求所需的查询参数。

将查询参数进行封装。

转发查询请求post 到官方api，获取返回的抽卡数据。

对获取的数据进行预处理。

将这些数据导入插入数据库（去重）。

## 整体架构

flowchart TD
A["GachaImportController<br/>POST /api/gacha/proxy"] --> B["ApiImportService<br/>编排入口"]  
B --> C["GachaUrlParser<br/>解析 + 封装参数"]  
B --> D["OfficialGachaApiClient<br/>转发官方 API"]  
B --> E["GachaRecordPreprocessor<br/>inSecondSeq 等"]  
B --> F["ApiGachaRecordService<br/>去重 + 入库"]  
F --> G["GameAccountMapper"]  
F --> H["ApiImportTaskMapper"]  
F --> I["ApiGachaRecordMapper"]  
F --> J["GameResourceMapper / GachaPoolMapper"]

## js代码

获取查询参数的js代码：

```js
function parseGachaUrl(url){
    try{
        const parsed=new URL(url);//URL是JavaScript内置的类，可以解析URL字符串。new URL(url)会返回一个URL对象，包含了URL的各个部分。

        const params=parsed.searchParams;//searchParams是URL对象的一个属性，是一个URLSearchParams对象，可以用来获取URL中的查询参数。

        return{
            origin:parsed.origin,//origin是URL对象的一个属性，表示URL的协议和主机部分，例如https://example.com
            path:parsed.pathname,//pathname是URL对象的一个属性，表示URL的路径部分，例如/analyze
            query:Object.fromEntries(params.entries())//entries()是URLSearchParams对象的方法，返回一个迭代器，包含了URL中的所有查询参数的键值对。Object.fromEntries()是JavaScript内置的方法，可以把一个键值对数组转换成一个对象。

            //常用字段（可能存在，将在后续测试过程中完善）
            uid:params.get("uid"),//get()是URLSearchParams对象的方法，可以获取指定查询参数的值，例如uid=12345678
            authkey:params.get("authkey")
        };
    }
    catch(err){
        return null;//如果URL无效，new URL(url)会抛出一个错误，我们捕获这个错误并返回null，表示解析失败。
    }
}

module.exports={
    parseGachaUrl
};//导出parseGachaUrl函数，使其可以在其他文件中被引入和使用。
```