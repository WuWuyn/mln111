// Content for the three "soft" pages of the journey: the dialectical-navigator
// challenge (situational quiz), the "philosophy in daily life" cards, and the
// closing badge tiers. Kept data-only so the overlays stay presentational.

// "Thử thách Nhà du hành Biện chứng" — situational questions, no dry theory.
export const challengeQuestions = [
  {
    id: 'q1',
    prompt: 'Một người nói: "Bạn A nghèo vì bạn ấy lười." Đây là cách nhìn nào?',
    options: [
      { label: 'Biện chứng', value: 'a' },
      { label: 'Toàn diện', value: 'b' },
      { label: 'Phiến diện / siêu hình', value: 'c' },
      { label: 'Lịch sử – cụ thể', value: 'd' },
    ],
    answer: 'c',
    explain:
      'Cách nhìn này phiến diện vì chỉ quy nguyên nhân vào một yếu tố cá nhân, không xét đến hoàn cảnh gia đình, giáo dục, môi trường xã hội, cơ hội việc làm…',
  },
  {
    id: 'q2',
    prompt:
      'Bạn học 20 phút mỗi ngày, nhiều tháng sau bỗng thấy mình phân tích vấn đề sắc bén hẳn lên. Quy luật nào được thể hiện?',
    options: [
      { label: 'Phủ định của phủ định', value: 'a' },
      { label: 'Lượng đổi dẫn đến chất đổi', value: 'b' },
      { label: 'Mối liên hệ phổ biến', value: 'c' },
      { label: 'Vật chất quyết định ý thức', value: 'd' },
    ],
    answer: 'b',
    explain:
      'Sự tích lũy đều đặn về lượng (số giờ học) vượt qua điểm nút và tạo nên bước nhảy về chất: từ "chưa biết phân tích" thành "biết phân tích".',
  },
  {
    id: 'q3',
    prompt:
      'Cả nhóm tranh luận gay gắt về cách làm dự án, nhưng nhờ đó tìm ra phương án tốt hơn. Mâu thuẫn ở đây đóng vai trò gì?',
    options: [
      { label: 'Điều cần tránh bằng mọi giá', value: 'a' },
      { label: 'Dấu hiệu nhóm sắp tan rã', value: 'b' },
      { label: 'Động lực thúc đẩy phát triển', value: 'c' },
      { label: 'Không có ý nghĩa gì', value: 'd' },
    ],
    answer: 'c',
    explain:
      'Mâu thuẫn được giải quyết hợp lý chính là động lực của phát triển: đấu tranh giữa các phương án đối lập dẫn tới một giải pháp mới, cao hơn.',
  },
  {
    id: 'q4',
    prompt:
      'Bạn tin học buổi sáng hiệu quả hơn, nhưng thử một tuần thì kết quả lại kém hơn học buổi tối. Bạn nên làm gì theo tinh thần duy vật biện chứng?',
    options: [
      { label: 'Giữ nguyên niềm tin ban đầu', value: 'a' },
      { label: 'Điều chỉnh theo kết quả thực tiễn', value: 'b' },
      { label: 'Bỏ học luôn cho khỏe', value: 'c' },
      { label: 'Hỏi xem bạn bè tin điều gì', value: 'd' },
    ],
    answer: 'b',
    explain:
      'Thực tiễn là tiêu chuẩn của chân lý. Khi kết quả thực tế bác bỏ giả thuyết, nhận thức phải được điều chỉnh lại cho phù hợp.',
  },
  {
    id: 'q5',
    prompt:
      'Khi đánh giá một bạn cùng lớp, bạn xét cả năng lực, hoàn cảnh gia đình, môi trường và quá trình cố gắng của bạn ấy. Đó là quan điểm nào?',
    options: [
      { label: 'Phiến diện', value: 'a' },
      { label: 'Toàn diện và lịch sử – cụ thể', value: 'b' },
      { label: 'Siêu hình', value: 'c' },
      { label: 'Chủ quan duy ý chí', value: 'd' },
    ],
    answer: 'b',
    explain:
      'Xem xét nhiều mặt, nhiều mối liên hệ và đặt trong điều kiện, hoàn cảnh cụ thể chính là quan điểm toàn diện và lịch sử – cụ thể.',
  },
  {
    id: 'q6',
    prompt:
      'Một người khẳng định: "Cái mới luôn ra đời hoàn hảo, không cần gì từ cái cũ." Nhận định này sai ở đâu?',
    options: [
      { label: 'Đúng hoàn toàn', value: 'a' },
      { label: 'Sai, vì phủ định biện chứng có tính kế thừa', value: 'b' },
      { label: 'Sai, vì cái mới không bao giờ tồn tại', value: 'c' },
      { label: 'Đúng, vì cái cũ luôn vô dụng', value: 'd' },
    ],
    answer: 'b',
    explain:
      'Phủ định biện chứng mang tính kế thừa: cái mới ra đời trên cơ sở giữ lại và cải tạo những yếu tố hợp lý của cái cũ, chứ không phủ định sạch trơn.',
  },
  {
    id: 'q7',
    prompt:
      '"Tôi muốn giỏi tiếng Anh nhưng chỉ cần ước là được, không cần luyện tập." Sai lầm triết học ở đây là gì?',
    options: [
      { label: 'Tuyệt đối hóa vai trò của ý thức, bỏ qua hoạt động vật chất', value: 'a' },
      { label: 'Quá coi trọng vật chất', value: 'b' },
      { label: 'Nhìn sự vật quá toàn diện', value: 'c' },
      { label: 'Không có sai lầm nào', value: 'd' },
    ],
    answer: 'a',
    explain:
      'Đây là bệnh chủ quan, duy ý chí: ý thức (mong muốn) chỉ trở thành hiện thực thông qua hoạt động vật chất – thực tiễn cụ thể như luyện tập, học tập.',
  },
]

