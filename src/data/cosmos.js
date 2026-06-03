export const planetPalette = {
  cyan: ['#b9f7ff', '#21b8ff', '#123c76'],
  gold: ['#fff4b8', '#f7b84d', '#8d5529'],
  violet: ['#ead9ff', '#9f62ff', '#2a1974'],
  emerald: ['#d5ffe9', '#45d88f', '#125b5e'],
  red: ['#ffd0c4', '#ff715d', '#7a1a36'],
  blue: ['#d2f3ff', '#668cff', '#25337a'],
  rose: ['#ffe1ee', '#ff78ad', '#6b1b60'],
  silver: ['#ffffff', '#a9c0dc', '#3d4e70'],
}

export const planets = [
  {
    id: 'vat-chat',
    name: 'Vật chất',
    type: 'Hành tinh nền tảng',
    concept: 'Thực tại khách quan',
    signal: 'Vật chất',
    chapter: 'Chương 2 - Vật chất và ý thức',
    distance: 7.2,
    size: 0.86,
    orbitSpeed: 0.1,
    rotationSpeed: 0.78,
    axialTilt: 0.12,
    phase: 3.7,
    color: 'cyan',
    widget: 'matter',
    summary: 'Nền khách quan của thế giới, tồn tại độc lập với cảm giác và ý thức của con người.',
    definition:
      'Vật chất là phạm trù triết học dùng để chỉ thực tại khách quan được đem lại cho con người trong cảm giác, được cảm giác phản ánh và tồn tại không lệ thuộc vào cảm giác.',
    explanation:
      'Nói ngắn gọn, vật chất là những gì tồn tại bên ngoài ý muốn chủ quan của ta. Con người có thể nhận thức nó đúng hoặc sai, nhưng nó không biến mất chỉ vì ta không tin vào nó.',
    example:
      'Bạn có tin hay không thì trọng lực vẫn tác động lên cơ thể. Đây là cách dễ thấy nhất để hiểu tính khách quan của vật chất.',
    details: [
      'Vật chất giúp người học bắt đầu từ hiện thực thay vì cảm tính chủ quan.',
      'Mọi hiện tượng tự nhiên và xã hội cần được xem xét từ điều kiện vật chất cụ thể.',
      'Đây là nền để hiểu quan hệ giữa thế giới khách quan và tư duy con người.',
    ],
    miniQuiz: {
      question: 'Đặc trưng cơ bản nhất của vật chất theo triết học Mác - Lênin là gì?',
      options: [
        'Chỉ gồm những vật có thể nhìn thấy bằng mắt',
        'Là thực tại khách quan, tồn tại độc lập với ý thức',
        'Do con người tưởng tượng và quy ước ra',
        'Chỉ gồm các vật thể rắn có khối lượng',
      ],
      answer: 1,
      explain:
        'Điểm cốt lõi là tính thực tại khách quan. Không phải mọi dạng vật chất đều dễ nhìn hoặc dễ chạm, nhưng chúng tồn tại độc lập với ý thức.',
    },
  },
  {
    id: 'y-thuc',
    name: 'Ý thức',
    type: 'Hành tinh phản ánh',
    concept: 'Hình ảnh chủ quan của thế giới khách quan',
    signal: 'Ý thức',
    chapter: 'Chương 2 - Vật chất và ý thức',
    distance: 9.6,
    size: 0.78,
    orbitSpeed: 0.081,
    rotationSpeed: 0.68,
    axialTilt: 0.24,
    phase: 5.65,
    color: 'gold',
    widget: 'consciousness',
    summary: 'Sự phản ánh năng động, sáng tạo của thế giới vật chất trong bộ óc con người.',
    definition:
      'Ý thức là sự phản ánh thế giới khách quan vào bộ óc con người, đồng thời có khả năng định hướng hoạt động thực tiễn để tác động trở lại hiện thực.',
    explanation:
      'Ý thức không đứng ngoài vật chất. Nó sinh ra trên nền đời sống vật chất, nhưng khi trở thành mục tiêu, kế hoạch và ý chí, nó có thể quay lại cải biến hiện thực thông qua hành động.',
    example:
      'Một sinh viên muốn đạt điểm cao. Mong muốn đó thuộc về ý thức, nhưng muốn thành kết quả thật thì phải học, luyện tập và làm bài.',
    details: [
      'Ý thức phản ánh hiện thực nhưng không sao chép máy móc hiện thực.',
      'Ngôn ngữ, lao động và đời sống xã hội là điều kiện quan trọng hình thành ý thức.',
      'Hiểu ý thức giúp thấy vai trò của tư duy, mục tiêu và hành động trong thực tiễn.',
    ],
    miniQuiz: {
      question: 'Theo chủ nghĩa duy vật biện chứng, quan hệ vật chất và ý thức là gì?',
      options: [
        'Ý thức có trước và sinh ra vật chất',
        'Vật chất quyết định ý thức, ý thức tác động trở lại qua thực tiễn',
        'Vật chất và ý thức hoàn toàn không liên quan',
        'Ý thức quyết định hoàn toàn vật chất',
      ],
      answer: 1,
      explain:
        'Vật chất có trước và quyết định ý thức, nhưng ý thức có tính năng động và tác động trở lại hiện thực thông qua hoạt động thực tiễn.',
    },
  },
  {
    id: 'lien-he-phat-trien',
    name: 'Mối liên hệ & Phát triển',
    type: 'Cụm hành tinh mạng lưới',
    concept: 'Toàn diện và vận động',
    signal: 'Liên hệ',
    chapter: 'Chương 2 - Hai nguyên lý của phép biện chứng',
    distance: 12.6,
    size: 0.92,
    orbitSpeed: 0.06,
    rotationSpeed: 0.62,
    axialTilt: 0.22,
    phase: 4.43,
    color: 'violet',
    widget: 'relation',
    summary: 'Mọi sự vật tồn tại trong liên hệ, vận động và biến đổi, không đứng yên như một mảnh rời.',
    definition:
      'Nguyên lý về mối liên hệ phổ biến khẳng định các sự vật luôn ràng buộc và tác động qua lại. Nguyên lý phát triển nhấn mạnh thế giới luôn vận động theo hướng xuất hiện cái mới.',
    explanation:
      'Muốn hiểu một hiện tượng, cần đặt nó vào mạng lưới điều kiện, quan hệ và lịch sử vận động. Không chỉ hỏi nó là gì, mà còn hỏi nó liên hệ với gì và đang biến đổi ra sao.',
    example:
      'Kết quả học tập không chỉ do chăm hay lười. Nó liên hệ với phương pháp, sức khỏe, môi trường, thời gian, động lực và cách phản hồi sau mỗi lần học.',
    details: [
      'Tư duy toàn diện giúp tránh nhìn một chiều.',
      'Tư duy phát triển giúp thấy sự vật trong quá trình, không đóng băng ở một thời điểm.',
      'Hai nguyên lý này tạo nền cho cách học triết bằng mạng lưới và chuyển động.',
    ],
    miniQuiz: {
      question: 'Bài học phương pháp luận từ mối liên hệ và phát triển là gì?',
      options: [
        'Chỉ xét một nguyên nhân duy nhất',
        'Nhìn sự vật toàn diện, lịch sử và cụ thể',
        'Tách sự vật khỏi hoàn cảnh để dễ nhớ',
        'Chỉ quan tâm trạng thái hiện tại',
      ],
      answer: 1,
      explain:
        'Vì sự vật nằm trong mạng lưới liên hệ và luôn vận động, cần xem xét nó toàn diện, lịch sử và trong điều kiện cụ thể.',
    },
  },
  {
    id: 'mau-thuan-luong-chat',
    name: 'Mâu thuẫn & Lượng - Chất',
    type: 'Hành tinh biến đổi',
    concept: 'Động lực và điểm nút',
    signal: 'Biến đổi',
    chapter: 'Chương 2 - Các quy luật cơ bản',
    distance: 15.8,
    size: 0.9,
    orbitSpeed: 0.045,
    rotationSpeed: 0.76,
    axialTilt: 0.34,
    phase: 2.72,
    color: 'red',
    widget: 'contradiction',
    summary: 'Sự vật biến đổi do mâu thuẫn bên trong và bước nhảy khi lượng tích lũy đủ để đổi chất.',
    definition:
      'Mâu thuẫn là sự thống nhất và đấu tranh giữa các mặt đối lập. Quy luật lượng - chất cho thấy thay đổi nhỏ tích lũy đến điểm nút sẽ tạo bước nhảy về chất.',
    explanation:
      'Một sự vật không đổi chỉ vì bên ngoài tác động. Bên trong nó có các mặt đối lập kéo đẩy nhau. Khi biến đổi tích lũy đủ, trạng thái cũ không giữ được nữa và chất mới xuất hiện.',
    example:
      'Học mỗi ngày 20 phút có vẻ nhỏ, nhưng sau nhiều tuần lượng kiến thức tích lũy có thể tạo ra bước nhảy: từ không hiểu sang biết phân tích vấn đề.',
    details: [
      'Mâu thuẫn cho thấy nguồn gốc bên trong của vận động.',
      'Lượng - chất giải thích vì sao tích lũy nhỏ có thể tạo chuyển biến lớn.',
      'Cụm này nên được trải nghiệm bằng animation căng kéo, ngưỡng và bùng nổ.',
    ],
    miniQuiz: {
      question: 'Khi lượng tích lũy vượt điểm nút thì điều gì xảy ra?',
      options: [
        'Sự vật giữ nguyên mãi chất cũ',
        'Xảy ra bước nhảy và chất mới ra đời',
        'Mâu thuẫn biến mất hoàn toàn',
        'Không có thay đổi nào đáng kể',
      ],
      answer: 1,
      explain:
        'Trong giới hạn độ, lượng thay đổi nhưng chất chưa đổi. Khi vượt điểm nút, bước nhảy xảy ra và chất mới hình thành.',
    },
  },
  {
    id: 'thuc-tien',
    name: 'Trạm Thực tiễn',
    type: 'Trạm kiểm nghiệm',
    concept: 'Kiểm nghiệm chân lý',
    signal: 'Thực tiễn',
    chapter: 'Chương 2 - Lý luận nhận thức',
    distance: 18.4,
    size: 0.82,
    orbitSpeed: 0.034,
    rotationSpeed: 0.58,
    axialTilt: 0.15,
    phase: 0.96,
    color: 'silver',
    widget: 'praxis',
    summary: 'Nơi tri thức quay về đời sống để được kiểm nghiệm, điều chỉnh và phát triển.',
    definition:
      'Thực tiễn là toàn bộ hoạt động vật chất có tính lịch sử - xã hội của con người nhằm cải tạo tự nhiên và xã hội. Thực tiễn là cơ sở, động lực, mục đích và tiêu chuẩn của chân lý.',
    explanation:
      'Nhận thức không dừng ở suy nghĩ. Con đường đầy đủ là quan sát hiện thực, khái quát bằng tư duy, rồi quay lại thực tiễn để kiểm nghiệm và điều chỉnh.',
    example:
      'Bạn tin học nhóm hiệu quả hơn học một mình. Niềm tin đó cần được thử bằng vài tuần học nhóm, đo kết quả và điều chỉnh phương pháp.',
    details: [
      'Thực tiễn nối bản đồ khái niệm với tình huống đời sống.',
      'Một nhận thức đúng cần được kiểm chứng trong hoạt động thực tế.',
      'Trạm này là điểm cuối của hành trình: hiểu để hành động tốt hơn.',
    ],
    miniQuiz: {
      question: 'Theo triết học Mác - Lênin, tiêu chuẩn kiểm tra chân lý là gì?',
      options: ['Ý kiến số đông', 'Suy luận hợp lý thuần túy', 'Thực tiễn', 'Uy tín của người nói'],
      answer: 2,
      explain:
        'Thực tiễn là tiêu chuẩn của chân lý vì nhận thức chỉ được xác nhận khi đi vào hoạt động thực tế và cho thấy kết quả.',
    },
  },
]
