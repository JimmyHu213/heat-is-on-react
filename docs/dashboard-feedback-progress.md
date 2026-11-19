# Dashboard Feedback 开发进度表

来源：`New Dashboard Feedback.xlsx`，`Sheet1`（原文件：`C:\Users\jimmy\Downloads\New Dashboard Feedback.xlsx`）。

最后核对：2026-11-18；代码基线：`main` / `4a8361c`（#13），以及本地尚未提交的 BUG-01/02/03 修复。本文记录反馈需求和代码实现进度，不包含 CCS 接入等其他项目范围。

## 状态与验收口径

- ✅ 已完成：已检查对应代码，未发现阻止该项使用的已知问题。
- ◐ 部分完成：已有实现，但仍有缺陷、素材缺口或验收步骤。
- ⏳ 待确认：依赖最终文案、素材或产品决定。
- 只有 ✅ 项可计为开发完成；这不等同于已通过浏览器、模拟器、投影设备或用户验收。状态列与下方待办清单应同步维护。
- Excel 行号保留原始定位；一条反馈包含多个交付内容时拆开记录。检查证据均链接到当前仓库文件。

## 需求进度

共 44 项：✅ 已完成 33 项，◐ 部分完成 10 项，⏳ 待确认 1 项。该统计按拆分后的需求项计数，不代表工作量百分比。

