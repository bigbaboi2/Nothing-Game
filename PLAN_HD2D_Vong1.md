# KẾ HOẠCH VÒNG 1: KIỂM CHỨNG HÌNH ẢNH HD-2D (PIXEL + ÁNH SÁNG 3D THỜI GIAN THỰC)

Tài liệu này được viết để BẤT KỲ agent nào đọc cũng có thể thực hiện độc lập. Đọc hết mục 0–3 trước khi làm bất cứ việc gì.

---

## 0. TỔNG QUAN

**Mục tiêu vòng 1:** Dựng một cảnh game duy nhất (một "tiểu cảnh" thị trấn/góc làng) đủ sống động và chi tiết để nghiệm thu bằng mắt: mở lên là thấy ngay phong cách HD-2D riêng, ấn tượng, ngang hoặc hơn các ví dụ tham khảo.

**Không làm ở vòng 1:** gameplay, di chuyển nhân vật, UI, âm thanh, lưu game. Nhân vật chibi chỉ đứng yên (cho phép hiệu ứng thở/đung đưa rất nhẹ nếu còn thời gian, nhưng không bắt buộc).

**Hai hướng song song (độc lập, không chia sẻ code):**

| Hướng | Công nghệ gợi ý | Thư mục |
|---|---|---|
| A – Web | Three.js (WebGL2) + EffectComposer / shader tự viết, JS thuần hoặc Vite | `/work/track-web/` |
| B – Godot | Godot 4.x (3D, Sprite3D + WorldEnvironment + shader) | `/work/track-godot/` |

**Vai trò agent (mỗi agent là Opus 5.5 extra):**

| Agent | Nhiệm vụ |
|---|---|
| Builder-Web | Làm hướng A theo mục 5 |
| Builder-Godot | Làm hướng B theo mục 6 |
| Reviewer-Web | Duyệt hướng A: so sánh với ví dụ tham khảo, chấm điểm, ra yêu cầu sửa |
| Reviewer-Godot | Duyệt hướng B: như trên |

Reviewer KHÔNG sửa code. Reviewer chỉ chụp, chấm, và viết yêu cầu sửa cụ thể, đo được. Builder sửa theo.

**Kết quả nghiệm thu (ngày mai):** với mỗi hướng: (1) ảnh chụp màn hình ở độ phân giải 1920×1080, (2) bộ ảnh theo thời điểm/thời tiết, (3) cách chạy 1 lệnh, (4) báo cáo ngắn theo mẫu mục 10.

---

## 1. TÀI LIỆU THAM KHẢO VÀ CÁCH KHAI THÁC

Agent PHẢI tự tra cứu (WebSearch/WebFetch) khi gặp khó. Không đoán mò.

1. **Octopath Traveler (HD-2D):** tìm bài phỏng vấn đội ngũ Square Enix / Acquire về cách làm HD-2D (từ khoá: "HD-2D Unreal Engine 4 Octopath interview", "Octopath Traveler tilt shift depth of field bloom", GDC/CEDEC talk). Đặc điểm cần rút ra: sprite pixel đặt trong môi trường 3D, tilt-shift DOF mạnh, bloom, ánh sáng điểm ấm, bóng đổ, nền 3D có texture pixel hoá.
2. **The Last Night:** https://store.steampowered.com/app/612400/The_Last_Night/ (trailer + ảnh chụp). Rút ra: cyberpunk pixel, ánh sáng neon, thể tích, phản chiếu mưa trên mặt đường, màu tương phản lạnh/ấm.
3. **LONG GONE (遠逝):** https://store.steampowered.com/app/1977610/ . Rút ra: hậu tận thế pixel, ánh sáng, nét vẽ, bố cục.
4. **Dự án mã nguồn Bilibili (Opus 5.5 tái hiện pixel + ánh sáng 3D):** https://www.bilibili.com/video/BV1dhn36VEF8/ . Nếu WebFetch không đọc được thì tìm bản mô tả, repo, bài viết liên quan; học phương pháp sprite + chiếu sáng 3D thời gian thực.
5. **Thị trấn chữa lành nhiều mùa (Bilibili):** nguồn cảm hứng ban đầu. Lấy phong cách màu và bố cục tổng thể (màn hình ngang, mùa, ánh sáng khác nhau), nhưng PHẢI vượt về chất lượng pixel và ánh sáng.

**Ghi chú nguồn:** Mỗi agent tạo file `notes/references.md` ghi: link đã đọc, 5–10 đặc điểm hình ảnh rút ra, kỹ thuật học được. Nếu không truy cập được link nào thì ghi rõ "không truy cập được" và dùng nguồn thay thế (ảnh/bài phân tích khác). KHÔNG sao chép nguyên tác phẩm; chỉ học phong cách và kỹ thuật. Cảnh, nhân vật và bảng màu phải là sáng tạo gốc.

---

## 2. ART BIBLE (CHUNG CHO CẢ HAI HƯỚNG)

