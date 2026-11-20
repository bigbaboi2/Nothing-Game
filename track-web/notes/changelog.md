# Changelog – Track Web

## v1.0 (W0–W6 Initial Build)
- Tạo bộ 25 pixel sprite + Sobel normal map + emissive mask bằng `tools/gen_assets.mjs` (100% chuẩn `shared/palette.json`, kiểm tra bởi `tools/verify_assets.mjs`).
- Dựng cảnh 3 lớp HD-2D bằng Three.js (WebGL2), shader sprite nhận directional + 7 point lights, planar water reflection, tilt-shift DOF, bloom, volumetric god-rays, mưa/lá/đom đóm/bướm/chim/khói.
- Ảnh: `shots/W2-assets-sheet.png`, `shots/FINAL-hero.png` (vòng 1).

## v1.1 (Sửa theo Review-01)
- **Sửa tường kênh đen đặc:** Thay `MeshStandardMaterial` ở `northBank`/`westBank` sang `createGroundMaterial('ground_cobble', ...)` để nhận đủ directional + 7 point lights.
- **Mở rộng khung hình camera:** Lùi camera về `(0.5, 13.0, 25.5)` nhìn `(0.5, 2.5, -1.5)` để thấy rõ mái ngói Inn, tán cây lớn, bầu trời hoàng hôn và mặt nước kênh phản chiếu.
- **Giảm cháy Bloom ở cửa sổ:** Nâng `threshold` lên `0.88`, giảm `strength` xuống `0.42`, `emissiveScale` dusk xuống `1.05` để giữ nét song cửa sổ gỗ.
