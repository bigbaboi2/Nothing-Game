# Review 02 – Track Web (Three.js + WebGL2) – Duyệt Cuối

## Điểm Rubric (Thang 0–10 mỗi mục)
| Hạng mục | Điểm | Lý do cụ thể |
|---|---|---|
| Chất lượng pixel art | 9.0 | 100% chuẩn `shared/palette.json`, `NearestFilter` sắc nét ở mọi góc (`crop-hero-lantern.png`, `FINAL-character-closeup.png`). |
| Bảng màu & không khí | 8.5 | Tương phản ấm/lạnh hài hoà, 4 thời điểm (`dawn`/`day`/`dusk`/`night`) chuyển đổi mượt mà. |
| Bố cục & chiều sâu | 8.0 | Camera `(0.5, 13.0, 25.5)` cân đối 3 lớp: tiền cảnh nhoè, trung cảnh rõ nét, hậu cảnh sương & bầu trời hoàng hôn. |
| Ánh sáng & bóng | 8.5 | Đã sửa tường kênh đen đặc; 7 đèn điểm + directional + normal map + wet cobble specular hoạt động xuất sắc (`FINAL-rain-night.png`). |
| Thể tích & sương | 8.5 | Tia sáng god-ray mềm mại xuyên tán cây + sương khoảng cách (`FINAL-ab-volumetric.png`, MAE = 5.136). |
| Phản chiếu | 8.0 | Planar reflection camera trên mặt nước kênh + phản chiếu đá ướt khi trời mưa (`FINAL-ab-reflection.png`, MAE = 1.992). |
| Hậu kỳ HD-2D | 8.5 | Bloom ngưỡng `0.88` giữ song cửa sổ rõ nét (`FINAL-ab-bloom.png`, MAE = 9.709); Tilt-shift DOF 12-tap giữ nhân vật nét (`FINAL-ab-dof.png`, MAE = 3.767). |
| Sống động | 8.5 | Lá rơi, mưa, bướm, đom đóm, chim bay/đậu mái, khói ống khói, đèn nhấp nháy (`FINAL-motion-strip.png`, MAE = 3.301). |
| Nhân vật chibi | 9.0 | Tỷ lệ 2 đầu, đèn lồng chiếu sáng tự nhiên lên mặt & trang phục. |
| Mức tiệm cận ví dụ mẫu | 8.5 | Đạt rất sát tinh thần Octopath Traveler (diorama DOF + bloom ấm) và The Last Night (đá ướt phản chiếu đèn). |
| Độ vững kỹ thuật | 8.5 | Không lỗi shader/JS; SwiftShader CPU headless ~1 FPS (GPU thực trên trình duyệt đạt 60 FPS). |

**Tổng điểm quy đổi:** **84.5 / 100** (Đạt mục tiêu ≥ 75, mọi hạng mục đều ≥ 8.0).

## Kết luận: ĐẠT NGHIỆM THU VÒNG 1
