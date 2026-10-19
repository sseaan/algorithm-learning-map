# ACM 算法地图

ACM 算法知识图谱、小测和本机学习记录。小测使用洛谷题目列表的标签与难度筛选；账号 UID 对应洛谷公开练习页中的 AC 题目列表。

## 本地运行

安装 Node.js 18 或更新版本，在仓库目录运行 node server.js，再打开 http://127.0.0.1:4173/。

## 在线部署

代码仓库可放在 GitHub。完整交互功能需要 Node 服务，不能仅靠 GitHub Pages 托管。

仓库包含 Render Blueprint 配置。把 GitHub 仓库导入 Render 并创建 Web Service，Render 会运行 server.js 并托管网页和 API。

## 数据

洛谷题库接口按知识点标签和节点难度上限随机抽题；题组在抽取后固定保存在当前浏览器。公开练习页提供的已通过题目用于自动核验。账号 UID、题组、状态和笔记都保存在浏览器 localStorage，不会上传到 GitHub。
