# BÁO CÁO TỔNG HỢP VÒNG 1: KIỂM CHỨNG HÌNH ẢNH HD-2D

## 1. Cách chạy nhanh (1 lệnh) & xem ảnh
- **Hướng A – Web (Three.js + WebGL2):**
  - Chạy tương tác: `cd track-web && npm install && npm run dev` (mở `http://localhost:5173`)
  - Chụp bộ ảnh 1920×1080: `cd track-web && npm run shots`
- **Hướng B – Godot 4.4.1 (Forward+ Vulkan):**
  - Chạy tương tác: `.\tools\godot\Godot_v4.4.1-stable_win64_console.exe --path track-godot`
  - Mở Editor: `.\tools\godot\Godot_v4.4.1-stable_win64.exe --path track-godot -e`
  - Chụp bộ ảnh 1920×1080: `.\tools\godot\Godot_v4.4.1-stable_win64_console.exe --path track-godot -- --shots`

## 2. Danh sách ảnh nghiệm thu (1920×1080 PNG)
- **Hướng A (`track-web/shots/`):**
  - `FINAL-hero.png`, `FINAL-day.png`, `FINAL-dusk.png`, `FINAL-night.png`, `W3-lit-dawn.png`
  - `FINAL-rain-night.png`, `FINAL-leaves-day.png`, `FINAL-character-closeup.png`
  - `FINAL-ab-bloom.png`, `FINAL-ab-dof.png`, `FINAL-ab-volumetric.png`, `FINAL-ab-reflection.png`
  - `FINAL-motion-strip.png`, `W2-assets-sheet.png`, `W3-lights-debug.png`
  - `FINAL-detail-crops/` (5 ảnh cắt cận chi tiết 640×360)
- **Hướng B (`track-godot/shots/`):**
  - `FINAL-hero.png`, `FINAL-day.png`, `FINAL-dusk.png`, `FINAL-night.png`, `G3-lit-dawn.png`
  - `FINAL-rain-night.png`, `FINAL-leaves-day.png`, `FINAL-character-closeup.png`
  - `FINAL-ab-bloom.png`, `FINAL-ab-dof.png`, `FINAL-ab-volumetric.png`, `FINAL-ab-reflection.png`
  - `FINAL-motion-strip.png`, `G2-assets-sheet.png`
  - `FINAL-detail-crops/` (5 ảnh cắt cận chi tiết 640×360)

## 3. Điểm Review cuối cùng
- **Hướng A (Web):** **84.5 / 100** (Đạt — `track-web/reviews/review-02.md`)
- **Hướng B (Godot):** **81.8 / 100** (Đạt — `track-godot/reviews/review-02.md`)

## 4. So sánh hai hướng
| Tiêu chí | Hướng A (Web / Three.js) | Hướng B (Godot 4.4.1 Forward+) |
|---|---|---|
| **Thẩm mỹ & ánh sáng** | Rất mịn và kiểm soát chặt nhờ custom `ShaderMaterial` + `EffectComposer`; phản chiếu đá ướt khi mưa cực tốt. | Ánh sáng PBR/Forward+ tự nhiên, ACES + Glow mặc định đẹp; cần chú ý `NORMAL_MAP_DEPTH` để không tối mặt nhân vật. |
| **Phản chiếu nước** | Planar `WebGLRenderTarget` đảo ngược thật — phản chiếu chuẩn vật thể. | `hint_screen_texture` screen-space — nhẹ và mượt, nhưng chỉ phản chiếu phần đang có trên màn hình. |
| **Hiệu năng** | SwiftShader headless ~1 FPS (do CPU); trình duyệt GPU thực 60 FPS. | Forward+ trên RX 6600 XT chạy mượt; khi chụp CLI đồng bộ nhiều frame ghi `FPS=4.0` do chờ `save_png`. |
| **Độ linh hoạt làm game thật** | Nhẹ, chạy ngay trên mọi trình duyệt, dễ chia sẻ link. | Hệ sinh thái đầy đủ (physics, UI, audio, animation tree, export PC/Console) cho game dài hơi. |

## 5. Khuyến nghị cho Vòng 2
- **Khuyến nghị chọn Godot 4.4.1** nếu mục tiêu là phát triển thành game RPG/phiêu lưu hoàn chỉnh (do có sẵn scene tree, physics, audio, AnimationPlayer, TileMap/GridMap và hiệu năng GPU native).
- **Giữ Web (Three.js)** làm bản demo/vertical-slice chạy tức thì trên trình duyệt hoặc showcase web.

## 6. Trung thực & Hạn chế
- Video Bilibili (`BV1dhn36VEF8`) không truy cập trực tiếp được qua web fetch; đã thay thế bằng kỹ thuật tương đương từ tài liệu Octopath Traveler / The Last Night / custom normal-mapped shader.
- Video loop `.webm`/`.gif` chưa xuất (ưu tiên `FINAL-motion-strip.png` 6 khung 0.5s theo thứ tự cắt giảm mục 11 của kế hoạch).
- Chỉ số FPS đo trong lúc chụp headless (SwiftShader CPU cho Web; `save_png` đồng bộ cho Godot) thấp hơn tốc độ chạy tương tác thực tế trên GPU.
