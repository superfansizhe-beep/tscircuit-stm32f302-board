#!/usr/bin/env python3
"""
模块验收检查 —— 每页放完器件后跑一次

用法：
    cd ~/Desktop/tscircuit/my-tscircuit
    export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"
    ./tsci-run export circuits/stm32f302/main.tsx -f circuit-json -o ../../out/stm32f302/main.json
    python3 scripts/check-modules.py

为什么必须跑它（血的教训）：
    `tsci export` 只要没崩就打印 "Exported to ..."，**构建成功不代表元件都在**。
    实测 <crystal> 漏了必填的 loadCapacitance 时，整个晶振被静默丢弃，
    而构建照样报成功 —— 只有 source_failed_to_create_component_error 能发现。
    所以「元件数 == 预期数」这条硬校验不能省。

判定标准：
    ❌ 必须为 0：创建失败 / 模块内器件重叠 / 模块内庭院重叠 / 原理图页外
    ⚠️ 允许存在：未接线、库存假阳性、封装自比对假阳性、缺 courtyard
"""
import json
import sys
from collections import Counter, defaultdict

PATH = "out/stm32f302/main.json"

# 各模块预期的器件集合（放完一页就往这里加一行）
EXPECT = {
    "PWR": set("J1 SW1 U1 L1 U2 C1 C2 C3 C4 C5 C6 C7 R1 R2 R3 R4 R5 D1 D2 D3".split()),
    "MCU": set(
        "U3 Y1 SW2 SW3 J11 FB1 C10 C11 C12 C13 C14 C15 C16 C17 C18 C19 C20 R10 R11 R12".split()
    ),
    "UART": set("J2 J3 J4".split()),
    "I2C": set("U4 U5 J5 R20 R21 R22 R23 R24 R25 C30 C31".split()),
    "SPI": set("U6 J6 J12 R26 R27 C32 C33".split()),
    "CAN": set("U7 J7 R28 R29 C34".split()),
    "PWM": set("J8 J9 J10".split()),
    "ADC": set("R30 R31 R32 R33 R34 R35 C35 C36 C37".split()),
    "LED": set("LED1 LED2 LED3 R36 R37 R38".split()),
}

# ── 具名豁免：庭院重叠，但是**故意设计**的 ──────────────────────────────
# 每个条目都要写清楚为什么可以放行。不加理由的豁免等于放松标准。
# ── 具名豁免：位号前缀约定 ────────────────────────────────────────────────
# tscircuit 对 <chip> 只认 U / IC 前缀，但有些前缀是行业惯用且更准确。
REFDES_EXCEPTIONS = {
    "FB1": "磁珠的行业惯用前缀就是 FB（Ferrite Bead）。tscircuit 建议的 <fuse> 与 "
    "<inductor> 都不符合器件本质。BOM 里这一行是 Murata BLM18AG601SN1D 磁珠。",
}

COURTYARD_EXCEPTIONS = {
    frozenset({"J8", "J9"}): "PWM 舵机轨：三排必须 2.54mm 紧贴，"
    "排针庭院 3.04mm 故重叠 0.50mm（本体外各 0.25mm 通用余量），物理无害",
    frozenset({"J9", "J10"}): "同上",
}

OK_TYPES = (
    "source_pin_missing_trace_warning",
    "source_component_availability_warning",
    "supplier_footprint_mismatch_warning",
    "source_property_ignored_warning",
    "pcb_component_missing_courtyard_warning",
    "source_pin_must_be_connected_error",  # 接线后应消失，接线前属预期
    "source_no_power_pin_defined_warning",
    "source_no_ground_pin_defined_warning",
    "source_component_pins_underspecified_warning",
    "source_missing_manufacturer_part_number_warning",
    "source_pin_has_multiple_traces_warning",
    # 连接器朝向：要求"从板边可插拔"。本阶段模块还在原点、板边未定，
    # 到全局布局阶段才会把连接器摆到板边，这条届时自然消失。
    "pcb_connector_not_in_accessible_orientation_warning",
    # 嘉立创接口偶发 HTTP 503（实测重跑即消失），属瞬时网络故障，非设计问题。
    # 但它会让构建从 40 秒变成 5 分钟以上，看到它应该重跑一次再判断。
    "source_part_not_found_warning",
    # 位号前缀约定单独在 ④b 里带豁免判定，这里过滤掉避免重复列出
    "source_refdes_convention_warning",
)

