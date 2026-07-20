'use strict';
const contents = [
  ['Bạn không cần vội. Một ngụm cà phê, một hơi thở sâu, rồi mọi chuyện sẽ dần vào đúng chỗ.','Chữa lành'],
  ['Hôm nay là một trang mới, và bạn hoàn toàn có thể viết lên đó điều thật dịu dàng.','Ngày mới'],
  ['Có những ngày chỉ cần bạn vẫn tiếp tục, như vậy đã là rất đáng tự hào rồi.','Động lực'],
  ['Mong ly nước này mang đến cho bạn một khoảng nghỉ nhỏ nhưng thật bình yên.','Cà phê'],
  ['Bạn xứng đáng được yêu thương, kể cả trong những ngày chưa hoàn hảo.','Yêu bản thân'],
  ['Chậm lại một chút không phải là tụt lại; đôi khi đó là cách mình đi xa hơn.','Chữa lành'],
  ['Chuyện tốt có thể đến muộn một chút, nhưng niềm hy vọng thì luôn có thể bắt đầu ngay bây giờ.','Tích cực'],
  ['Một nụ cười nhỏ hôm nay cũng có thể trở thành ký ức đẹp của ngày mai.','Vui vẻ'],
  ['Cứ làm điều tử tế, uống món mình thích và để ngày hôm nay nhẹ nhàng trôi qua.','Cà phê'],
  ['Bạn đang làm tốt hơn những gì bạn vẫn thường nghĩ về mình đấy.','Động lực'],
  ['Không sao nếu hôm nay bạn chỉ đủ sức chăm sóc chính mình. Như thế cũng rất quan trọng.','Yêu bản thân'],
  ['Mỗi buổi sáng đều là một lời mời bắt đầu lại theo cách mình mong muốn.','Ngày mới'],
  ['Hãy giữ lại một chút dịu dàng cho bản thân sau một ngày đã cố gắng nhiều.','Chữa lành'],
  ['Điều đẹp nhất đôi khi chỉ là một cuộc gặp, một ly ngon và một chiều thong thả.','Cà phê'],
  ['Mọi hành trình lớn đều bắt đầu bằng một bước nhỏ đủ chân thành.','Động lực'],
  ['Bạn không phải trở thành ai khác để xứng đáng với những điều tốt đẹp.','Yêu bản thân'],
  ['Nếu ngày hôm nay hơi nhạt, mình thêm chút ngọt và thử lại nhé.','Vui vẻ'],
  ['Bình yên không ở đâu xa, đôi khi đang nằm trong vài phút bạn dành riêng cho mình.','Chữa lành'],
  ['Chúc bạn gặp được người dễ thương, chuyện dễ chịu và một món uống thật vừa ý.','Tích cực'],
  ['Cảm ơn bạn đã ghé. Mong hôm nay sẽ đối xử với bạn thật nhẹ nhàng.','Cà phê'],
];
module.exports = { async up(q) { const now = new Date(); await q.bulkInsert('quotes', contents.map(([content,topic]) => ({ content, topic, scan_count: 0, is_active: true, created_at: now, updated_at: now }))); }, async down(q) { await q.bulkDelete('quotes', null, {}); } };
