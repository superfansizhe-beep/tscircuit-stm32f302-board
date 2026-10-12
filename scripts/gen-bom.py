#!/usr/bin/env python3
"""
从 circuit-json 自动生成 BOM —— 不是手写的

为什么要自动生成：
    手写 BOM 一定会跟设计脱节 —— 改了电路忘了改 BOM，或者改了 BOM 忘了改电路。
    本项目已经两次在「料号」上出过这种问题（R5 写成 0402 的料号、
    120Ω 凭印象写 C20633），所以 BOM 必须从**实际电路产物**反推出来。

数据来源：
    元件/参数/C 编号/厂商型号  ← out/stm32f302/main.json（tsci export 产物）
    封装规格                  ← 嘉立创官方接口（按 C 编号查 componentSpecificationEn）
                               结果缓存到 out/stm32f302/jlc-packages.json，避免重复请求

用法：
    cd ~/Desktop/tscircuit/my-tscircuit
    export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"
    ./tsci-run export circuits/stm32f302/main.tsx -f circuit-json -o ../../out/stm32f302/main.json
    python3 scripts/gen-bom.py
"""
import json
import os
import subprocess
import sys
from collections import defaultdict

CIRCUIT = "out/stm32f302/main.json"
CACHE = "out/stm32f302/jlc-packages.json"
OUTPUT = "circuits/stm32f302/BOM-AUTO.md"

JLC_URL = "https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList"

# 少数料号嘉立创接口没给封装规格（返回 "-"），人工兜底并注明来源。
# 这是**唯一的**人工表，且只有已核实的条目才能进这里。
PKG_OVERRIDE = {
    "C428721": "插件通孔（XT30 板端公头）",
}


def fmt_cap(f: float) -> str:
    for div, unit in ((1e-6, "uF"), (1e-9, "nF"), (1e-12, "pF")):
        if f >= div * 0.999:
            return f"{f / div:g}{unit}"
    return f"{f:g}F"


def fmt_freq(hz: float) -> str:
    return f"{hz / 1e6:g}MHz" if hz >= 1e6 else f"{hz / 1e3:g}kHz"


def fmt_res(ohm: float) -> str:
    return f"{ohm / 1e3:g}kΩ" if ohm >= 1000 else f"{ohm:g}Ω"


def fetch_package(code: str) -> str:
    """按 C 编号问嘉立创要封装规格"""
    body = {"keyword": code, "currentPage": 1, "pageSize": 10}
    try:
        p = subprocess.run(
            ["curl", "-s", "-m", "30", "-X", "POST", JLC_URL,
             "-H", "Content-Type: application/json", "-H", "User-Agent: Mozilla/5.0",
             "-H", "Origin: https://jlcpcb.com", "-H", "Referer: https://jlcpcb.com/parts",
             "-d", json.dumps(body)],
            capture_output=True, text=True,
        )
        data = json.loads(p.stdout)
        for x in data["data"]["componentPageInfo"]["list"]:
            if x.get("componentCode") == code:
                return x.get("componentSpecificationEn") or ""
    except Exception:
        pass
    return ""