BAD_TYPES = (
    "source_failed_to_create_component_error",
    "pcb_footprint_overlap_error",
    "pcb_courtyard_overlap_error",
    "schematic_element_outside_sheet_warning",
    "pcb_component_outside_board_error",
    # 下面两条是实测踩出来的真 bug，绝不能当噪声放过：
    #   external_footprint_load_error —— jlcpcb 封装在 EasyEDA 库里不存在，
    #     元件会生成但**一个焊盘都没有**（实测 C1002/C1003 磁珠就是）
    #   source_component_misconfigured_error —— 典型是 LED 极性写反，
    #     实测红色 C2286 是 pin1=阳极，而绿色 C84267 / 蓝色 C84266 是 pin1=阴极
    "external_footprint_load_error",
    "source_component_misconfigured_error",
)


def main() -> int:
    els = json.load(open(PATH))
    if not isinstance(els, list):
        els = els.get("elements", [])

    src = {e["source_component_id"]: e.get("name") for e in els if e.get("type") == "source_component"}
    pcb = {e["pcb_component_id"]: e for e in els if e.get("type") == "pcb_component"}

    # 模块归属按 pcb_group 名判定。
    # ⚠️ 这里有个关键背景：模块用的是 <group> 而**不是 <subcircuit>**。
    #    原因见 README「为什么模块用 <group> 而不是 <subcircuit>」——
    #    <subcircuit> 会把 net.X 的命名空间隔离在子电路内，跨页供电就全断了。
    grp_name = {
        e.get("pcb_group_id"): e.get("name")
        for e in els
        if e.get("type") == "pcb_group"
    }

    def mod(cid):
        g = pcb.get(cid, {}).get("pcb_group_id")
        return grp_name.get(g) or g or "?"

    def nm(cid):
        return src.get(pcb.get(cid, {}).get("source_component_id"), "?")

    counts = Counter(e.get("type") for e in els)
    fail = 0

    print("=" * 68)
    print("① 元件数（构建成功 ≠ 元件都在 —— 必须逐模块核对）")
    print("=" * 68)
    got = defaultdict(set)
    for cid in pcb:
        got[mod(cid)].add(nm(cid))
    for m, exp in EXPECT.items():
        g = got.get(m, set())
        missing, extra = sorted(exp - g), sorted(g - exp)
        flag = "✅" if not missing and not extra else "❌"
        if missing or extra:
            fail += 1
        print(f"  {flag} {m:<6} {len(g):>2}/{len(exp):<2} 个", end="")
        if missing:
            print(f"   缺失: {missing}", end="")
        if extra:
            print(f"   多余: {extra}", end="")
        print()
    unlisted = {m: sorted(v) for m, v in got.items() if m not in EXPECT}
    if unlisted:
        print(f"  ℹ️  未登记模块: {unlisted}")

    print()
    print("=" * 68)
    print("② 创建失败的元件（静默丢件的唯一线索）")
    print("=" * 68)
    n = counts.get("source_failed_to_create_component_error", 0)
    print(f"  {'✅' if n == 0 else '❌'} {n} 个")
    for e in els:
        if e.get("type") == "source_failed_to_create_component_error":
            print(f"      {str(e.get('message'))[:150]}")
    fail += n

    print()
    print("=" * 68)
    print("②b 硬错误兜底（BAD_TYPES 通用扫描 —— 之前漏了这一层，导致 503 丢封装时误报通过）")
    print("=" * 68)
    handled = {"pcb_footprint_overlap_error", "pcb_courtyard_overlap_error",
               "schematic_element_outside_sheet_warning", "source_refdes_convention_warning",
               "source_failed_to_create_component_error"}
    n_bad = 0
    for t in BAD_TYPES:
        if t in handled:
            continue
        cnt = counts.get(t, 0)
        if cnt:
            print(f"  ❌ {t}: {cnt}")
            for e in els:
                if e.get("type") == t:
                    print(f"        {str(e.get('message'))[:130]}")
            n_bad += cnt
    print(f"  {'✅ 0 个' if not n_bad else f'❌ 共 {n_bad} 条'}")
    fail += n_bad

    print()
    print("=" * 68)
    print("②c 零焊盘元件（封装没加载成功 —— 元件在、但板子上是空的）")
    print("=" * 68)
    pad_cnt = defaultdict(int)
    for e in els:
        if e.get("type") in ("pcb_smtpad", "pcb_plated_hole"):
            pad_cnt[e.get("pcb_component_id")] += 1
    zero = [(nm(cid), mod(cid)) for cid in pcb if pad_cnt.get(cid, 0) == 0]
    if zero:
        for n, m in zero:
            print(f"  ❌ {n} ({m}) 一个焊盘都没有")
    else:
        print("  ✅ 0 个")
    fail += len(zero)

    print()
    print("=" * 68)
    print("③ 模块【内部】几何冲突（跨模块重叠属预期，全局布局时解决）")
    print("=" * 68)
    for t in ("pcb_footprint_overlap_error", "pcb_courtyard_overlap_error"):
        inner, cross, excused = [], 0, []
        for e in els:
            if e.get("type") != t:
                continue
            ids = e.get("pcb_component_ids") or []
            if len(ids) == 2:
                a, b = ids
                if mod(a) != mod(b):
                    cross += 1
                elif frozenset({nm(a), nm(b)}) in COURTYARD_EXCEPTIONS:
                    excused.append((nm(a), nm(b)))
                else:
                    inner.append((nm(a), nm(b), mod(a)))
        flag = "✅" if not inner else "❌"
        print(f"  {flag} {t}: 模块内 {len(inner)}   模块间 {cross}")
        for a, b, m in inner:
            print(f"        {a} + {b}  ({m})")
        for a, b in excused:
            why = COURTYARD_EXCEPTIONS[frozenset({a, b})]
            print(f"        ℹ️  已豁免 {a} + {b}: {why[:70]}")
        fail += len(inner)

    print()
    print("=" * 68)
    print("④ 原理图页外元素")
    print("=" * 68)
    n = counts.get("schematic_element_outside_sheet_warning", 0)
    print(f"  {'✅' if n == 0 else '❌'} {n} 个")
    fail += n

    print()
    print("=" * 68)
    print("④b 位号前缀约定")
    print("=" * 68)
    n_bad = 0
    for e in els:
        if e.get("type") != "source_refdes_convention_warning":
            continue
        ref = e.get("refdes") or ""
        if ref in REFDES_EXCEPTIONS:
            print(f"  ℹ️  已豁免 {ref}: {REFDES_EXCEPTIONS[ref][:70]}")
        else:
            print(f"  ❌ {ref}: {str(e.get('message'))[:100]}")
            n_bad += 1
    if not n_bad and not any(
        e.get("type") == "source_refdes_convention_warning" for e in els
    ):
        print("  ✅ 0 个")
    fail += n_bad

    print()
    print("=" * 68)
    print("⑤ 其余警告（分类）")
    print("=" * 68)
    others = {
        k: v
        for k, v in counts.items()
        if ("warning" in k or "error" in k) and k not in OK_TYPES and k not in BAD_TYPES
    }
    for k, v in sorted(others.items()):
        print(f"  ⚠️  {k:<52} {v}")
    if not others:
        print("  （无）")

    print()
    print("=" * 68)
    print(f"总元件 {len(pcb)}   焊盘 {counts.get('pcb_smtpad',0)} SMT + {counts.get('pcb_plated_hole',0)} 通孔")
    print("结论:", "✅ 通过" if fail == 0 else f"❌ 有 {fail} 项硬校验未过")
    print("=" * 68)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
