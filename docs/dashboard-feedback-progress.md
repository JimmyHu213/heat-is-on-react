# Dashboard Feedback 开发进度表

来源：`New Dashboard Feedback.xlsx`，`Sheet1`（原文件：`C:\Users\jimmy\Downloads\New Dashboard Feedback.xlsx`）。

当前发布版本为 `feat/workshop-dashboard` / `5c0d822`，已在 [heat-is-on.web.app](https://heat-is-on.web.app) 核对线上构建。原始代码核对基线为 2026-11-18 的 `main` / `4a8361c`（#13）。2026-11-19 根据品牌邮件、三张附件和五条交互反馈更新相关条目，对照本地 `c6a84da`。其余条目沿用原核对记录。

## 状态与验收口径

- ✅ 已完成：已检查对应代码，未发现阻止该项使用的已知问题。
- ◐ 部分完成：已有实现，但仍有缺陷、素材缺口或验收步骤。
- ☐ 待开发：需求已明确，等待实现。
- ⏳ 待确认：依赖最终文案、素材或产品决定。
- 只有 ✅ 项可计为开发完成；这不等同于已通过浏览器、模拟器、投影设备或用户验收。状态列与下方待办清单应同步维护。
- Excel 行号保留原始定位；一条反馈包含多个交付内容时拆开记录。检查证据均链接到当前仓库文件。

## 需求进度

截至 11 月 20 日共 50 项，11 月 23 日新增的 8 项见文末 DF-51 至 DF-58。此前 50 项中 ✅ 已完成 45 项，◐ 部分完成 5 项。DF-01 至 DF-44 可追溯到原始 Excel，DF-45 至 DF-50 来自后续反馈。

本批次 15 个条目的实施顺序、文件和验收方法见[工作坊仪表盘开发计划](superpowers/plans/2026-11-19-workshop-dashboard-revision.md)。

| ID | Excel 行 | 需求 / 验收目标 | 状态 | 当前实现与剩余工作 |
| --- | --- | --- | --- | --- |
| DF-01 | 2 | 尽可能放大灾害转盘 | ◐ | [HazardWheel](../src/components/Game/components/HazardWheel.jsx) 使用 340×340 SVG，实际容器为 `min(440px, 52vh)`；已有大型弹窗，仍需在目标 16:9 投影分辨率验收大小和裁切。 |
| DF-02 | 3 | 增加 Mystery `?` 格子 | ✅ | [wheel.js](../src/game/wheel.js) 定义五种灾害与一个 Mystery；[HazardControls](../src/components/Game/components/HazardControls.jsx) 对 Mystery 显示提示、不自动应用灾害。最终行为决定见 Q-03。 |
| DF-03 | 4 | 恢复四张跨灾害卡牌 | ✅ | [cards.js](../src/constants/cards.js) 包含 Green industries、Community events、Health services、Protected areas；[CardControls](../src/components/Game/components/CardControls.jsx) 使用完整 19 张卡牌列表。 |
| DF-04 | 5 + 后续反馈 | 六张城镇卡片保持正方形，桌面三列两行，随窗口宽高缩放 | ◐ | 宽屏将阶段栏和标签移至图表左侧，网格按右区剩余宽高计算正方形尺寸。每个城镇名在卡片底部独立显示。在 1280×720 至 2560×1440 的浏览器中验证六图同屏，手机和平板分别回落到一列和两列。真实投影设备验收仍待执行。 |
| DF-05 | 6 | 删除非最后一次的错误出牌（原反馈：不紧急） | ✅ | [GameTable](../src/components/Game/components/GameTable.jsx) 和 Adapt 控件已有删除入口；BUG-02 已修复，多年度卡牌按已生效年度数扣除效果，费用只退一次，模拟器验证通过。 |
| DF-06 | 7 | 出牌时看见城镇 NESH 实时变化，避免遮挡 | ◐ | [Game](../src/components/Game/index.jsx) 出牌保存成功后浮动面板收起，对应城镇分数以约 1.2 秒动画过渡，浏览器已验证。仍需在真实投影设备验收可见性。 |
| DF-07 | 7、16 + 新反馈 | 灾害 GIF 循环播放，主持人手动关闭后，六镇雷达图再缓慢收缩到灾后数值 | ✅ | Game 在保存前冻结灾前图表。循环动画优先使用 WebP，主持人手动关闭后，六镇同步过渡约 1.2 秒。 |
| DF-08 | 8 | 在合作伙伴区显示正式 Inspiring Tasmania Logo | ✅ | Footer 已使用正式图档，登录页和站内页脚共用配置。 |
| DF-09 | 8 | 合作伙伴区使用新版 UTAS Logo | ✅ | Footer 已使用 2026 横版标识，图档等比显示。 |
| DF-10 | 9 | 保留现行版权文字 | ✅ | 邮件确认接受当前页脚版权信息，见 [mediaConfig](../src/constants/mediaConfig.js) 和 [Footer](../src/components/common/Footer.jsx)。 |
| DF-11 | 10、14 | Dividends 阶段改名 Reward for effort | ✅ | [StageBar](../src/components/Game/components/StageBar.jsx)、[DividendsDialog](../src/components/Game/components/DividendsDialog.jsx) 和总结页已使用新名称。内部标识保留 `dividends`。 |
| DF-12 | 11 | Adapt 标题改为指定问题，去掉副标题 | ✅ | StageBar：`What adaptations will you choose for your town?`；步骤不再显示副标题。 |
| DF-13 | 12 | Event 标题改为指定问题，去掉副标题 | ✅ | StageBar：`Will Adaptania face a climate hazard this year?`。 |
| DF-14 | 13 | Review 标题改为指定问题，去掉副标题 | ✅ | StageBar：`How resilient is Adaptania now?`。 |
| DF-15 | 14 + 新反馈 | 移除阶段栏中原第三步 Review 的独立展示，将其文案 `How resilient is Adaptania now?` 移至原第四步，替换该步标题 `Reward for effort` | ✅ | StageBar 只显示三个入口。最后一步显示原 Review 文案，返回 Event、奖励和结算继续由 Review 状态承载。 |
| DF-16 | 15 | 转盘和事件可通过下拉入口访问 | ◐ | 通过左下角浮动按钮访问；[HazardControls](../src/components/Game/components/HazardControls.jsx) 仅在 Event 阶段允许应用灾害。与“always available via dropdown”的具体预期需确认。 |
| DF-17 | 15 | 可以从 Review 返回 Event | ✅ | StageBar 提供 `Back to Event`；[stages.js](../src/game/stages.js) 允许返回，达到每轮五次灾害上限时禁止。 |
| DF-18 | 17 | 同一轮连续应用灾害，包括相同灾害两次 | ✅ | [gameSessionService](../src/services/gameSessionService.js) 按次数追加灾害，未按类型去重；每轮最多五次。 |
| DF-19 | 18 | 移除出牌 / 灾害的“是否确定”确认界面 | ✅ | CardControls 和 HazardControls 直接调用操作；此项不代表所有控制面板都不遮挡图表，见 DF-06/07。 |
| DF-20 | 21 | Town details：Budget points 改为 Effort points | ✅ | [TownDetailsView](../src/components/Game/components/TownDetailsView.jsx) 的显示与编辑字段均使用 Effort Points。 |
| DF-21 | 22 | 去掉 Bludgeton 的 Comparison town 文案 | ✅ | 城镇卡片、详情、历史与总结未展示该徽章；比较城镇的内部身份和操作限制保留。 |
| DF-22 | 24 | 总结页增加出牌总数 | ✅ | [GameSummaryDialog](../src/components/Game/components/GameSummaryDialog.jsx) 已展示统计；BUG-03 已修复，真实 React Context 浏览器验证确认撤销后统计立即归零。 |
| DF-23 | 25 | 游戏时长由 rounds 改为 over X years | ✅ | GameSummaryDialog 使用 `over X years`，单年使用 `year`。 |
| DF-24 | 27 | Resilience Highlights 改为 Most resilient town | ✅ | GameSummaryDialog 已更新，并支持并列。 |
| DF-25 | 28 | Biggest event challenge 改为 Most impacted town | ✅ | GameSummaryDialog 已更新；旧存档缺少完整影响数据时不展示该排名。 |
| DF-26 | 29 | 增加 Most popular climate adaptation | ✅ | [summary.js](../src/game/summary.js) 计算频次、支持并列和零出牌；BUG-03 已修复，撤销后用于总结的卡牌明细同步更新。 |
| DF-27 | 31 | 时间线改为 Events experienced，round 改为 year | ✅ | GameSummaryDialog 使用新标题及 `Year 2051` 等标签。 |
| DF-28 | 32 | 删除 Every town including Bludgeton 标题 | ✅ | 总结表不再显示该标题。 |
| DF-29 | 33 | Final resilience 改为 Average Resilience | ✅ | 总结表头已更新。 |
| DF-30 | 34 | Event loss 改为 Hazard impact | ✅ | 总结表头已更新。 |
| DF-31 | 35 | 总结表删除 Segments <20% | ✅ | 总结表已移除该列；城镇翻面图仍有弱分区提示，不在本条删除范围内。 |
| DF-32 | 36 | 总结表 Dividends 改为 Reward for effort | ✅ | 总结表头已更新。 |
| DF-33 | 37 | 总结表删除 Budget | ✅ | 总结表未显示 Budget / Final Budget 列。 |
| DF-34 | 40–41 | 移除翻面雷达图，改为粗彩色 NESH 柱状图 | ✅ | TownPieChart 翻面使用四条 NESH 彩色进度条；正面灾害分区圆图保留。 |
| DF-35 | 42 | N/E/S/H 分别按五个灾害分区求和除以 5 | ✅ | [scores.js](../src/game/scores.js) 的 `neshAverages` 对每个维度分别计算五种灾害的平均值。 |
| DF-36 | 44–45 + 品牌邮件 | 统一所有 NESH 图表及图例的四个维度颜色 | ✅ | palette.js 已更新四个色值，城镇卡背面和总结图共用。 |
| DF-37 | 48 | NESH Resilience Summary：排除 Bludgeton、五镇平均、百分比 | ✅ | [BarChartsView](../src/components/Game/components/BarChartsView.jsx) 已更新标题，过滤比较城镇，按 N/E/S/H 求平均并使用 0–100% 轴。 |
| DF-38 | 51 | Towns Resilience Summary：更名、百分比 | ✅ | BarChartsView 已更新标题，以各镇平均韧性百分比展示。 |
| DF-39 | 53 | 允许补改遗漏的游戏历史 | ◐ | GameTable 可补录已进行轮次的卡牌和删除出牌；BUG-01/02/03 已修复，历史卡牌事务验证通过。灾害编辑和已结束游戏编辑不在当前实现中，仍需确认范围（Q-04）。 |
| DF-40 | 56、58–60 | 欢迎页提供 Time Machine 入口，移除 Global Scenario 入口 | ✅ | [Game](../src/components/Game/index.jsx) 已提供 Time Machine 卡片，Global Scenario 入口已移除。欢迎页两段视频的组合和顺序见 DF-49。 |
| DF-41 | 57 | 从开场页删除原三步说明 | ✅ | 开场页已替换为视频卡片，不再显示原 01/02/03 步骤。 |
| DF-42 | 58、61 | 顶部增加 NESH explainer 视频按钮 | ✅ | Game 顶部已有按钮和播放器，已导入 Understanding NESH 至 `nesh-explainer.mp4`。视频已上线。体积处理见[素材清单](media-assets.md)。 |
| DF-43 | 63 | 提供返回 opening screen 的入口 | ✅ | Game 顶部提供 Opening Screen；已开始的游戏可再返回 Live Dashboard。 |
| DF-44 | 64 + 后续反馈 | Town Details 显示总体韧性和每种灾害的 N/E/S/H 分数 | ✅ | 恢复为紧凑表格，直接读取当前城镇分数。 |
| DF-45 | 品牌邮件 | 主标题使用 Fredoka SemiBold，游戏标题统一显示为 `THE HEAT IS ON`，正文使用 Figtree | ✅ | Fredoka 和 Figtree 随站点加载，两个游戏标题均用大写。 |
| DF-46 | 品牌邮件 | 登录页封面使用 Adaptania 地图 | ✅ | 登录页使用 Adaptania 地图，替代文字已更新，旧照片署名已移除。 |
| DF-47 | 新反馈 1 | 游戏欢迎页默认展示五个灾害的小图标，点击其中一个放大对应图标 | ✅ | Opening Screen 默认显示五个按钮，分别打开对应的放大图标。 |
| DF-48 | 新反馈 4 | 游戏进行期间隐藏两张汇总柱状图，游戏结束后在 View Summary 中展示 | ✅ | GameSummaryDialog 在游戏结束后显示两张汇总图。实时仪表盘显示六镇卡片。 |
| DF-49 | 新反馈 5 | 欢迎页视频区只显示两个相邻入口，顺序为 ① Time Machine、② NESH Explainer | ✅ | 欢迎页视频入口顺序已更新。保留顶部 NESH Explainer 入口。 |
| DF-50 | 后续反馈 | 改名时可选六种雷达图名称框背景色 | ✅ | 名称和颜色一次写入城镇文档。旧文档继续使用默认青绿。已验证仅改颜色、同时改名和颜色，以及刷新后显示。 |

## 已知缺陷与修复待办

以下三个问题来自 2026-11-18 对 #13 的代码审查，已修复、验证，并于同日发布至 Firebase 项目 `heat-is-on`。P1/P2 保留发现时的优先级；代码尚未提交。

- [x] **BUG-01 / P1：补录已过期卡牌被规则拒绝。** 创建规则现接受布尔型 `isActive`，允许已无未来效果的历史出牌写入 `false`；所属用户校验保留。模拟器确认第 3 轮补录第 1 轮单年度卡原子提交成功，可撤销，且跨用户访问仍被拒绝。关联 DF-39。
- [x] **BUG-02 / P1：历史多年度卡牌增删只算一次效果。** 服务按 `effectiveRounds` 中不晚于当前轮次的条目数计算效果，费用只扣退一次；仅有未来效果的卡牌保持 active。退款不超过规则的 9999 上限，分数仍限制在 0–100。单元及模拟器验证补录、未来续效和删除通过，已结算 `round_stats` 不重写。关联 DF-05/39。
- [x] **BUG-03 / P2：撤销后未刷新卡牌明细。** `revertToPreviousState` 同步刷新 `townCardPlays` 与 `townCardPlayDocs`；登出也清理明细。真实 Chromium + React Provider + 模拟器验证“出牌 → 撤销”，卡牌明细与总结计数均从 1 变为 0，无需刷新页面。关联 DF-22/26/39。

证据：[gameSessionService.js](../src/services/gameSessionService.js)、[cards.js](../src/game/cards.js)、[GameContext.jsx](../src/contexts/GameContext.jsx)、[firestore.rules](../firestore.rules)。

修复前已观察到回归用例失败：BUG-01 为模拟器权限拒绝；BUG-02 为实际效果次数不足；BUG-03 为浏览器中撤销后仍有 1 条明细和 1 次出牌统计。修复后对应验证全部通过。历史编辑沿用设计中的当前状态加减效果方案，不回放灾害、不重算已结算的统计或奖励。

2026-11-18 已依次部署更新后的 `firestore.rules` 和前端至 [heat-is-on.web.app](https://heat-is-on.web.app)。线上首页引用 `index-DbSNDdtd.js`，下载的 JS 与本地构建逐字节一致。未自动修正过去已被错误历史编辑影响的存档，也未在生产环境写入测试游戏。

## 待确认与素材交付

- [x] **Q-01** 邮件已确认保留现有版权信息，DF-10 已结项。
- [x] **Q-02** 邮件已确认四个 NESH 色值，实施见 DF-36。
- [ ] **Q-03：** 确认 Mystery 落点的最终规则。原表只要求 `?` 格；当前行为为提示后不自动应用灾害，主持人可手动选择。
- [ ] **Q-04：** 确认历史编辑范围：仅卡牌，还是包含灾害、已结束游戏；是否需要更改已结算历史统计。现有设计不重算不可变的 `round_stats`。
- [ ] **Q-05** 确认转盘在非 Event 阶段的访问范围，以及转盘是否影响观看 DF-07 的收缩动画。灾害 GIF 的手动关闭方式已确定。
- [x] **ASSET-01** 已核对 `D:\Projects\heat_is_on` 中的 `inspiring_tas_logo_500x500px (1).png`，500 × 500，Inspiring Australia Tasmania 彩色标识。接入见 DF-08。
- [x] **ASSET-02** 已核对同目录的 `UTAS-#1-Climate_THE-Rankings-2026_HOR_MONO.png`，3800 × 415，含气候行动排名的 UTAS 横版标识。接入见 DF-09。
- [x] **ASSET-03** Time Machine 和 NESH Explainer 素材均已提供，欢迎页排版见 DF-49。Global Scenario 已移出欢迎页需求。
- [x] **ASSET-04** 已导入 5 个灾害 GIF、6 个网页图标、5 张介绍图及 2 段视频。新的展示要求见 DF-07、DF-47。
- [x] **ASSET-05** 已核对同目录的 `Adaptania-Map-nosigns.jpg`，1200 × 849，Adaptania 岛屿插画。接入见 DF-46。
- [ ] **UAT-01：** 在目标 16:9 投影屏幕验收六镇布局、字号、转盘尺寸、滚动和操作遮挡。

## 验证记录

| 日期 | 验证 | 结果 / 边界 |
| --- | --- | --- |
| 2026-11-18 | 读取反馈原文件 | Sheet1，A1:E64；已按原始行号记录需求。 |
| 2026-11-18 | 对照 main / 4a8361c 静态核对 | 核对组件、规则、算分函数、卡牌数据和媒体文件存在情况；此时未运行浏览器验收。 |
| 2026-11-18 | `npm test`（此前代码审查执行） | 13 个测试文件通过；不覆盖以上全部缺陷路径。 |
| 2026-11-18 | `npm run lint`（此前项目近况检查执行） | 0 errors、6 warnings。 |
| 2026-11-18 | `npm run build`（此前项目近况检查执行） | 构建通过，有产物体积警告。 |
| 2026-11-18 | 修复后 `npm test` | 13 个测试文件通过，含 4 个新增卡牌效果 / 退款回归用例。 |
| 2026-11-18 | 修复后 `npm run test:emulator` | 7/7 通过，含 3 个新增历史编辑用例，覆盖原子保存、撤销、未来续效、多年度删除、不可变统计及跨用户拒绝。 |
| 2026-11-18 | 修复后 Chromium + React Context 验证 | 临时浏览器脚本 `/tmp/heat-undo-browser.mjs` 挂载真实 AuthProvider / GameProvider，并连接本地模拟器；先复现撤销后明细与总结计数残留，再确认修复后均归零。不是完整页面交互验收。 |
| 2026-11-18 | 修复后 Lint / Build | Lint 0 errors、6 个原有 warnings；生产构建通过，保留原有产物体积警告。 |
| 2026-11-18 | 生产部署与只读核验 | `npm run build` 后，`firebase deploy --only firestore:rules --project heat-is-on --non-interactive`、`firebase deploy --only hosting --project heat-is-on --non-interactive` 均成功。线上首页加载本次 JS，产物内容与本地一致；未执行生产游戏写入验收。 |
| 2026-11-18 | 素材导入验证（尚未部署） | 18 个源素材复制校验一致，构建产物包含全部文件；13 个测试文件通过，Lint 无错误，构建通过。Chromium 本地生产预览确认两段 2560×1440 视频可解码并开始播放。详见[素材清单](media-assets.md)。 |
| 2026-11-19 | 工作坊改版回归 | 单元测试 70 项、Firebase 模拟器测试 7 项通过。Lint 0 错误、6 条既有警告。构建通过。Chromium 验证登录封面、欢迎页媒体、1280×720 与 1920×1080 六镇同屏、同灾害连续动画、中途刷新、Review 重开、正常及提前结束的总结。 |
| 待执行 | 全部反馈的浏览器与投影流程验收 | 已完成本次三个缺陷的定向验证；其余布局、视频素材、投影等验收仍待执行。 |

## 维护记录

| 日期 | 进度更新 |
| --- | --- |
| 2026-11-18 | 根据 Excel 建立需求基线，对照 #13 标记开发状态，登记三个已知缺陷、素材缺口及验收事项。 |
| 2026-11-18 | 本地修复 BUG-01/02/03，新增单元与模拟器回归测试并通过真实 React 浏览器验证；DF-05/22/26 更新为完成。提交号待提交后补充。 |
| 2026-11-18 | 构建前端并部署 Firestore 规则、Hosting 至 `heat-is-on`，完成线上构建文件核验。发布源为本地未提交修复，提交号待补充。 |
| 2026-11-18 | 从用户提供的两个 Downloads 文件夹导入 18 个素材，接入 Time Machine / NESH 视频和网页 PNG 图标，更新署名来源与[素材清单](media-assets.md)。DF-42 更新为完成；素材尚未提交或部署。 |
| 2026-11-19 | 已确认沿用线上规则：15 张灾害专属适应卡每张统一收费 15 EP，`origin/dev` 按持续年数收取 10 / 20 / 30 EP 的改动不纳入。此版本仅提供英文界面与英文介绍视频，中英切换及中文介绍视频不属于本次范围。 |
| 2026-11-19 | 核对品牌邮件及三张原图，更新 DF-07/08/09/10/15/36，新增 DF-45 至 DF-48。本次更新开发清单。 |
| 2026-11-19 | 追加 DF-49，明确欢迎页视频顺序，同步关闭 DF-40 的 Global Scenario 素材依赖。 |
| 2026-11-19 | 工作坊改版实现品牌、欢迎页媒体、阶段展示、GIF 和结束总结。DF-01/04/06 等待真实投影验收，DF-16/39 等待产品确认。 |
| 2026-11-19 | `af44905` 已发布网页及 Firestore 规则。城镇名称颜色为可选字段，旧存档显示默认青绿，无需迁移。 |
| 2026-11-19 | `63b2433` 已发布响应式 WebP 地图、循环 WebP 灾害动画、分阶段预载和版本化长缓存。已核对线上响应。 |
| 2026-11-20 | 记录收尾状态。线上运行 `5c0d822`，出牌后以约 1.2 秒过渡到保存后的分数。70 项单元测试通过，浏览器已验证动画，线上构建与本地逐字节一致。待办为 DF-01/04/06 真实投影验收及 DF-16/39 产品确认。 |

后续每次修复或交付：更新对应 DF 状态与证据，勾选完成的缺陷 / 素材 / 验收项，在验证记录写明执行结果，并在维护记录追加日期与提交号。已确认的问题修复前，相关需求保持 ◐。

## 2026-11-23 工作坊功能验收 · DF-51 至 DF-58

下列 8 项已进入本地验收版本（分支 `feat/workshop-feedback`），复选框留给主持人。计分依据为 `Heat Is On Scoring.xlsx` 的 Sheet1 第 25–29 行，Mystery 使用同批提供的 `Mystery.gif`（1920 × 1080）。

| 核对 | 项目 | 操作和预期 |
| --- | --- | --- |
| ☐ DF-51 | 灾害扣分 | 本地版按表格仅扣受灾分区的 N/E/S/H，最低为 0。用未出牌的 Town 1，依次触发 Bushfire 和 Flood。第一次后 Bushfire 为 10/30/20/20，第二次后 Bushfire 仍为 10/30/20/20，Flood 为 60/50/65/65。表格没有列出低分连带惩罚，这项解释待主持人确认。 |
| ☐ DF-52 | 连续出牌 | Play Cards 中给 A 镇依次打出两张不同牌，再给 B 镇打一张。核对面板内余额与记录，点击 Done 后观察两镇圆图的累计变化。 |
| ☐ DF-53 | 有效期内禁止重选 | A 镇在 2051 年打出 Floodwater Soaks，2051 和 2052 年该牌标为 In play；同年 B 镇可选，2053 年 A 镇可再次选择。刷新和历史补录同样检查有效年份。 |
| ☐ DF-54 | 先结算，再跨年 | Review 点 Settle Game，弹窗列出当年各镇奖励 EP。刷新后仍显示同一份奖励，点 Next 才进入新年。末年点 Next 进入 Game Debrief。 |
| ☐ DF-55 | 城镇翻面文案 | 在 Adapt 查看 “Click any town to flip between its NESH circle, which shows resilience to each hazard, and NESH bars, which show overall resilience across NESH dimensions”。点击一个镇，核对圆图和四维柱状图可来回切换。 |
| ☐ DF-56 | 移除选择器底部说明 | 打开 Event，切换屏幕转盘和实体转盘两种模式，底部均已移除旧的 Note 提示。 |
| ☐ DF-57 | 选择器宽度与 Mystery | 桌面弹窗宽 860px，窄屏随可用宽度缩小。转盘落到问号或在任一模式手选 Mystery 时播放附件 GIF；Close 返回选择器，Event 阶段的 Next 进入 Review。 |
| ☐ DF-58 | 洪水卡牌更名 | 在牌库和历史中核对 FLOODWATER SOAKS。它沿用原来的 flood2，费用为 20 EP、持续两年；已有出牌记录仍关联同一张牌。 |

验收环境使用 Firebase 模拟器。单元测试覆盖五种灾害的表格扣分和低分边界；模拟器覆盖并发出牌、到期重选、奖励仅发一次和末年结算。浏览器流程覆盖连续出牌、Mystery 的三个入口、窄屏选择器和奖励弹窗刷新。
