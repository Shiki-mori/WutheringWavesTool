# 导入依赖import规范

- java.* 标准库
- javax.* 扩展库
- 第三方库
- 项目内部包

# 注解顺序建议

将核心身份标识的注解放在最上面，  
配置性或辅助性的注解放在下面。  
使得读者能立即看出组件类型，然后再看具体配置。

# Java项目依赖管理

Java项目通常使用构建工具来管理外部库，如Maven（pom.xml）或Gradle(build.gradle)。  
在这些配置文件中，声明了对第三方模块的依赖。构建项目时，构建工具将自动从远程仓库（如Maven Central）下载这些jar包到本地仓库，并将其添加到项目的Classpath中。  
编译器会识别这些jar包，虽然它们物理上不在源码目录中。

# 查看Classpath

## IDEA

### 在“项目结构”中查看

1. 点击菜单栏的 File -> Project Structure（或者快捷键 Ctrl + Alt + Shift + S / Mac: Cmd + ;）。  
2. 在左侧面板选择 Modules。  
3. 选中你的模块（例如 backend_java）。  
4. 点击右侧的 Dependencies 标签页。  

这里列出的所有 .jar 文件和文件夹就是当前模块的 Classpath。  
你可以看到每个依赖的范围（Scope），如 Compile, Runtime, Test 等。  

### 通过“外部库”视图查看

1. 在左侧的 Project 面板中（通常快捷键 Alt + 1）。
2. 滚动到最底部，找到 External Libraries（外部库）。
3. 展开它，你会看到所有已下载的依赖包（如 spring-web-5.x.x.jar, tomcat-embed-core.jar 等）。

这些 jar 包中的内容都在 Classpath 中，所以你的代码可以 import 它们。

## 命令行

Maven项目：  
在项目根目录执行：

```bash
mvn dependency:build-classpath
```

它会在控制台打印出一长串由冒号（Linux/Mac）或分号（Windows）分隔的路径。

## VScode

需要插件 `Extension Pack for Java` 和 `Maven for Java`。

### 通过“Java 项目资源管理器”查看

这是 VS Code 中管理 Java 依赖的标准方式。

1. 打开侧边栏：
    - 点击左侧活动栏中的 Java Projects 图标（通常是一个咖啡杯图标 ☕）。  
    - 如果没有看到，可以通过菜单栏 View -> Open View... -> 输入 `Java Projects` 打开。  
2. 展开依赖树：  

    - 在你的项目名（backend_java）下，找到 Maven Dependencies 节点。  
    - 展开它，你看到的每一个 .jar 文件（如 spring-web-5.3.20.jar）都是当前 Classpath 的一部分。  
注意：这里显示的是编译和运行时可用的所有库。  
3. 查看具体类的来源：  
    - 如果你在代码中按住 Ctrl (Windows/Linux) 或 Cmd (Mac) 并点击一个类名（例如 String 或 RestController），VS Code 会跳转到该类的定义。
    - 在编辑器顶部的导航或标签页标题中，你可以看到这个类来自哪个 .jar 包。这间接告诉你该类在 Classpath 中的位置。

### 通过 Maven 侧边栏查看依赖树

打开 Maven 侧边栏：

点击左侧活动栏中的 Maven 图标（通常是一个红色的 "M" 字母）。
展开项目依赖：

找到你的项目 -> Dependencies。
这里会以树状结构显示所有直接依赖和传递性依赖。
虽然这不直接显示文件系统路径，但它展示了哪些包被包含在 Classpath 中。
