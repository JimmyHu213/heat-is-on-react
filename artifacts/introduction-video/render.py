"""Reproducible 1080p teaching animation. Requires Pillow, numpy, imageio-ffmpeg.
Run --voices on macOS first; then run without arguments to render.
All illustrations are explanatory diagrams, not screenshots of the app.
"""
import json, math, subprocess, sys, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
WORK = HERE / 'work'
WORK.mkdir(exist_ok=True)
SCENES = json.loads((HERE / 'storyboard.json').read_text())
FF = imageio_ffmpeg.get_ffmpeg_exe()
OUTPUT = ROOT / 'public/media/introduction.mp4'
SUBTITLE_FILE = 'introduction.zh.srt'
VOICE, SPEECH_RATE = 'Tingting', '245'
W, H, FPS = 1920, 1080, 24
BG = '#102F2D'
PANEL = '#1B403C'
WHITE = '#F4F3E9'
MUTED = '#B4CDC1'
MINT = '#B7D998'
ORANGE = '#EC9C74'
COLORS = ['#F59B6C','#AFA2E1','#79C9BA','#F0869A','#C79BDE']
CN = '/System/Library/Fonts/Hiragino Sans GB.ttc'
EN = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
FONTS = {}
def font(size, en=False):
    key=(size,en)
    if key not in FONTS: FONTS[key]=ImageFont.truetype(EN if en else CN,size)
    return FONTS[key]
def text(d,xy,s,size=36,fill=WHITE,en=False,anchor=None):
    d.text(xy,s,font=font(size,en),fill=fill,anchor=anchor)
def box(d,xy,fill=PANEL,r=24,outline=None,width=2):
    d.rounded_rectangle(tuple(int(x) for x in xy),radius=r,fill=fill,outline=outline,width=width)
def ease(x): return 1-(1-max(0,min(1,x)))**3
def arrow(d,x,y,length=60,c=MUTED):
    d.line((x,y,x+length,y),fill=c,width=4)
    d.polygon([(x+length,y),(x+length-12,y-9),(x+length-12,y+9)],fill=c)
def house(d,x,y,s,c):
    d.polygon([(x,y),(x+s*.5,y-s*.4),(x+s,y)],fill=c)
    d.rectangle((x+9,y,x+s-9,y+s*.65),fill=c)
    d.rectangle((x+s*.4,y+s*.25,x+s*.6,y+s*.65),fill=BG)
    d.rectangle((x+s*.17,y+s*.12,x+s*.31,y+s*.28),fill=BG)
def subtitle(d,s):
    size=34 if len(s)<49 else 30
    text(d,(960,963),s,size,WHITE,anchor='mm')
def radar(d,cx,cy,r,p):
    for fac in [.25,.5,.75,1]:
        pts=[(cx,cy-r*fac),(cx+r*fac,cy),(cx,cy+r*fac),(cx-r*fac,cy),(cx,cy-r*fac)]
        d.line(pts,fill='#42615A',width=2)
    d.line((cx-r,cy,cx+r,cy),fill='#42615A',width=2)
    d.line((cx,cy-r,cx,cy+r),fill='#42615A',width=2)
    values=[.82,.68,.76,.9]
    pts=[(cx,cy-r*values[0]*p),(cx+r*values[1]*p,cy),(cx,cy+r*values[2]*p),(cx-r*values[3]*p,cy)]
    d.polygon(pts,fill='#477A65',outline=MINT,width=5)
    for pt in pts: d.ellipse((pt[0]-6,pt[1]-6,pt[0]+6,pt[1]+6),fill=MINT)
    for pos,s in [((cx,cy-r-42),'自然'),((cx+r+65,cy),'经济'),((cx,cy+r+42),'社会'),((cx-r-65,cy),'健康')]: text(d,pos,s,32,anchor='mm')

