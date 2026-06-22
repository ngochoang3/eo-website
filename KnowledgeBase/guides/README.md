# SLIME MMORPG — MASTER REBUILD V10 (BỘ HOÀN CHỈNH)

## Bắt đầu
- Sang VS Code/Claude Code? → đọc **HANDOFF_VSCODE.md**.
- Tích hợp Unity? → đọc **unity/SETUP_UNITY.md**.
- Thiết kế? → **MMORPG_BIBLE_V10.md** (Vol.1) + **MMORPG_BIBLE_V10_VOL2.md** (Vol.2).
- Test cân bằng nhanh? → mở **unity/BalanceSandbox.html** bằng trình duyệt.

## Cấu trúc
```
MMORPG_BIBLE_V10.md / _VOL2.md   Bible 18 + 13 phần
HANDOFF_VSCODE.md                bàn giao sang Claude Code
data/*.csv                       18 database gốc (CSV)
unity/
  Scripts/Core (8)               math + glue runtime
  Scripts/Data (11)              ScriptableObject
  Scripts/Editor (3)             importer + Balance Bench
  Resources/GameData/*.json (18) database cho Unity
  BalanceSandbox.html            công cụ QA cân bằng
  SETUP_UNITY.md                 hướng dẫn tích hợp
gen_*.py (6)                     generator — một nguồn sự thật
```

## 3 trụ chống power creep
1. Power Budget 100% có trần (không hệ >35%, không nhân chồng).
2. Mọi nâng cấp = % cộng trong trần.
3. Damage cap theo level: tích hệ số tình huống ≤ cap/floor → 0 breach.