### 2.1 Định hướng tổng thể
- **Chủ đề cảnh:** một góc thị trấn nhỏ ven nước vào lúc hoàng hôn chuyển đêm (hoặc buổi chiều có mưa nhẹ). Gợi ý nội dung: 2–3 ngôi nhà (mái ngói, cửa sổ sáng đèn), một cây cầu nhỏ hoặc bến nước, con đường lát đá, cây lớn, bụi hoa, hàng rào, đèn lồng/đèn đường, thùng gỗ, chum vại.
- Cảm xúc: ấm, chữa lành, chi tiết dày, có chiều sâu.
- Nhân vật chibi (tỷ lệ 2 đầu) đứng trên đường, quay nghiêng 3/4 hoặc nhìn ra xa, có đèn lồng hoặc không.

### 2.2 Quy tắc pixel (rất quan trọng)
- **Mật độ pixel nhất quán:** toàn bộ sprite/texture dùng cùng một "kích thước pixel" trên màn hình. Không trộn pixel to với pixel nhỏ. Không xoay hoặc scale sprite theo góc không nguyên (gây răng cưa/nhoè).
- **Lọc texture:** Nearest (không bilinear) cho mọi art pixel. Bật `image-rendering: pixelated` (web) / `Texture Filter = Nearest` (Godot).
- **Bảng màu:** mỗi vật thể có ramp 4–6 bước (tối → sáng), hue-shift (bóng nghiêng về lạnh/tím-xanh, sáng nghiêng về ấm/vàng). Tổng bảng màu cảnh khoảng 48–96 màu. Lưu thành `assets/palette.json` và `assets/palette.png`.
- **Viền và dithering:** dùng selective outline (viền màu tối đậm hơn màu thân, không viền đen thuần); dithering chỉ dùng cho gradient lớn (trời, sương), chừa sạch ở nơi khác.
- **Kích thước tham chiếu:** chibi 2 đầu cao khoảng 40–48 px (đầu ~20 px). Nhà cao khoảng 5–7 lần nhân vật. Cây lớn 6–10 lần.
- **Nhân vật chibi:** đầu to, mắt lớn vài pixel có highlight, tóc có ít nhất 3 ramp, trang phục có chi tiết (khăn, áo choàng, túi, giày), bóng đổ dưới chân.

### 2.3 Công thức HD-2D (thành phần bắt buộc, dùng làm checklist nghiệm thu)
1. Môi trường là không gian 3D thật (có độ sâu), sprite/texture pixel dán lên mặt phẳng hoặc khối đơn giản.
2. Camera nghiêng từ trên (khoảng 30–45°), góc nhìn hơi phối cảnh (FOV nhỏ 20–35°) hoặc trực giao nghiêng.
3. **Tilt-shift / DOF:** vùng giữa nét, trên và dưới nhoè rõ; bokeh nhẹ ở điểm sáng.
4. **Bloom:** các nguồn sáng ấm bừng sáng, viền ánh sáng mềm.
5. **Ánh sáng động:** ít nhất 1 ánh sáng định hướng (mặt trời/trăng) + 4–8 đèn điểm ấm (cửa sổ, đèn lồng, đèn đường) có đổ bóng hoặc mặt nạ bóng giả.
6. **Ánh sáng thể tích:** tia sáng xuyên tán lá/khe nhà, sương mỏng có chiều sâu, bụi lơ lửng trong tia sáng.
7. **Phản chiếu:** mặt nước phản chiếu nhà/đèn (có gợn sóng), mặt đường đá ướt phản chiếu đèn nếu cảnh có mưa.
8. **Màu & hậu kỳ:** color grading (tương phản ấm/lạnh), vignette nhẹ, grain rất nhẹ, hơi quang sai màu ở rìa (tuỳ chọn).
9. **Sprite nhận ánh sáng:** sprite có normal map hoặc ít nhất bóng ramp để đèn điểm làm sáng đúng phía; có rim light nhẹ.

### 2.4 Yếu tố sống động bắt buộc
- Cây, cỏ, hoa đung đưa theo gió (vertex/shader sway, pha lệch từng cây).
- Lá rơi HOẶC mưa (chọn 1 làm chính; làm công tắc chuyển được).
- Chim (đàn nhỏ bay qua hoặc đậu trên mái, nhảy nhẹ), bươm bướm/đom đóm.
- Khói bốc lên từ ống khói, cờ/vải/rèm phấp phới, đèn lồng đung đưa, ánh sáng cửa sổ nhấp nháy nhẹ như lửa.
- Nước: gợn sóng, ánh sáng lấp lánh, lá/hoa trôi.
- Mây trôi (bóng mây quét qua mặt đất nếu làm được).

### 2.5 Chế độ chuyển đổi để chứng minh chiều sâu hình ảnh
Mỗi hướng cần phím tắt/biến để chuyển (đều chụp ảnh được bằng script):
- Thời điểm: `dawn` / `day` / `dusk` / `night`
- Thời tiết: `clear` / `rain` / `leaves`
- Mùa (nếu kịp, ưu tiên thấp): `spring` / `autumn`
- Bật/tắt từng hiệu ứng (bloom, DOF, volumetric, reflection) để chứng minh từng phần đóng góp gì (ảnh so sánh "tắt vs bật").

---

## 3. QUY TẮC LÀM VIỆC CHUNG

