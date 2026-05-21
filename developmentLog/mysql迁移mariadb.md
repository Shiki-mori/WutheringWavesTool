由于mysql对于opensuse tumbleweed的兼容性不够好（key expired，面向suse linux enterprise 15），因此决定迁移到zypper源原生支持的mariadb。

mysql版本：8.4.8

# 数据导出

需要使用逻辑导出（SQL dump），而不是直接复制数据目录。

目的：

1. 导出全部数据库与数据
2. 保存用户权限与结构

## 确认需要导出的数据库

确认mysql运行正常：

```bash
sudo systemctl status mysql
```

查看当前数据库：

```bash
mysql -u root
```

```sql
SHOW DATABASES;
```

输出：

```text
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| analyzer           |
| car_sales          |
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
6 rows in set (0.01 sec)
```

前两个是我创建的数据库。其余为系统库。

## 使用mysqldump导出数据

```bash
mysqldump -u root -p \
  --all-databases \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  > ~/mysql_backup.sql
```

执行后需要输入数据库root密码。

--all-databases \  导出所有数据库
--single-transaction \  保证InnoDB一致性且不中断服务
--routines \  导出存储过程/函数
--triggers \  导出触发器
--events \  导出事件调度器

导出后确认文件`~/mysql_backup.sql`内容。

## 额外备份

备份Mysql配置文件：

```bash
sudo cp -r /etc/my.cnf* ~/mysql_config_backup/
```

确认mysql字符集：

```text
mysql> show variables like 'character_set%';
+--------------------------+--------------------------------+
| Variable_name            | Value                          |
+--------------------------+--------------------------------+
| character_set_client     | utf8mb4                        |
| character_set_connection | utf8mb4                        |
| character_set_database   | utf8mb4                        |
| character_set_filesystem | binary                         |
| character_set_results    | utf8mb4                        |
| character_set_server     | utf8mb4                        |
| character_set_system     | utf8mb3                        |
| character_sets_dir       | /usr/share/mysql-8.4/charsets/ |
+--------------------------+--------------------------------+
8 rows in set (0.01 sec)

mysql> SHOW VARIABLES LIKE 'collation%';
+----------------------+--------------------+
| Variable_name        | Value              |
+----------------------+--------------------+
| collation_connection | utf8mb4_0900_ai_ci |
| collation_database   | utf8mb4_0900_ai_ci |
| collation_server     | utf8mb4_0900_ai_ci |
+----------------------+--------------------+
3 rows in set (0.00 sec)
```

MariaDB可能不支持`utf8mb4_0900_ai_ci`字符集，需要记录下来，以便后续处理。

# 卸载mysql

彻底、干净地移除官方 Mysql RPM 安装，避免与 mariadb包 发生冲突。

## 停止mysql服务

停止mysql服务：

```bash
sudo systemctl stop mysql
sudo systemctl status mysql
```

确认：

```text
Active: inactive (dead)
```

## 确认mysql包

确认mysql包：

```bash
rpm -qa | grep -i mysql
```

输出：

```text
mysql84-community-release-sl15-1.noarch
lua-resty-mysql-0.28-1.2.noarch
错误：Key b7b3b788a8d3785c (MySQL Release Engineering <mysql-build@oss.oracle.com>) expired on 2025-10-23 01:26:50
mysql-community-server-8.4.8-1.sl15.x86_64
错误：Key b7b3b788a8d3785c (MySQL Release Engineering <mysql-build@oss.oracle.com>) expired on 2025-10-23 01:26:50
mysql-community-client-8.4.8-1.sl15.x86_64
错误：Key b7b3b788a8d3785c (MySQL Release Engineering <mysql-build@oss.oracle.com>) expired on 2025-10-23 01:26:50
mysql-community-client-plugins-8.4.8-1.sl15.x86_64
错误：Key b7b3b788a8d3785c (MySQL Release Engineering <mysql-build@oss.oracle.com>) expired on 2025-10-23 01:26:50
mysql-community-common-8.4.8-1.sl15.x86_64
错误：Key b7b3b788a8d3785c (MySQL Release Engineering <mysql-build@oss.oracle.com>) expired on 2025-10-23 01:26:50
mysql-community-icu-data-files-8.4.8-1.sl15.x86_64
错误：Key b7b3b788a8d3785c (MySQL Release Engineering <mysql-build@oss.oracle.com>) expired on 2025-10-23 01:26:50
mysql-community-libs-8.4.8-1.sl15.x86_64
```

## 卸载mysql软件包

```bash
sudo zypper rm mysql-community-server mysql-community-client mysql-community-client-plugins mysql-community-common mysql-community-icu-data-files mysql-community-libs mysql84-community-release
```

## 删除官方Mysql仓库

查看repo：

```bash
zypper repos
```

