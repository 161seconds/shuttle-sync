import { useState } from 'react';
import { Dumbbell, Timer, PlayCircle, Zap, Activity, HeartPulse, ShieldPlus, Move, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══ DANH MỤC ═══
const CATEGORIES = [
    { 
        id: 'warmup', label: 'Khởi Động', icon: <Zap className="w-4 h-4" />, 
        color: 'text-yellow-500', activeBorder: 'border-yellow-500/50', activeBg: 'bg-yellow-500/20', activeShadow: 'shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
    },
    { 
        id: 'fitness', label: 'Thể Lực', icon: <Dumbbell className="w-4 h-4" />, 
        color: 'text-red-500', activeBorder: 'border-red-500/50', activeBg: 'bg-red-500/20', activeShadow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]'
    },
    { 
        id: 'stretching', label: 'Giãn Cơ', icon: <Move className="w-4 h-4" />, 
        color: 'text-blue-500', activeBorder: 'border-blue-500/50', activeBg: 'bg-blue-500/20', activeShadow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]'
    },
    { 
        id: 'recovery', label: 'Phục Hồi', icon: <ShieldPlus className="w-4 h-4" />, 
        color: 'text-emerald-500', activeBorder: 'border-emerald-500/50', activeBg: 'bg-emerald-500/20', activeShadow: 'shadow-glow-md'
    },
];