1. **Làm theo giai đoạn, có minh chứng ảnh ở mỗi mốc.** Không có ảnh chụp thật = chưa xong mốc đó.
2. **Không tự chấm mình.** Hết mốc là gửi cho Reviewer của hướng mình.
3. **Mỗi lần làm xong một vòng sửa, ghi vào `notes/changelog.md`:** đã đổi gì, vì sao, ảnh trước/sau.
4. **Tài nguyên mỹ thuật (art assets):**
   - Không có nguồn ảnh ngoài ổn định → TỰ TẠO bằng mã: Python (Pillow/numpy) sinh sprite/texture pixel từ bảng màu, hoặc vẽ tay bằng mảng ký tự/ma trận màu. Giữ script trong `tools/` để tái tạo được.
   - Nếu dùng asset ngoài (CC0) thì ghi nguồn + giấy phép vào `notes/credits.md`. Ưu tiên tự tạo cho nhân vật chính.
   - Nếu chất lượng pixel thủ tục chưa đạt, tra cứu cách làm: "procedural pixel art generation", "pixel art tree/house palette ramp", "pixel art normal map generation (Laigter/SpriteIlluminator workflow)".
5. **Mạng có thể bị giới hạn** (chỉ npm/pip/GitHub). Nếu tải Godot/thư viện lỗi thì thử qua GitHub releases hoặc gói pip/npm; nếu vẫn không được, báo rõ lý do và chuyển phương án (xem mục 8).
6. **Hiệu năng:** mục tiêu chạy mượt 60 FPS trên máy thường; nhưng vòng 1 ưu tiên chất lượng hình ảnh. Ghi lại FPS đo được (nếu đo được).
7. **Tái lập:** mọi thứ chạy được bằng 1 lệnh được ghi trong `README.md` của từng thư mục.

---

## 4. CẤU TRÚC THƯ MỤC CHUẨN

```
/work/
  PLAN_HD2D_Vong1.md          (file này)
  shared/
    palette.json              (bảng màu dùng chung)
    scene-brief.md            (mô tả bố cục cảnh, vị trí vật thể, toạ độ)
  track-web/
    README.md
    package.json
    index.html
    src/ (main.js, scene.js, sprites.js, lighting.js, post.js, particles.js, ...)
    assets/ (sprites, normal maps, palette)
    tools/ (script sinh asset, script chụp ảnh)
    notes/ (references.md, changelog.md, credits.md)
    shots/ (ảnh minh chứng, đặt tên theo mục 7)
    reviews/ (review-01.md, review-02.md, ...)
  track-godot/
    README.md
    project.godot
    scenes/ scripts/ shaders/ assets/ tools/ notes/ shots/ reviews/
  report/
    SUMMARY.md                (báo cáo tổng hợp cuối)
```

Việc đầu tiên của người điều phối (agent đầu tiên chạy): tạo `shared/scene-brief.md` và `shared/palette.json` để hai hướng cùng cảnh, cùng bảng màu gốc, giúp so sánh công bằng. Hai builder có thể mở rộng bảng màu nhưng phải ghi lại thay đổi.

### 4.1 Nội dung `shared/scene-brief.md` (mẫu nội dung bắt buộc)
- Hệ toạ độ (x ngang, z sâu, y cao), đơn vị: 1 đơn vị = 1 chiều cao nhân vật (hoặc 16 px).
- Bố cục theo 3 lớp: tiền cảnh (bụi hoa/hàng rào, nhoè), trung cảnh (đường, nhân vật, nhà chính), hậu cảnh (nhà xa, đồi, cây lớn, trời).
- Vị trí nhân vật (gần tâm, lệch tam phân), vị trí nước/cầu, nguồn sáng chính, đèn điểm (liệt kê toạ độ và màu).
- Kích thước khung nhìn 16:9; camera mặc định.
- Danh sách vật thể (ít nhất 25–40 vật thể/chi tiết riêng biệt, không tính cỏ).

---

## 5. HƯỚNG A: WEB (Builder-Web)

### 5.1 Lựa chọn kỹ thuật (khuyến nghị)
- **Three.js** + `EffectComposer` (UnrealBloomPass, BokehPass hoặc shader tilt-shift tự viết, ShaderPass cho grading/vignette/grain).
- Sprite: `THREE.Mesh` với `PlaneGeometry` + `ShaderMaterial` tự viết (billboard xoay theo trục Y, nhận ánh sáng bằng normal map giả). Texture dùng `NearestFilter`.
- Ánh sáng điểm: truyền mảng đèn (vị trí, màu, bán kính, cường độ) vào shader sprite/nền để tính chiếu sáng tuỳ biến theo normal map; thêm 1–2 `DirectionalLight` có shadow map cho bóng đổ nhà/cây.
- Thể tích: raymarching nhẹ trong post-process (sương + tia sáng), hoặc các mặt phẳng "god-ray" cộng dồn (additive) kết hợp hạt bụi.
- Phản chiếu nước: mặt phẳng nước phản chiếu thật bằng render target đảo ngược (`Reflector`-style) + nhiễu sóng dịch UV; sàn ướt dùng phản chiếu giả theo màn hình (screen-space) hoặc cubemap rẻ.
- Hạt (mưa, lá, bụi, đom đóm, bươm bướm): `Points`/`InstancedMesh`, cập nhật trong shader.
- Pixel hoá toàn khung hình (tuỳ chọn mạnh): render scene ở độ phân giải thấp (ví dụ 480×270) rồi phóng nguyên số lên 1920×1080 bằng nearest để pixel đều. Lưu ý: DOF/bloom thực hiện trước hay sau bước này sẽ cho cảm giác khác nhau; HD-2D thật thì sprite pixel sắc nét còn hậu kỳ mượt (độ phân giải đầy đủ). Thử cả hai, giữ bản đẹp hơn và ghi lý do.