def main() -> int:
    if not os.path.exists(CIRCUIT):
        print(f"找不到 {CIRCUIT}，先跑 tsci export")
        return 1

    els = json.load(open(CIRCUIT))
    if not isinstance(els, list):
        els = els.get("elements", [])

    src = [e for e in els if e.get("type") == "source_component"]
    pcb = {e["pcb_component_id"]: e for e in els if e.get("type") == "pcb_component"}
    bysrc = {c.get("source_component_id"): c for c in pcb.values()}
    grp = {e.get("pcb_group_id"): e.get("name") for e in els if e.get("type") == "pcb_group"}
    fpstr = {e.get("source_component_id"): e.get("footprinter_string")
             for e in els if e.get("type") == "cad_component"}

    # 焊盘数：封装是否真的生效，看这个（封装不以字符串字段存在，
    # 而是被解析成真实焊盘几何）
    pads = defaultdict(int)
    for e in els:
        if e.get("type") in ("pcb_smtpad", "pcb_plated_hole"):
            pads[e.get("pcb_component_id")] += 1

    # ── 封装规格缓存 ──
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    codes = sorted({(s.get("supplier_part_numbers") or {}).get("jlcpcb", [None])[0]
                    for s in src} - {None})
    missing = [c for c in codes if c not in cache]
    if missing:
        print(f"向嘉立创查询 {len(missing)} 个料号的封装规格 …")
        for i, c in enumerate(missing, 1):
            cache[c] = fetch_package(c)
            print(f"   [{i}/{len(missing)}] {c} → {cache[c] or '（未取到）'}")
        json.dump(cache, open(CACHE, "w"), indent=1, ensure_ascii=False)

    def mod(sid):
        c = bysrc.get(sid)
        return grp.get(c.get("pcb_group_id"), "?") if c else "?"

    rows = []
    for s in src:
        n = s.get("name")
        ft = s.get("ftype", "")
        jlc = (s.get("supplier_part_numbers") or {}).get("jlcpcb", [None])[0]
        val = ""
        if s.get("resistance") is not None:
            val = fmt_res(s["resistance"])
        elif s.get("capacitance") is not None:
            val = fmt_cap(s["capacitance"])
        elif s.get("inductance") is not None:
            val = str(s["inductance"])
        elif s.get("frequency") is not None:
            val = fmt_freq(s["frequency"])
        elif s.get("color"):
            val = s["color"]
        if s.get("display_resistance"):
            val = s["display_resistance"]
        if s.get("display_inductance"):
            val = s["display_inductance"]
        pc = bysrc.get(s["source_component_id"], {})
        pkg = (PKG_OVERRIDE.get(jlc)
               or (cache.get(jlc) if cache.get(jlc) not in ("", "-") else "")
               or fpstr.get(s["source_component_id"], "") or "")
        rows.append({
            "mod": mod(s["source_component_id"]),
            "ref": n,
            "type": ft.replace("simple_", ""),
            "value": val or "—",
            "pkg": pkg or "—",
            "jlc": jlc or "—",
            "mpn": s.get("manufacturer_part_number") or "—",
            "pads": pads.get(pc.get("pcb_component_id"), 0),
        })

    order = ["PWR", "MCU", "UART", "I2C", "SPI", "CAN", "PWM", "ADC", "LED"]
    rows.sort(key=lambda r: (order.index(r["mod"]) if r["mod"] in order else 99, r["ref"]))

    # ── 汇总（按料号合并，供下单用）──
    agg = defaultdict(lambda: {"refs": [], "qty": 0})
    for r in rows:
        key = (r["jlc"], r["mpn"], r["pkg"], r["value"], r["type"])
        agg[key]["refs"].append(r["ref"])
        agg[key]["qty"] += 1

    L = []
    L.append("# BOM（自动生成）— STM32F302R8T6 考核板\n")
    L.append("> **本文件由 `scripts/gen-bom.py` 从 circuit-json 自动生成，请勿手改。**")
    L.append("> 元件/参数/C 编号/厂商型号取自 `out/stm32f302/main.json`（tsci export 产物）；")
    L.append("> 封装规格由嘉立创官方接口按 C 编号查得（缓存于 `out/stm32f302/jlc-packages.json`）。")
    L.append("> 手写 BOM 一定会跟设计脱节，所以这张表必须从实际产物反推。\n")
    L.append(f"**元件总数：{len(rows)}**　按料号合并后 **{len(agg)} 种**\n")

    L.append("---\n")
    L.append("## 1. 下单汇总（按料号合并）\n")
    L.append("| # | C 编号 | 厂商型号 | 封装 | 参数 | 数量 | 位号 |")
    L.append("|---:|--------|----------|------|------|:---:|------|")
    # 先按数量降序，数量相同则按 C 编号稳定排序，避免每次生成顺序抖动
    for i, (k, v) in enumerate(sorted(agg.items(), key=lambda x: (-x[1]["qty"], x[0][0])), 1):
        jlc, mpn, pkg, val, typ = k
        refs = " ".join(v["refs"])
        if len(refs) > 60:
            refs = refs[:57] + "…"
        L.append(f"| {i} | `{jlc}` | {mpn} | {pkg} | {val} | {v['qty']} | {refs} |")
    L.append("")

    L.append("---\n")
    L.append("## 2. 逐元件明细（按页）\n")
    cur = None
    for r in rows:
        if r["mod"] != cur:
            cur = r["mod"]
            L.append(f"\n### {cur} 页\n")
            L.append("| 位号 | 类型 | 参数 | 封装 | C 编号 | 厂商型号 | 焊盘 |")
            L.append("|------|------|------|------|--------|----------|:---:|")
        L.append(f"| **{r['ref']}** | {r['type']} | {r['value']} | {r['pkg']} "
                 f"| `{r['jlc']}` | {r['mpn']} | {r['pads']} |")
    L.append("")

    L.append("---\n")
    L.append("## 3. 完整性自检\n")
    bad = [r for r in rows if r["jlc"] == "—" or r["mpn"] == "—" or r["pads"] == 0]
    L.append("| 检查项 | 结果 |")
    L.append("|--------|------|")
    L.append(f"| 每个元件都有电参数 | {'✅' if all(r['value'] != '—' or r['type'] in ('chip','connector','switch') for r in rows) else '❌'} |")
    L.append(f"| 每个元件都有 C 编号 | {'✅' if all(r['jlc'] != '—' for r in rows) else '❌'} |")
    L.append(f"| 每个元件都有厂商型号 | {'✅' if all(r['mpn'] != '—' for r in rows) else '❌'} |")
    L.append(f"| 每个元件封装都生效（焊盘 > 0） | {'✅' if all(r['pads'] > 0 for r in rows) else '❌'} |")
    if bad:
        L.append("\n**有问题的元件：**\n")
        for r in bad:
            L.append(f"- {r['ref']}（{r['mod']}）：C={r['jlc']} 型号={r['mpn']} 焊盘={r['pads']}")
    L.append("")
    L.append("> **关于「封装」这一列**：tscircuit 不把封装存成字符串字段，而是")
    L.append("> 直接把 `footprint=` 解析成**真实焊盘几何**。所以「封装填了吗」的")
    L.append("> 判定标准是**焊盘数 > 0**，而不是某个字段非空。最后一列就是这个证据。\n")

    open(OUTPUT, "w").write("\n".join(L) + "\n")
    print(f"\n✅ 已写出 {OUTPUT}")
    print(f"   元件 {len(rows)} 个 / 料号 {len(agg)} 种")
    if bad:
        print(f"   ⚠️ 有 {len(bad)} 个元件信息不全：{[r['ref'] for r in bad]}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
