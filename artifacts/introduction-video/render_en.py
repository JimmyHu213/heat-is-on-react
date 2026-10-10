"""English edition. Run --voices first, then render. Shares animation with render.py."""
import json
import re
import sys
from pathlib import Path
import render as v

SOURCE = Path(__file__).resolve().parent
v.HERE = SOURCE / 'english'
v.HERE.mkdir(exist_ok=True)
v.WORK = v.HERE / 'work'
v.WORK.mkdir(exist_ok=True)
v.SCENES = json.loads((SOURCE / 'storyboard.en.json').read_text())
v.OUTPUT = v.ROOT / 'public/media/introduction-en.mp4'
v.SUBTITLE_FILE = 'introduction.en.srt'
v.VOICE, v.SPEECH_RATE = 'Karen', '180'
v.CN = '/System/Library/Fonts/Supplemental/Arial.ttf'

# Exact translations keep the English edition tied to the original illustrations.
TRANSLATIONS = {
    '气候适应游戏  /  中文教学': 'CLIMATE ADAPTATION / HOW TO PLAY',
    '教学示意动画 · 非界面录屏': 'Teaching illustration · Not a screen recording',
    '为城镇作选择，为下一回合做准备。': 'Make choices. Prepare for the next round.',
    '策略  ·  灾害  ·  韧性': 'Strategy · Hazards · Resilience',
    '个城镇的未来': 'towns, shared futures',
    '新建游戏': 'Create a game',
    '设置回合数': 'Choose your rounds',
    '可选：数字灾害转盘': 'Optional: digital hazard wheel',
    '开始游戏': 'Start game',
    '可以使用适应卡牌': 'Can play adaptation cards',
    '对照 · 不使用卡牌': 'Comparison · No cards',
    '适应': 'Adapt', '事件': 'Event', '复盘': 'Review', '分红': 'Dividends',
    '讨论策略 · 使用卡牌': 'Discuss strategy · Play cards',
    '选择灾害 · 确认应用': 'Choose a hazard · Confirm',
    '比较图表 · 讨论影响': 'Compare charts · Reflect',
    '确认结算 · 继续游戏': 'Settle budgets · Continue',
    '主持人按页面的「下一步」按钮推进回合': 'The presenter guides the round with the next-step button.',
    '景观规划': 'Landscaping',
    'LANDSCAPING': 'ADAPTATION CARD',
    '山火适应卡': 'Bushfire',
    '持续 1 回合': 'Duration: 1 round',
    '选择城镇  →  选择卡牌  →  确认使用': 'Select town  →  Choose card  →  Confirm',
    '自然': 'Nature', '经济': 'Economy', '社会': 'Society', '健康': 'Health',
    'EP = 城镇预算点数；使用前检查可用余额': 'EP = effort points. Check your available budget first.',
    '灾害转盘': 'Hazard wheel',
    '山火': 'Bushfire', '洪水': 'Flood', '风暴潮': 'Storm surge',
    '热浪': 'Heatwave', '生物灾害': 'Biohazard',
    '确认应用': 'Confirm the event',
    '影响全部 6 个城镇': 'Affects all 6 towns',
    '包括 Bludgeton 对照城镇': 'Including the comparison town, Bludgeton',
    '实体转盘也可使用：': 'Using a physical wheel?',
    '在页面选择相应结果': 'Select its result on the page.',
    'NESH：每个维度取五种灾害的平均值': 'NESH: each aspect averages scores across five hazards.',
    '翻转图表，切换观察角度': 'Flip the chart. Explore resilience.',
    '灾害图：发现不同灾害下的弱项': 'Hazard charts: identify vulnerabilities.',
    '四维图：比较自然、经济、社会、健康': 'NESH: Nature, Economy, Society, Health.',
    '对照城镇：讨论适应策略的作用': 'Comparison town: discuss adaptation choices.',
    '留意 ≤20 的低分块与连锁扣分': 'Watch for scores ≤20 and cascading penalties.',
    '结算示例': 'A dividend example',
    '5 种灾害 × 4 个维度 = 20 个韧性块': '5 hazards × 4 aspects = 20 resilience segments',
    '每个恰好达到 100 的块 → +5 EP': 'Each segment at exactly 100 → +5 EP',
    '全部六个城镇适用；最后一回合也结算': 'All six towns qualify, including in the final round.',
    '确认后自动入账，无需重复添加': 'Added automatically. Do not add twice.',
    '事件与损失': 'Events & losses',
    '回顾每回合发生了什么': 'Review what happened each round.',
    '最终韧性': 'Final resilience',
    '比较全部六个城镇': 'Compare all six towns.',
    '分红与预算': 'Dividends & budgets',
    '检视资源投入与结果': 'Reflect on spending and outcomes.',
    '下一局，你会做出什么不同的选择？': 'What would you do differently next time?',
    '完成游戏或提前结束  →  查看总结  →  一起讨论': 'Finish or end early  →  View summary  →  Discuss together',
    'THE HEAT IS ON · 学习，从下一次决策开始': 'THE HEAT IS ON · Learn through your next decision',
}

