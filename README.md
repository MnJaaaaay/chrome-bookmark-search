# 书签搜索助手 (Chrome 扩展)

在浏览器工具栏弹窗中快速检索书签、浏览历史、剪贴板历史与自建常用片段。所有数据仅保存在本机，不上传任何服务器。

## 功能

- 🔖 **书签搜索**：在树形结构中按关键词检索全部书签。
- 🕐 **历史搜索**：检索最近 500 条浏览历史。
- 📋 **剪贴板历史**：自动记录你在网页中复制过的文本（最多 100 条）；一键回粘。
- ⭐ **常用片段**：手动新建经常需要复制的文字片段（签名、地址、模板等），一键复制。

## 安装（开发者模式）

1. 下载或克隆本仓库。
2. 打开 `chrome://extensions/`，开启右上角的「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本仓库根目录。

## 安装（Chrome 应用商店）

待上架。

## 文件结构

```
.
├── manifest.json        # MV3 清单
├── popup.html / .js     # 工具栏弹窗 UI 与主要逻辑
├── styles.css           # 弹窗样式
├── background.js        # service worker：处理剪贴板写入
├── content.js           # 监听网页 copy 事件
├── icons/               # 扩展图标 (16/32/48/128 PNG)
├── PRIVACY.md           # 隐私政策（上架必备）
└── README.md
```

## 权限说明

详见 [PRIVACY.md](PRIVACY.md)。简言之：

- `bookmarks` / `history` — 读取自身的书签与历史用于搜索；
- `tabs` — 打开搜索命中的网址；
- `storage` — 在本机保存剪贴板历史与常用片段；
- `<all_urls>` content script — 监听网页 `copy` 事件，仅用于采集所选文本。

本扩展**不发起任何网络请求**，不收集账号或身份信息。

## 上架 Chrome 应用商店流程（自用备忘）

1. 在 [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/) 创建条目（首次需付 5 USD 一次性注册费）。
2. 上传 `bookmark-search-helper.zip`（运行 `zip` 命令打包，见下方）。
3. 填写：
   - 商品名称、简短描述（≤132 字符）、详细描述。
   - 类别选择：`生产工具 / Productivity`。
   - 至少 1 张 1280×800 截图（建议 3–5 张）；可选 440×280 推广图。
4. 隐私实践：
   - 单一用途说明：「在弹窗中检索书签 / 历史 / 剪贴板，统一的快速取用工具」。
   - `<all_urls>` 权限理由：「监听 `copy` 事件以构建本地剪贴板历史」。
   - `bookmarks` / `history` / `tabs` / `storage` 各自简述用途即可。
   - 确认「不出售用户数据」「数据仅本地处理」。
   - 隐私政策 URL：把 `PRIVACY.md` 渲染版（GitHub Pages / Gist 链接）填入。
5. 提交审核，通常 1–3 个工作日。

## 打包命令

```bash
# 在仓库根目录执行
zip -r bookmark-search-helper.zip . \
  -x "*.DS_Store" "README.md" "PRIVACY.md" "*.svg" ".git/*"
```

`README.md` 与 `PRIVACY.md` 会在 Web Store 商品页填写，无需打进 zip；`icon.svg` 是设计源文件不参与运行。

## 许可

MIT
