import random, sys
B=[1.10,1.35,1.65]; DM=[-.1,0,.1]; KK=[10,35,60]
KN={0:[.6,.3,.1],1:[.3,.5,.2],2:[.1,.4,.5]}
def pick(p): return random.choices([0,1,2],p)[0]
def make_cfg(v):
    if v=="old":
        L=[([1500,2500,3500],8600,1000,[.6,.35,.05]),([4000,5000,6000],24000,3000,[.5,.4,.1]),
           ([5000,8000,9000],47000,5000,[.3,.5,.2]),([12000,14000,18000],93000,8000,[.1,.35,.55]),
           ([12000,14000,16000],150000,0,[.1,.4,.5])]
        return dict(L=L,insp_formal=1.0,insp_item=1.0,detect_text=True)
    L=[([1500,2500,3500],8000,1000,[.6,.35,.05]),([4000,5000,6000],24000,3000,[.5,.4,.1]),
       ([5000,8000,9000],48000,5000,[.3,.5,.2]),([12000,14000,18000],94000,8000,[.1,.35,.55]),
       ([15000,18000,22000],150000,0,[.1,.4,.5])]
    return dict(L=L,insp_formal=.8,insp_item=.85,detect_text=False)

def regular_ev(m,kn,mood,bpost,upost):
    ev=0
    for b,pb in enumerate(bpost):
        for u,pu in enumerate(upost):
            w=pb*pu
            if not w: continue
            L=B[b]+DM[mood]+(.1 if u==2 else 0)
            if m<=1: ev+=w*m; continue
            det=0 if m<=1.2 else min(95,KK[kn]+50*(m-1.2))/100
            acc=(1-det)*(m<=L)+det*(m<=L)*(.3 if mood==2 else 0)
            hp=[0,.4,.65][kn]; hv=[1,.95,.90][kn]
            p_refuse=1-acc
            # among refusals: hard only if detected
            p_hard=det*(1-(m<=L)*(.3 if mood==2 else 0))*hp
            ev+=w*(acc*m+p_hard*hv+(p_refuse-p_hard)*1.0)
    return ev

def strategy_informed(o,cfg,st):
    st['scen']=True
    # posterior inspector from signals
    Q=0 if st['call']==0 else min(40,max(5,20-st['R']))/100
    f,it=o['formal'],o['item']
    pi=Q*(cfg['insp_formal'] if f else 1-cfg['insp_formal'])*(cfg['insp_item'] if it else 1-cfg['insp_item'])
    pr=(1-Q)*(.2 if f else .8)*(.2 if it else .8)
    p=pi/(pi+pr) if pi+pr else 0
    if cfg['detect_text'] and it: p=1.0 if o['insp'] else 0.0   # old: answer text reveals
    if not cfg['detect_text'] and not it and not f: pass
    bp=o['bp']
    if o['bud']==2 and o['ambig']: bpost=[0,0,1]
    elif o['ambig']: s=bp[0]+bp[1]; bpost=[bp[0]/s,bp[1]/s,0]
    else: bpost=bp
    upost=[0,0,0]
    if o['urg_hint']: upost[o['urg']]=1
    else: upost=[.3,.4,.3]
    pen = 0.6 if st['V']==0 else 30
    psc = 1.0 if o.get('sc_hint') else (0.03 if st.get('scen') else 0)
    best=(-9,1.0)
    for m in [x/100 for x in range(100,201,5)]:
        ins = m if m<=1.2+1e-9 else (2-m)-pen
        det=0 if m<=1.2 else min(95,KK[o['kn']]+50*(m-1.2))/100
        r=regular_ev(m,o['kn'],o['mood'],bpost,upost)
        if m>=1.3-1e-9: r=(1-psc*det)*r + psc*det*(-0.3)
        ev=(1-p)*r+p*ins
        if ev>best[0]: best=(ev,m)
    return best[1]
def strategy_flat(x): return lambda o,cfg,st: x
def strategy_honest(o,cfg,st): return 1.0

