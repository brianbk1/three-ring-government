#!/usr/bin/env python3
"""Down the Middle — Instagram slide + hero generator.

Usage:  python3 tools/ig_slides.py spec.json
Spec keys:
  slug, date ("NOV 13, 2026"), kicker, headline (list of lines), accent_line,
  hook (list of lines), cta, story_url,
  data: {title (list), subtitle, bars: [[label, value, display, highlight?]], unit_note,
         callouts: [[big, label]], source}
Outputs public/blog/assets/<slug>-ig-1.png (story), -ig-2.png (data), -hero.png (1200x800).
"""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont

NAVY=(18,35,62); DEEP=(11,24,46); RED=(229,57,53); CREAM=(246,244,239)
WHITE=(255,255,255); MUTED=(150,165,185); INK=(21,28,40); GREY=(95,107,124); RULE=(222,226,232)
F="/usr/share/fonts/opentype/inter/"
def font(w,s): return ImageFont.truetype(F+{"black":"InterDisplay-Black.otf","xb":"InterDisplay-ExtraBold.otf","b":"Inter-Bold.otf","sb":"Inter-SemiBold.otf","m":"Inter-Medium.otf","r":"Inter-Regular.otf"}[w],s)

def brand(d,x,y,dark=True,num=None,W=1080):
    d.rounded_rectangle([x,y+6,x+26,y+32],5,fill=RED)
    d.text((x+40,y),"DOWN THE MIDDLE",font=font("xb",30),fill=WHITE if dark else NAVY)
    d.text((x,y+48),"INDEPENDENT • NONPARTISAN • DATA-DRIVEN",font=font("sb",19),fill=MUTED if dark else GREY)
    if num:
        d.rounded_rectangle([W-138,y-6,W-70,y+62],12,fill=RED)
        d.text((W-104,y+28),str(num),font=font("xb",34),fill=WHITE,anchor="mm")

def footer(d,W,H,date,dark=True):
    c=(255,255,255,60) if dark else RULE
    d.line([70,H-112,W-70,H-112],fill=(60,78,105) if dark else RULE,width=2)
    d.text((70,H-72),"DownTheMiddle.ai",font=font("b",26),fill=WHITE if dark else NAVY,anchor="lm")
    d.text((W-70,H-72),date,font=font("b",24),fill=WHITE if dark else NAVY,anchor="rm")

def bars_bg(d,W,H,vals):
    # faint decorative bar chart on the right of the dark slide
    mx=max(vals); n=len(vals); x0=W-470; bw=52; gap=14; base=H-200
    for i,v in enumerate(vals):
        h=int(v/mx*560); x=x0+i*(bw+gap)
        d.rounded_rectangle([x,base-h,x+bw,base],6,fill=(38,58,92))

def wrap(d,text,f,maxw):
    words=text.split(); lines=[]; cur=""
    for w in words:
        t=(cur+" "+w).strip()
        if d.textlength(t,font=f)<=maxw: cur=t
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    return lines

def slide_story(s,out):
    W,H=1080,1350
    im=Image.new("RGB",(W,H),NAVY); d=ImageDraw.Draw(im)
    # gradient
    for y in range(H):
        t=y/H; d.line([0,y,W,y],fill=tuple(int(NAVY[i]*(1-t)+DEEP[i]*t) for i in range(3)))
    brand(d,70,70,True,1)
    y=210
    k=s["kicker"]; kw=d.textlength(k,font=font("b",24))
    d.rounded_rectangle([70,y,70+kw+40,y+50],10,fill=RED); d.text((90,y+25),k,font=font("b",24),fill=WHITE,anchor="lm")
    y+=90
    for ln in s["headline"]:
        d.text((70,y),ln,font=font("black",92),fill=WHITE); y+=100
    y+=6
    d.text((70,y),s["accent_line"],font=font("black",92),fill=RED); y+=128
    # hook box
    f=font("b",36); lines=[]
    for p in s["hook"]: lines+=wrap(d,p,f,W-220)
    bh=len(lines)*50+56
    d.rounded_rectangle([70,y,W-70,y+bh],16,fill=(9,20,38))
    yy=y+30
    for ln in lines: d.text((105,yy),ln,font=f,fill=WHITE); yy+=50
    y+=bh+40
    d.text((70,y),s["cta"],font=font("xb",34),fill=RED)
    d.text((70,y+50),"Full story + charts → link in bio",font=font("m",28),fill=MUTED)
    footer(d,W,H,s["date"])
    im.save(out,optimize=True)

