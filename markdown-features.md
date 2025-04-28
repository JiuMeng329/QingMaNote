# Markdown语法支持指南 📝

轻码笔记全面支持Markdown语法，让你的笔记更加结构化、美观且易于阅读。本文将介绍所有已实现的Markdown功能，帮助你快速掌握这些强大的格式化工具。

## 基础语法 ⚡

### 标题

使用`#`符号创建不同级别的标题：

```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
```

### 文本格式化

```markdown
*斜体文本* 或 _斜体文本_
**粗体文本** 或 __粗体文本__
***粗斜体文本*** 或 ___粗斜体文本___
~~删除线文本~~
```

### 列表

无序列表：
markdown
```
* 项目1
* 项目2
  * 子项目A
  * 子项目B
```

有序列表：
```markdown
1. 第一项
2. 第二项
3. 第三项
```

任务列表：
```markdown
- [x] 已完成任务
- [ ] 未完成任务
```

### 引用

```markdown
> 这是一段引用文本
> 
> 这是引用的第二段
```

### 分割线

```markdown
---
或
***
或
___
```

### 链接

```markdown
[链接文本](https://www.example.com)
<https://www.example.com>
```

### 图片

```markdown
![图片描述](图片URL)
```

## 高级语法 🚀

### 代码

行内代码：
```markdown
`console.log('Hello World')`
```

代码块：
````markdown
```javascript
function sayHello() {
  console.log('Hello World');
}
```
````

支持的代码高亮语言：
- javascript/js
- python
- java
- c/cpp
- html
- css
- json
- markdown
- sql
- bash/shell
...以及更多

### 表格

```markdown
| 表头1 | 表头2 | 表头3 |
| ----- | ----- | ----- |
| 单元格1 | 单元格2 | 单元格3 |
| 单元格4 | 单元格5 | 单元格6 |
```

对齐方式：
```markdown
| 左对齐 | 居中对齐 | 右对齐 |
| :----- | :-----: | -----: |
| 内容 | 内容 | 内容 |
```

### 数学公式

行内公式：
```markdown
$E=mc^2$
```

独立公式：
```markdown
$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$
```

### 脚注

```markdown
这里有一个脚注[^1]

[^1]: 这是脚注内容
```

### 目录生成

```markdown
[TOC]
```

## 轻码笔记特有功能 💫

### 高亮标记

```markdown
==高亮文本==
```

### 上标和下标

```markdown
H~2~O (下标)
X^2^ (上标)
```

### 自定义容器

```markdown
::: info
这是一个信息提示框
:::

::: warning
这是一个警告提示框
:::

::: success
这是一个成功提示框
:::

::: danger
这是一个危险提示框
:::
```

### 流程图支持

```markdown
```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```
```

## 快捷键支持 ⌨️

轻码笔记提供了丰富的Markdown编辑快捷键，让你的写作更高效：

| 功能 | Windows快捷键 | Mac快捷键 |
| ---- | ------------ | --------- |
| 粗体 | Ctrl+B | Cmd+B |
| 斜体 | Ctrl+I | Cmd+I |
| 链接 | Ctrl+K | Cmd+K |
| 代码块 | Ctrl+Shift+K | Cmd+Shift+K |
| 无序列表 | Ctrl+Shift+U | Cmd+Shift+U |
| 有序列表 | Ctrl+Shift+O | Cmd+Shift+O |
| 任务列表 | Ctrl+Shift+X | Cmd+Shift+X |
| 表格 | Ctrl+T | Cmd+T |
| 引用 | Ctrl+Shift+Q | Cmd+Shift+Q |

## 实时预览 👁️

轻码笔记支持实时预览功能，让你在编辑的同时即时查看Markdown渲染效果。可以选择以下预览模式：

- 分屏预览：同时显示编辑区和预览区
- 即时预览：边输入边显示渲染效果
- 纯编辑模式：专注于内容创作
- 纯预览模式：查看最终效果

## 导出选项 📤

你可以将Markdown笔记导出为以下格式：

- HTML
- PDF
- Word文档
- 图片
- 纯文本

---

通过掌握这些Markdown语法，你可以在轻码笔记中创建结构清晰、格式丰富的笔记和文档。如有任何问题，欢迎随时联系我们的支持团队！ 