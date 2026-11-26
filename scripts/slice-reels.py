import sys
from PIL import Image
import numpy as np
def slice_trip(path, names, y0s, outdir):
    im=Image.open(path).convert('RGB'); arr=np.asarray(im).astype(int); col=arr.mean(axis=(0,2))
    white=[i for i,v in enumerate(col) if v>240]
    # group gutter columns
    gs=[];cur=[]
    for i in white:
        if cur and i!=cur[-1]+1: gs.append(cur);cur=[]
        cur.append(i)
    if cur: gs.append(cur)
    gs=[g for g in gs if 3<len(g)<40 and 300<g[0]<1300]
    edges=[0]+[x for g in gs for x in (g[0],g[-1]+1)]+[im.width]
    panels=[(edges[i],edges[i+1]) for i in range(0,len(edges),2)]
    assert len(panels)==3, panels
    for (x0,x1),name,y0 in zip(panels,names,y0s):
        w=x1-x0-4; x0+=2; h=round(w*16/9)
        y0=max(0,min(im.height-h,y0))
        p=im.crop((x0,y0,x0+w,y0+h)).resize((540,960),Image.LANCZOS)
        p.save(f'{outdir}/{name}.webp',quality=82)
        print(name,(x0,y0,w,h))
if __name__=='__main__':
    slice_trip(sys.argv[1], sys.argv[2].split(','), [int(v) for v in sys.argv[3].split(',')], sys.argv[4])
