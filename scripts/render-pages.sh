#!/bin/bash
# 逐页单独导出原理图。
# 为什么不直接切堆叠大图：各页高度不等，按等分切会错位，
# 出现"某页的元素跑到另一页边框外"的假象（实测踩过）。
set -e
export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"
cd ~/Desktop/tscircuit/my-tscircuit
PAGES="power:01-power:电源 mcu:02-mcu:最小系统 uart:03-uart:串口 i2c:04-i2c:i2c spi:05-spi:spi can:06-can:can pwm:07-pwm:pwm adc:08-adc:adc led:09-led:指示灯"
for entry in $PAGES; do
  key="${entry%%:*}"; rest="${entry#*:}"; mod="${rest%%:*}"; name="${rest#*:}"
  python3 - "$key" "$mod" "$name" <<'PY'
import re, sys
key, mod, name = sys.argv[1], sys.argv[2], sys.argv[3]
cap = mod.split('-')[1].capitalize()
comp = {"power":"PowerSection","mcu":"McuSection","uart":"UartSection","i2c":"I2cSection",
        "spi":"SpiSection","can":"CanSection","pwm":"PwmSection","adc":"AdcSection",
        "led":"LedSection"}[key]
s = open('circuits/stm32f302/_preview.tsx', encoding='utf-8').read()
s = re.sub(r'import \{ \w+Section \} from "\./modules/\d\d-\w+"',
           f'import {{ {comp} }} from "./modules/{mod}"', s)
s = re.sub(r'const SHEET_NAME: \(typeof PAGES\)\[number\]\["name"\] = "\w+"',
           f'const SHEET_NAME: (typeof PAGES)[number]["name"] = "{key}"', s)
s = re.sub(r'const SHEET_DISPLAY_NAME = "[^"]*"', f'const SHEET_DISPLAY_NAME = "{name}"', s)
s = re.sub(r'const PREVIEW = <\w+Section />', f'const PREVIEW = <{comp} />', s)
open('circuits/stm32f302/_preview.tsx','w').write(s)
PY
  ./tsci-run export circuits/stm32f302/_preview.tsx -f schematic-svg -o "../../out/stm32f302/page-$key.sch.svg" >/dev/null 2>&1
  bun scripts/svg2png.ts "out/stm32f302/page-$key.sch.svg" "/tmp/page-$key.png" 1500 >/dev/null 2>&1
  echo "  ✅ $name → /tmp/page-$key.png"
done