// "Triết học trong đời sống" — relatable situations mapped to a principle.
export const lifeCards = [
  {
    id: 'deadline',
    icon: '⏳',
    title: 'Chạy deadline',
    lens: 'Lượng – chất & thực tiễn',
    insight:
      'Việc tích lũy đều mỗi ngày (lượng) giúp tránh "bước nhảy" hoảng loạn phút chót. Và chỉ khi bắt tay làm thật (thực tiễn) bạn mới biết kế hoạch có ổn không.',
  },
  {
    id: 'teamwork',
    icon: '🤝',
    title: 'Cãi nhau trong nhóm',
    lens: 'Mâu thuẫn là động lực',
    insight:
      'Bất đồng không phải dấu hiệu xấu. Nếu biết giải quyết, mâu thuẫn giữa các quan điểm đối lập sẽ đẩy nhóm tới giải pháp tốt hơn cái ban đầu.',
  },
  {
    id: 'major',
    icon: '🎓',
    title: 'Chọn ngành học',
    lens: 'Khách quan & chủ quan',
    insight:
      'Cân nhắc điều kiện khách quan (nhu cầu xã hội, năng lực tài chính) cùng với năng lực và sở thích chủ quan, thay vì chỉ chạy theo cảm tính nhất thời.',
  },
  {
    id: 'friends',
    icon: '💬',
    title: 'Mâu thuẫn với bạn bè',
    lens: 'Toàn diện, không phiến diện',
    insight:
      'Trước khi kết luận, hãy xét nhiều mối liên hệ: hoàn cảnh của bạn ấy, cách hiểu của mỗi bên, bối cảnh xảy ra chuyện — tránh quy chụp một chiều.',
  },
  {
    id: 'social',
    icon: '📱',
    title: 'Áp lực mạng xã hội',
    lens: 'Hiện tượng & bản chất',
    insight:
      'Hình ảnh "hoàn hảo" trên mạng chỉ là hiện tượng bề ngoài. Tư duy biện chứng nhắc ta nhìn xuyên qua vẻ ngoài để thấy bản chất, tránh so sánh lệch lạc.',
  },
  {
    id: 'ai',
    icon: '🤖',
    title: 'Dùng AI học tập',
    lens: 'Ý thức – công cụ – thực tiễn',
    insight:
      'AI là công cụ mở rộng năng lực nhận thức, nhưng tri thức chỉ thực sự là của bạn khi được kiểm nghiệm qua thực tiễn và đi kèm trách nhiệm cá nhân.',
  },
  {
    id: 'spending',
    icon: '🛍️',
    title: 'Tiêu dùng & lối sống',
    lens: 'Lượng – chất & nhu cầu thật',
    insight:
      'Những khoản chi nhỏ tích lũy lại tạo ra thay đổi lớn về tài chính. Phân biệt nhu cầu thật và ham muốn nhất thời là một lựa chọn có tính biện chứng.',
  },
]

// Closing badge tiers — rank scales with how much of the journey was completed
// (planets visited + challenge score). Ordered from highest to lowest so the
// first matching `min` threshold wins.
export const badgeTiers = [
  {
    id: 'master',
    title: 'Tư duy biện chứng cấp cao',
    emblem: '🌌',
    min: 90,
    blurb:
      'Bạn không chỉ thuộc khái niệm — bạn đã nhìn thế giới qua lăng kính biện chứng: toàn diện, vận động và gắn với thực tiễn.',
  },
  {
    id: 'quantity',
    title: 'Bậc thầy Lượng – Chất',
    emblem: '⚡',
    min: 70,
    blurb:
      'Bạn hiểu rõ sự tích lũy tạo nên bước nhảy. Hành trình tích lũy tri thức của bạn đã chạm tới một chất mới.',
  },
  {
    id: 'contradiction',
    title: 'Người giải mã Mâu thuẫn',
    emblem: '🔥',
    min: 45,
    blurb:
      'Bạn đã nắm được động lực bên trong của phát triển. Hãy tiếp tục khám phá các hành tinh còn lại để hoàn thiện bản đồ.',
  },
  {
    id: 'novice',
    title: 'Nhà du hành nhập môn',
    emblem: '🚀',
    min: 0,
    blurb:
      'Chuyến du hành mới bắt đầu. Hãy ghé thăm thêm các hành tinh và chinh phục thử thách để nâng cấp huy hiệu của bạn.',
  },
]

// Maps a 0–100 score to the highest tier whose threshold it meets.
export function resolveBadge(score) {
  return badgeTiers.find((tier) => score >= tier.min) ?? badgeTiers[badgeTiers.length - 1]
}