// ═══ DATA: 60 BÀI TẬP CÓ KÈM HƯỚNG DẪN ═══
const EXERCISES = [
    // --- 1. KHỞI ĐỘNG (WARM-UP) ---
    { id: 'w1', cat: 'warmup', title: 'Xoay cổ tay, cổ chân', duration: '2 Phút', intensity: 'Nhẹ', desc: 'Làm nóng khớp cổ tay và cổ chân, hạn chế lật cổ chân và lỏng cổ tay khi đập cầu.', steps: ['Đứng thẳng, đan hai bàn tay vào nhau.', 'Nhón một gót chân lên, dùng mũi chân làm trụ xoay tròn.', 'Kết hợp xoay tròn cổ tay cùng lúc. Đổi bên sau 1 phút.'] },
    { id: 'w2', cat: 'warmup', title: 'Xoay khớp vai', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Xoay tới và lui. Cực kỳ quan trọng để mở biên độ vai cho cú phông và smash.', steps: ['Đứng dang hai chân bằng vai, thả lỏng tay.', 'Quạt hai cánh tay thành vòng tròn lớn từ sau ra trước.', 'Thực hiện 30 giây rồi đổi chiều quay từ trước ra sau.'] },
    { id: 'w3', cat: 'warmup', title: 'Chạy bước nhỏ tại chỗ', duration: '2 Phút', intensity: 'Vừa', desc: 'Kích thích nhịp tim tăng dần, làm nóng toàn bộ cơ thể.', steps: ['Đứng thẳng, kiễng gót chân.', 'Chạy nhấp nhô mũi chân tại chỗ nhanh nhất có thể.', 'Đánh tay nhịp nhàng theo bước chạy.'] },
    { id: 'w4', cat: 'warmup', title: 'Nâng cao đùi', duration: '1 Phút', intensity: 'Vừa', desc: 'Tăng cường sức mạnh cơ đùi trước và sự linh hoạt của khớp háng.', steps: ['Chạy tại chỗ, nâng cao một bên đùi sao cho vuông góc với bụng.', 'Luân phiên hai chân liên tục, tiếp đất bằng mũi chân.', 'Tăng dần tốc độ trong 20 giây cuối.'] },
    { id: 'w5', cat: 'warmup', title: 'Gót chạm mông', duration: '1 Phút', intensity: 'Vừa', desc: 'Làm nóng cơ đùi sau, chuẩn bị cho những pha lùi bước.', steps: ['Chạy tại chỗ, gập cẳng chân về phía sau.', 'Cố gắng để gót chân chạm sát vào mông.', 'Thực hiện nhịp nhàng liên tục.'] },
    { id: 'w6', cat: 'warmup', title: 'Xoay eo, hông', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Tránh chấn thương lưng dưới khi phải vặn người cứu cầu khó.', steps: ['Đứng dang rộng hai chân, chống hai tay ngang hông.', 'Xoay hông thành vòng tròn lớn từ trái sang phải.', 'Sau 30 giây đổi chiều xoay ngược lại.'] },
    { id: 'w7', cat: 'warmup', title: 'Ép dọc (Lunge xoạc dọc)', duration: '2 Phút', intensity: 'Vừa', desc: 'Kéo căng và làm nóng cơ gân khoeo, háng và đùi trước.', steps: ['Bước một chân dài về phía trước, khuỵu gối chân trước 90 độ.', 'Chân sau duỗi thẳng, ép phần hông xuống sàn.', 'Giữ 3 giây, thu chân về và đổi bên.'] },
    { id: 'w8', cat: 'warmup', title: 'Ép ngang', duration: '2 Phút', intensity: 'Vừa', desc: 'Mở rộng khớp háng, hữu ích cho những pha xoạc cứu cầu hai bên.', steps: ['Dang hai chân rất rộng.', 'Khụy gối một bên, hạ thấp trọng tâm, chân kia duỗi thẳng.', 'Nhấp ép nhẹ 3-5 nhịp rồi đổi bên.'] },
    { id: 'w9', cat: 'warmup', title: 'Xoay khớp gối', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Bôi trơn khớp gối, khớp chịu áp lực lớn nhất khi đánh cầu.', steps: ['Chụm hai chân lại, hơi khụy gối.', 'Đặt hai tay lên đầu gối, xoay tròn hai gối cùng lúc.', 'Xoay 30 giây mỗi chiều.'] },
    { id: 'w10', cat: 'warmup', title: 'Gập duỗi lưng lườn', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Làm mềm cơ xô và cơ liên sườn.', steps: ['Đứng dang chân, giơ hai tay lên cao.', 'Cúi gập người sao cho tay chạm mũi chân.', 'Vươn người đứng dậy, ngả lưng ra sau. Lặp lại 10 lần.'] },
    { id: 'w11', cat: 'warmup', title: 'Đánh tay chéo ngực', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Mở rộng lồng ngực và làm nóng cơ ngực, vai trước.', steps: ['Dang hai tay ngang vai.', 'Đánh mạnh hai tay đan chéo nhau trước ngực.', 'Vung tay bật trở lại phía sau hết cỡ. Lặp lại liên tục.'] },
    { id: 'w12', cat: 'warmup', title: 'Lăng chân trước sau', duration: '1 Phút', intensity: 'Vừa', desc: 'Tăng biên độ dao động của chân, giúp di chuyển lướt tốt hơn.', steps: ['Tìm một vách tường để một tay bám giữ thăng bằng.', 'Đứng một chân, chân kia lăng mạnh về trước rồi đu đưa ra sau.', 'Đổi chân sau 30 giây.'] },
    { id: 'w13', cat: 'warmup', title: 'Lăng chân sang ngang', duration: '1 Phút', intensity: 'Vừa', desc: 'Kích hoạt cơ mông nhỡ và cơ đùi trong.', steps: ['Quay mặt vào tường, bám hai tay.', 'Lăng một chân cắt ngang trước mặt sang bên đối diện, rồi vung mạnh ra ngoài.', 'Thực hiện 15 lần mỗi bên chân.'] },
    { id: 'w14', cat: 'warmup', title: 'Chạy ziczac đổi hướng', duration: '3 Phút', intensity: 'Cao', desc: 'Khởi động thần kinh thị giác và phản xạ đổi hướng đột ngột trên sân.', steps: ['Đặt 3-4 quả cầu lông trên sân làm nón chóp.', 'Chạy bước nhỏ luồn lách qua các quả cầu.', 'Gập người chạm tay xuống sàn ở mỗi góc cua.'] },
    { id: 'w15', cat: 'warmup', title: 'Bật nhảy tại chỗ (Jumping Jacks)', duration: '2 Phút', intensity: 'Cao', desc: 'Bơm máu toàn thân, đẩy nhịp tim lên mức sẵn sàng chiến đấu.', steps: ['Đứng chụm chân, tay thả lỏng.', 'Bật nhảy dang rộng hai chân, đồng thời vung hai tay đập vào nhau trên đỉnh đầu.', 'Nhảy thu chân và tay về vị trí cũ. Lặp lại liên tục.'] },

    // --- 2. THỂ LỰC (FITNESS) ---
    { id: 'f1', cat: 'fitness', title: 'Di chuyển 6 góc sân (Footwork)', duration: '15 Phút', intensity: 'Cực Cao', desc: 'Bài tập Vua của cầu lông. Chạy không bóng 6 điểm để luyện bước chân.', steps: ['Bắt đầu từ giữa sân.', 'Thực hiện bước đuổi/bước chéo tiến lên 2 góc lưới giả vờ hất cầu rồi lùi về trung tâm.', 'Thực hiện tương tự lùi về 2 góc đuôi sân giả vờ smash.', 'Thực hiện liên tục 5 hiệp, mỗi hiệp 2 phút.'] },
    { id: 'f2', cat: 'fitness', title: 'Nhảy dây tốc độ', duration: '10 Phút', intensity: 'Cao', desc: 'Tăng sức bền, nhịp độ chân và sự dẻo dai của cổ chân.', steps: ['Dùng dây nhảy chuyên dụng.', 'Nhảy liên tục trên mũi chân, hạn chế gập gối quá nhiều.', 'Tập 3 hiệp: 3 phút nhảy/1 phút nghỉ.'] },
    { id: 'f3', cat: 'fitness', title: 'Cuộn tạ cổ tay (Wrist Curls)', duration: '5 Phút', intensity: 'Vừa', desc: 'Dùng tạ 1-2kg cuộn ngửa và sấp. Tăng lực phông và smash.', steps: ['Ngồi trên ghế, đặt cẳng tay lên đùi, cổ tay thò ra khỏi đầu gối.', 'Cầm tạ đơn 1-2kg, ngửa lòng bàn tay, cuộn cổ tay lên xuống.', 'Xoay úp lòng bàn tay và thực hiện tương tự. Mỗi kiểu 3 hiệp x 15 lần.'] },
    { id: 'f4', cat: 'fitness', title: 'Lunges (Chùng chân)', duration: '3 Hiệp', intensity: 'Cao', desc: 'Tập sức mạnh đùi trước và mông, giúp những bước lên lưới vững chắc.', steps: ['Đứng thẳng, tay cầm tạ nhẹ hoặc không tạ.', 'Bước một chân dài lên trước, hạ trọng tâm sao cho 2 đầu gối đều gập 90 độ.', 'Đẩy mạnh chân trước để thu người về. Mỗi chân 15 lần.'] },
    { id: 'f5', cat: 'fitness', title: 'Squat có tạ (Goblet Squat)', duration: '3 Hiệp', intensity: 'Cao', desc: 'Tăng cường sức mạnh toàn bộ phần thân dưới để bật nhảy cao hơn.', steps: ['Ôm 1 quả tạ (hoặc bình nước lớn) trước ngực.', 'Dang chân bằng vai, mũi chân hơi hướng ra ngoài.', 'Hạ mông xuống như ngồi ghế cho đến khi đùi song song mặt sàn, rồi đứng lên.'] },
    { id: 'f6', cat: 'fitness', title: 'Nhảy cóc (Frog Jumps)', duration: '3 Hiệp', intensity: 'Cực Cao', desc: 'Tăng lực bùng nổ (explosive power) của đôi chân.', steps: ['Ngồi xổm, hai tay chạm sàn.', 'Dùng lực đùi và mũi chân bật nảy người tới trước xa nhất có thể.', 'Tiếp đất mềm mại bằng mũi chân rồi hạ xuống gót. Thực hiện 10 bước/hiệp.'] },
    { id: 'f7', cat: 'fitness', title: 'Tập cơ xô với dây kháng lực', duration: '3 Hiệp', intensity: 'Vừa', desc: 'Móc dây trên cao kéo xuống, giả lập động tác đập cầu tăng lực vai.', steps: ['Móc dây kháng lực cao quá đầu.', 'Đứng tư thế chuẩn bị đập cầu, cầm dây bằng tay thuận.', 'Kéo dây mạnh xuống theo đúng biên độ vung vợt đập cầu. 15 lần/hiệp.'] },
    { id: 'f8', cat: 'fitness', title: 'Plank', duration: '3x 1 Phút', intensity: 'Cao', desc: 'Tăng cường cơ lõi (Core), giúp giữ thăng bằng trên không khi đập cầu.', steps: ['Nằm sấp, chống hai cẳng tay xuống sàn.', 'Nâng người lên sao cho từ gót chân đến vai thành một đường thẳng.', 'Siết chặt cơ bụng, hít thở đều và giữ yên 1 phút.'] },
    { id: 'f9', cat: 'fitness', title: 'Russian Twists', duration: '3 Hiệp', intensity: 'Vừa', desc: 'Tập cơ liên sườn, hỗ trợ lực vặn người khi phông hoặc đập chéo sân.', steps: ['Ngồi trên sàn, nhấc hai chân lên khỏi mặt đất, hơi ngả lưng.', 'Hai tay cầm 1 quả tạ nhẹ hoặc chai nước.', 'Vặn thân trên đưa tạ sang chạm sàn bên trái, rồi vặn sang phải.'] },
    { id: 'f10', cat: 'fitness', title: 'Chạy bứt tốc ngắt quãng (Intervals)', duration: '15 Phút', intensity: 'Cực Cao', desc: 'Giả lập cường độ của một trận đấu: 30s chạy rút nước, 30s đi bộ.', steps: ['Tìm một đoạn đường thẳng hoặc máy chạy bộ.', 'Chạy nước rút 100% sức lực trong 30 giây.', 'Đi bộ thả lỏng 30 giây. Lặp lại 10-15 vòng.'] },
    { id: 'f11', cat: 'fitness', title: 'Bật nhảy lên bục (Box Jumps)', duration: '3 Hiệp', intensity: 'Cao', desc: 'Tập phản xạ co cơ nhanh, tối ưu hóa sức bật dọc.', steps: ['Đứng trước một bục gỗ hoặc bậc thềm cao 30-50cm.', 'Lấy đà, vung tay và bật nhảy cả 2 chân lên bục.', 'Bước từng chân xuống (không nhảy lùi để bảo vệ gối).'] },
    { id: 'f12', cat: 'fitness', title: 'Chống đẩy nảy tay (Clapping Push-ups)', duration: '3 Hiệp', intensity: 'Cao', desc: 'Tăng lực đẩy bùng nổ của cơ ngực và cơ tam đầu (triceps).', steps: ['Vào tư thế chống đẩy cơ bản.', 'Hạ người xuống chậm, sau đó đẩy bùng nổ thật mạnh để hai tay rời mặt đất.', 'Vỗ tay 1 cái trên không rồi tiếp đất mềm mại.'] },
    { id: 'f13', cat: 'fitness', title: 'Burpees', duration: '3 Hiệp', intensity: 'Cực Cao', desc: 'Bài tập toàn thân tiêu hao thể lực khủng khiếp, luyện ý chí.', steps: ['Đứng thẳng, hạ người xuống tư thế chống đẩy.', 'Thực hiện 1 nhịp chống đẩy.', 'Thu 2 chân lên và lập tức bật nhảy vươn hai tay lên trời.'] },
    { id: 'f14', cat: 'fitness', title: 'Wall Sit (Ngồi xổm dựa tường)', duration: '3x 1 Phút', intensity: 'Cao', desc: 'Luyện sức chịu đựng tĩnh của cơ đùi trước.', steps: ['Dựa lưng phẳng vào tường.', 'Hạ người xuống cho đến khi đùi song song với mặt đất (như đang ngồi ghế).', 'Giữ im tư thế đó đến khi cơ đùi mỏi nhừ (tầm 1 phút).'] },
    { id: 'f15', cat: 'fitness', title: 'Bóp kìm tập tay (Hand Grip)', duration: 'Hằng ngày', intensity: 'Nhẹ', desc: 'Tăng lực nắm, hạn chế tuột vợt hoặc xoay cán vợt khi đập.', steps: ['Mua kìm bóp tay lò xo.', 'Rảnh rỗi ngồi xem TV thì lấy ra bóp.', 'Bóp giữ 2 giây rồi nhả ra. Thực hiện 50-100 cái mỗi tay.'] },

    // --- 3. GIÃN CƠ (STRETCHING) ---
    { id: 's1', cat: 'stretching', title: 'Căng bắp chân (Calf Stretch)', duration: '2 Phút', intensity: 'Nhẹ', desc: 'Đẩy tường, duỗi thẳng chân sau. Ngừa chuột rút bắp chân.', steps: ['Đứng úp mặt vào tường, chống 2 tay ngang ngực.', 'Bước 1 chân ra sau thật xa, giữ gót chân dính sát mặt sàn.', 'Đẩy hông về trước để cảm nhận độ căng ở bắp chân sau. Giữ 30s.'] },
    { id: 's2', cat: 'stretching', title: 'Căng đùi trước (Quad Stretch)', duration: '2 Phút', intensity: 'Nhẹ', desc: 'Đứng 1 chân, kéo gót chân kia chạm mông. Phục hồi cơ đùi trước.', steps: ['Đứng trụ 1 chân (có thể bám tường).', 'Co chân kia lên mông, dùng tay cùng bên nắm lấy cổ chân.', 'Kéo ép sát gót chân vào mông, ưỡn ngực thẳng lưng. Giữ 30s.'] },
    { id: 's3', cat: 'stretching', title: 'Căng đùi sau (Hamstring Stretch)', duration: '2 Phút', intensity: 'Nhẹ', desc: 'Ngồi gập người chạm mũi chân. Rất quan trọng để tránh căng cơ.', steps: ['Ngồi thẳng lưng trên sàn, duỗi thẳng 2 chân.', 'Hít sâu, thở ra và từ từ bò 2 tay về phía mũi chân.', 'Cố gắng chạm tay vào mũi chân mà không cong đầu gối. Giữ 30s.'] },
    { id: 's4', cat: 'stretching', title: 'Căng cơ mông (Glute Stretch)', duration: '2 Phút', intensity: 'Nhẹ', desc: 'Nằm ngửa, bắt chéo chân chữ ngũ và kéo ép vào ngực.', steps: ['Nằm ngửa, co 2 gối. Gác mắt cá chân trái lên đùi phải.', 'Dùng 2 tay luồn ôm lấy đùi phải kéo sát về phía ngực.', 'Bạn sẽ thấy cơ mông trái căng cứng. Giữ 30s và đổi bên.'] },
    { id: 's5', cat: 'stretching', title: 'Ép hông bướm (Butterfly Stretch)', duration: '2 Phút', intensity: 'Nhẹ', desc: 'Ngồi áp 2 lòng bàn chân vào nhau, ép gối xuống sàn.', steps: ['Ngồi trên sàn, gập gối, áp 2 lòng bàn chân vào nhau.', 'Dùng 2 tay ôm lấy bàn chân, thẳng lưng.', 'Dùng cùi chỏ tì nhẹ lên đùi để ép 2 đầu gối xuống sát mặt sàn. Giữ 30s.'] },
    { id: 's6', cat: 'stretching', title: 'Kéo giãn vai (Shoulder Stretch)', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Vắt tay chữ thập ngang ngực, ép sát để giãn cơ vai sau.', steps: ['Đứng hoặc ngồi thẳng.', 'Đưa cánh tay phải vắt chéo qua ngực sang bên trái.', 'Dùng cẳng tay trái ép chặt cánh tay phải vào người. Giữ 20s.'] },
    { id: 's7', cat: 'stretching', title: 'Kéo giãn cơ tam đầu (Triceps)', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Vòng tay qua sau gáy, dùng tay kia kéo cùi chỏ. Phục hồi tay đập.', steps: ['Giơ cánh tay thuận thẳng lên trần, rồi gập khuỷu tay ra sau gáy.', 'Dùng tay còn lại nắm lấy cùi chỏ tay thuận, kéo nhẹ sang ngang.', 'Cảm nhận độ căng ở bắp tay sau. Giữ 20s.'] },
    { id: 's8', cat: 'stretching', title: 'Kéo giãn cẳng tay, cổ tay', duration: '2 Phút', intensity: 'Nhẹ', desc: 'Gập ngửa và gập sấp bàn tay, ép nhẹ. Cực kỳ cần thiết cho tay cầm vợt.', steps: ['Duỗi thẳng 1 tay ra trước, lòng bàn tay ngửa lên trần.', 'Dùng tay kia bẻ quặp 5 ngón tay hướng xuống đất, giữ 20s.', 'Đổi lại úp lòng bàn tay và bẻ gập ngón tay xuống đất, giữ 20s.'] },
    { id: 's9', cat: 'stretching', title: 'Tư thế em bé (Child\'s Pose)', duration: '2 Phút', intensity: 'Nhẹ', desc: 'Quỳ gập người, duỗi tay dài ra trước. Thư giãn toàn bộ vùng lưng dưới.', steps: ['Quỳ gối trên thảm, mông ngồi lên gót chân.', 'Cúi gập người sát đùi, trán chạm sàn.', 'Duỗi thẳng 2 cánh tay vươn ra trước mặt xa nhất có thể. Thở đều.'] },
    { id: 's10', cat: 'stretching', title: 'Tư thế chó úp mặt (Downward Dog)', duration: '2 Phút', intensity: 'Nhẹ', desc: 'Giãn đồng thời gót chân, bắp chân, đùi sau và vai.', steps: ['Vào tư thế chống đẩy, sau đó đẩy cao hông lên trần nhà.', 'Cơ thể tạo thành hình chữ V lộn ngược.', 'Cố gắng ép 2 gót chân chạm sàn và đẩy ngực về phía đùi. Giữ 30s.'] },
    { id: 's11', cat: 'stretching', title: 'Vặn cột sống (Spinal Twist)', duration: '2 Phút', intensity: 'Nhẹ', desc: 'Nằm ngửa, vắt 1 chân sang bên kia, xoay người ngược lại. Giãn lưng cơ bản.', steps: ['Nằm ngửa, dang ngang hai cánh tay chữ T.', 'Co gối phải 90 độ, đổ gối phải sang trái chạm sàn.', 'Đầu ngoảnh nhìn sang bên phải. Giữ 30s rồi đổi bên.'] },
    { id: 's12', cat: 'stretching', title: 'Kéo giãn cơ xô', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Bám tay vào cột/khung lưới, ngả người ra sau kéo giãn nách và mạn sườn.', steps: ['Đứng đối diện cột cờ lưới.', 'Tay thuận bám vào cột, lùi người ra sau gập lưng ngang hông.', 'Hơi đẩy hông sang bên tay thuận để mạn sườn căng ra. Giữ 20s.'] },
    { id: 's13', cat: 'stretching', title: 'Giãn lườn (Side Bend)', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Đứng thẳng, nghiêng lườn sâu sang hai bên.', steps: ['Đứng dang chân rộng bằng vai.', 'Trượt bàn tay trái dọc theo đùi trái xuống đầu gối.', 'Tay phải giơ qua đầu uốn cong thân người sang trái. Giữ 20s.'] },
    { id: 's14', cat: 'stretching', title: 'Giãn cơ cổ', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Dùng tay kéo nghiêng cổ nhẹ nhàng sang trái, phải, trước, sau.', steps: ['Ngồi thẳng lưng, thả lỏng vai.', 'Vòng tay phải qua đỉnh đầu, nắm lấy mang tai trái.', 'Kéo nhẹ đầu nghiêng sang vai phải cho đến khi cơ cổ trái căng. Giữ 15s.'] },
    { id: 's15', cat: 'stretching', title: 'Tư thế rắn hổ mang (Cobra Pose)', duration: '1 Phút', intensity: 'Nhẹ', desc: 'Nằm sấp, chống tay đẩy ngực lên. Căng cơ bụng và giảm mỏi lưng.', steps: ['Nằm sấp úp trên thảm, 2 tay chống ngang ngực.', 'Hít vào, từ từ thẳng tay đẩy thân trên ngóc đầu lên cao.', 'Ngửa mặt lên trần, phần hông vẫn chạm sàn. Giữ 30s.'] },

    // --- 4. PHỤC HỒI (RECOVERY) ---
    { id: 'r1', cat: 'recovery', title: 'Foam Rolling: Bắp chân', duration: '3 Phút', intensity: 'Thư giãn', desc: 'Dùng ống lăn massage giải phóng các điểm bó cơ (trigger point) ở bắp chân.', steps: ['Ngồi trên sàn, đặt ống lăn dưới bắp chân.', 'Dùng hai tay chống phía sau nâng mông lên khỏi mặt đất.', 'Lăn ống từ cổ chân lên đến sát nếp gấp nhượng chân trong 1 phút.'] },
    { id: 'r2', cat: 'recovery', title: 'Foam Rolling: Đùi trước (Quads)', duration: '3 Phút', intensity: 'Thư giãn', desc: 'Lăn bóc tách cơ đùi trước, giảm axit lactic tích tụ sau khi chạy nhiều.', steps: ['Nằm sấp, đặt ống lăn ngang dưới phần đùi trên.', 'Chống bằng hai cẳng tay (tư thế plank).', 'Dùng tay kéo/đẩy cơ thể để ống lăn chạy từ hông xuống sát đầu gối.'] },
    { id: 'r3', cat: 'recovery', title: 'Foam Rolling: Dải chậu chày (IT Band)', duration: '3 Phút', intensity: 'Thư giãn', desc: 'Lăn mặt ngoài đùi. Hơi đau nhưng cực kỳ hiệu quả chống mỏi gối.', steps: ['Nằm nghiêng 1 bên, đặt ống lăn dưới hông bên dưới.', 'Chân trên chống xuống sàn để kiểm soát lực tì.', 'Lăn từ hông dọc theo mặt ngoài đùi xuống sát gối. Đoạn nào đau thì dừng lại day nhẹ.'] },
    { id: 'r4', cat: 'recovery', title: 'Foam Rolling: Lưng trên', duration: '2 Phút', intensity: 'Thư giãn', desc: 'Mở rộng lồng ngực, giảm mỏi vùng giữa 2 xương bả vai.', steps: ['Nằm ngửa, đặt ống lăn ngang dưới phần lưng trên (bả vai).', 'Hai tay đỡ sau gáy, co gối nâng mông.', 'Lăn từ giữa lưng lên đến cổ. (Tuyệt đối không lăn ở vùng lưng dưới gồ ghề).'] },
    { id: 'r5', cat: 'recovery', title: 'Ngâm nước đá (Ice Bath)', duration: '10 Phút', intensity: 'Đặc biệt', desc: 'Ngâm chi dưới vào nước đá (10-15 độ C) sau trận đấu căng thẳng để giảm viêm.', steps: ['Chuẩn bị bồn tắm hoặc xô lớn với nước pha đá lạnh (10-15 độ).', 'Mặc quần áo ấm phần thân trên.', 'Ngâm từ eo trở xuống trong vòng 10-15 phút. Ra ngoài lau khô ngay.'] },
    { id: 'r6', cat: 'recovery', title: 'Chườm nóng lưng dưới', duration: '15 Phút', intensity: 'Thư giãn', desc: 'Dùng túi chườm nóng giúp tăng tuần hoàn máu vùng lưng chậu.', steps: ['Chuẩn bị túi chườm nước nóng hoặc đệm sưởi điện.', 'Nằm sấp thoải mái trên giường.', 'Đặt túi chườm lên vùng thắt lưng, nhắm mắt thư giãn 15-20 phút.'] },
    { id: 'r7', cat: 'recovery', title: 'Massage súng điện (Massage Gun)', duration: '10 Phút', intensity: 'Thư giãn', desc: 'Bắn vào các vùng cơ lớn (đùi, mông, bắp chân). Tránh bắn vào xương khớp.', steps: ['Sử dụng đầu súng tròn hoặc phẳng.', 'Chỉnh tốc độ mức thấp-trung bình.', 'Rà súng nhẹ nhàng trên các búi cơ đùi, bắp tay. Tuyệt đối không dí vào xương cùi chỏ hay đầu gối.'] },
    { id: 'r8', cat: 'recovery', title: 'Đi bộ thả lỏng (Active Recovery)', duration: '15 Phút', intensity: 'Nhẹ', desc: 'Ngày nghỉ, đi bộ nhẹ nhàng để máu lưu thông đào thải độc tố.', steps: ['Thay vì nằm lỳ ở nhà vào ngày nghỉ ngơi.', 'Hãy mang giày thể thao đi dạo ngoài công viên 15-20 phút.', 'Kết hợp hít thở sâu lấy oxy.'] },
    { id: 'r9', cat: 'recovery', title: 'Bơi lội thả lỏng', duration: '30 Phút', intensity: 'Nhẹ', desc: 'Môi trường nước giúp giảm tải áp lực trọng lượng lên khớp gối và cổ chân.', steps: ['Đến hồ bơi, không cần bơi tốc độ.', 'Bơi ếch nhẹ nhàng hoặc chỉ cần đi bộ/ngâm mình dưới nước.', 'Sức cản của nước massage tự nhiên cho toàn thân.'] },
    { id: 'r10', cat: 'recovery', title: 'Đạp xe nhẹ nhàng', duration: '20 Phút', intensity: 'Nhẹ', desc: 'Xoay khớp gối liên tục không áp lực tạ, phục hồi dây chằng gối.', steps: ['Dùng xe đạp tập trong nhà hoặc đạp ngoài trời.', 'Chỉnh lực cản cực kỳ nhẹ.', 'Đạp chậm rãi (khoảng 60 vòng/phút) để khớp gối vận động bài tiết dịch khớp.'] },
    { id: 'r11', cat: 'recovery', title: 'Thở cơ hoành (Box Breathing)', duration: '5 Phút', intensity: 'Thư giãn', desc: 'Kỹ thuật thở 4-4-4-4 giảm stress hệ thần kinh trung ương sau đấu giải.', steps: ['Nằm ngửa ở nơi yên tĩnh, nhắm mắt.', 'Hít vào bằng mũi 4 giây bụng phình ra.', 'Nín thở 4 giây. Thở ra bằng miệng 4 giây xẹp bụng. Nín thở 4 giây. Lặp lại.'] },
    { id: 'r12', cat: 'recovery', title: 'Kê cao chân lên tường', duration: '10 Phút', intensity: 'Thư giãn', desc: 'Nằm ngửa, gác hai chân vuông góc lên tường. Giúp máu rút về tim, giảm sưng phù.', steps: ['Tìm một mảng tường trống.', 'Nằm ngửa sát tường, đưa gác hai chân thẳng đứng lên tường.', 'Dang hai tay thoải mái, nhắm mắt nghỉ ngơi 10-15 phút.'] },
    { id: 'r13', cat: 'recovery', title: 'Yoga phục hồi (Yin Yoga)', duration: '30 Phút', intensity: 'Thư giãn', desc: 'Giữ các tư thế kéo giãn lâu (3-5 phút) để tác động sâu vào mạc cơ.', steps: ['Trải thảm Yoga, bật nhạc thiền.', 'Thực hiện tư thế gập người hoặc xoạc ngang.', 'Giữ tĩnh tư thế đó từ 3-5 phút thay vì 30 giây như giãn cơ thông thường.'] },
    { id: 'r14', cat: 'recovery', title: 'Xoa bóp tay cầm vợt', duration: '5 Phút', intensity: 'Nhẹ', desc: 'Tự dùng tay kia vuốt cẳng tay và nắn bóp lòng bàn tay, ngón tay.', steps: ['Dùng ngón cái của tay không thuận ấn miết dọc cẳng tay thuận.', 'Day ấn vào các hõm giữa các ngón tay.', 'Kéo giãn từng ngón tay để giảm chứng cứng ngón (trigger finger).'] },
    { id: 'r15', cat: 'recovery', title: 'Ngâm bồn nước nóng muối Epsom', duration: '20 Phút', intensity: 'Thư giãn', desc: 'Muối Magie (Epsom) ngấm qua da giúp cơ bắp thư giãn sâu cực kỳ hiệu quả.', steps: ['Xả nước nóng (đủ chịu đựng) vào bồn tắm.', 'Đổ 1-2 bát muối Epsom vào hòa tan.', 'Ngâm mình 20 phút. Magie sulfat sẽ ngấm qua da giúp nới lỏng cơ gân căng cứng.'] },
];

export default function SupplementaryPage() {
    const [activeTab, setActiveTab] = useState('warmup');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const currentExercises = EXERCISES.filter(ex => ex.cat === activeTab);

    // Khi chuyển tab thì đóng cái đang mở
    const handleTabChange = (id: string) => {
        setActiveTab(id);
        setExpandedId(null);
    }

    return (
        <div className="w-full h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar bg-background relative font-sans text-muted-foreground">
            
            {/* Animated Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] dark:mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px] dark:mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[100px] dark:mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>

            <div className="max-w-[1400px] mx-auto p-6 md:p-10 pb-24 space-y-12 relative z-10">

                {/* Header Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-[2.5rem] p-8 md:p-12 bg-card border border-border backdrop-blur-2xl overflow-hidden shadow-2xl group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-emerald-500/20 blur-[100px] rounded-full group-hover:bg-emerald-500/30 transition-colors duration-700"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-glow-lg">
                                    <HeartPulse className="w-7 h-7 text-emerald-400" />
                                </div>
                                <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-black uppercase tracking-widest text-emerald-400">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>Giáo án Thể lực & Phục hồi
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight mb-6">
                                Cỗ Máy <br className="hidden md:block"/> Không Phổi
                            </h1>
                            <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-2xl">
                                Kỹ thuật tốt là chưa đủ. Hệ thống gồm 60 bài tập chuyên sâu từ Khởi động đến Phục hồi dưới đây sẽ giúp bạn duy trì phong độ và tránh chấn thương.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Danh mục Tabs */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap md:flex-nowrap gap-4"
                >
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleTabChange(cat.id)}
                            className={`flex-1 min-w-[150px] p-5 rounded-[2rem] border backdrop-blur-xl transition-all duration-300 flex flex-col items-center justify-center gap-3 group ${
                                activeTab === cat.id
                                ? `bg-card ${cat.activeBorder} ${cat.activeShadow}`
                                : `bg-card border-border text-muted-foreground hover:bg-muted hover:border-border`
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${activeTab === cat.id ? `${cat.activeBg} ${cat.color} scale-110` : 'bg-card text-muted-foreground group-hover:scale-110 group-hover:text-foreground'}`}>
                                {cat.icon}
                            </div>
                            <span className={`text-sm font-black uppercase tracking-widest ${activeTab === cat.id ? cat.color : 'text-muted-foreground group-hover:text-foreground'}`}>
                                {cat.label}
                            </span>
                        </button>
                    ))}
                </motion.div>

                {/* Danh sách bài tập theo Tab */}
                <div className="mt-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <h2 className="text-2xl font-black text-foreground flex items-center gap-3 uppercase tracking-wider">
                            <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
                                {CATEGORIES.find(c => c.id === activeTab)?.icon}
                            </div>
                            Danh sách bài tập ({currentExercises.length} bài)
                        </h2>
                        <span className="text-sm font-medium text-muted-foreground px-4 py-2 bg-card rounded-full backdrop-blur-md border border-border">💡 Bấm vào từng bài tập để xem chi tiết</span>
                    </div>

                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {currentExercises.map((workout, idx) => {
                            const isExpanded = expandedId === workout.id;

                            return (
                                <div key={idx} className={`rounded-[2rem] bg-card border backdrop-blur-xl transition-all duration-500 overflow-hidden ${isExpanded ? 'border-emerald-500/50 shadow-glow' : 'border-border hover:border-border hover:bg-muted'}`}>
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                                        className="w-full text-left p-6 md:p-8 flex flex-col gap-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-4xl font-black text-foreground/10 italic">{String(idx + 1).padStart(2, '0')}</span>
                                                <h3 className={`text-xl font-black transition-colors ${isExpanded ? 'text-emerald-400' : 'text-foreground'}`}>
                                                    {workout.title}
                                                </h3>
                                            </div>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-card text-muted-foreground'}`}>
                                                <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>

                                        <p className="text-base font-medium text-muted-foreground leading-relaxed">
                                            {workout.desc}
                                        </p>

                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-card px-4 py-2 rounded-xl border border-border backdrop-blur-md">
                                                <Timer className="w-4 h-4 text-emerald-400" /> {workout.duration}
                                            </span>
                                            <span className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border backdrop-blur-md ${
                                                workout.intensity.includes('Cao') ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                workout.intensity.includes('Vừa') ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                workout.intensity.includes('Nhẹ') ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            }`}>
                                                <Activity className="w-4 h-4" /> Cường độ: {workout.intensity}
                                            </span>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-card"
                                            >
                                                <div className="p-6 md:p-8 border-t border-border relative overflow-hidden">
                                                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/10 blur-[50px] rounded-full"></div>
                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                                                <PlayCircle className="w-4 h-4 text-emerald-400" />
                                                            </div>
                                                            <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Cách Thực Hiện</h4>
                                                        </div>
                                                        <ul className="space-y-4">
                                                            {workout.steps.map((step, i) => (
                                                                <li key={i} className="flex items-start gap-4">
                                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-card text-muted-foreground text-xs font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                                                                    <span className="text-base text-foreground font-medium leading-relaxed">{step}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}