SC=[.05,.05,.10,.15,.15]
def run(strategy,cfg,fail=0.12,scandal=False):
    st=dict(M=0,R=0,V=0,call=0,qb=0)
    for li,(prices,quota,move,bp) in enumerate(cfg['L']):
        offers=[(prices[0],0)]*2+[(prices[1],1)]*2+[(prices[2],2)]
        chosen=sorted(offers,reverse=True)[:3]
        for P,tier in chosen:
            o=dict(bud=pick(bp),kn=pick(KN[tier]),urg=pick([.3,.4,.3]),mood=pick([.2,.6,.2]),bp=bp)
            Q=0 if st['call']==0 else min(40,max(5,20-st['R'])+st['qb'])
            st['qb']=0
            o['sc']= scandal and random.random()<SC[li]
            o['sc_hint']= o['sc'] and random.random()<.7
            o['insp']= random.random()*100<Q
            st['call']+=1
            if o['insp']:
                o['formal']=random.random()<cfg['insp_formal']; o['item']=random.random()<cfg['insp_item']
            else:
                o['formal']=random.random()<.2; o['item']=random.random()<.2
            o['ambig']=not o['item']
            o['urg_hint']=random.random()<.5
            m=strategy(o,cfg,st)
            obj=False
            if o['insp']: acc=True
            elif m<=1: acc=True
            else:
                bud,kn,mood,urg=o['bud'],o['kn'],o['mood'],o['urg']
                L=B[bud]+DM[mood]+(.1 if urg==2 else 0)
                det= m>1.2 and random.random()*100<min(95,KK[kn]+50*(m-1.2))
                if det and o['sc'] and m>=1.30-1e-9:
                    st['R']=max(-20,st['R']-6); st['qb']=10; continue
                if not det and m<=L+1e-9: acc=True
                elif det and m<=L+1e-9 and mood==2 and random.random()<.3: acc=True
                else:
                    obj=True
                    hard=det and random.random()<[0,.4,.65][kn]
                    if hard: m2=[0,.95,.90][kn]; acc=True
                    else:
                        L2=B[bud]+DM[max(0,mood-1)]+(.1 if urg==2 else 0)
                        # player guesses: drops to ~ (m+1)/2 rounded down, at least 1 step
                        m2=1.0 if strategy is strategy_informed else min(m-0.05,max(1.0,round(((m+1)/2)/0.05)*0.05))
                        acc = m2<=L2+1e-9
                    m=m2
            if not acc: st['R']=max(-20,st['R']-4); continue
            failed=random.random()<fail
            st['M']+=round(P*m)*(0.8 if failed else 1)
            dR=0 if failed else (1 if obj else 2)
            if o['insp'] and m>1.2+1e-9:
                st['M']-=2*(round(P*m)-P); dR-=8; st['V']+=1
                if st['V']>=2: return "arrest",li
            st['R']=max(-20,min(20,st['R']+dR))
            if li<4 and st['M']>=quota: break
            if li==4 and st['M']>=quota and st['R']>=10: return "win",li
        if st['M']<quota: return "money",li
        if li==4 and st['R']<10: return "rep",li
        st['M']-=move
    return "win",4
NAMES=["dorm","khr","new","elite","office"]
random.seed(7); N=20000
cfg=make_cfg("new")
for sc in [False,True]:
    print("=== scandal",sc)
    for nm,st in [("honest",strategy_honest),("flat1.10",strategy_flat(1.1)),("flat1.20",strategy_flat(1.2)),("flat1.40",strategy_flat(1.4)),("informed",strategy_informed)]:
        res={}
        for _ in range(N):
            r,li=run(st,cfg,scandal=sc); k=r if r=="win" else f"{r}@{NAMES[li]}"
            res[k]=res.get(k,0)+1
        top=sorted(res.items(),key=lambda x:-x[1])[:4]
        print(f"  {nm:9s} win={res.get('win',0)/N:5.1%}  ", ", ".join(f"{k} {c/N:.0%}" for k,c in top if k!='win'))
