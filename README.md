# Ashen Crown — Duel of the Four Embers

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/akhmadfitriyanramadhan23-wq/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/akhmadfitriyanramadhan23-wq/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

Ashen Crown — an original turn-based card duel for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826). You are the Warden of the Ashen Crown, duelling Duchess Cinder in a candle-lit hall. First to reduce the other to 0 life wins the crown.

## How to play

Run `node serve.ts` then open http://localhost:8080.

- **Embers:** each turn starts with 3 embers, +1 every turn, max 8. Cards cost embers; unspent embers vanish.
- **Cards:** Strike deals damage · Guard gains shield · Mend restores life · Trick has a special effect. 24 unique cards across four elements.
- **Surge:** play two cards of the same element in one turn — the second gets +2 (Wildfire gets +3).
- **Advantage:** Flame ▲ > Gale 🍃 > Stone ◆ > Tide 💧 > Flame ▲. A Strike deals +1 when its element beats the rival's last played element.
- **Intent:** the banner shows what Duchess Cinder plans to play next, so you can Guard or Mend in answer. She takes a lethal play when she has one and guards when hurt.
- **Controls:** click a card (or keys 1–7) to play it · Space ends your turn · R restarts · H help · M mute.

The game is plain static files under `game/` — no build step, no network request, no libraries. Sounds are synthesised with WebAudio.

## Referral

Use referral code `yd8r37m9` when you join make.fun.