| ID | Excel 行 | 需求 / 验收目标 | 状态 | 当前实现与剩余工作 |
| --- | --- | --- | --- | --- |
| DF-01 | 2 | 尽可能放大灾害转盘 | ◐ | [HazardWheel](../src/components/Game/components/HazardWheel.jsx) 使用 340×340 SVG，实际容器为 `min(440px, 52vh)`；已有大型弹窗，仍需在目标 16:9 投影分辨率验收大小和裁切。 |
| DF-02 | 3 | 增加 Mystery `?` 格子 | ✅ | [wheel.js](../src/game/wheel.js) 定义五种灾害与一个 Mystery；[HazardControls](../src/components/Game/components/HazardControls.jsx) 对 Mystery 显示提示、不自动应用灾害。最终行为决定见 Q-03。 |
| DF-03 | 4 | 恢复四张跨灾害卡牌 | ✅ | [cards.js](../src/constants/cards.js) 包含 Green industries、Community events、Health services、Protected areas；[CardControls](../src/components/Game/components/CardControls.jsx) 使用完整 19 张卡牌列表。 |
| DF-04 | 5 | 六个城镇图适配 16:9 投影，接近 1:1，占据主要画面 | ◐ | [TownPieCharts](../src/components/Game/components/TownPieCharts.jsx) 配置桌面三列；[TownPieChart](../src/components/Charts/TownPieChart.jsx) 最大宽度 255px、最小高度 265px。布局已调整，仍需验收实际占屏比例、六图是否同时可见。 |
| DF-05 | 6 | 删除非最后一次的错误出牌（原反馈：不紧急） | ✅ | [GameTable](../src/components/Game/components/GameTable.jsx) 和 Adapt 控件已有删除入口；BUG-02 已修复，多年度卡牌按已生效年度数扣除效果，费用只退一次，模拟器验证通过。 |
| DF-06 | 7 | 出牌时看见城镇 NESH 实时变化，避免遮挡 | ◐ | [Game](../src/components/Game/index.jsx) 即时更新图表，已移除出牌确认框；浮动面板和侧边抽屉仍可能遮挡，需要投影验收。 |
| DF-07 | 7、16 | 灾害发生时看见六个 NESH 图下降，不用影响表遮挡 | ◐ | Game 不再渲染 `HazardImpactDialog`；但当前转盘使用居中模态弹窗，应用灾害后仍保持打开，未完全满足原始可见性目标。需确认是否保留最新弹窗设计。 |
| DF-08 | 8 | 添加 Inspiring Tasmania Logo | ◐ | [Footer](../src/components/common/Footer.jsx) 已接入配置并有文字回退；`public/media/logos/inspiring-tasmania-placeholder.svg` 不存在，等待正式素材。 |
| DF-09 | 8 | 更新 UTAS Logo | ◐ | Footer 仍优先使用原 `src/assets/images/utas.png`；新配置是占位路径。未发现已替换为获确认的新素材的证据。 |
| DF-10 | 9 | 更新版权文字 | ⏳ | [mediaConfig](../src/constants/mediaConfig.js) 支持统一配置，Footer 显示当年年份；原反馈明确 TBC，最终文案未确认。 |
| DF-11 | 10、14 | Dividends 阶段改名 Reward for effort | ✅ | [StageBar](../src/components/Game/components/StageBar.jsx)、[DividendsDialog](../src/components/Game/components/DividendsDialog.jsx) 和总结页已使用新名称。内部标识保留 `dividends`。 |
| DF-12 | 11 | Adapt 标题改为指定问题，去掉副标题 | ✅ | StageBar：`What adaptations will you choose for your town?`；步骤不再显示副标题。 |
| DF-13 | 12 | Event 标题改为指定问题，去掉副标题 | ✅ | StageBar：`Will Adaptania face a climate hazard this year?`。 |
| DF-14 | 13 | Review 标题改为指定问题，去掉副标题 | ✅ | StageBar：`How resilient is Adaptania now?`。 |
| DF-15 | 14 | 最后阶段标题为 Reward for effort，无副标题 | ✅ | StageBar 的第四步已匹配该标题。 |
| DF-16 | 15 | 转盘和事件可通过下拉入口访问 | ◐ | 有主持人抽屉入口与浮动按钮；[HazardControls](../src/components/Game/components/HazardControls.jsx) 仅在 Event 阶段允许应用灾害。与“always available via dropdown”的具体预期需确认。 |
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
| DF-36 | 44–45 | 图表统一 NESH 色彩，Health 改为深蓝色 | ◐ | [palette.js](../src/constants/palette.js) 设置 Health 为 `#1B365D` 并用于图表；原表备注 `Chloe check`，仍待颜色确认。 |
| DF-37 | 48 | NESH Resilience Summary：排除 Bludgeton、五镇平均、百分比 | ✅ | [BarChartsView](../src/components/Game/components/BarChartsView.jsx) 已更新标题，过滤比较城镇，按 N/E/S/H 求平均并使用 0–100% 轴。 |
| DF-38 | 51 | Towns Resilience Summary：更名、百分比 | ✅ | BarChartsView 已更新标题，以各镇平均韧性百分比展示。 |
| DF-39 | 53 | 允许补改遗漏的游戏历史 | ◐ | GameTable 可补录已进行轮次的卡牌和删除出牌；BUG-01/02/03 已修复，历史卡牌事务验证通过。灾害编辑和已结束游戏编辑不在当前实现中，仍需确认范围（Q-04）。 |
| DF-40 | 56、58–60 | Time Machine / Global Scenario 视频入口，图标与标题 | ◐ | [Game](../src/components/Game/index.jsx) 已提供视频卡片与播放器；已导入 `time-machine.mp4`，Global Scenario 视频仍缺失。未自动复用旧 `introduction-en.mp4`。本批素材待部署。 |
| DF-41 | 57 | 从开场页删除原三步说明 | ✅ | 开场页已替换为视频卡片，不再显示原 01/02/03 步骤。 |
| DF-42 | 58、61 | 顶部增加 NESH explainer 视频按钮 | ✅ | Game 顶部已有按钮和播放器，已导入 Understanding NESH 至 `nesh-explainer.mp4`。本批素材待部署；视频体积处理见[素材清单](media-assets.md)。 |
| DF-43 | 63 | 提供返回 opening screen 的入口 | ✅ | Game 顶部提供 Opening Screen；已开始的游戏可再返回 Live Dashboard。 |
| DF-44 | 64 | Town details 移除 Hazard Resilience levels | ✅ | TownDetailsView 已移除该明细区域。 |

## 已知缺陷与修复待办

以下三个问题来自 2026-11-18 对 #13 的代码审查，已修复、验证，并于同日发布至 Firebase 项目 `heat-is-on`。P1/P2 保留发现时的优先级；代码尚未提交。

- [x] **BUG-01 / P1：补录已过期卡牌被规则拒绝。** 创建规则现接受布尔型 `isActive`，允许已无未来效果的历史出牌写入 `false`；所属用户校验保留。模拟器确认第 3 轮补录第 1 轮单年度卡原子提交成功，可撤销，且跨用户访问仍被拒绝。关联 DF-39。
- [x] **BUG-02 / P1：历史多年度卡牌增删只算一次效果。** 服务按 `effectiveRounds` 中不晚于当前轮次的条目数计算效果，费用只扣退一次；仅有未来效果的卡牌保持 active。退款不超过规则的 9999 上限，分数仍限制在 0–100。单元及模拟器验证补录、未来续效和删除通过，已结算 `round_stats` 不重写。关联 DF-05/39。
- [x] **BUG-03 / P2：撤销后未刷新卡牌明细。** `revertToPreviousState` 同步刷新 `townCardPlays` 与 `townCardPlayDocs`；登出也清理明细。真实 Chromium + React Provider + 模拟器验证“出牌 → 撤销”，卡牌明细与总结计数均从 1 变为 0，无需刷新页面。关联 DF-22/26/39。