### 5.2 Các mốc (mỗi mốc có ảnh minh chứng)

**Mốc W0 – Khởi tạo & nghiên cứu (mục tiêu: ~30 phút)**
- Đọc mục 0–4, đọc tài liệu tham khảo mục 1, viết `notes/references.md`.
- Tạo project (Vite hoặc file tĩnh + import map), chạy được trang trống.
- Viết `tools/screenshot.mjs` dùng Playwright (Chromium headless, cờ `--use-angle=swiftshader` / `--use-gl=swiftshader --enable-unsafe-swiftshader` nếu không có GPU) chụp 1920×1080. Có tham số `?time=dusk&weather=rain` hoặc `window.__setState({...})` để chuyển trạng thái trước khi chụp.
- Minh chứng: `shots/W0-blank.png` (trang chạy + camera đặt sẵn).
- Kiểm thử: lệnh chụp chạy được từ đầu đến cuối, ảnh không đen.

**Mốc W1 – Khối cảnh & camera (~1 giờ)**
- Dựng mặt đất, đường, nước, nhà bằng khối (box/plane) có màu bảng màu; đặt camera nghiêng, FOV nhỏ.
- Minh chứng: `shots/W1-blockout.png`.
- Kiểm thử: bố cục khớp `scene-brief.md` (3 lớp rõ ràng, nhân vật là điểm nhấn).

**Mốc W2 – Asset pixel (~2 giờ)**
- Sinh bằng mã: texture nền (đá lát, cỏ, ngói, gỗ, tường), cây, bụi hoa, hàng rào, đèn lồng, thùng/chum, cầu, nhà (mặt tiền có cửa sổ/cửa), nhân vật chibi (đứng 1 hướng; nếu kịp thêm 2 hướng), chim, bươm bướm, lá.
- Lưu `tools/gen_assets.py` (hoặc `.mjs`) để tái tạo. Xuất sprite + normal map (chạy tạo normal từ heightmap tự vẽ hoặc từ độ sáng).
- Minh chứng: `shots/W2-assets-sheet.png` (bảng tổng hợp tất cả asset phóng 4×, nền trung tính) và `shots/W2-scene-textured.png`.
- Kiểm thử tự động: script kiểm tra mọi sprite chỉ dùng màu trong bảng màu (cho phép sai số nhỏ), kích thước nhất quán.

**Mốc W3 – Ánh sáng (~2 giờ)**
- Ánh sáng định hướng + đèn điểm + bóng đổ; sprite nhận sáng bằng normal map; rim light.
- Minh chứng: `shots/W3-lit-day.png`, `W3-lit-dusk.png`, `W3-lit-night.png`; và `W3-lights-debug.png` (hiển thị bán kính đèn để chứng minh đèn điểm hoạt động).
- Kiểm thử: bật/tắt từng đèn thì ảnh thay đổi đúng vị trí (chụp 2 ảnh và so sánh vùng).

**Mốc W4 – Hậu kỳ HD-2D (~2 giờ)**
- Tilt-shift DOF, bloom, grading, vignette, grain, thể tích (tia sáng + sương).
- Minh chứng: `shots/W4-final-dusk.png`; kèm ảnh so sánh "tắt vs bật" từng hiệu ứng: `W4-ab-bloom.png`, `W4-ab-dof.png`, `W4-ab-volumetric.png`.
- Kiểm thử: DOF thấy rõ nhoè tiền cảnh/hậu cảnh, nhân vật nét; bloom chỉ sáng ở nguồn sáng, không làm cháy toàn ảnh.

**Mốc W5 – Sống động (~2 giờ)**
- Gió đung đưa, mưa/lá, chim, bươm bướm, khói, nước gợn + phản chiếu, mây/bóng mây, đèn nhấp nháy.
- Minh chứng: chuỗi khung ảnh theo thời gian (ví dụ 6 ảnh cách 0.5s) `shots/W5-motion-strip.png` ghép sẵn; video/GIF ngắn 5–8 giây `shots/W5-loop.webm` (hoặc GIF) nếu quay được; `shots/W5-rain-night.png`, `W5-leaves-day.png`.
- Kiểm thử: đo khác biệt giữa các khung (không đứng im); không giật hình; ghi FPS.

**Mốc W6 – Nhân vật hoàn thiện & thẩm mỹ (~1.5 giờ)**
- Hoàn thiện chibi (tỉ lệ 2 đầu, shading 4–6 bước, rim light, bóng dưới chân, phản chiếu dưới nước/đá ướt nếu ở gần).
- Minh chứng: `shots/W6-character-closeup.png` (phóng cận, hiển thị pixel sắc nét) và `W6-final-hero.png`.

**Mốc W7 – Vòng duyệt & sửa (lặp tối thiểu 2 vòng)**
- Xem mục 9. Sau mỗi vòng ghi `changelog.md` và chụp ảnh "trước/sau".

