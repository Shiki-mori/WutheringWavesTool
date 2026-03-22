# 随笔

*2026/3/22 16:45*  
我需要搞清楚每个接口函数是怎么串起来的。  

## 后端

- `parseUrl`  函数parseGachaUrl
函数接受一个url字符串，将字符串解析，返回包含查询参数（payload）的对象。  

- `app.post`  
接受前端输入的url字符串，将url参数传递给parseGachaUrl函数，将其返回的查询参数对象作为参数，转发请求到官方API，官方接口作出响应，将响应数据返回到前端。

## 前端

- `gacha`  函数getGachaData
定义了每一条抽卡记录的数据结构（response），将其作为一部分再定义整个响应的数据结构。  
导出一个函数`getGachaData`。这个函数接受一个url字符串，（通过request）调用后端的代理接口来获取抽卡数据。  
函数返回一个Promise对象，解析后得到响应类型的数据结构。

- `gachaAnalyze`  
点击按钮后调用该函数。将输入的url传递给getGachaData函数，将其返回结果作为result。

## fetchAll

现在要一次性抓取所有卡池的信息。  
需要写一个`fetchAll`函数，输入url，遍历卡池类型参数发送查询请求，整合后返回所有的抽卡结果。  
卡池类型参数包含在`payload`中，因此需要更改`parseGachaUrl`返回的查询参数中的`cardPoolType`值。  

但是当前后端结构app.post将接受输入和返回抽卡结果数据作为一个整体功能。可能需要拆分出其中的一个功能，在拆分节点进行`cardPoolType`参数的修改。  
显然，在parseGachaUrl返回查询参数之后，post转发请求之前，先对查询参数中的`cardPoolType`值进行遍历，对每个参数都转发一遍请求。

这个具体的函数要怎么实现呢？  
先定义除了type参数之外的基础`baseInfo`结构，再定义`pooltype`数组。对于每个数组元素，定义数据结构为`baseInfo+poolType`。  

不对不对，原来这里type参数不应该作为parseGachaUrl的返回。type参数经过测试是已知的，直接在后续进行拼接，得到完整的payload，再进行遍历。

拼接方式为`静态的baseInfo+动态的type参数`。
