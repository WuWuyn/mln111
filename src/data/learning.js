export const challengeQuestions = [
  {
    id: 'q1',
    prompt: 'Một người nói: "Bạn A nghèo vì bạn ấy lười." Cách nhìn này đang thiếu điều gì?',
    options: [
      { label: 'Xem xét toàn diện các điều kiện xã hội và cá nhân', value: 'a' },
      { label: 'Chỉ cần xét ý chí cá nhân', value: 'b' },
      { label: 'Chỉ cần xét may mắn', value: 'c' },
      { label: 'Không cần phân tích nguyên nhân', value: 'd' },
    ],
    answer: 'a',
    explain:
      'Một hiện tượng xã hội không nên bị quy về một nguyên nhân đơn lẻ. Tư duy biện chứng đòi hỏi nhìn nhiều mối liên hệ: gia đình, giáo dục, cơ hội, môi trường và nỗ lực cá nhân.',
  },
  {
    id: 'q2',
    prompt:
      'Bạn học 20 phút mỗi ngày trong nhiều tháng, rồi bỗng thấy khả năng phân tích tốt hẳn lên. Quy luật nào được thể hiện rõ nhất?',
    options: [
      { label: 'Mâu thuẫn là động lực phát triển', value: 'a' },
      { label: 'Lượng đổi dẫn đến chất đổi', value: 'b' },
      { label: 'Thực tiễn là tiêu chuẩn chân lý', value: 'c' },
      { label: 'Ý thức tồn tại độc lập tuyệt đối', value: 'd' },
    ],
    answer: 'b',
    explain:
      'Sự tích lũy đều đặn về lượng có thể vượt qua một điểm nút và tạo ra thay đổi về chất: từ chưa biết phân tích đến biết phân tích sắc hơn.',
  },
  {
    id: 'q3',
    prompt:
      'Một nhóm tranh luận gay gắt về cách làm dự án, nhưng nhờ đó tìm ra phương án tốt hơn. Mâu thuẫn ở đây đóng vai trò gì?',
    options: [
      { label: 'Điều phải né tránh bằng mọi giá', value: 'a' },
      { label: 'Động lực thúc đẩy phát triển', value: 'b' },
      { label: 'Dấu hiệu mọi thứ đã kết thúc', value: 'c' },
      { label: 'Yếu tố không liên quan', value: 'd' },
    ],
    answer: 'b',
    explain:
      'Khi được nhận diện và giải quyết hợp lý, mâu thuẫn giữa các phương án đối lập có thể đẩy sự vật tới một trạng thái cao hơn.',
  },
  {
    id: 'q4',
    prompt:
      'Bạn tin học buổi sáng hiệu quả hơn, nhưng thử một tuần thì kết quả lại kém hơn học buổi tối. Theo tinh thần duy vật biện chứng, bạn nên làm gì?',
    options: [
      { label: 'Giữ nguyên niềm tin ban đầu', value: 'a' },
      { label: 'Điều chỉnh theo kết quả thực tiễn', value: 'b' },
      { label: 'Bỏ qua dữ liệu vì cảm giác quan trọng hơn', value: 'c' },
      { label: 'Hỏi số đông rồi làm theo', value: 'd' },
    ],
    answer: 'b',
    explain:
      'Thực tiễn là nơi kiểm nghiệm nhận thức. Khi kết quả thực tế bác bỏ giả định ban đầu, nhận thức cần được điều chỉnh.',
  },
  {
    id: 'q5',
    prompt:
      'Khi chọn ngành học, bạn cân nhắc năng lực, điều kiện tài chính, nhu cầu xã hội và sở thích cá nhân. Đây là cách nhìn nào?',
    options: [
      { label: 'Phiến diện', value: 'a' },
      { label: 'Toàn diện, lịch sử - cụ thể', value: 'b' },
      { label: 'Chủ quan duy ý chí', value: 'c' },
      { label: 'Tách rời mọi mối liên hệ', value: 'd' },
    ],
    answer: 'b',
    explain:
      'Một lựa chọn đúng cần đặt trong mạng lưới điều kiện cụ thể, không chỉ dựa vào một cảm xúc hoặc một dữ kiện riêng lẻ.',
  },
]

export const lifeCards = [
  {
    id: 'deadline',
    icon: '01',
    title: 'Chạy deadline',
    lens: 'Lượng - chất',
    insight:
      'Tích lũy đều từng ngày giúp tránh cú bùng nổ hỗn loạn vào phút cuối. Một thay đổi nhỏ lặp lại đủ lâu có thể tạo ra chất lượng làm việc mới.',
  },
  {
    id: 'teamwork',
    icon: '02',
    title: 'Tranh luận trong nhóm',
    lens: 'Mâu thuẫn',
    insight:
      'Bất đồng không nhất thiết là tiêu cực. Nếu được xử lý đúng, nó làm lộ ra điểm yếu của phương án cũ và mở đường cho cách làm tốt hơn.',
  },
  {
    id: 'learning',
    icon: '03',
    title: 'Học bằng AI',
    lens: 'Ý thức - thực tiễn',
    insight:
      'AI có thể mở rộng khả năng nhận thức, nhưng tri thức chỉ thực sự thuộc về bạn khi được kiểm nghiệm qua bài làm, tranh luận và ứng dụng.',
  },
  {
    id: 'social',
    icon: '04',
    title: 'Áp lực mạng xã hội',
    lens: 'Hiện tượng - bản chất',
    insight:
      'Hình ảnh hoàn hảo trên mạng thường chỉ là lớp hiện tượng. Tư duy triết học giúp bạn nhìn sâu hơn vào điều kiện, động cơ và giới hạn phía sau.',
  },
  {
    id: 'choice',
    icon: '05',
    title: 'Ra quyết định',
    lens: 'Mối liên hệ',
    insight:
      'Một quyết định hiếm khi đứng một mình. Nó kéo theo thời gian, nguồn lực, quan hệ, mục tiêu và những hệ quả chưa xuất hiện ngay trước mắt.',
  },
]

export const badgeTiers = [
  {
    id: 'master',
    title: 'Nhà du hành biện chứng',
    emblem: '✦',
    min: 90,
    blurb:
      'Bạn đã đi qua bản đồ khái niệm, thử nghiệm quy luật và biết đưa triết học trở lại đời sống cụ thể.',
  },
  {
    id: 'praxis',
    title: 'Người kiểm nghiệm thực tiễn',
    emblem: '◆',
    min: 70,
    blurb:
      'Bạn hiểu rằng nhận thức không dừng ở ý nghĩ. Nó cần được thử, sửa và chứng minh trong hoạt động thực tế.',
  },
  {
    id: 'dialectic',
    title: 'Người giải mã vận động',
    emblem: '◇',
    min: 45,
    blurb:
      'Bạn đã bắt đầu nhìn thế giới như một quá trình: có liên hệ, có mâu thuẫn và luôn biến đổi.',
  },
  {
    id: 'novice',
    title: 'Nhà du hành nhập môn',
    emblem: '·',
    min: 0,
    blurb:
      'Hành trình mới mở ra. Hãy tiếp tục khám phá các hành tinh, làm thực nghiệm và thử vận dụng vào đời sống.',
  },
]

export function resolveBadge(score) {
  return badgeTiers.find((tier) => score >= tier.min) ?? badgeTiers[badgeTiers.length - 1]
}