**Mốc W8 – Đóng gói**
- `README.md` có đúng 1 lệnh chạy (ví dụ `npm install && npm run dev`) và 1 lệnh chụp ảnh (`npm run shots`).
- Chụp bộ ảnh nghiệm thu cuối (mục 7), viết báo cáo mục 10.

---

## 6. HƯỚNG B: GODOT (Builder-Godot)

### 6.1 Lựa chọn kỹ thuật (khuyến nghị)
- **Godot 4.3+ (bản ổn định mới nhất có thể tải)**, dùng renderer **Forward+** nếu có thể chụp được; nếu môi trường chỉ có phần mềm render (llvmpipe/lavapipe) thì thử **Compatibility (OpenGL)**, nhưng lưu ý Compatibility thiếu một số hiệu ứng (volumetric fog, SDFGI, DOF bị hạn chế). Ghi rõ quyết định.
- Cảnh 3D: `Node3D` gốc, `Camera3D` (FOV nhỏ hoặc trực giao, nghiêng khoảng 35–45°, đặt `CameraAttributesPractical` với DOF far/near blur để tilt-shift).
- Sprite: `Sprite3D` (hoặc `MeshInstance3D` với `QuadMesh` + `ShaderMaterial`), `texture_filter = NEAREST`, `billboard` theo trục Y, `shaded = true` và `normal_map` để ánh sáng 3D tác động; hoặc shader spatial tuỳ chỉnh có alpha scissor + chiếu sáng.
- Ánh sáng: `DirectionalLight3D` có shadow, nhiều `OmniLight3D`/`SpotLight3D` ấm; `WorldEnvironment`: Glow (bloom), Volumetric Fog (Forward+) + Light shafts, tonemap, adjustments (colour correction với LUT/curve), SSAO/SSIL nhẹ tuỳ chọn.
- Phản chiếu nước: shader spatial dùng `hint_screen_texture` + dịch UV theo sóng, hoặc `ReflectionProbe`/SubViewport phản chiếu đảo ngược; sàn ướt dùng `roughness` thấp + `ReflectionProbe` / SSR bật trong Environment.
- Hạt: `GPUParticles3D` (mưa, lá, bụi, đom đóm), `MultiMeshInstance3D` cho cỏ/hoa với shader gió (vertex sway).
- Hậu kỳ pixel: có thể dùng `SubViewport` độ phân giải thấp cho phần sprite, rồi `SubViewportContainer` + nearest, kết hợp hậu kỳ độ phân giải đầy đủ; ghi lại lựa chọn.

### 6.2 Các mốc (mỗi mốc có ảnh minh chứng)

**Mốc G0 – Khởi tạo & nghiên cứu (~45 phút)**
- Đọc mục 0–4; viết `notes/references.md`.
- Tải Godot (ưu tiên GitHub releases `godotengine/godot`; phiên bản linux x86_64 headless/editor), giải nén vào `/work/tools/godot`. Kiểm tra `godot --version`.
- Tạo project, scene rỗng, script chụp màn hình `tools/screenshot.sh`:
  - Chạy với Xvfb (`xvfb-run -a`) + Mesa llvmpipe hoặc lavapipe, ví dụ `xvfb-run -a godot --rendering-driver opengl3 --path . --quit-after N` kèm script GDScript tự `get_viewport().get_texture().get_image().save_png(...)` sau vài khung hình; hoặc dùng `--write-movie out.avi --fixed-fps 30` rồi trích khung hình bằng ffmpeg.
  - Nếu không có GPU/software Vulkan, thử `--rendering-method gl_compatibility`.
- Minh chứng: `shots/G0-blank.png`.
- Kiểm thử: ảnh không đen; kích thước đúng 1920×1080 (đặt cửa sổ/viewport).

**Mốc G1 – Khối cảnh & camera (~1 giờ)**
- Dựng cảnh bằng khối (CSGBox/MeshInstance3D) theo `scene-brief.md`; đặt camera.
- Minh chứng: `shots/G1-blockout.png`.

**Mốc G2 – Asset pixel (~2 giờ)**
- Dùng cùng ý tưởng sinh asset bằng Python (Pillow/numpy) trong `tools/gen_assets.py`, xuất PNG sprite + normal map vào `assets/`. Import với `Filter = Nearest`, tắt mipmap, tắt nén có tổn hao (Lossless).
- Minh chứng: `shots/G2-assets-sheet.png`, `G2-scene-textured.png`.
- Kiểm thử: script kiểm tra palette + kích thước (như W2).

**Mốc G3 – Ánh sáng (~2 giờ)**
- Cấu hình DirectionalLight + đèn điểm + shadow; sprite `shaded` với normal map; thử chuyển thời điểm bằng cách nội suy màu/độ sáng/góc đèn.
- Minh chứng: `shots/G3-lit-day.png`, `G3-lit-dusk.png`, `G3-lit-night.png`.
- Kiểm thử: tắt/bật từng đèn → ảnh đổi đúng vùng.

