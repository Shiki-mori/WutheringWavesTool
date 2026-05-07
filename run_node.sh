#!/bin/bash

echo "启动后端..."
cd backend_node || exit
kgx -- bash -c "node index.js; exec bash" &

echo "启动前端..."
cd ../frontend || exit
kgx -- bash -c "npm run dev; exec bash" &