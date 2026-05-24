#!/bin/bash

echo "启动后端..."
cd backend_node || exit
kgx -- bash -c "node index.js; exec bash" &

echo "构建前端静态文件..."
cd ../frontend || exit
npm run build || exit 1

echo "前端已构建完成，请通过 nginx 访问: http://localhost:8081"