**Mốc G4 – Hậu kỳ HD-2D (~2 giờ)**
- `CameraAttributesPractical` (DOF far/near, khoảng cách lấy nét ở nhân vật), Glow, Volumetric Fog + light shafts, tonemap + colour adjustments, vignette/grain (qua shader canvas toàn màn hình).
- Minh chứng: `shots/G4-final-dusk.png`, ảnh so sánh bật/tắt: `G4-ab-glow.png`, `G4-ab-dof.png`, `G4-ab-volumetric.png`.

**Mốc G5 – Sống động (~2 giờ)**
- Gió (shader vertex), mưa/lá bằng GPUParticles3D, chim/bươm bướm (AnimatedSprite3D hoặc shader lật khung), khói, nước gợn + phản chiếu, bóng mây, đèn nhấp nháy.
- Minh chứng: dải khung `shots/G5-motion-strip.png`, video/GIF `shots/G5-loop.*`, `G5-rain-night.png`, `G5-leaves-day.png`.
- Kiểm thử: khác biệt giữa các khung; ghi FPS (Godot có `Engine.get_frames_per_second()`; nhớ rằng môi trường phần mềm sẽ chậm hơn thực tế).

**Mốc G6 – Nhân vật hoàn thiện & thẩm mỹ (~1.5 giờ)**
- Giống W6. Minh chứng: `shots/G6-character-closeup.png`, `G6-final-hero.png`.

**Mốc G7 – Vòng duyệt & sửa (≥2 vòng)** – xem mục 9.

**Mốc G8 – Đóng gói**
- `README.md`: cách mở bằng Godot Editor (`godot --path . -e`), cách chạy (`godot --path .`), cách chụp ảnh (`tools/screenshot.sh`).
- Chụp bộ ảnh nghiệm thu cuối (mục 7) và viết báo cáo mục 10.

---

## 7. MINH CHỨNG HÌNH ẢNH (BẮT BUỘC, CHO MỖI HƯỚNG)

**Bộ ảnh nghiệm thu cuối (độ phân giải 1920×1080, PNG):**
1. `FINAL-hero.png`: ảnh đẹp nhất, hoàng hôn, nhân vật rõ ràng.
2. `FINAL-day.png`, `FINAL-dusk.png`, `FINAL-night.png`.
3. `FINAL-rain-night.png` (hoặc rain-dusk), `FINAL-leaves-day.png`.
4. `FINAL-character-closeup.png` (cận nhân vật, pixel sắc nét).
5. `FINAL-detail-crops/`: 4–6 ảnh cắt cận chi tiết (cửa sổ sáng đèn, mặt nước phản chiếu, tán cây có tia sáng, mái nhà, tiền cảnh nhoè).
6. `FINAL-ab-*.png`: so sánh tắt/bật bloom, DOF, volumetric, phản chiếu.
7. `FINAL-motion-strip.png` + video/GIF 5–8 giây (nếu quay được).
8. `FINAL-compare-refs.png` (chỉ để nội bộ đối chiếu): ảnh của mình đặt cạnh ảnh chụp màn hình tham khảo từ trang Steam. Reviewer dùng để chấm, KHÔNG đưa vào sản phẩm phát hành.

**Quy ước tên file ảnh:** `<Mốc>-<mô tả>.png`, ví dụ `W4-final-dusk.png`. Lưu trong `shots/`. Mỗi ảnh có dòng ghi chú ngắn trong `notes/changelog.md` (commit/phiên bản nào sinh ra ảnh).

**Xác minh ảnh hợp lệ (làm tự động bằng script):**
- Kích thước đúng; không đen/trắng hoàn toàn (kiểm tra histogram, độ lệch chuẩn > ngưỡng).
- Ảnh không giống hệt ảnh mốc trước (băm hoặc khoảng cách điểm ảnh) khi mốc đó có thay đổi.

Builder PHẢI tự mở và nhìn ảnh bằng công cụ xem ảnh (Read ảnh) trước khi báo xong mốc; không báo "xong" khi chưa nhìn ảnh.

---

## 8. KIỂM THỬ & XỬ LÝ SỰ CỐ

### 8.1 Checklist kiểm thử kỹ thuật (mỗi hướng)
- [ ] Chạy từ máy sạch theo README (1 lệnh).
- [ ] Không có lỗi/cảnh báo shader trong console/log.
- [ ] Texture dùng Nearest; không thấy nhoè pixel ở sprite.
- [ ] Chụp ảnh tự động ở tất cả trạng thái (4 thời điểm × 3 thời tiết) thành công.
- [ ] Mọi hiệu ứng có công tắc bật/tắt.
- [ ] FPS được ghi (nêu rõ môi trường đo).
- [ ] Ảnh chụp lặp lại cho kết quả tương tự (ổn định; seed ngẫu nhiên cố định cho chụp ảnh).

