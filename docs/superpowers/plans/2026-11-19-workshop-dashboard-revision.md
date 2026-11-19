# 工作坊仪表盘开发计划

**目标**　落实已确认的品牌和演示流程，完成六镇同屏验收，并为余下两项规则问题明确决策范围。需求依据为 2026-11-19 的 15 个未结 DF 条目。[开发清单](../../dashboard-feedback-progress.md)

**架构**　沿用 React 19、MUI 7、Recharts 2 和 Firebase。素材由现有 Hosting 路径提供。阶段展示在 StageBar 调整，灾害动画在 Game 页面管理，最终分数继续取自 GameContext 和既有结算逻辑。

**执行方式**　在包含 `c6a84da` 及本次需求文档的工作树中按下列任务推进。每个实现任务先复现现状，再修改、定向验收并独立提交。第 5 项排版验收安排在字体、流程和图表位置确定之后。第 6 项产品确认可与前五项同时进行。

## 全局约束与重点回归

- 界面及介绍视频仅提供英文。15 张灾害专属适应卡各收 15 EP，页脚版权沿用当前文字。
- 刷新旧存档时应恢复到正确阶段。特别验证已处于 Review 的存档和缺少 stage 字段的早期存档。
- 同一轮连续施加两次相同灾害，每次都应显示对应 GIF，并从各自的灾前数值开始动画。
- 在 GIF 打开时刷新，必须恢复已经保存的灾后数值。关闭动画只改变展示，不能再次扣分。
- 正常结束、提前结束和重新打开已完成游戏都要能查看最终两图。
- 投影验收覆盖冷加载、刷新、抽屉开合和卡片翻面，检查六镇布局及图表可见性。

## 1. 品牌、字体和登录封面 · DF-08、DF-09、DF-36、DF-45、DF-46

- [ ] 更新 `src/constants/mediaConfig.test.js` 的 Logo 路径断言，并把两张 Logo 及封面加入静态文件存在性检查。先运行 `node --test src/constants/mediaConfig.test.js` 复现占位路径问题。
- [ ] 从 `D:\Projects\heat_is_on` 导入下列已核对的文件。在 `src/constants/mediaConfig.js` 配置路径，`src/components/common/Footer.jsx` 的两个展示分支统一取配置。让长条 UTAS 图片等比缩放，确认登录页滚动伙伴栏和站内页脚均完整显示。

  | 源文件 | 目标路径 |
  | --- | --- |
  | inspiring_tas_logo_500x500px (1).png | public/media/logos/inspiring-tasmania.png |
  | UTAS-#1-Climate_THE-Rankings-2026_HOR_MONO.png | public/media/logos/utas-climate-rankings-2026.png |
  | Adaptania-Map-nosigns.jpg | public/media/adaptania-map.jpg |

- [ ] 在 `src/components/auth/Login.jsx` 替换 Stanley 封面、替代文字及旧照片署名，检查窄屏下地图和标题均可辨认。在 `docs/media-assets.md` 登记新素材来源。
- [ ] 将 Fredoka SemiBold（600）、Figtree 正文字体及其许可随站点打包。在 `src/index.css`、`src/App.jsx` 的 MUI 主题和 `src/components/auth/Login.css` 统一字体。核对登录页与 `src/components/Game/index.jsx` 欢迎页的实际标题均显示 **THE HEAT IS ON**。用浏览器检查主标题实际渲染为 Fredoka 600，正文实际渲染为 Figtree。
- [ ] 更新 `src/constants/palette.js`，Nature 用 `#43AE35`、Economy 用 `#F2C94C`、Society 用 `#73C6D5`、Health 用 `#2F5D8A`。在城镇卡背面及两张总结图检查数据与图例同色，核对灾害扇区仍按灾种着色。
- [ ] 重跑素材测试和构建。确认新图片和字体从构建产物正常加载，页脚版权与现行版本一致。

## 2. 欢迎页媒体 · DF-47、DF-49

- [ ] 在模拟器打开 Opening Screen，记录现有 Workshop Introduction、Time Machine 两张视频卡片，以及需要展开的灾害介绍区。
- [ ] 修改 `src/components/Game/index.jsx`，将视频区设为两个相邻入口，按 **Time Machine → NESH Explainer** 排列。分别用现有 `MEDIA_CONFIG.timeMachineVideo` 和 `MEDIA_CONFIG.neshExplainerVideo` 打开现有播放器。移除该区的 Workshop Introduction 入口，保留已隐藏的 Global Scenario 和游戏顶部可随时使用的 NESH 入口。
- [ ] 欢迎页直接展示五个小图标按钮。复用 `src/components/common/HazardIcon.jsx`，点击后在弹窗用相同 hazardId 显示大图标及其英文名称。验收五个图标逐一对应，关闭回到欢迎页，键盘可操作。
- [ ] 在桌面及窄屏分别从欢迎页播放两段视频，核对顺序和实际片源；从游戏返回 Opening Screen 再次检查。

## 3. 合并阶段展示 · DF-15

