#!/usr/bin/env python3
"""
ERC 电气规则检查 —— 从 circuit-json 的**真实连通性**做，不靠猜

数据基础：
    tscircuit 给每个 source_port 打了一个 `subcircuit_connectivity_map_key`。
    **同 key 的引脚就是同一个电气网络** —— 这是权威连通性，比顺着 source_trace
    自己追可靠得多（trace 只是画法，连通性才是电气事实）。

检查项：
    A 电源短路      两个不同的命名网络被并成同一个连通组
    B 重复网络      同一个网络名分裂成多个互不相连的连通组
    C 悬空引脚      引脚所在的连通组只有它自己
    D 必连未连      must_be_connected 的引脚仍然孤单
    E 供电无源      requires_power 的引脚所在网络里没有任何 provides_power 的引脚
    F 接地非地      requires_ground 的引脚所在网络不是 GND
    G 多驱动        同一个网络上有两个以上 provides_power 的引脚（可能对顶）

用法：
    cd ~/Desktop/tscircuit/my-tscircuit
    python3 scripts/erc.py
"""
import json
import sys
from collections import defaultdict

CIRCUIT = "out/stm32f302/main.json"

# 电网网络的判定（名字里带这些的算电源轨）
POWER_NAMES = {"V12", "V5", "V3_3", "VDDA", "GND"}


# ── 刻意留空的引脚白名单（每条都要写理由，不加理由的豁免等于放松标准）──
# 来源：PINMAP.md「未使用引脚」+ 各页文件头注释
INTENTIONAL_OPEN = {
    # 主控的 12 个未用脚（与 PINMAP.md 清单逐字一致）
    **{f"U3.{n}": "主控未用脚（见 PINMAP.md §4）"
       for n in ("PC13", "PC14", "PC15", "PA5", "PB1", "PA15", "PD2", "PB3", "PB4", "PB5", "PB8", "PB9")},
    # 器件本身的 NC / 不用功能
    "U2.NC": "TLV75733 的第 4 脚本就是 NC",
    "U7.NC1": "TCAN332 的第 5 脚本就是 NC",
    "U7.NC2": "TCAN332 的第 8 脚本就是 NC",
    "U6.INTA": "MCP23S17 中断输出，本板不用中断（轮询）",
    "U6.INTB": "同上",
    "U5.ALERT": "TMP1075 报警输出，本板轮询温度即可",
    # 开关
    "SW1.T2": "SPDT 的另一个掷，本板只用 COM+T1 做通断",
    "SW1.MP1": "拨动开关的安装脚，不参与电路",
    "SW1.MP2": "同上",
    "SW2.A2": "与 A1 在器件内部相通（每组触点只接一个，否则被判成短接）",
    "SW2.B2": "与 B1 内部相通",
    "SW3.A2": "与 A1 内部相通",
    "SW3.B2": "与 B1 内部相通",
    # SWD 标准 10 脚里的保留位
    "J11.pin6": "SWO，本板不复用",
    "J11.pin7": "KEY（防呆位），本来就无引脚",
    "J11.pin8": "NC",
}