### 8.2 Sự cố thường gặp và hướng xử lý
| Sự cố | Cách xử lý |
|---|---|
| Không có GPU để chụp | Web: SwiftShader/ANGLE trong Chromium headless; Godot: Xvfb + Mesa llvmpipe, hoặc Compatibility renderer, hoặc `--write-movie`. |
| Godot không tải được | Thử GitHub releases; nếu bị chặn, báo rõ và chuyển hướng B sang việc chuẩn bị đầy đủ project + asset + script để người dùng mở bằng Godot ở máy mình (ghi rõ là CHƯA có ảnh chụp thật), hoặc dùng gói `godot` từ pip/npm (nếu có bản đóng gói). Đừng giả mạo ảnh. |
| Volumetric fog không có trong Compatibility | Dùng tia sáng giả: mặt phẳng additive + shader noise + hạt bụi. |
| Pixel bị nhoè/vỡ khi scale | Dùng scale nguyên, Nearest, tắt mipmap/anisotropy cho sprite; bảo đảm camera pixel-snapped nếu có di chuyển. |
| DOF làm nhân vật bị nhoè | Đặt khoảng cách lấy nét theo vị trí nhân vật; dùng vùng nét rộng hơn; kiểm tra bằng ảnh A/B. |
| Cảnh trông "phẳng" | Tăng độ sâu: tiền cảnh nhoè, hậu cảnh sương, phối cảnh nghiêng, đổ bóng, tầng cây nhiều lớp, ánh sáng cạnh (rim). |
| Cảnh trông "rối" | Giảm bảng màu, tăng tương phản giá trị (value), nhóm vật thể, tạo điểm nhấn quanh nhân vật và nguồn sáng ấm. |

### 8.3 Quy tắc trung thực
Nếu không chụp được ảnh thật, hoặc hiệu ứng nào chưa làm được, phải ghi rõ trong báo cáo. Không dùng ảnh mô phỏng/ảnh từ nguồn khác để thay cho kết quả thật.

---

## 9. QUY TRÌNH DUYỆT (REVIEWER) – LẶP TỐI THIỂU 2 VÒNG

### 9.1 Khi nào duyệt
- Duyệt giữa kỳ sau mốc W4/G4 (có hậu kỳ).
- Duyệt sau mốc W6/G6 (gần hoàn thiện).
- Duyệt cuối sau khi sửa.

### 9.2 Reviewer làm gì
1. Đọc `notes/references.md` của builder, tự xem lại các ví dụ tham khảo (Steam, trailer/ảnh chụp, tài liệu phỏng vấn HD-2D).
2. Tự chạy dự án theo README và tự chụp lại ảnh (không chỉ tin ảnh builder gửi).
3. Xem từng ảnh ở kích thước đầy đủ và các ảnh cắt cận.
4. Chấm theo rubric 9.3; đối chiếu với ví dụ mẫu từng điểm một.
5. Xem lại **phương pháp thực hiện** của builder (mã shader, cách làm sprite/normal, cách làm ánh sáng/DOF/volumetric): có đúng hướng không? Có phương pháp tốt hơn mà ví dụ tham khảo dùng không? Tra cứu nếu cần.
6. Viết `reviews/review-NN.md` theo mẫu 9.4.

### 9.3 Rubric chấm (mỗi hạng mục 0–10; điểm kèm lý do cụ thể)
| Hạng mục | Câu hỏi kiểm tra |
|---|---|
| Chất lượng pixel art | Ramp màu, hue-shift, viền chọn lọc, mật độ pixel nhất quán, chi tiết đủ dày? |
| Bảng màu & không khí | Tương phản ấm/lạnh, màu hài hoà, cảm xúc "chữa lành"? |
| Bố cục & chiều sâu | 3 lớp rõ, đường dẫn mắt, điểm nhấn là nhân vật/ánh sáng ấm? |
| Ánh sáng & bóng | Đèn điểm nhận đúng, bóng đổ, rim light, sprite nhận sáng hợp lý? |
| Thể tích & sương | Tia sáng, sương có chiều sâu, bụi lơ lửng? |
| Phản chiếu | Nước/đá ướt phản chiếu đèn và vật thể đủ tin? |
| Hậu kỳ HD-2D | Tilt-shift, bloom, grading, vignette hài hoà, không quá tay? |
| Sống động | Gió, mưa/lá, chim, bướm, khói, nước; chuyển động tự nhiên? |
| Nhân vật chibi | Tỷ lệ 2 đầu, dễ thương, chi tiết, hoà vào cảnh (bóng, ánh sáng)? |
| Mức tiệm cận ví dụ mẫu | So với Octopath/The Last Night/LONG GONE và cảnh Bilibili: thiếu gì cụ thể? |
| Độ vững kỹ thuật | Chạy ổn định, FPS, tái lập, mã sạch? |

Điểm tổng quy về thang 100. Mục tiêu vòng 1: ≥ 75 cho mỗi hướng ở vòng duyệt cuối; không hạng mục nào dưới 5.

### 9.4 Mẫu `review-NN.md`
```
# Review NN – <hướng> – <ngày/giờ>
## Điểm (bảng rubric, kèm lý do 1–2 câu mỗi dòng)
## Điểm mạnh (3–5 ý, dẫn chiếu ảnh cụ thể)
## So sánh với ví dụ mẫu (từng ví dụ: khác biệt cụ thể nhìn thấy được)
## Đánh giá phương pháp (đúng/sai/nên đổi; link tham khảo kỹ thuật nếu có)
## YÊU CẦU SỬA (đánh số, ưu tiên cao → thấp)
 1. [Cao] <việc cần sửa> – Tiêu chí hoàn thành đo được (ví dụ: "DOF: vùng nhoè tiền cảnh bán kính ≥ 6 px ở 1080p; chụp lại ảnh FINAL-hero") – Ảnh minh chứng cần nộp lại.
 2. ...
## Kết luận: Đạt / Cần sửa tiếp (và lý do)
```
Yêu cầu sửa phải CỤ THỂ, ĐO ĐƯỢC. Không viết kiểu "làm cho đẹp hơn".

