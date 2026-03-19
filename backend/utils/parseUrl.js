function parseGachaUrl(url){
    try{
        const parsed=new URL(url);//URL是JavaScript内置的类，可以解析URL字符串。new URL(url)会返回一个URL对象，包含了URL的各个部分。

        const params=parsed.searchParams;//searchParams是URL对象的一个属性，是一个URLSearchParams对象，可以用来获取URL中的查询参数。

        //console.log(Object.fromEntries(params.entries()));//将URL中的查询参数转换成一个对象并打印出来
        console.log("全部参数：", Object.fromEntries(params.entries()));
        return{
        
            origin:parsed.origin,//origin是URL对象的一个属性，表示URL的协议和主机部分，例如https://example.com
            path:parsed.pathname,//pathname是URL对象的一个属性，表示URL的路径部分，例如/analyze
            query:Object.fromEntries(params.entries()),//entries()是URLSearchParams对象的方法，返回一个迭代器，包含了URL中的所有查询参数的键值对。Object.fromEntries()是JavaScript内置的方法，可以把一个键值对数组转换成一个对象。

            //常用字段（可能存在，将在后续测试过程中完善）
            //get()是URLSearchParams对象的方法，可以获取指定查询参数的值，例如uid=12345678
            playerId: params.get("playerId"),
            cardPoolId: params.get("cardPoolId"),
            cardPoolType: params.get("cardPoolType"),
            recordId: params.get("recordId")
        }
    }
    catch(err){
        return null;//如果URL无效，new URL(url)会抛出一个错误，我们捕获这个错误并返回null，表示解析失败。
    }
}

module.exports={
    parseGachaUrl
};//导出parseGachaUrl函数，使其可以在其他文件中被引入和使用。

