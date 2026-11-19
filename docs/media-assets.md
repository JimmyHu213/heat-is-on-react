# Workshop 素材清单

导入日期：2026-11-18。来源由 Jimmy 提供：

- `C:\Users\jimmy\Downloads\gifs`
- `C:\Users\jimmy\Downloads\For Jimmy\For Jimmy`

共 18 个文件，按下表复制到 `public/media/`，仅规范文件名，未修改内容。导入时已逐一比较 SHA-256，与源文件一致。发布前另将 NESH 视频转为网页播放版。

| 来源文件 / 目录 | 项目路径 | 当前用途 |
| --- | --- | --- |
| `gifs/Bushfire_GIF.gif` | `public/media/events/bushfire.gif` | 替换原占位动画，保留现有配置路径。 |
| `gifs/Flood_GIF.gif` | `public/media/events/flood.gif` | 同上。 |
| `gifs/Storm_Surge_GIF.gif` | `public/media/events/stormSurge.gif` | 同上。 |
| `gifs/Heatwave_GIF.gif` | `public/media/events/heatwave.gif` | 同上。 |
| `gifs/Biohazard_GIF.gif` | `public/media/events/biohazard.gif` | 同上。 |
| `Time Machine.mp4` | `public/media/time-machine.mp4` | 现有开场页 Time Machine 按钮。 |
| `Understanding NESH.mp4` | `public/media/nesh-explainer.mp4` | 现有顶部 NESH Explainer 按钮。 |
| `Web icons/Bushfire_smallweb.png` | `public/media/icons/bushfire.png` | HazardIcon 的山火图标。 |
| `Web icons/Flood_smallweb.png` | `public/media/icons/flood.png` | HazardIcon 的洪水图标。 |
| `Web icons/Storm_Surge_smallweb.png` | `public/media/icons/stormSurge.png` | HazardIcon 的风暴潮图标。 |
| `Web icons/Heatwave_smallweb.png` | `public/media/icons/heatwave.png` | HazardIcon 的热浪图标。 |
| `Web icons/Biohazard_smallweb.png` | `public/media/icons/biohazard.png` | HazardIcon 的生物灾害图标。 |
| `Web icons/Question_smallweb.png` | `public/media/icons/mystery.png` | 已用于转盘 Mystery 分区，图片失败时显示备用问号图标。 |
| `Introduce-icons/Bushfire-intro.png` | `public/media/introductions/bushfire.png` | 开场页可展开的五种灾害介绍区。 |
| `Introduce-icons/Flood-intro.png` | `public/media/introductions/flood.png` | 同上。 |
| `Introduce-icons/Stormsurge-intro.png` | `public/media/introductions/stormSurge.png` | 同上。 |
| `Introduce-icons/Heatwave-intro.png` | `public/media/introductions/heatwave.png` | 同上。 |
| `Introduce-icons/biohazard-intro.png` | `public/media/introductions/biohazard.png` | 同上。 |

## 展示范围

视频和网页灾害图标通过已有 `src/constants/mediaConfig.js` 引用接入，无需增加新页面。

开场页居中提供 Workshop Introduction 与 Time Machine 视频入口；顶部 NESH Explainer 按钮可随时打开讲解视频。所有播放器均支持控制、移动端内联播放及加载失败提示，不阻塞开始游戏。

五张灾害介绍图位于开场页可展开的 “Meet the five climate hazards” 区域。灾害应用成功后关闭转盘和抽屉，居中弹窗显示该灾害的 16:9 GIF，约 3 秒后自动关闭，也可提前手动关闭。图片加载失败时回退到灾害图标。切换阶段后隐藏，撤销操作会清除弹窗；连续触发会重新计时，关闭或卸载时清理计时器。弹窗不占据图表布局空间。

旧 `introduction-en.mp4` 也已接入 Workshop Introduction 入口；Global Scenario 按钮和缺失视频配置已移除。

此批素材没有 Global Scenario 视频、Inspiring Tasmania Logo、新版 UTAS Logo 或版权最终文案。没有把现有介绍视频自动视为 Global Scenario。

## 文件体积与发布状态

- Time Machine：85,287,984 bytes（约 81.3 MiB）。
- Understanding NESH：110,262,234 bytes（约 105.2 MiB），超过 GitHub 普通 Git 文件的 100 MiB 限制；提交前应制作网页播放版本或使用外部媒体存储。原文件仍保存在用户提供的 Downloads 目录。
- 本批导入尚未提交或部署；之前 BUG-01/02/03 的部署不包含这些新素材。

来源文件夹未附作者 / 许可文字，项目只记录提供来源；不会沿用被替换的 Google Noto GIF 署名。保留的旧 Tabler SVG 文件仍保留其原有说明和许可。

## 导入验证

- `npm test`：13 个测试文件通过。
- `npm run lint`：0 errors，保留原有 6 个 warnings。
- `npm run build`：通过，保留原有 JS 体积警告；18 个素材均进入 `dist/media/`，文件内容与项目源素材一致。
- Chromium 对本地生产预览执行真实视频解码和播放验证：Time Machine 为 2560×1440、94.079 秒；Understanding NESH 为 2560×1440、137.471 秒。两段视频均触发播放且播放时间实际推进。
- 本次没有发布线上站点，也没有运行需要写入游戏的验证。

## Firebase Hosting 配置（2026-11-19）

当前固定视频与图片随网站部署到 Firebase Hosting，不存入 Firestore，也无需新建 Cloud Storage bucket。路径集中在 `src/constants/mediaConfig.js`；Vite 将 `public/media/` 复制到 `dist/media/`，`firebase.json` 将 `dist/` 作为 Hosting 目录，并对 `/media/**` 设置一小时缓存。固定文件名的更新最多受此缓存时间影响。

准备发布时运行：

```sh
npm run build
npx firebase deploy --only hosting --project <project-id>
```

以上命令只发布 Hosting。若同一版本包含 Firestore 规则变更，应先验证和发布配套规则。

本地构建逐字节验证了 19 个素材：三个视频、五个 GIF、六个 PNG 图标和五张介绍图；测试、lint 和构建通过，保留原有警告。此次环境没有可用浏览器，未重新验证视频解码、播放或页面居中效果。

仓库使用 1920×1080 的 NESH 网页版（约 33.3 MiB，137.47 秒，H.264/AAC），包含原有音频。原始 1440p 视频仍保留在用户提供的 Downloads 目录。Firebase Hosting 单文件上限依据：[Firebase 官方说明](https://firebase.google.com/docs/hosting/faq-and-troubleshooting)。

## 2026-11-19 品牌素材

| 来源 | 项目路径 |
| --- | --- |
| `D:\Projects\heat_is_on\Adaptania-Map-nosigns.jpg` | `public/media/adaptania-map.jpg` |
| `D:\Projects\heat_is_on\inspiring_tas_logo_500x500px (1).png` | `public/media/logos/inspiring-tasmania.png` |
| `D:\Projects\heat_is_on\UTAS-#1-Climate_THE-Rankings-2026_HOR_MONO.png` | `public/media/logos/utas-climate-rankings-2026.png` |

Fredoka 和 Figtree 来自 Google Fonts 的开源字库，字体和对应 OFL 许可随站点存放在 `public/media/fonts/`。欢迎页视频区按 Time Machine、NESH Explainer 的顺序展示。游戏顶部也提供 NESH Explainer 入口。
