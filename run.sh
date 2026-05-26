# cd backend_java/gacha-server
# mvn spring-boot:run

# echo "前端已构建完成，请通过 nginx 访问: http://localhost:8081"

cd backend_java
# ./mvnw install -DskipTests
./mvnw -pl gacha-server spring-boot:run -Dspring-boot.run.profiles=dev

# 以8081端口启动：
# cd backend_java
# ./mvnw -pl gacha-server spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.arguments=--server.port=8081

# 产生端口冲突时，关闭占用8080的进程：
# lsof -i :8080
# kill <PID>