def frame(idx,t,dur,sub,total_t,total_duration):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    # Editorial grid and restrained moving orbit.
    for x in range(100,1920,100): d.line((x,150,x,885),fill='#143532',width=1)
    for y in range(185,886,100): d.line((85,y,1835,y),fill='#143532',width=1)
    text(d,(86,47),'THE HEAT IS ON',27,MINT,True)
    text(d,(1834,62),'气候适应游戏  /  中文教学',24,MUTED,anchor='rm')
    d.line((86,110,1834,110),fill='#42615A',width=2)
    text(d,(88,153),SCENES[idx]['label'],27,ORANGE,idx==0)
    text(d,(86,203),SCENES[idx]['title'],62)
    text(d,(1834,864),'教学示意动画 · 非界面录屏',21,MUTED,anchor='rm')
    p=ease(t/1.2)
    if idx==0:
        text(d,(93,337),'THE HEAT',112,WHITE,True)
        text(d,(93,470),'IS ON',112,MINT,True)
        text(d,(96,650),'为城镇作选择，为下一回合做准备。',35,MUTED)
        box(d,(94,744,593,810),MINT,33)
        text(d,(343,777),'策略  ·  灾害  ·  韧性',29,BG,anchor='mm')
        cx,cy=1400,535
        for r in [175,245,300]: d.ellipse((cx-r,cy-r,cx+r,cy+r),outline='#42615A',width=2)
        for i in range(6):
            a=i*math.pi/3-.4+t*.025; x=cx+235*math.cos(a); y=cy+235*math.sin(a)
            house(d,x-35,y-13,70,COLORS[i%5] if i<5 else MUTED)
        text(d,(cx,cy-22),'6',98,MINT,True,'mm')
        text(d,(cx,cy+59),'个城镇的未来',30,anchor='mm')
    elif idx==1:
        box(d,(88,330,655,822))
        text(d,(128,375),'新建游戏',38)
        text(d,(128,460),'设置回合数',29,MUTED)
        text(d,(128,510),'1–20',94,MINT,True)
        text(d,(128,644),'可选：数字灾害转盘',30)
        box(d,(128,720,610,776),MINT,15); text(d,(368,748),'开始游戏',29,BG,anchor='mm')
        for i in range(6):
            x=710+(i%3)*370; y=334+(i//3)*244
            box(d,(x,y,x+332,y+215),PANEL,24,ORANGE if i==5 else None)
            house(d,x+34,y+55,52,COLORS[i%5] if i<5 else MUTED)
            text(d,(x+111,y+43),f'城镇 {i+1}' if i<5 else 'Bludgeton',30,en=i==5)
            text(d,(x+33,y+139),'可以使用适应卡牌' if i<5 else '对照 · 不使用卡牌',26,MUTED)
    elif idx==2:
        names=['适应','事件','复盘','分红']; notes=['讨论策略 · 使用卡牌','选择灾害 · 确认应用','比较图表 · 讨论影响','确认结算 · 继续游戏']
        active=min(3,int(t/max(dur/4,.1)))
        for i in range(4):
            x=88+i*453
            box(d,(x,365,x+390,714),MINT if i==active else PANEL)
            col=BG if i==active else WHITE
            text(d,(x+32,402),f'0{i+1}',58,col,True)
            text(d,(x+32,510),names[i],58,col)
            text(d,(x+32,619),notes[i],25,col)
            if i<3: arrow(d,x+405,535,32)
        text(d,(960,797),'主持人按页面的「下一步」按钮推进回合',33,MUTED,anchor='mm')
    elif idx==3:
        box(d,(88,332,700,829),WHITE)
        text(d,(132,372),'景观规划',51,BG)
        text(d,(132,447),'LANDSCAPING',26,'#527165',True)
        box(d,(132,510,366,564),ORANGE,15);text(d,(249,537),'山火适应卡',27,BG,anchor='mm')
        text(d,(132,612),'15 EP',74,BG,True)
        text(d,(132,724),'持续 1 回合',32,'#527165')
        text(d,(802,345),'选择城镇  →  选择卡牌  →  确认使用',32,MUTED)
        for i,(s,v) in enumerate(zip(['自然','经济','社会','健康'],[20,10,10,10])):
            y=436+i*78
            text(d,(805,y),s,33)
            box(d,(921,y+4,1660,y+40),'#2E5049',12)
            box(d,(921,y+4,921+max(3,580*v/20*p),y+40),MINT if i==0 else '#7DAD94',12)
            text(d,(1712,y+20),f'+{v}',36,MINT,True,'mm')
        text(d,(805,782),'EP = 城镇预算点数；使用前检查可用余额',28,MUTED)
    elif idx==4:
        cx,cy,r=478,571,236
        turn=250*(1-ease(min(t/3,1)))
        for i in range(5): d.pieslice((cx-r,cy-r,cx+r,cy+r),i*72-90+turn,(i+1)*72-90+turn,fill=COLORS[i],outline=BG,width=6)
        d.ellipse((cx-92,cy-92,cx+92,cy+92),fill=BG)
        text(d,(cx,cy),'灾害转盘',31,anchor='mm')
        d.polygon([(cx-20,cy-r-24),(cx+20,cy-r-24),(cx,cy-r+14)],fill=WHITE)
        names=['山火','洪水','风暴潮','热浪','生物灾害']
        for i,s in enumerate(names):
            y=340+i*83
            d.ellipse((858,y+7,884,y+33),fill=COLORS[i]);text(d,(914,y),s,35)
        box(d,(1205,348,1828,778))
        text(d,(1253,390),'确认应用',38)
        text(d,(1253,458),'影响全部 6 个城镇',36,MINT)
        text(d,(1253,543),'包括 Bludgeton 对照城镇',27,MUTED)
        text(d,(1253,628),'实体转盘也可使用：',28)
        text(d,(1253,679),'在页面选择相应结果',28,MUTED)
    elif idx==5:
        box(d,(90,337,874,822));radar(d,480,576,173,p)
        text(d,(480,789),'NESH：每个维度取五种灾害的平均值',24,MUTED,anchor='mm')
        text(d,(968,356),'翻转图表，切换观察角度',40)
        for i,s in enumerate(['灾害图：发现不同灾害下的弱项','四维图：比较自然、经济、社会、健康','对照城镇：讨论适应策略的作用']):
            y=453+i*97
            d.ellipse((970,y+10,984,y+24),fill=MINT);text(d,(1007,y),s,29,MUTED)
        box(d,(968,745,1828,822),'#633E31',15)
        text(d,(1398,783),'留意 ≤20 的低分块与连锁扣分',29,'#FFD4B4',anchor='mm')
    elif idx==6:
        text(d,(100,341),'结算示例',30,MUTED)
        # Exactly 3 out of 20 segments at 100, others below threshold.
        for i in range(20):
            x=96+(i%5)*148;y=413+(i//5)*90; yes=i in [1,7,13]
            box(d,(x,y,x+126,y+65),MINT if yes else PANEL,14)
            text(d,(x+63,y+32),'100' if yes else ['60','80','70','90'][i%4],29,BG if yes else MUTED,True,'mm')
        text(d,(100,801),'5 种灾害 × 4 个维度 = 20 个韧性块',27,MUTED)
        arrow(d,850,581,99)
        text(d,(1020,416),'3 × 5 = 15 EP',80,MINT,True)
        text(d,(1027,550),'每个恰好达到 100 的块 → +5 EP',34)
        text(d,(1027,636),'全部六个城镇适用；最后一回合也结算',28,MUTED)
        box(d,(1027,717,1830,802),MINT,22)
        text(d,(1429,759),'确认后自动入账，无需重复添加',31,BG,anchor='mm')
    elif idx==7:
        for i,(a,b) in enumerate([('事件与损失','回顾每回合发生了什么'),('最终韧性','比较全部六个城镇'),('分红与预算','检视资源投入与结果')]):
            x=88+i*596;box(d,(x,342,x+555,572))
            text(d,(x+37,382),a,40,MINT);text(d,(x+37,488),b,29,MUTED)
        text(d,(960,678),'下一局，你会做出什么不同的选择？',58,WHITE,anchor='mm')
        text(d,(960,785),'完成游戏或提前结束  →  查看总结  →  一起讨论',32,MUTED,anchor='mm')
    d.line((86,910,1834,910),fill='#42615A',width=2)
    subtitle(d,sub)
    text(d,(86,1031),f'{idx+1:02d} / 08',22,MUTED,True)
    text(d,(1834,1031),'THE HEAT IS ON · 学习，从下一次决策开始',22,MUTED,anchor='ra')
    d.rectangle((0,1073,int(W*total_t/total_duration),1079),fill=MINT)
    # Fade through background at scene boundaries without making captions jump.
    fade=min(1,t/.28,(dur-t)/.28)
    if fade<1: im=Image.blend(Image.new('RGB',(W,H),BG),im,max(0,fade))
    return im

def voices():
    for i,s in enumerate(SCENES):
        for j,line in enumerate(s['lines']):
            target=WORK/f'voice-{i}-{j}.aiff'
            subprocess.run(['say','-v',VOICE,'-r',SPEECH_RATE,'-o',str(target),line],check=True)
            print(target.name,flush=True)

def stamp(t):
    ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'

def render():
    all_audio=[];timeline=[];captions=[];offset=0;sr=44100
    for i,s in enumerate(SCENES):
        audio=[np.zeros(int(.45*sr),dtype=np.int16)]; segments=[]; st=.45
        for j,line in enumerate(s['lines']):
            raw=subprocess.check_output([FF,'-v','error','-i',str(WORK/f'voice-{i}-{j}.aiff'),'-ar',str(sr),'-ac','1','-f','s16le','-'])
            a=np.frombuffer(raw,dtype=np.int16)
            if len(a)<sr*.3: raise RuntimeError('Empty narration')
            audio.extend([a,np.zeros(int(.32*sr),dtype=np.int16)])
            end=st+len(a)/sr
            segments.append((st,end,line));captions.append((offset+st,offset+end,line));st=end+.32
        duration=max(7,st+.7); duration=math.ceil(duration*FPS)/FPS
        joined=np.concatenate(audio);joined=np.pad(joined,(0,round(duration*sr)-len(joined)))
        all_audio.append(joined);timeline.append((offset,duration,segments));offset+=duration
    full=np.concatenate(all_audio).astype(np.float64)/32768
    # Quiet original synthesized ambient bed; no external music or licensed samples.
    tt=np.arange(len(full))/sr;bed=np.zeros(len(full))
    for n in [130.8128,164.8138,195.9977,261.6256]:
        bed+=.006*np.sin(2*np.pi*n*tt)*(.55+.45*np.sin(2*np.pi*.085*tt+n))
    bed*=np.minimum(1,tt/2)*np.minimum(1,(offset-tt)/3)
    full=np.clip(full*.88+bed,-.98,.98)
    wav=WORK/'narration.wav'
    with wave.open(str(wav),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes((full*32767).astype('<i2').tobytes())
    (HERE/SUBTITLE_FILE).write_text('\n\n'.join(f'{i+1}\n{stamp(a)} --> {stamp(b)}\n{s}' for i,(a,b,s) in enumerate(captions))+'\n')
    (HERE/'timing.json').write_text(json.dumps({'duration':offset,'fps':FPS,'scenes':timeline},ensure_ascii=False,indent=2))
    out=OUTPUT
    cmd=[FF,'-y','-v','warning','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(wav),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',str(out)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    thumbs=[]
    for i,(start,duration,segments) in enumerate(timeline):
        print(f'Rendering scene {i+1}/8 ({duration:.1f}s)',flush=True)
        for k in range(round(duration*FPS)):
            t=k/FPS
            sub=next((line for a,b,line in segments if a<=t<b+.2),'')
            im=frame(i,t,duration,sub,start+t,offset)
            if k==min(round(3*FPS),round(duration*FPS)-1):
                im.save(HERE/f'scene-{i+1:02}.jpg',quality=90);thumbs.append(im.resize((640,360)))
                if i==0: im.save(HERE/'poster.jpg',quality=95)
            proc.stdin.write(im.tobytes())
    proc.stdin.close()
    if proc.wait()!=0: raise RuntimeError('Encoding failed')
    contact=Image.new('RGB',(1280,1440))
    for i,im in enumerate(thumbs):contact.paste(im,((i%2)*640,(i//2)*360))
    contact.save(HERE/'contact-sheet.jpg',quality=90)
    print(f'DONE {out} | {offset:.2f}s | {out.stat().st_size/1024/1024:.1f} MiB',flush=True)

if __name__=='__main__':
    voices() if '--voices' in sys.argv else render()
