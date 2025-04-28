# 将轻码笔记项目上传到GitHub指南

## 前提条件

1. 安装Git
2. 拥有GitHub账号

## 步骤一：安装Git

由于您的系统上尚未安装Git（通过命令检测结果），请先安装Git：

1. 访问Git官网下载页面：https://git-scm.com/downloads
2. 下载Windows版本的Git安装程序
3. 运行安装程序，按照默认选项安装即可
4. 安装完成后，可以通过在命令提示符或PowerShell中运行`git --version`来验证安装是否成功

## 步骤二：在GitHub上创建仓库

1. 登录您的GitHub账号（如果没有，请先在[GitHub](https://github.com)注册）
2. 点击右上角的+号，选择"New repository"
3. 填写仓库名称，例如"markmark"
4. 添加描述（可选）："轻码笔记 - 一个Markdown编辑器小程序"
5. 选择仓库可见性（公开或私有）
6. 不要勾选"Initialize this repository with a README"（因为我们将上传已有代码）
7. 点击"Create repository"

## 步骤三：初始化本地Git仓库并上传代码

在您的项目目录（e:\markmark1.0.0）中打开命令提示符或PowerShell，然后执行以下命令：

```bash
# 初始化Git仓库
git init

# 添加所有文件到暂存区
git add .

# 提交更改
git commit -m "初始提交：轻码笔记项目"

# 添加远程仓库（替换YOUR_USERNAME为您的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/markmark.git

# 推送到GitHub
git push -u origin master
```

执行最后一步时，系统会要求您输入GitHub的用户名和密码（或个人访问令牌）。

## 注意事项

1. 如果您使用的是较新版本的Git，默认分支可能是`main`而不是`master`，请根据实际情况调整命令
2. 如果遇到身份验证问题，可能需要设置个人访问令牌(PAT)，详情请参考[GitHub文档](https://docs.github.com/cn/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
3. 首次使用Git时，需要设置用户名和邮箱：
   ```bash
   git config --global user.name "您的名字"
   git config --global user.email "您的邮箱"
   ```

## 后续操作

成功上传代码后，您可以在GitHub上查看您的代码库，进行进一步的操作，如创建分支、处理Pull Request等。