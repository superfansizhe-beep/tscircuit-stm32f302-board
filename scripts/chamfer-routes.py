#!/usr/bin/env python3
"""
把 PCB 走线里的 90° 直角切成两段 45°（倒角），并把结果固化成 tscircuit 的
`pcbRouteCache`，让后续构建直接采用修正后的路径。

为什么要做这件事：
    90° 直角在 PCB 上有三个实际害处 ——
      1. 蚀刻时夹角处药液不易流动，容易残留铜（acid trap）
      2. 阻抗在拐角处突变，高速信号会反射
      3. 尖角处电场集中，长期可能引起枝晶生长
    行业标准做法是"切角"：把 1 个 90° 弯拆成 2 个 45° 弯。

⚠️ 重要：**这个脚本目前只能产出倒角后的 JSON，不要指望它接入构建流程。**

    实测把结果经 `pcbRouteCache` 灌回构建会失败，两条路都试过：
      · 只给 pcbRouteCache            → 布线器带着预载走线再跑一遍，内存溢出，
                                        产出 284 条乱走线 + 5 万个乱转角
      · 再加 routingDisabled + cacheKey → 不报错了，但 **只有 182/234 条走线
                                        采用了缓存**，没采用的那 52 条里正好包含
                                        全部 17 个直角 —— 等于一个都没修到
    所以脚本保留下来当"离线倒角工具"用（比如导出手工修图参考），
    但不接进 main.tsx。

为什么布线器改不了：
    tscircuit 的 core 里有 `chamferOrthogonalPolyline()`，但它只在某个特定
    布线策略（createBranchTrace）内部调用，不是全局后处理开关。

实测基线（供对比）：
    530 个有效转角的分布 ——
      45° 495 个（93%）   ← 布线器本来就在做 45° 走线，这部分是好的
      30°  9 个 / 60° 3 个 / 15° 1 个 / 75° 1 个
      **90° 17 个（3.2%）**  ← 需要处理的只有这些
    17 个直角分散在 17 条不同的走线上，每条只有 1 个，互不相邻。

用法：
    cd ~/Desktop/tscircuit/my-tscircuit
    python3 scripts/chamfer-routes.py
"""
import json
import math
import sys
from collections import Counter

CIRCUIT = "out/stm32f302/main.json"
OUTPUT = "circuits/stm32f302/route-cache.json"

# 倒角边长（mm）。太小起不到效果，太大会吃掉整条短线段。
# 0.3mm 是常见取值，对 0.25mm 线宽来说视觉上已经明显。
CHAMFER = 0.3

# 两段都短于这个长度的转角不动 —— 那是焊盘入口处的收尾抖动，不是真转角
MIN_SEG = 0.25


def angle_at(a, b, c):
    """b 处的方向变化角（度）。0 = 直行，90 = 直角。"""
    v1 = (b[0] - a[0], b[1] - a[1])
    v2 = (c[0] - b[0], c[1] - b[1])
    n1 = math.hypot(*v1)
    n2 = math.hypot(*v2)
    if n1 < 1e-9 or n2 < 1e-9:
        return 0.0, 0.0, 0.0
    cos = max(-1.0, min(1.0, (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2)))
    return math.degrees(math.acos(cos)), n1, n2


def dedupe(pts):
    out = []
    for p in pts:
        if out and math.dist((out[-1]["x"], out[-1]["y"]), (p["x"], p["y"])) < 1e-3:
            continue
        out.append(p)
    return out


def chamfer_route(route):
    """
    对一条走线的 route 做倒角。route 已按层分段（换层处重新起算），
    因为跨层的拐角不是几何拐角。
    """
    stats = {"fixed": 0, "kept": 0}

    # 先按层切成若干段，各自处理
    runs = []
    cur = []
    for p in route:
        if cur and p.get("layer") != cur[-1].get("layer"):
            runs.append(cur)
            cur = []
        cur.append(p)
    if cur:
        runs.append(cur)

    result = []
    for run in runs:
        run = dedupe(run)
        if len(run) < 3:
            result.extend(run)
            continue

        out = [run[0]]
        for i in range(1, len(run) - 1):
            a = (run[i - 1]["x"], run[i - 1]["y"])
            b = (run[i]["x"], run[i]["y"])
            c = (run[i + 1]["x"], run[i + 1]["y"])
            ang, n1, n2 = angle_at(a, b, c)

            # 只处理"真转角"：两段都够长，且转弯接近直角
            if n1 < MIN_SEG or n2 < MIN_SEG or ang < 60:
                out.append(run[i])
                stats["kept"] += 1
                continue

            # 切成两段 45°：在两条腿上各退 CHAMFER，但不能超过腿长的一半
            t = min(CHAMFER, n1 / 2, n2 / 2)
            u1 = ((b[0] - a[0]) / n1, (b[1] - a[1]) / n1)
            u2 = ((c[0] - b[0]) / n2, (c[1] - b[1]) / n2)

            p1 = dict(run[i])
            p1["x"] = b[0] - u1[0] * t
            p1["y"] = b[1] - u1[1] * t
            p2 = dict(run[i])
            p2["x"] = b[0] + u2[0] * t
            p2["y"] = b[1] + u2[1] * t

            out.append(p1)
            out.append(p2)
            stats["fixed"] += 1

        out.append(run[-1])
        result.extend(out)

    return result, stats


def main():
    els = json.load(open(CIRCUIT))
    if not isinstance(els, list):
        els = els.get("elements", [])

    traces = [e for e in els if e.get("type") == "pcb_trace"]
    print(f"读入 {len(traces)} 条走线")

    cached = []
    total = Counter()
    for t in traces:
        route = t.get("route") or []
        if len(route) < 3:
            cached.append(t)
            continue
        new_route, st = chamfer_route(route)
        total.update(st)
        nt = dict(t)
        nt["route"] = new_route
        cached.append(nt)

    print(f"  倒角 {total['fixed']} 处（90° → 两段 45°）")
    print(f"  保留 {total['kept']} 处普通转角")

    # 只留 core 需要的字段，别把整个 circuit-json 塞进去
    keep = ("pcb_trace_id", "route", "layer", "source_trace_id",
            "pcb_component_id", "subcircuit_id", "connection_name")
    slim = [{k: v for k, v in t.items() if k in keep} for t in cached]
    json.dump({"pcbTraces": slim}, open(OUTPUT, "w"), separators=(",", ":"))
    print(f"✅ 已写出 {OUTPUT}（{len(slim)} 条）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