def slide_data(s,out):
    D=s["data"]; W,H=1080,1350
    im=Image.new("RGB",(W,H),CREAM); d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,14],fill=RED)
    brand(d,70,70,False,2)
    y=200
    for ln in D["title"]:
        d.text((70,y),ln,font=font("black",68),fill=NAVY); y+=76
    y+=8
    for ln in wrap(d,D["subtitle"],font("m",27),W-140):
        d.text((70,y),ln,font=font("m",27),fill=GREY); y+=36
    y+=24
    # chart card
    top=y; ch=500
    d.rounded_rectangle([70,top,W-70,top+ch],18,fill=WHITE,outline=RULE,width=2)
    bars=D["bars"]; n=len(bars); mx=max(b[1] for b in bars)
    pl=110; pr=W-110; base=top+ch-96; ph=ch-176
    bw=(pr-pl)/n*0.62; step=(pr-pl)/n
    for i,b in enumerate(bars):
        lab,v,disp=b[0],b[1],b[2]; hi=len(b)>3 and b[3]
        x=pl+i*step+(step-bw)/2; h=max(6,v/mx*ph)
        d.rounded_rectangle([x,base-h,x+bw,base],8,fill=RED if hi else NAVY)
        d.text((x+bw/2,base-h-14),disp,font=font("xb",28),fill=RED if hi else INK,anchor="ms")
        d.text((x+bw/2,base+36),lab,font=font("sb",22),fill=GREY,anchor="ms")
    d.line([pl-10,base,pr+10,base],fill=RULE,width=2)
    d.text((W/2,top+ch-20),D["unit_note"],font=font("r",19),fill=GREY,anchor="ms")
    y=top+ch+30
    # callouts
    cw=(W-140-24)/2
    for i,(big,lab) in enumerate(D["callouts"][:2]):
        x=70+i*(cw+24)
        d.rounded_rectangle([x,y,x+cw,y+200],18,fill=WHITE if i else NAVY,outline=RULE,width=2)
        d.text((x+28,y+28),big,font=font("black",62),fill=RED)
        yy=y+108
        for ln in wrap(d,lab,font("sb",24),cw-56)[:3]:
            d.text((x+28,yy),ln,font=font("sb",24),fill=INK if i else WHITE); yy+=31
    y+=212
    d.text((70,y),"Source: "+D["source"],font=font("r",19),fill=GREY)
    footer(d,W,H,s["date"],dark=False)
    im.save(out,optimize=True)

def hero(s,out):
    W,H=1200,800
    im=Image.new("RGB",(W,H),NAVY); d=ImageDraw.Draw(im)
    for y in range(H):
        t=y/H; d.line([0,y,W,y],fill=tuple(int(NAVY[i]*(1-t)+DEEP[i]*t) for i in range(3)))
    bars=s["data"]["bars"]; mx=max(b[1] for b in bars); n=len(bars)
    x0=730; bw=56; gap=18; base=H-120
    for i,b in enumerate(bars):
        h=max(8,int(b[1]/mx*470)); x=x0+i*(bw+gap)
        d.rounded_rectangle([x,base-h,x+bw,base],8,fill=RED if (len(b)>3 and b[3]) else (70,98,140))
        d.text((x+bw/2,base+30),b[0],font=font("sb",19),fill=MUTED,anchor="ms")
    d.rounded_rectangle([60,66,84,90],5,fill=RED); d.text((98,60),"DOWN THE MIDDLE",font=font("xb",26),fill=WHITE)
    y=180
    for ln in s["hero_title"]:
        d.text((60,y),ln,font=font("black",64),fill=WHITE); y+=74
    for ln in wrap(d,s["hero_sub"],font("sb",26),600):
        d.text((60,y+14),ln,font=font("sb",26),fill=MUTED); y+=36
    d.text((60,H-70),"Original Down the Middle graphic",font=font("r",18),fill=MUTED)
    im.save(out,optimize=True)

if __name__=="__main__":
    s=json.load(open(sys.argv[1]))
    root=os.path.join(os.path.dirname(__file__),"..","public","blog","assets")
    slide_story(s,os.path.join(root,f'{s["slug"]}-ig-1.png'))
    slide_data(s,os.path.join(root,f'{s["slug"]}-ig-2.png'))
    hero(s,os.path.join(root,f'{s["slug"]}-hero.png'))
    print("ok")