输出：

|#| Alias                                        | Name                         | Enabled | GPG Check | Refresh|
|---|----------------------------------------------|------------------------------|---------|-----------|--------|
| 1 | code                                         | Visual Studio Code           | 否      | ----      | ----|
| 2 | google-chrome                                | google-chrome                | 否      | ----      | ----|
| 3 | mysql-8.4-lts-community-debuginfo            | MySQL 8.4 LTS Community Se-> | 否      | ----      | ----|
| 4 | mysql-8.4-lts-community-source               | MySQL 8.4 LTS Community Se-> | 否      | ----      | ----|
| 5 | mysql-cluster-8.0-community                  | MySQL Cluster 8.0 Community  | 否      | ----      | ----|
 6 | mysql-cluster-8.0-community-debuginfo        | MySQL Cluster 8.0 Communit-> | 否      | ----      | ----
 7 | mysql-cluster-8.0-community-source           | MySQL Cluster 8.0 Communit-> | 否      | ----      | ----
 8 | mysql-cluster-8.4-lts-community              | MySQL Cluster 8.4 LTS Comm-> | 否      | ----      | ----
 9 | mysql-cluster-8.4-lts-community-debuginfo    | MySQL Cluster 8.4 LTS Comm-> | 否      | ----      | ----
10 | mysql-cluster-8.4-lts-community-source       | MySQL Cluster 8.4 LTS Comm-> | 否      | ----      | ----
11 | mysql-cluster-innovation-community           | MySQL Cluster Innovation R-> | 否      | ----      | ----
12 | mysql-cluster-innovation-community-debuginfo | MySQL Cluster Innovation R-> | 否      | ----      | ----
13 | mysql-cluster-innovation-community-source    | MySQL Cluster Release Inno-> | 否      | ----      | ----
14 | mysql-connectors-community-debuginfo         | MySQL Connectors Community-> | 否      | ----      | ----
15 | mysql-connectors-community-source            | MySQL Connectors Community-> | 否      | ----      | ----
16 | mysql-innovation-community                   | MySQL Innovation Release C-> | 否      | ----      | ----
17 | mysql-innovation-community-debuginfo         | MySQL Innovation Release C-> | 否      | ----      | ----
18 | mysql-innovation-community-source            | MySQL Innovation Release C-> | 否      | ----      | ----
19 | mysql-tools-8.4-lts-community-debuginfo      | MySQL Tools 8.4 LTS Commun-> | 否      | ----      | ----
20 | mysql-tools-8.4-lts-community-source         | MySQL Tools 8.4 LTS Commun-> | 否      | ----      | ----
21 | mysql-tools-community                        | MySQL Tools Community        | 否      | ----      | ----
22 | mysql-tools-community-debuginfo              | MySQL Tools Community - De-> | 否      | ----      | ----
23 | mysql-tools-community-source                 | MySQL Tools Community - So-> | 否      | ----      | ----
24 | mysql-tools-innovation-community             | MySQL Tools Innovation Com-> | 否      | ----      | ----
25 | mysql-tools-innovation-community-debuginfo   | MySQL Tools Innovation Com-> | 否      | ----      | ----
26 | mysql-tools-innovation-community-source      | MySQL Tools Innovation Com-> | 否      | ----      | ----
27 | mysql80-community                            | MySQL 8.0 Community Server   | 否      | ----      | ----
28 | mysql80-community-debuginfo                  | MySQL 8.0 Community Server-> | 否      | ----      | ----
29 | mysql80-community-source                     | MySQL 8.0 Community Server-> | 否      | ----      | ----
30 | openSUSE-20251109-0                          | openSUSE-20251109-0          | 否      | ----      | ----
31 | repo-debug                                   | openSUSE-Tumbleweed-Debug    | 否      | ----      | ----
32 | repo-non-oss                                 | openSUSE-Tumbleweed-Non-Oss  | 是      | (r ) 是   | 是
33 | repo-openh264                                | Open H.264 Codec (openSUSE-> | 是      | (r ) 是   | 是
34 | repo-oss                                     | openSUSE-Tumbleweed-Oss      | 是      | (r ) 是   | 是
35 | repo-source                                  | openSUSE-Tumbleweed-Source   | 否      | ----      | ----
36 | repo-update                                  | openSUSE-Tumbleweed-Update   | 是      | (r ) 是   | 是
37 | windsurf                                     | Windsurf Repository          | 否      | ----      | ----
38 | windsurfopensuse                             | windsurfopensuse             | 否      | ----      | ----

删除repo：

```bash
sudo zypper rr mysql-8.4-lts-community-debuginfo mysql-8.4-lts-community-source mysql-cluster-8.0-community mysql-cluster-8.0-community-debuginfo mysql-cluster-8.0-community-source mysql-cluster-8.4-lts-community mysql-cluster-8.4-lts-community-debuginfo mysql-cluster-8.4-lts-community-source mysql-cluster-innovation-community mysql-cluster-innovation-community-debuginfo mysql-cluster-innovation-community-source mysql-connectors-community-debuginfo mysql-connectors-community-source mysql-innovation-community mysql-innovation-community-debuginfo mysql-innovation-community-source mysql-tools-8.4-lts-community-debuginfo mysql-tools-8.4-lts-community-source mysql-tools-community mysql-tools-community-debuginfo mysql-tools-community-source mysql-tools-innovation-community mysql-tools-innovation-community-debuginfo mysql-tools-innovation-community-source mysql80-community mysql80-community-debuginfo mysql80-community-source
```

刷新zypper：

```bash
sudo zypper refresh
```

## 检查删除结果

再次执行`zypper repos`，确认MySQL相关repo已删除。

确认数据目录还存在：

```bash
sudo ls /var/lib/mysql
```

# 安装MariaDB

搜索mariadb可用包：

```bash
zypper search mariadb
```

安装：

```bash
sudo zypper install mariadb mariadb-client
```

接受到一则通知：

```text
来自软件包 mariadb 的消息：


WARNING: /etc/my.cnf.rpmsave file detected!

This probably means that you are migrating from different variant of MySQL.
Your configuration was left intact and you can see the new configuration in
/etc/my.cnf.rpmnew


You have just installed MariaDB server for the first time.

You can start it via:
 systemctl start mariadb
or
 rcmysql start

During the first start, empty database will be created for you automatically.

PLEASE REMEMBER TO SET A PASSWORD FOR THE MariaDB root USER!
To do so, start the server and run the following commands:

'/usr/bin/mysqladmin' -u root password 'new-password'
'/usr/bin/mysqladmin' -u root -h <hostname> password 'new-password'

Alternatively you can run:
'/usr/bin/mysql_secure_installation'

which will also give you the option of removing the test
databases and anonymous user created by default. This is
strongly recommended for production servers.
```

安装程序将以前的Mysql配置保留为`/etc/my.cnf.rpmsave`，并生成了MariaDB默认配置`/etc/my.cnf.rpmnew`。

暂时不要直接启动MariaDB。先隔离旧的 data dir。

移动旧数据目录：

```bash
sudo mv /var/lib/mysql /var/lib/mysql_old
```

# 启动Mariadb

完成上述准备工作后，启动Mariadb。MariaDB将创建新的数据目录：

```bash
sudo systemctl start mariadb
sudo systemctl status mariadb
```

输出状态：

```text
Active: active (running) 
```

启动mariadb：

```bash
mariadb
```

报错：

```text
ERROR 2002 (HY000): Can't connect to local server through socket '/run/mysql/mysql.sock' (2)
```

推测是由于客户端寻找错误的socket路径`/run/mysql/mysql.sock`。  
可能是当前客户端配置继承了旧Mysql的socket设置。

查看socket：

```bash
sudo ss -lx | grep mysql
```

输出：

```bash
u_str LISTEN 0      80       /var/lib/mysql/mysql.sock 182535            * 0
```

获取到正确的socket，指定该socket登录：

```bash
sudo mariadb --socket=/var/lib/mysql/mysql.sock
```

由于访问`/var/lib/mysql`需要sudo，这里也使用sudo。

成功进入mariadb。

## 修复配置

查看当前配置来源：

```bash
grep -R "socket" /etc/my.cnf*
```

输出：

```text
/etc/my.cnf:socket=/var/lib/mysql/mysql.sock
/etc/my.cnf.rpmnew:# socket     = /run/mysql/mysql.sock
/etc/my.cnf.rpmnew:# socket = /run/mysql/mysql.sock
/etc/my.cnf.rpmnew:# socket     = /var/lib/mysql/mysql.sock
/etc/my.cnf.rpmnew:# socket     = /var/lib/mysql-databases/mysqld2/mysql.sock
/etc/my.cnf.rpmnew:# socket     = /var/lib/mysql-databases/mysqld3/mysql.sock
/etc/my.cnf.rpmnew:# socket     = /var/lib/mysql-databases/mysqld6/mysql.sock
```

后续的 # 表示被注释，不必理会。  
/etc/my.cnf 的socket配置正确，可能没有被正确解析到[client]或[mysqld]。
因此客户端仍在使用编译默认值`/run/mysql/mysql.sock`。

将`/etc/my.cnf`修改为标准形式。  
在[mysqld]之前添加：

```conf
[client]
socket=/var/lib/mysql/mysql.sock
```

重启mariadb：

```bash
sudo systemctl restart mariadb
```

现在执行`sudo mariadb`可直接进入。

# 导入数据

## 检查 Mysql 8 dump兼容性

```bash
grep -n "utf8mb4_0900_ai_ci" ~/mysql_config_backup/mysql_backup.sql | head
```

产生大量输出。部分输出如下：

```text
24:CREATE DATABASE /*!32312 IF NOT EXISTS*/ `mysql` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
243:) /*!50100 TABLESPACE `mysql` */ ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci STATS_PERSISTENT=0 ROW_FORMAT=DYNAMIC;
347:INSERT INTO `help_topic` VALUES (0,'HELP_DATE',1,'This help information was generated from the MySQL 8.4 Reference Manual\non: 2024-09-13\n','',''),(1,'HELP_VERSION',1,'This help information was generated from the MySQL 8.4 Reference Manual\non: 2024-09-13 (revision: 79684)\n\nThis information applies to MySQL 8.4 through 8.4.2.\n','',''),(2,'AUTO_INCREMENT',2,'The AUTO_INCREMENT attribute can be used to generate a unique identity\nfor new rows:\n\nURL: https://dev.mysql.com/doc/refman/8.4/en/example-auto-increment.html\n\n','CREATE TABLE animals (\n     id
```

一方面字符集不兼容，另一方面，

dump使用了`--all-databases`，导出的数据库中包含系统库，这是一个重大失误。由于系统表结构不同，这些系统库不能被导入mariadb。  
不导入系统库，仅迁移业务数据库。

提取业务数据库`analyzer``car_sales`。  

临时启动旧的 Mysql 数据目录，临时恢复旧的data dir，启动mysql，仅导出业务数据库。

## 临时从旧数据库导出业务库

停止 mariadb：

```bash
sudo systemctl stop mariadb
sudo systemctl status mariadb
```

备份当前Mariadb新目录（保险起见）：

```bash
sudo mv /var/lib/mysql /var/lib/mysql_mariadb_fresh
```

恢复旧的mysql数据目录：

```bash
sudo mv /var/lib/mysql_old /var/lib/mysql
```

由于已经卸载了 Oracle Mysql Server，无法启动服务，需要手动读取数据。  

经验证，Mariadb无法直接使用 Mysql 8.4 的完整数据目录启动。  
重新设置mariadb的数据目录，使mariadb回到正常状态：

```bash
sudo mv /var/lib/mysql /var/lib/mysql_old
sudo mv /var/lib/mysql_mariadb_fresh /var/lib/mysql
sudo systemctl start mariadb
```

这个方法失败了。要继续用这个方法，将需要重新安装mysql，解决那些复杂的签名过期问题。我放弃这条路径。

## 从dump中清洗，提取业务库

dump 文件：`mysql_backup.sql`。  

提取仅包含业务库的新dump：

```bash
awk '
/^-- Current Database: `analyzer`/ {flag=1}
(/^-- Current Database: `/ && !/^-- Current Database: `analyzer`/ && flag) {exit}
flag
' ./mysql_backup.sql > ./analyzer.sql
awk '
/^-- Current Database: `car_sales`/ {flag=1}
(/^-- Current Database: `/ && !/^-- Current Database: `car_sales`/ && flag) {exit}
flag
' ./mysql_backup.sql > ./car_sales.sql
```

得到的文件中，需要解决的只有`utf8mb4_0900_ai_ci`字符集的兼容问题。

替换字符集规则：

```bash
sed -i 's/utf8mb4_0900_ai_ci/utf8mb4_unicode_ci/g' ./analyzer.sql
sed -i 's/utf8mb4_0900_ai_ci/utf8mb4_unicode_ci/g' ./car_sales.sql
```

将`0900_ai_ci`替换为`unicode_ci`。

## 将提取的业务库导入数据库

```bash
sudo mariadb < ./analyzer.sql
sudo mariadb < ./car_sales.sql
```

验证数据库：

```sql
show databases;
use analyzer;
select count(*) from analyzer_records;
```

成功导入并保留了数据。

car_sales则由于外键问题导入失败，不过无关紧要，其中并无真实数据，且拥有建库建表初始化实验数据的全套sql脚本。

# 收尾工作

删除旧的mysql数据目录，旧的Oracle配置残留：

```bash
sudo rm -r /var/lib/mysql_old
sudo rm /etc/my.cnf.rpmsave
sudo rm /etc/zypp/repos.d/mysql-community.repo.rpmsave
```

设置开机自启动：

```bash
sudo systemctl enable mariadb
```

# dbeaver连接mariadb

创建一个普通数据库用户：

```sql
create user 'dbeaver'@'localhost' identified by 'password';
```

授权：

```sql
grant all privileges on *.* to 'dbeaver'@'localhost';
flush privileges;
```

启动dbeaver，连接数据库。  
填写username：dbeaver，password：password。  
点击test connection，下载驱动，完成后连接。