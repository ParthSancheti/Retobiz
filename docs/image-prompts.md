# Retobiz cutout image prompts (ChatGPT)

All sheets live in one ChatGPT chat, "Generate Bazaar Sprite Sheet", so the style stays consistent.
Every sheet is **1536×1024, transparent PNG, 3 columns × 2 rows of 512px cells**, filled left-to-right, top-to-bottom.

| Sheet | Status | Cells (→ file keys) |
|---|---|---|
| 1 | ✅ done | kirana · saree · footwear · mobile · mithai · medical → `cat-*` |
| 2 | ✅ done | hardware · salon · jewel · stationery · hot-deals ₹ coin · new-shops shopfront → `cat-*`, `promo-*` |
| 3 | ✅ done | paithani · cotton saree · kurti set · kids lehenga · men's kurta · nauvari → `p-*` |
| 4 | ✅ done | kaju katli · ladoo box · jalebi · mithai box · kirana combo · whole spices |
| 5 | ✅ done (use the **transparent re-generation**) | kolhapuri · handbag · phone covers · tempered glass · LED pack · power bank |
| 6 | ⏳ sent, check the result | kundan jhumkas · bridal bangles · school kit · notebooks · medicine strips · facial kit |
| 7 | ⬜ not sent yet (prompt below) | tool kit · bridal saree · black sandals · bread/pav · masala pouches · rice & dal |

## Sheet 7 prompt (paste into the same chat)

> Perfect. Same style, fully TRANSPARENT background (PNG alpha) like sheets 1-4, 3x2 grid of 512px cells, clean margins, no text/logos/people. Sheet 7 (single hero products): 1) an open electrician tool kit pouch with pliers, a line tester, screwdrivers and insulation tape; 2) a folded rich red-and-gold bridal Banarasi silk saree with a matching blouse piece on top; 3) a pair of black leather ladies strap sandals with a small gold buckle; 4) a soft fresh loaf of bread and a tray of golden pav buns; 5) three colourful unbranded masala pouches (red, yellow, green) with a spill of spice powder in front; 6) a jute sack of basmati rice and a cloth sack of toor dal with a steel scoop.

## After downloading

1. Download the 7 sheet PNGs, using the **transparent** re-generation for sheet 5, and rename them `sheet1.png` … `sheet7.png`.
2. Zip them and attach the zip in the Claude chat.
3. Claude runs `python3 scripts/slice-sprites.py <folder>`, which writes 42 files to `public/images/`, then rebuilds and verifies that every `<img>` loads.