- [ ] 用现有流程走到 Review，记录返回 Event、Reward for effort、进入下一年及末年结算入口。对照 `src/game/stages.js` 与 `src/components/Game/components/StageBar.jsx`。当前存储的进行中阶段只有 adaptation、hazard、review，第四步是展示项。
- [ ] 在 StageBar 移除原第三步 Review 的独立展示，保留原第四步，将标题替换为 **How resilient is Adaptania now?**。让 review 状态高亮这一项，完成状态的索引按新步骤数计算。核对 Event 的前进按钮文字与实际到达的最后一步一致。
- [ ] 使用现有 Review 状态承载操作。奖励结算窗口及按钮继续使用 **Reward for effort**。验证一次返回 Event、一次普通结算、一次最终结算，分别检查奖励只发一次、年份正确、最终总结可打开。
- [ ] 运行 `node --test src/game/stages.test.js src/game/settlement.test.js`，并在模拟器刷新 Review 存档及无 stage 的旧存档，验证高亮位置和可用操作。

## 4. 灾害 GIF 和雷达图变化 · DF-07

- [ ] 在 `src/components/Game/index.jsx` 的 handleApplyHazard 路径记录基线。当前 3000 ms 定时器关闭弹窗，GameContext 在事件记录重读前就更新 towns。五个现有 GIF 都自带无限循环标记。
- [ ] 调用 applyHazard 之前按 town.id 缓存灾前图表数据并冻结展示。成功后用返回的 towns 作为动画终点，显示 GIF 直到主持人手动关闭。去掉自动关闭定时器，保留关闭按钮。保存失败则解除冻结并回到当前数据。转盘和浮动层应在动画开始前让出图表视野。
- [ ] 在 `src/components/Game/components/TownPieCharts.jsx` 和 `src/components/Charts/TownPieChart.jsx` 的展示链路插值绘制各扇区，六镇同步过渡。建议首轮使用 **1.2 秒**，以投影可见性作为调速依据。结束后直接显示保存值，切换游戏、撤销或卸载时清理过渡状态；刷新从已保存结果恢复。
- [ ] 用模拟器连续触发两次同种灾害。弹窗各保持至少 6 秒，确认 GIF 仍在播放、分数图仍为本次灾前值；关闭后可看见中间帧，最终值与对应的已保存 towns 一致。再验证弹窗期间刷新、保存失败、撤销及翻面图表。确认每次成功施加只增加一条对应的灾害记录。

## 5. 最终总结图和 16:9 投影 · DF-48、DF-01、DF-04、DF-06

- [ ] 在 `src/components/Game/index.jsx` 移除实时仪表盘的 BarChartsView 和为右栏保留的宽度。在 `src/components/Game/components/GameSummaryDialog.jsx` 使用已有的 session 和 towns，仅在游戏已结束时挂载 `<BarChartsView towns={towns} />`。
- [ ] 在 `src/components/Game/components/BarChartsView.jsx` 给总结弹窗内的图表设置可测量高度。检查 **NESH Resilience Summary** 取五个参与镇平均值，**Towns Resilience Summary** 展示六镇。旧存档、正常结束和提前结束后，重新打开 View Summary 都应显示最终数值和完整图例。进行中的汇总入口也不能提前显示这两图。
- [ ] 在 TownPieCharts 用可用宽度和高度共同限制正方形卡片尺寸，桌面三列两行、行列紧凑，保留现有小屏断点。记录刷新前后六张卡片的实际边界和手动翻面结果。
- [ ] 建议先用 1280×720 和 1920×1080、浏览器缩放 100% 复验，再在实际 16:9 投影设备验收。分别检查六镇能同时完整显示，`HazardWheel.jsx` 的转盘尽量大且边缘完整，出牌和灾后动画时面板不遮挡变化。将屏幕尺寸、浏览器缩放、结果和必要截图登记到开发清单 UAT-01。设备未验收时保留该项待验收状态。

## 6. 需要产品确认的两项 · DF-16、DF-39

| 项目 | 可先核对的现状 | 决策后执行与验收 |
| --- | --- | --- |
| DF-16 转盘访问 | 在 Adapt、Event 和 Review 分别测试抽屉、浮动入口、转盘与应用按钮，记录可见和可操作状态。目前应用灾害受 Event 阶段限制。 | 分别确认“查看转盘”和“应用灾害”的允许阶段。在 Game、HazardControls 和 StageBar 对齐入口；若变更游戏规则，同步校验服务和持久化规则，并逐阶段复测。Mystery 的最终处理单独沿用 Q-03 跟踪。 |
| DF-39 历史编辑 | 在 GameTable 验证当前补录和删除历史卡牌、跨年效果及退款。关联实现为 `src/services/gameSessionService.js` 和 `firestore.rules`。 | 确认是否允许修改历史灾害、编辑已结束游戏、重算已结算统计和奖励。按决定补充可编辑对象、重算范围和新旧存档用例，在模拟器验证原子保存、撤销、重复操作和跨用户拒绝后更新状态。 |

## 交付检查

- [ ] 依次执行 `npm test`、`npm run lint`、`npm run build`。在本地 Firebase 模拟器运行时执行 `npm run test:emulator`，记录结果及已有警告。
- [ ] 在模拟器串联完整流程：欢迎页播放视频 → 放大灾害图标 → 出牌 → 施加灾害 → 手动关闭 GIF → 查看收缩 → 结算 → View Summary。另走一次提前结束流程。
- [ ] 在开发清单逐项附上验证结果和实现提交。将仍待产品决定或真实投影验收的条目保留开放，供下次检查。
