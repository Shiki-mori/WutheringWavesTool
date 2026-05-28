# nginx

原来：浏览器--vite开发服务器（npm run dev:5173）
目标：浏览器--nginx--前端静态文件

npm run dev是开发服务器，  
nginx提供打包后的静态文件。

# 修改端口

修改request.ts中为相对路径：

```ts
const request=axios.create({
    // 使用相对路径，交由 nginx(8081) 反向代理到后端
    baseURL:'/',
    timeout:5000
})
```

# 前端项目打包

```bash
cd /path/to/frontend
npm run build
```

vite项目打包后的静态文件存放在`frontend/dist`文件夹中。  
其中有`index.html`、`assets`等文件。

# nginx配置

查找opensuse的默认网页目录：

```bash
grep root /etc/nginx/nginx.conf
```

得到默认目录`/srv/www/htdocs/`。

## 新增前端配置

当前的nginx已经进行过外卖单项目配置，`etc/nginx/`中有外卖的`nginx.conf`配置文件，/srv/www/htdocs/中有外卖的静态文件。  

需要新增一个server，新增一个前端目录，新增一个端口。

### 新增目录

新建目录`/srv/www/gacha`作为抽卡项目前端目录。

将`dist/`静态文件复制到新建的前端目录下：

```bash
sudo cp -r /path/to/frontend/dist/* /srv/www/gacha/
```

gacha 目录下应有`index.html`、`assets`等文件。

### 新增.conf配置文件

```bash
sudo vim /etc/nginx/conf.d/gacha.conf
```

该文件具体内容在`frontend/nginx`目录下。

修改nginx.conf，使得conf.d中的配置生效：

```conf
http {
    include       mime.types;
    default_type  application/octet-stream;
    
    include /etc/nginx/conf.d/*.conf;
```

配置完成，访问<localhost/8081>

当前端更新时，执行npm run build重新打包，将打包后的dist/*复制到`srv/www/gacha/`目录下即可。