def main() -> int:
    els = json.load(open(CIRCUIT))
    if not isinstance(els, list):
        els = els.get("elements", [])

    comp = {e["source_component_id"]: e.get("name") for e in els if e.get("type") == "source_component"}
    ports = [e for e in els if e.get("type") == "source_port"]
    nets = [e for e in els if e.get("type") == "source_net"]
    groups = {e.get("pcb_group_id"): e.get("name") for e in els if e.get("type") == "pcb_group"}
    pcb = {e["pcb_component_id"]: e for e in els if e.get("type") == "pcb_component"}
    bysrc = {c.get("source_component_id"): c for c in pcb.values()}

    def mod_of(sid):
        c = bysrc.get(sid)
        return groups.get(c.get("pcb_group_id"), "?") if c else "?"

    def ftype_of(name):
        for sid, n in comp.items():
            if n == name:
                for e in els:
                    if e.get("type") == "source_component" and e["source_component_id"] == sid:
                        return e.get("ftype", "")
        return ""

    def pin_label(c, nm, pn):
        return f"{c}.{nm}"

    def pin(pid):
        p = next(x for x in ports if x["source_port_id"] == pid)
        cid = p.get("source_component_id")
        return comp.get(cid, "?"), p.get("name"), p.get("pin_number"), mod_of(cid)

    # ── 按连通性 key 建网表 ──
    # ⚠️ 关键：未接任何线的引脚，key 是 **None**。
    #    如果把 None 当成一个网络名分组，28 个毫不相干的空脚会被并成
    #    一个"28 脚网络"，看起来像把所有未用脚短接在一起 —— 这是**假象**。
    #    （实测这些引脚之间 source_trace 数 = 0，电气上互不相连。）
    key_ports = defaultdict(list)
    unconnected = []
    for p in ports:
        k = p.get("subcircuit_connectivity_map_key")
        if k is None:
            unconnected.append(p)
        else:
            key_ports[k].append(p)

    key_names = defaultdict(set)
    for n in nets:
        key_names[n.get("subcircuit_connectivity_map_key")].add(n.get("name"))
    name_keys = defaultdict(set)
    for n in nets:
        name_keys[n.get("name")].add(n.get("subcircuit_connectivity_map_key"))

    fails = 0
    print("=" * 72)
    print("ERC 电气规则检查")
    print("=" * 72)
    print(f"  元件 {len(comp)}   引脚 {len(ports)}   连通组 {len(key_ports)}   命名网络 {len(nets)}")
    print()

    # ═══ A 电源短路：一个连通组挂着两个不同的网络名 ═══
    print("── A 电源短路（两个不同网络被并成同一个连通组）")
    n = 0
    for key, names in key_names.items():
        if len(names) > 1:
            print(f"   ❌ {sorted(names)} 被并成同一个网络（{len(key_ports[key])} 个引脚）")
            # 打印成员帮助定位
            for p in key_ports[key][:8]:
                c, nm, pn, m = pin(p["source_port_id"])
                print(f"        {c}.{nm} (pin{pn}, {m})")
            n += 1
    print(f"   {'✅ 0 处' if not n else f'❌ {n} 处'}")
    fails += n

    # ═══ A2 电源网络里混进了别的东西（按引脚属性交叉验证）═══
    print()
    print("── A2 电源轨与地是否被短接（按引脚属性交叉验证）")
    n = 0
    for key, plist in key_ports.items():
        names = key_names.get(key, set())
        # 该组里既有 provides_power 的引脚、名字又叫 GND → 可疑
        provides = [p for p in plist if p.get("provides_power")]
        if "GND" in names and provides:
            srcs = {pin(p["source_port_id"])[0] for p in provides}
            print(f"   ❌ GND 网络上出现了 provides_power 的引脚：{sorted(srcs)}")
            n += 1
    print(f"   {'✅ 0 处' if not n else f'❌ {n} 处'}")
    fails += n

    # ═══ B 重复网络：一个名字分裂成多个连通组 ═══
    print()
    print("── B 重复网络（同一个网络名分裂成多个互不相连的组）")
    n = 0
    for name, keys in sorted(name_keys.items()):
        if len(keys) > 1:
            print(f"   ❌ {name} 分裂成 {len(keys)} 个组，各自引脚数 {[len(key_ports[k]) for k in keys]}")
            n += 1
    print(f"   {'✅ 0 处' if not n else f'❌ {n} 处'}")
    fails += n

    # ═══ C 悬空引脚 ═══
    print()
    print("── C 悬空引脚")
    # 分两类：所在网络只有自己（真孤立） + 完全没接入（key=None）
    singles = [p for key, plist in key_ports.items() if len(plist) == 1 for p in plist]
    all_open = singles + unconnected
    unexpected, expected = [], []
    for p in all_open:
        c, nm, pn, m = pin(p["source_port_id"])
        token = f"{c}.{nm}"
        if token in INTENTIONAL_OPEN:
            expected.append((token, pin_label(c, nm, pn), INTENTIONAL_OPEN[token]))
        else:
            unexpected.append(f"{c}.{nm} (pin{pn}, {m})")
    for u in unexpected:
        print(f"   ❌ 意外悬空：{u}")
    print(f"   孤立单脚网络 {len(singles)} 个 + 完全未接入 {len(unconnected)} 个 "
          f"= {len(all_open)} 个悬空引脚")
    print(f"   其中刻意留空 {len(expected)} 个（见下方清单），意外 {len(unexpected)} 个 "
          f"{'✅' if not unexpected else '❌'}")
    fails += len(unexpected)

    # ═══ D 必连未连 ═══
    print()
    print("── D 标记了 must_be_connected 但网络里只有自己")
    n = 0
    for p in ports:
        if not p.get("must_be_connected"):
            continue
        k = p.get("subcircuit_connectivity_map_key")
        if len(key_ports[k]) < 2:
            c, nm, pn, m = pin(p["source_port_id"])
            print(f"   ❌ {c}.{nm} (pin{pn}, {m})")
            n += 1
    print(f"   {'✅ 0 个' if not n else f'❌ {n} 个'}")
    fails += n

    # ═══ E 供电无源：requires_power 的网络里没有任何 provides_power ═══
    print()
    print("── E 需要供电的网络里找不到供电来源")
    n = 0
    for key, plist in key_ports.items():
        needers = [p for p in plist if p.get("requires_power")]
        if needers and not any(p.get("provides_power") for p in plist):
            names = key_names.get(key, {"(未命名)"})
            srcs = sorted({pin(p["source_port_id"])[0] for p in needers})
            print(f"   ❌ 网络 {sorted(names)}：{srcs} 需要供电，但组内无人 provides_power")
            n += 1
    print(f"   {'✅ 0 处' if not n else f'❌ {n} 处'}")
    fails += n

    # ═══ F 接地非地：requires_ground 的引脚不在 GND 网络上 ═══
    print()
    print("── F 需要接地的引脚不在 GND 网络上")
    n = 0
    for key, plist in key_ports.items():
        grounders = [p for p in plist if p.get("requires_ground")]
        if grounders and "GND" not in key_names.get(key, set()):
            names = key_names.get(key, {"(未命名)"})
            srcs = sorted({pin(p["source_port_id"])[0] for p in grounders})
            print(f"   ❌ 网络 {sorted(names)}：{srcs} 需要接地，但网络名不是 GND")
            n += 1
    print(f"   {'✅ 0 处' if not n else f'❌ {n} 处'}")
    fails += n

    # ═══ G 多驱动：同一网络上有 2 个以上 provides_power（可能对顶）═══
    print()
    print("── G 同一网络上有多个供电来源（可能对顶）")
    n = 0
    for key, plist in key_ports.items():
        prov = [p for p in plist if p.get("provides_power")]
        if len(prov) > 1:
            names = key_names.get(key, {"(未命名)"})
            srcs = sorted({f"{pin(p['source_port_id'])[0]}.{pin(p['source_port_id'])[1]}" for p in prov})
            # 同一元件的多个电源脚（如多个 VDD）不算对顶。
            # 另外**连接器的电源脚不算"来源"** —— 它是把电送出去给外部设备，
            # 不是驱动这条网络（J1.VIN 那种电源输入口才是源，但它是 requiresPower）。
            ics = {s.split(".")[0] for s in srcs if ftype_of(s.split(".")[0]) == "simple_chip"}
            if len(ics) > 1:
                print(f"   ⚠️  网络 {sorted(names)}：{srcs}")
                n += 1
    print(f"   {'✅ 0 处' if not n else f'⚠️  {n} 处（需人工确认是否可接受）'}")
    fails += n

    if expected:
        print()
        print("   ── 刻意留空的引脚（已核对，非缺陷）")
        for token, lbl, why in sorted(expected):
            print(f"      ℹ️  {lbl:<16} {why}")

    # ═══ 汇总 ═══
    print()
    print("=" * 72)
    if fails == 0:
        print("结论: ✅ ERC 通过，无电气规则违规")
    else:
        print(f"结论: ❌ 发现 {fails} 处违规")
    print("=" * 72)

    # 顺带列出全部网络清单，便于人工复核
    print()
    print("── 网表清单（按引脚数降序）")
    for key, plist in sorted(key_ports.items(), key=lambda kv: -len(kv[1]))[:60]:
        names = key_names.get(key)
        label = "/".join(sorted(names)) if names else "(未命名)"
        members = [f"{pin(p['source_port_id'])[0]}.{pin(p['source_port_id'])[1]}" for p in plist]
        shown = " ".join(members[:6])
        more = f" …+{len(members)-6}" if len(members) > 6 else ""
        print(f"   {label:<18} {len(plist):>2} 脚   {shown}{more}")
    return 0 if fails == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
