# 书签搜索助手 (Chrome 扩展)

在浏览器工具栏弹窗中快速检索书签、浏览历史、剪贴板历史与自建常用片段。所有数据仅保存在本机，不上传任何服务器。

## 功能

- 🔖 **书签搜索**：在树形结构中按关键词检索全部书签。
- 🕐 **历史搜索**：检索最近 500 条浏览历史。
- 📋 **剪贴板历史**：自动记录你在网页中复制过的文本（最多 100 条）；一键回粘。
- ⭐ **常用片段**：手动新建经常需要复制的文字片段（签名、地址、模板等），一键复制。

## 安装（开发者模式）

1. 下载或克隆本仓库 `main` 分支。
2. 打开 `chrome://extensions/`，开启右上角的「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本仓库根目录（包含 `manifest.json` 那一层）。

## 安装（Chrome 应用商店）

待上架。

## 仓库分支约定

| 分支 | 内容 |
|---|---|
| `main` | 扩展运行所需的纯净代码。**禁止放任何以 `_` 开头的文件**（Chrome 会拒载） |
| `gh-pages` | GitHub Pages 站点源（含 `_config.yml` Jekyll 主题等），仅用于渲染隐私政策页 |

隐私政策线上版本：<https://mnjaaaaay.github.io/chrome-bookmark-search/PRIVACY.html>

## 文件结构（main 分支）

```
.
├── manifest.json        # MV3 清单
├── popup.html / .js     # 工具栏弹窗 UI 与主要逻辑
├── styles.css           # 弹窗样式
├── background.js        # service worker：处理剪贴板写入
├── content.js           # 监听网页 copy 事件
├── icons/               # 扩展图标 (16/32/48/128 PNG)
├── PRIVACY.md           # 隐私政策（GitHub 上展示，不打进 zip）
└── README.md
```

## 权限说明

详见 [PRIVACY.md](PRIVACY.md)。简言之：

- `bookmarks` / `history` — 读取自身的书签与历史用于搜索；
- `tabs` — 打开搜索命中的网址；
- `storage` — 在本机保存剪贴板历史与常用片段；
- `<all_urls>` content script — 监听网页 `copy` 事件，仅用于采集所选文本。

本扩展**不发起任何网络请求**，不收集账号或身份信息。

## 上架 Chrome 应用商店流程

1. 在 [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/) 创建条目（首次需付 5 USD 一次性注册费）。
2. 上传 `clipbook.zip`（用下方命令打包，**不要用 Finder 右键压缩**）。
3. 填写：
   - 商品名称、简短描述（≤132 字符）、详细描述。
   - 类别选择：`生产工具 / Productivity`。
   - 至少 1 张 1280×800 截图（建议 3–5 张）；可选 440×280 推广图。
4. 隐私实践：
   - 单一用途说明：「在弹窗中检索书签 / 历史 / 剪贴板 / 常用片段，统一的快速取用工具」。
   - `<all_urls>` 权限理由：「监听 `copy` 事件以构建本地剪贴板历史」。
   - `bookmarks` / `history` / `tabs` / `storage` 各自简述用途即可。
   - 隐私政策 URL：<https://mnjaaaaay.github.io/chrome-bookmark-search/PRIVACY.html>
   - 确认「不出售用户数据」「数据仅本地处理」。
5. 提交审核，通常 1–3 个工作日。

## 打包命令

**用显式白名单，不要 `zip -r .`** —— 后者很容易把 `.git/`、Finder 残留或新增的 `_*.yml` 等夹带进去导致 Chrome 拒载。

```bash
# 在仓库根目录执行；产出物放上一级目录避免被 git 跟踪
zip -r ../clipbook.zip \
  manifest.json popup.html popup.js styles.css \
  background.js content.js icons/ \
  -x "*.DS_Store"
```

打包后用 `unzip -l ../clipbook.zip` 检查应该正好 11 个文件，不超过 50 KB。

## 关键避坑

- **绝不在 `main` 根目录放以 `_` 开头的文件**（Chrome 视为系统保留名，拒载整个扩展）。Jekyll/Pages 配置只能放 `gh-pages` 分支。
- **不要用 macOS Finder 的"压缩"打包**。Finder 会塞进 `__MACOSX/` 影子目录，Chrome 解析时会报警告甚至失败。
- 改完代码要发新版本时，记得递增 `manifest.json` 里的 `version`（如 `2.0.0` → `2.0.1`）后再 `zip` 上传。

## 许可

MIT