# Width limits for text inside existing cards; titles use the full safe area.
WIDTHS = {
    '为城镇作选择，为下一回合做准备。': 800,
    '策略  ·  灾害  ·  韧性': 455,
    '个城镇的未来': 310,
    '可选：数字灾害转盘': 475,
    '可以使用适应卡牌': 270, '对照 · 不使用卡牌': 270,
    '讨论策略 · 使用卡牌': 325, '选择灾害 · 确认应用': 325,
    '比较图表 · 讨论影响': 325, '确认结算 · 继续游戏': 325,
    '灾害转盘': 165, '包括 Bludgeton 对照城镇': 520,
    'NESH：每个维度取五种灾害的平均值': 700,
    '翻转图表，切换观察角度': 858,
    '留意 ≤20 的低分块与连锁扣分': 790,
    '确认后自动入账，无需重复添加': 750,
    '事件与损失': 480, '最终韧性': 480, '分红与预算': 480,
    '回顾每回合发生了什么': 480, '比较全部六个城镇': 480, '检视资源投入与结果': 480,
}
BASE_TEXT = v.text

def english_text(d, xy, s, size=36, fill=v.WHITE, en=False, anchor=None):
    original = s
    s = TRANSLATIONS.get(s, s)
    s = re.sub(r'^城镇 (\d+)$', r'Town \1', s)
    if re.search(r'[\u4e00-\u9fff]',s):
        raise ValueError(f'Untranslated visible label: {s}')
    limit = WIDTHS.get(original, 1748)
    if anchor is None:
        limit = min(limit,1834-xy[0])
    if xy[0] == 805 and original in ['自然','经济','社会','健康']:
        limit = 107
    while v.font(size,en).getlength(s)>limit and size>18:
        size-=1
    if v.font(size,en).getlength(s)>limit:
        raise ValueError(f'Label exceeds its layout: {s}')
    BASE_TEXT(d,xy,s,size,fill,en,anchor)

def subtitle(d,s):
    # Word wrapping preserves full-size readable subtitles in the caption band.
    lines=[];current=''
    for word in s.split():
        candidate=f'{current} {word}'.strip()
        if v.font(32).getlength(candidate)>1690:
            lines.append(current);current=word
        else: current=candidate
    if current: lines.append(current)
    if len(lines)>2: raise ValueError(f'Caption too long: {s}')
    for i,line in enumerate(lines):
        BASE_TEXT(d,(960,963+(i-(len(lines)-1)/2)*39),line,32,v.WHITE,anchor='mm')

v.text=english_text
v.subtitle=subtitle
BASE_RADAR = v.radar
def english_radar(d,cx,cy,r,p):
    # Keep the lower axis label clear of the explanatory caption.
    BASE_RADAR(d,cx,cy-22,r-12,p)
v.radar=english_radar

if __name__=='__main__':
    if '--voices' in sys.argv: v.voices()
    elif '--preview' in sys.argv:
        grid=v.Image.new('RGB',(1280,1440))
        for i in range(8):
            for s in v.SCENES[i]['lines']: v.frame(i,3,10,s,3+i*10,80)
            im=v.frame(i,3,10,v.SCENES[i]['lines'][0],3+i*10,80)
            grid.paste(im.resize((640,360)),((i%2)*640,(i//2)*360))
        grid.save(v.HERE/'preview-grid.jpg')
        print('All English labels and captions fit.')
    else: v.render()