证据：[gameSessionService.js](../src/services/gameSessionService.js)、[cards.js](../src/game/cards.js)、[GameContext.jsx](../src/contexts/GameContext.jsx)、[firestore.rules](../firestore.rules)。

修复前已观察到回归用例失败：BUG-01 为模拟器权限拒绝；BUG-02 为实际效果次数不足；BUG-03 为浏览器中撤销后仍有 1 条明细和 1 次出牌统计。修复后对应验证全部通过。历史编辑沿用设计中的当前状态加减效果方案，不回放灾害、不重算已结算的统计或奖励。

2026-11-18 已依次部署更新后的 `firestore.rules` 和前端至 [heat-is-on.web.app](https://heat-is-on.web.app)。线上首页引用 `index-DbSNDdtd.js`，下载的 JS 与本地构建逐字节一致。未自动修正过去已被错误历史编辑影响的存档，也未在生产环境写入测试游戏。

## 待确认与素材交付

- [ ] **Q-01：** 确认版权最终文字（原表第 9 行明确 TBC）。
- [ ] **Q-02：** 请 Chloe 确认 Health 深蓝色；当前实现使用 `#1B365D`，不能视为已获得确认。
- [ ] **Q-03：** 确认 Mystery 落点的最终规则。原表只要求 `?` 格；当前行为为提示后不自动应用灾害，主持人可手动选择。
- [ ] **Q-04：** 确认历史编辑范围：仅卡牌，还是包含灾害、已结束游戏；是否需要更改已结算历史统计。现有设计不重算不可变的 `round_stats`。
- [ ] **Q-05：** 确认是否接受最新居中转盘弹窗，或需满足原表“不遮挡 NESH 实时变化”的目标；明确“转盘始终可访问”是否包括非 Event 阶段。
- [ ] **ASSET-01：** 提供 Inspiring Tasmania 正式 Logo。
- [ ] **ASSET-02：** 提供 / 确认新版 UTAS Logo，并更新实际使用的资源。
- [ ] **ASSET-03：** Time Machine 与 NESH explainer 已提供并接入本地；仍缺 Global Scenario。NESH 原文件约 105.2 MiB，提交前需要处理文件体积，详见[素材清单](media-assets.md)。
- [x] **ASSET-04：** 导入用户提供的 5 个灾害 GIF、6 个网页图标、5 张介绍图及 2 段视频，共 18 个文件；文件内容与源文件一致。GIF 和介绍图的可见展示入口仍待决定，不等同于已接入主流程。
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
| 待执行 | 全部反馈的浏览器与投影流程验收 | 已完成本次三个缺陷的定向验证；其余布局、视频素材、投影等验收仍待执行。 |

## 维护记录

| 日期 | 进度更新 |
| --- | --- |
| 2026-11-18 | 根据 Excel 建立需求基线，对照 #13 标记开发状态，登记三个已知缺陷、素材缺口及验收事项。 |
| 2026-11-18 | 本地修复 BUG-01/02/03，新增单元与模拟器回归测试并通过真实 React 浏览器验证；DF-05/22/26 更新为完成。提交号待提交后补充。 |
| 2026-11-18 | 构建前端并部署 Firestore 规则、Hosting 至 `heat-is-on`，完成线上构建文件核验。发布源为本地未提交修复，提交号待补充。 |
| 2026-11-18 | 从用户提供的两个 Downloads 文件夹导入 18 个素材，接入 Time Machine / NESH 视频和网页 PNG 图标，更新署名来源与[素材清单](media-assets.md)。DF-42 更新为完成；素材尚未提交或部署。 |

后续每次修复或交付：更新对应 DF 状态与证据，勾选完成的缺陷 / 素材 / 验收项，在验证记录写明执行结果，并在维护记录追加日期与提交号。已确认的问题修复前，相关需求保持 ◐。