### 9.5 Builder phản hồi
- Sửa theo từng mục yêu cầu, ghi `changelog.md` (mục đã sửa, cách sửa, ảnh trước/sau).
- Nếu không đồng ý một yêu cầu thì ghi lý do và đề xuất thay thế; reviewer quyết định cuối cùng ở vòng sau.
- Sau khi sửa, chụp lại toàn bộ bộ ảnh nghiệm thu.

---

## 10. BÁO CÁO CUỐI (MỖI HƯỚNG VIẾT 1 BẢN NGẮN; ĐIỀU PHỐI VIÊN TỔNG HỢP)

`report/SUMMARY.md` gồm:
1. Cách chạy (1 lệnh) và cách xem nhanh.
2. Danh sách ảnh nghiệm thu (đường dẫn).
3. Điểm cuối của reviewer cho từng hướng và nhận xét chính.
4. So sánh hai hướng: thẩm mỹ, độ chi tiết, hiệu ứng làm được/không làm được, hiệu năng, độ khó làm asset/ánh sáng, độ linh hoạt khi mở rộng thành game thật, rủi ro.
5. Khuyến nghị chọn hướng nào cho vòng 2 (kèm lý do), và những gì còn thiếu so với ví dụ mẫu.
6. Hạn chế/trung thực: hiệu ứng nào chưa làm được, ảnh nào không chụp được và vì sao.

---

## 11. TIẾN ĐỘ TỔNG THỂ (ĐỂ NGHIỆM THU VÀO NGÀY MAI)

Hai hướng chạy song song. Mốc tham khảo (có thể chồng lên nhau, miễn đủ minh chứng):

| Giai đoạn | Nội dung | Thời lượng gợi ý |
|---|---|---|
| P0 | Điều phối viên tạo `shared/` (brief + palette), cấu trúc thư mục | 20–30 phút |
| P1 | W0–W2 / G0–G2 (khởi tạo, khối cảnh, asset) | 3–4 giờ |
| P2 | W3–W4 / G3–G4 (ánh sáng, hậu kỳ) | 3–4 giờ |
| P3 | Duyệt giữa kỳ (Review-01) | 30–45 phút |
| P4 | W5–W6 / G5–G6 (sống động, nhân vật) + sửa theo Review-01 | 3–4 giờ |
| P5 | Duyệt (Review-02) + sửa | 1.5–2 giờ |
| P6 | Đóng gói, ảnh nghiệm thu cuối, báo cáo | 1 giờ |

Nếu thiếu thời gian, ưu tiên cắt theo thứ tự: mùa → video/GIF → chim/bướm phức tạp → normal map đầy đủ cho mọi sprite. KHÔNG cắt: DOF, bloom, đèn điểm, nước phản chiếu, gió, nhân vật chibi, ảnh minh chứng.

---

## 12. LỆNH KHỞI CHẠY CHO ĐIỀU PHỐI VIÊN (GỢI Ý PROMPT CHO TỪNG AGENT)

**Builder-Web / Builder-Godot:**
"Đọc `/work/PLAN_HD2D_Vong1.md` và `/work/shared/*`. Thực hiện Hướng <A/B> theo các mốc, nộp ảnh minh chứng đúng tên quy ước. Tự tra cứu khi gặp khó (asset, ánh sáng, DOF, volumetric, phản chiếu). Sau khi có Review, sửa theo từng yêu cầu và ghi changelog. Trung thực về mọi thứ chưa làm được."

**Reviewer-Web / Reviewer-Godot:**
"Đọc `/work/PLAN_HD2D_Vong1.md` mục 9. Tự xem lại ví dụ tham khảo, tự chạy và tự chụp lại dự án của Hướng <A/B>, chấm theo rubric, đánh giá cả phương pháp, viết `reviews/review-NN.md` với các yêu cầu sửa cụ thể, đo được. Không sửa code của builder."

---

## 13. TIÊU CHÍ NGHIỆM THU CUỐI (CHO NGƯỜI DÙNG VÀO NGÀY MAI)

Mở lên là thấy ngay (đánh dấu từng mục):
- [ ] Cảnh 3D có chiều sâu thật, pixel art sắc nét, nhất quán.
- [ ] Tilt-shift DOF rõ ràng; bloom đẹp ở nguồn sáng.
- [ ] Ánh sáng ấm từ cửa sổ/đèn lồng; sprite nhận sáng; có bóng đổ.
- [ ] Tia sáng/sương thể tích, bụi lơ lửng.
- [ ] Mặt nước phản chiếu, gợn sóng.
- [ ] Cây cỏ hoa đung đưa; mưa hoặc lá rơi; chim, bươm bướm; khói, cờ/đèn lồng chuyển động.
- [ ] Nhân vật chibi 2 đầu đáng yêu, hoà vào ánh sáng cảnh.
- [ ] Chuyển được thời điểm/thời tiết.
- [ ] Có ảnh minh chứng đầy đủ + báo cáo + điểm review của từng hướng.
