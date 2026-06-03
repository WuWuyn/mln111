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

// Each planet carries both its 3D orbital parameters (distance/size/orbitSpeed…)
// and the learning content shown in the 2D detail overlay: a short definition,
// a plain-language explanation, a real-life example, an interactive `widget`
// key, and a one-question mini-quiz to confirm understanding.
export const planets = [
  {
    id: 'vat-chat',
    name: 'Vật chất',
    type: 'Hành tinh nền tảng',
    concept: 'Cơ sở khách quan',
    signal: 'Ontology',
    chapter: 'Chương 2 · Mục I — Vật chất và ý thức',
    distance: 6.5,
    size: 0.74,
    orbitSpeed: 0.12,
    rotationSpeed: 0.8,
    axialTilt: 0.12,
    phase: 3.7,
    color: 'cyan',
    widget: 'matter',
    summary: 'Phạm trù nền tảng để hiểu thế giới khách quan tồn tại độc lập với ý thức.',
    definition:
      'Vật chất là một phạm trù triết học dùng để chỉ thực tại khách quan được đem lại cho con người trong cảm giác, được cảm giác của chúng ta chép lại, chụp lại, phản ánh và tồn tại không lệ thuộc vào cảm giác.',
    explanation:
      'Nói gọn: vật chất là tất cả những gì tồn tại thật bên ngoài đầu óc ta, dù ta có nghĩ tới nó hay không. Bàn ghế, cơ thể, xã hội, các quy luật tự nhiên… đều là vật chất. Con người nhận biết nó qua cảm giác, nhưng nó không sinh ra từ cảm giác.',
    example:
      'Bạn không tin có trọng lực thì trọng lực vẫn tồn tại và vẫn kéo bạn xuống đất. Hiện thực vật chất không thay đổi theo việc ta thừa nhận hay phủ nhận nó.',
    details: [
      'Vật chất là thực tại khách quan, được con người phản ánh thông qua cảm giác và nhận thức.',
      'Nắm được vật chất giúp người học tránh nhìn thế giới bằng cảm tính thuần túy hoặc chủ quan.',
      'Mọi hiện tượng xã hội và tự nhiên đều cần được xem xét từ điều kiện vật chất cụ thể.',
    ],
    miniQuiz: {
      question: 'Đặc trưng cơ bản nhất của vật chất theo định nghĩa của Lênin là gì?',
      options: [
        'Có thể nhìn thấy và sờ được bằng tay',
        'Là thực tại khách quan, tồn tại độc lập với ý thức',
        'Do con người tưởng tượng và quy ước ra',
        'Chỉ gồm các vật rắn có khối lượng',
      ],
      answer: 1,
      explain:
        'Thuộc tính chung nhất của vật chất là "thực tại khách quan tồn tại độc lập với ý thức". Không phải mọi vật chất đều sờ thấy được (ví dụ trường, sóng), nên các đáp án còn lại đều phiến diện.',
    },
  },
  {
    id: 'y-thuc',
    name: 'Ý thức',
    type: 'Hành tinh phản ánh',
    concept: 'Tư duy năng động',
    signal: 'Mind',
    chapter: 'Chương 2 · Mục I — Vật chất và ý thức',
    distance: 8.4,
    size: 0.66,
    orbitSpeed: 0.095,
    rotationSpeed: 0.7,
    axialTilt: 0.24,
    phase: 5.65,
    color: 'gold',
    widget: 'matter',
    summary: 'Sự phản ánh năng động, sáng tạo của thế giới vật chất trong bộ óc con người.',
    definition:
      'Ý thức là sự phản ánh năng động, sáng tạo thế giới khách quan vào bộ óc con người; là hình ảnh chủ quan của thế giới khách quan. Vật chất có trước, quyết định ý thức; ý thức có tính độc lập tương đối và tác động trở lại vật chất thông qua hoạt động thực tiễn.',
    explanation:
      'Ý thức không phải là một "thứ" tồn tại riêng, mà là cách bộ óc phản ánh hiện thực rồi đặt ra mục tiêu, kế hoạch. Mong muốn, ý chí, tri thức là ý thức — nhưng muốn thành hiện thực, chúng phải thông qua hành động vật chất cụ thể.',
    example:
      'Một sinh viên muốn đạt điểm cao. Mong muốn đó thuộc về ý thức, nhưng muốn biến nó thành kết quả thật thì phải thông qua hoạt động vật chất cụ thể: học tập, ghi chép, luyện tập, làm bài.',
    details: [
      'Ý thức không tách rời vật chất, nhưng có vai trò định hướng hoạt động thực tiễn.',
      'Ngôn ngữ, lao động và đời sống xã hội là những điều kiện quan trọng hình thành ý thức.',
      'Quan hệ vật chất và ý thức giúp giải thích vì sao tư duy đúng cần dựa trên hiện thực.',
    ],
    miniQuiz: {
      question: 'Theo chủ nghĩa duy vật biện chứng, mối quan hệ vật chất – ý thức là?',
      options: [
        'Ý thức có trước và sinh ra vật chất',
        'Vật chất và ý thức tồn tại tách rời, không liên quan',
        'Vật chất quyết định ý thức, ý thức tác động trở lại qua thực tiễn',
        'Ý thức quyết định hoàn toàn vật chất',
      ],
      answer: 2,
      explain:
        'Vật chất có trước, quyết định ý thức; nhưng ý thức có tính năng động, tác động trở lại vật chất thông qua hoạt động thực tiễn của con người.',
    },
  },
  {
    id: 'moi-lien-he',
    name: 'Mối liên hệ phổ biến',
    type: 'Hành tinh mạng lưới',
    concept: 'Quan hệ toàn diện',
    signal: 'Relation',
    chapter: 'Chương 2 · Mục II — Phép biện chứng duy vật',
    distance: 10.4,
    size: 0.6,
    orbitSpeed: 0.075,
    rotationSpeed: 0.9,
    axialTilt: 0.18,
    phase: 4.43,
    color: 'violet',
    widget: 'relation',
    summary: 'Mọi sự vật, hiện tượng tồn tại trong mạng lưới quan hệ tác động qua lại.',
    definition:
      'Nguyên lý về mối liên hệ phổ biến khẳng định: các sự vật, hiện tượng và quá trình của thế giới không tồn tại biệt lập, tách rời nhau mà tồn tại trong sự liên hệ, ràng buộc, tác động qua lại và chuyển hóa lẫn nhau.',
    explanation:
      'Muốn hiểu đúng một sự vật, phải đặt nó trong mạng lưới quan hệ với những cái khác, chứ không nhìn cô lập, phiến diện. Đây là cơ sở của quan điểm toàn diện: xem xét nhiều mặt, nhiều mối liên hệ rồi rút ra cái cơ bản, chủ yếu.',
    example:
      'Hỏi "Vì sao một sinh viên học kém?" — không thể quy về một nguyên nhân. Phương pháp học, môi trường lớp, tâm lý, thời gian, sức khỏe, động lực, cách giảng dạy… đều liên hệ và cùng tác động.',
    details: [
      'Không có khái niệm nào nên được học như một mảnh rời khỏi hệ thống.',
      'Muốn hiểu một hiện tượng cần xem xét quan hệ của nó với hoàn cảnh, lịch sử và điều kiện xung quanh.',
      'Đây là cơ sở để hình thành tư duy toàn diện trong học tập và nghiên cứu.',
    ],
    miniQuiz: {
      question: 'Bài học phương pháp luận rút ra từ nguyên lý về mối liên hệ phổ biến là?',
      options: [
        'Quan điểm phiến diện, chỉ xét một mặt',
        'Quan điểm toàn diện và lịch sử – cụ thể',
        'Chỉ cần tìm một nguyên nhân duy nhất',
        'Tách rời sự vật khỏi hoàn cảnh để xét',
      ],
      answer: 1,
      explain:
        'Vì mọi sự vật đều liên hệ với nhau nên phải có quan điểm toàn diện (xét nhiều mối liên hệ) và lịch sử – cụ thể (xét trong điều kiện, hoàn cảnh xác định).',
    },
  },
  {
    id: 'su-phat-trien',
    name: 'Sự phát triển',
    type: 'Hành tinh vận động',
    concept: 'Cái mới hình thành',
    signal: 'Motion',
    chapter: 'Chương 2 · Mục II — Phép biện chứng duy vật',
    distance: 12.8,
    size: 0.68,
    orbitSpeed: 0.06,
    rotationSpeed: 0.65,
    axialTilt: 0.3,
    phase: 0.55,
    color: 'emerald',
    widget: 'spiral',
    summary: 'Thế giới luôn vận động theo hướng biến đổi, tạo ra cái mới trong những điều kiện nhất định.',
    definition:
      'Phát triển là quá trình vận động đi lên từ thấp đến cao, từ đơn giản đến phức tạp, từ kém hoàn thiện đến hoàn thiện hơn. Phát triển có tính khách quan, tính phổ biến, tính đa dạng và diễn ra theo đường "xoáy ốc", không phải đường thẳng.',
    explanation:
      'Phát triển không chỉ là tăng về số lượng mà là sự ra đời của cái mới thay thế cái cũ. Khuynh hướng chung là đi lên, nhưng con đường thì quanh co, có những bước lùi tạm thời — như đường xoáy trôn ốc.',
    example:
      'Việc học của bạn không tiến lên theo đường thẳng: có ngày hiểu nhanh, có ngày bế tắc, thậm chí tưởng như thụt lùi. Nhưng nhìn cả quá trình, năng lực tư duy vẫn được nâng lên một trình độ cao hơn.',
    details: [
      'Phát triển không chỉ là tăng lên về số lượng mà còn bao gồm biến đổi về chất.',
      'Cái mới hình thành thông qua mâu thuẫn, điều kiện, quá trình và bước chuyển.',
      'Nhìn sự vật trong phát triển giúp tránh cách học thuộc lòng, đứng yên và máy móc.',
    ],
    miniQuiz: {
      question: 'Hình ảnh nào diễn tả đúng nhất con đường của sự phát triển?',
      options: [
        'Một đường thẳng đi lên liên tục',
        'Một vòng tròn lặp lại y nguyên',
        'Một đường xoáy ốc đi lên, có quanh co',
        'Một đường thẳng đi xuống',
      ],
      answer: 2,
      explain:
        'Phát triển có tính kế thừa và quanh co: khuynh hướng chung là tiến lên nhưng qua những bước thăng trầm, lặp lại ở trình độ cao hơn — hình ảnh đường xoáy ốc.',
    },
  },
  {
    id: 'mau-thuan',
    name: 'Mâu thuẫn',
    type: 'Hành tinh xung lực',
    concept: 'Nguồn gốc vận động',
    signal: 'Dialectic',
    chapter: 'Chương 2 · Mục II — Quy luật thống nhất và đấu tranh của các mặt đối lập',
    distance: 15.2,
    size: 0.72,
    orbitSpeed: 0.047,
    rotationSpeed: 0.82,
    axialTilt: 0.38,
    phase: 2.72,
    color: 'red',
    widget: 'contradiction',
    summary: 'Nguồn gốc bên trong của vận động và phát triển.',
    definition:
      'Mâu thuẫn biện chứng là sự thống nhất và đấu tranh giữa các mặt đối lập trong cùng một sự vật. Sự đấu tranh giữa các mặt đối lập là nguồn gốc, động lực bên trong của mọi vận động và phát triển.',
    explanation:
      'Mâu thuẫn ở đây không có nghĩa là "cãi nhau". Đó là quan hệ giữa hai mặt vừa nương tựa, vừa bài trừ nhau trong một chỉnh thể. Khi đấu tranh giữa hai mặt đó được giải quyết, sự vật chuyển sang trạng thái mới — đó là phát triển.',
    example:
      'Một sinh viên vừa muốn nghỉ ngơi, vừa muốn đạt điểm cao. Mâu thuẫn giữa "thoải mái hiện tại" và "mục tiêu tương lai" buộc bạn ấy phải thay đổi cách quản lý thời gian — và nhờ đó mà trưởng thành hơn.',
    details: [
      'Mâu thuẫn là sự thống nhất và đấu tranh giữa các mặt đối lập trong cùng một sự vật.',
      'Nhận diện mâu thuẫn chủ yếu giúp tìm đúng vấn đề trung tâm cần giải quyết.',
      'Cách tiếp cận này biến triết học thành công cụ phân tích thay vì chỉ là định nghĩa.',
    ],
    miniQuiz: {
      question: 'Theo phép biện chứng, vai trò của mâu thuẫn đối với sự phát triển là gì?',
      options: [
        'Là điều cần loại bỏ hoàn toàn để ổn định',
        'Là nguồn gốc, động lực bên trong của sự phát triển',
        'Chỉ là sự xung đột, cãi vã không có ích',
        'Không liên quan gì đến phát triển',
      ],
      answer: 1,
      explain:
        'Sự thống nhất và đấu tranh của các mặt đối lập (mâu thuẫn) chính là nguồn gốc, động lực bên trong thúc đẩy sự vật vận động và phát triển.',
    },
  },
  {
    id: 'luong-chat',
    name: 'Lượng - Chất',
    type: 'Hành tinh bước nhảy',
    concept: 'Tích lũy và chuyển hóa',
    signal: 'Threshold',
    chapter: 'Chương 2 · Mục II — Quy luật chuyển hóa lượng – chất',
    distance: 17.4,
    size: 0.64,
    orbitSpeed: 0.04,
    rotationSpeed: 0.72,
    axialTilt: 0.2,
    phase: 1.7,
    color: 'blue',
    widget: 'quantity',
    summary: 'Sự tích lũy về lượng đến một giới hạn sẽ dẫn tới bước nhảy về chất.',
    definition:
      'Quy luật lượng – chất: những thay đổi về lượng khi đạt tới điểm nút (vượt khỏi độ) sẽ dẫn đến bước nhảy, làm thay đổi về chất; chất mới ra đời lại tạo nên độ và điểm nút mới. Lượng và chất thống nhất trong "độ".',
    explanation:
      'Thay đổi nhỏ tích lũy dần về lượng, đến một ngưỡng (điểm nút) sẽ tạo ra sự thay đổi căn bản về chất. "Độ" là khoảng giới hạn mà lượng thay đổi nhưng chất chưa đổi; vượt độ thì xảy ra bước nhảy.',
    example:
      'Học triết mỗi ngày 20 phút có vẻ ít, nhưng sau nhiều ngày, lượng kiến thức tích lũy đủ sẽ tạo ra sự thay đổi về chất: từ "không hiểu gì" thành "biết phân tích vấn đề".',
    details: [
      'Lượng biểu thị quy mô, trình độ, nhịp độ; chất làm nên tính quy định của sự vật.',
      'Điểm nút và bước nhảy giúp giải thích vì sao thay đổi nhỏ có thể tích lũy thành chuyển biến lớn.',
      'Quy luật này rất gần với việc học: kiến thức tích lũy đều đặn tạo ra năng lực mới.',
    ],
    miniQuiz: {
      question: 'Khi sự tích lũy về lượng vượt qua điểm nút thì điều gì xảy ra?',
      options: [
        'Sự vật giữ nguyên chất cũ mãi mãi',
        'Xảy ra bước nhảy, chất mới ra đời',
        'Lượng tự biến mất',
        'Chất quyết định lại lượng ngay lập tức',
      ],
      answer: 1,
      explain:
        'Lượng thay đổi trong giới hạn "độ" thì chất chưa đổi; nhưng khi đạt tới điểm nút và vượt qua, bước nhảy xảy ra và chất mới ra đời.',
    },
  },
  {
    id: 'phu-dinh',
    name: 'Phủ định của phủ định',
    type: 'Hành tinh kế thừa',
    concept: 'Vượt bỏ biện chứng',
    signal: 'Spiral',
    chapter: 'Chương 2 · Mục II — Quy luật phủ định của phủ định',
    distance: 19.6,
    size: 0.62,
    orbitSpeed: 0.033,
    rotationSpeed: 0.68,
    axialTilt: 0.28,
    phase: 5.05,
    color: 'rose',
    widget: 'spiral',
    summary: 'Quá trình phát triển kế thừa, vượt bỏ và tái tạo ở trình độ cao hơn.',
    definition:
      'Quy luật phủ định của phủ định chỉ ra khuynh hướng của sự phát triển: thông qua những lần phủ định biện chứng, sự vật dường như quay lại cái ban đầu nhưng trên cơ sở cao hơn. Phủ định biện chứng có tính kế thừa và tính khách quan.',
    explanation:
      'Phủ định biện chứng không phải là xóa sạch cái cũ, mà là "vượt bỏ": giữ lại yếu tố hợp lý, loại bỏ cái lỗi thời để cái mới ra đời. Qua hai lần phủ định, sự phát triển có vẻ lặp lại cái ban đầu nhưng ở một trình độ cao hơn — đường xoáy ốc.',
    example:
      'Hạt thóc (khẳng định) → gieo xuống nảy thành cây lúa, phủ định hạt thóc → cây lúa lại cho ra nhiều hạt thóc mới (phủ định của phủ định): vẫn là hạt thóc nhưng nhiều hơn, ở vòng phát triển cao hơn.',
    details: [
      'Phủ định biện chứng không xóa sạch cái cũ mà giữ lại yếu tố hợp lý để phát triển tiếp.',
      'Sự phát triển có tính quanh co, không phải đường thẳng đơn giản.',
      'Khái niệm này giúp nhìn lịch sử tri thức như một chuỗi kế thừa và đổi mới.',
    ],
    miniQuiz: {
      question: 'Đặc điểm quan trọng của "phủ định biện chứng" là gì?',
      options: [
        'Xóa bỏ sạch trơn cái cũ',
        'Giữ nguyên cái cũ không thay đổi',
        'Vượt bỏ: kế thừa yếu tố hợp lý của cái cũ',
        'Quay lại y hệt điểm xuất phát ban đầu',
      ],
      answer: 2,
      explain:
        'Phủ định biện chứng mang tính kế thừa: cái mới ra đời trên cơ sở giữ lại, cải tạo những yếu tố hợp lý của cái cũ chứ không phủ định sạch trơn.',
    },
  },
  {
    id: 'thuc-tien',
    name: 'Thực tiễn & Nhận thức',
    type: 'Trạm liên hợp',
    concept: 'Kiểm nghiệm chân lý',
    signal: 'Praxis',
    chapter: 'Chương 2 · Mục III — Lý luận nhận thức',
    distance: 11.2,
    size: 0.82,
    orbitSpeed: 0.085,
    rotationSpeed: 0.62,
    axialTilt: 0.15,
    phase: 0.96,
    color: 'silver',
    widget: 'praxis',
    summary: 'Nơi kiểm nghiệm, điều chỉnh và phát triển tri thức.',
    definition:
      'Thực tiễn là toàn bộ hoạt động vật chất – cảm tính, có tính lịch sử – xã hội của con người nhằm cải tạo tự nhiên và xã hội. Thực tiễn là cơ sở, động lực, mục đích của nhận thức và là tiêu chuẩn để kiểm tra chân lý.',
    explanation:
      'Nhận thức không dừng ở suy nghĩ trong đầu. Con đường biện chứng là: từ trực quan sinh động đến tư duy trừu tượng, rồi từ tư duy trừu tượng trở về thực tiễn để kiểm nghiệm. Đúng hay sai phải do thực tiễn trả lời.',
    example:
      'Bạn tin rằng học nhóm hiệu quả hơn học một mình. Niềm tin đó chỉ là giả thuyết cho tới khi bạn thử học nhóm vài tuần, đo kết quả, rồi điều chỉnh phương pháp — đó là chu trình thực tiễn ↔ nhận thức.',
    details: [
      'Thực tiễn là cơ sở, động lực, mục đích và tiêu chuẩn kiểm tra chân lý của nhận thức.',
      'Nhận thức đúng không dừng ở suy nghĩ, mà cần được kiểm chứng trong hoạt động thực tế.',
      'Trạm này kết nối toàn bộ bản đồ vì học triết cuối cùng phải quay về cách nhìn và cách hành động.',
    ],
    miniQuiz: {
      question: 'Theo triết học Mác – Lênin, tiêu chuẩn để kiểm tra chân lý là gì?',
      options: [
        'Ý kiến của số đông',
        'Sự hợp lý trong suy luận logic thuần túy',
        'Thực tiễn',
        'Uy tín của người phát biểu',
      ],
      answer: 2,
      explain:
        'Thực tiễn là tiêu chuẩn của chân lý: một nhận thức chỉ được khẳng định là đúng khi được kiểm nghiệm và xác nhận qua hoạt động thực tiễn.',
    },
  },
]
