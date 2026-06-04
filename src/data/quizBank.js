// Ngân hàng câu hỏi quiz nhanh theo chủ đề từng hành tinh.
// Nội dung bám theo "Giáo trình Triết học Mác - Lênin" (NXB Chính trị Quốc gia, 2021).
// Mỗi câu: { question, options: string[], answer: index, explain }.
// Key trùng với planet.id trong cosmos.js.

export const quizBankByPlanet = {
  'vat-chat': [
    {
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
    {
      question: 'Định nghĩa vật chất kinh điển của chủ nghĩa duy vật biện chứng do ai nêu ra?',
      options: ['C. Mác', 'Ph. Ăngghen', 'V.I. Lênin', 'L. Phoiơbắc'],
      answer: 2,
      explain:
        'V.I. Lênin đưa ra định nghĩa: vật chất là phạm trù triết học dùng để chỉ thực tại khách quan được đem lại cho con người trong cảm giác, tồn tại không lệ thuộc vào cảm giác.',
    },
    {
      question: 'Theo triết học Mác - Lênin, phương thức tồn tại của vật chất là gì?',
      options: ['Đứng yên tuyệt đối', 'Vận động', 'Cảm giác của con người', 'Ý niệm tuyệt đối'],
      answer: 1,
      explain:
        'Vận động là phương thức tồn tại của vật chất; không có vật chất nào tồn tại mà không vận động, và mọi vận động đều là vận động của vật chất.',
    },
    {
      question: 'Quan hệ giữa vận động và đứng yên được hiểu như thế nào?',
      options: [
        'Đứng yên là tuyệt đối, vận động là tương đối',
        'Vận động là tuyệt đối, đứng yên là tương đối',
        'Cả hai đều tuyệt đối',
        'Cả hai đều không có thật',
      ],
      answer: 1,
      explain:
        'Vận động là tuyệt đối và vĩnh viễn; đứng yên chỉ là tương đối, tạm thời, là trạng thái cân bằng trong một quan hệ xác định.',
    },
    {
      question: 'Không gian và thời gian được quan niệm là gì đối với vật chất?',
      options: [
        'Những thực thể tồn tại tách rời vật chất',
        'Hình thức tồn tại của vật chất đang vận động',
        'Sản phẩm thuần túy của ý thức con người',
        'Chỉ là đơn vị đo lường do con người đặt ra',
      ],
      answer: 1,
      explain:
        'Không gian và thời gian là những hình thức tồn tại của vật chất vận động, gắn liền với vật chất, không tồn tại tách rời vật chất.',
    },
    {
      question: 'Tính thống nhất thật sự của thế giới nằm ở đâu?',
      options: [
        'Ở tính tinh thần của nó',
        'Ở tính vật chất của nó',
        'Ở ý niệm tuyệt đối',
        'Ở cảm giác của con người',
      ],
      answer: 1,
      explain:
        'Theo Ph. Ăngghen, tính thống nhất thật sự của thế giới là ở tính vật chất của nó; thế giới thống nhất ở chỗ mọi sự vật, hiện tượng đều là những dạng cụ thể của vật chất.',
    },
  ],

  'y-thuc': [
    {
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
    {
      question: 'Nguồn gốc tự nhiên của ý thức gồm những yếu tố nào?',
      options: [
        'Lao động và ngôn ngữ',
        'Bộ óc người và sự phản ánh thế giới khách quan vào bộ óc',
        'Thần linh ban cho con người',
        'Ý niệm tuyệt đối tự sinh ra',
      ],
      answer: 1,
      explain:
        'Nguồn gốc tự nhiên của ý thức là bộ óc người - một dạng vật chất có tổ chức cao - cùng mối quan hệ giữa con người với thế giới khách quan tạo ra quá trình phản ánh.',
    },
    {
      question: 'Nhân tố nào là nguồn gốc xã hội trực tiếp và quan trọng nhất quyết định sự ra đời của ý thức?',
      options: ['Lao động và ngôn ngữ', 'Khí hậu và môi trường', 'Bản năng sinh tồn', 'Sự tiến hóa của loài vật'],
      answer: 0,
      explain:
        'Lao động và ngôn ngữ là hai sức kích thích chủ yếu. Lao động giúp con người cải tạo thế giới, còn ngôn ngữ là "vỏ vật chất" của tư duy, công cụ để khái quát và trao đổi tri thức.',
    },
    {
      question: 'Bản chất của ý thức được xác định như thế nào?',
      options: [
        'Là hình ảnh chủ quan của thế giới khách quan, phản ánh năng động, sáng tạo',
        'Là bản sao y nguyên, thụ động của sự vật',
        'Là một thực thể tinh thần tồn tại độc lập',
        'Là sản phẩm thuần túy của thần kinh, không liên quan thế giới bên ngoài',
      ],
      answer: 0,
      explain:
        'Ý thức là hình ảnh chủ quan của thế giới khách quan: nội dung do hiện thực khách quan quy định, nhưng phản ánh mang tính năng động, sáng tạo chứ không sao chép máy móc.',
    },
    {
      question: '"Vỏ vật chất" của tư duy, phương tiện để ý thức tồn tại và phát triển là gì?',
      options: ['Ngôn ngữ', 'Cảm giác', 'Trực giác', 'Bản năng'],
      answer: 0,
      explain:
        'Ngôn ngữ là hệ thống tín hiệu vật chất mang nội dung ý thức; nhờ ngôn ngữ con người khái quát, lưu giữ và truyền đạt tri thức.',
    },
    {
      question: 'Ý thức phát huy vai trò của mình đối với vật chất bằng con đường nào?',
      options: [
        'Tự nó biến đổi hiện thực mà không cần hành động',
        'Thông qua hoạt động thực tiễn của con người',
        'Bằng cách phủ nhận vật chất',
        'Bằng ý chí thuần túy, bất chấp điều kiện khách quan',
      ],
      answer: 1,
      explain:
        'Ý thức không trực tiếp làm biến đổi hiện thực; nó định hướng, chỉ đạo hành động và chỉ tác động trở lại vật chất thông qua hoạt động thực tiễn của con người.',
    },
  ],

  'lien-he-phat-trien': [
    {
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
    {
      question: 'Nguyên lý về mối liên hệ phổ biến khẳng định điều gì?',
      options: [
        'Các sự vật, hiện tượng tồn tại biệt lập, tách rời nhau',
        'Mọi sự vật, hiện tượng đều ràng buộc, tác động qua lại lẫn nhau',
        'Chỉ có sự vật vật chất mới liên hệ với nhau',
        'Mối liên hệ là do con người gán ghép một cách chủ quan',
      ],
      answer: 1,
      explain:
        'Mối liên hệ mang tính khách quan, phổ biến và đa dạng: mọi sự vật, hiện tượng đều nằm trong sự ràng buộc, tác động và chuyển hóa lẫn nhau.',
    },
    {
      question: 'Theo phép biện chứng duy vật, phát triển là gì?',
      options: [
        'Mọi sự thay đổi nói chung của sự vật',
        'Khuynh hướng vận động đi lên, cái mới ra đời thay thế cái cũ',
        'Sự tăng lên đơn thuần về số lượng',
        'Sự vận động vòng tròn khép kín lặp lại',
      ],
      answer: 1,
      explain:
        'Phát triển là khuynh hướng vận động từ thấp đến cao, từ đơn giản đến phức tạp, theo đó cái mới tiến bộ ra đời thay thế cái cũ - không phải mọi vận động đều là phát triển.',
    },
    {
      question: 'Các tính chất cơ bản của mối liên hệ phổ biến là gì?',
      options: [
        'Chủ quan, ngẫu nhiên, đơn nhất',
        'Khách quan, phổ biến và đa dạng, phong phú',
        'Bất biến, cố định, một chiều',
        'Tinh thần, siêu hình, tách rời',
      ],
      answer: 1,
      explain:
        'Mối liên hệ có tính khách quan (vốn có của sự vật), tính phổ biến (ở mọi sự vật, mọi lĩnh vực) và tính đa dạng, phong phú (mỗi liên hệ có vai trò khác nhau).',
    },
    {
      question: 'Quan điểm phát triển đòi hỏi chúng ta phải làm gì khi xem xét sự vật?',
      options: [
        'Giữ nguyên đánh giá cũ về sự vật',
        'Đặt sự vật trong quá trình vận động, biến đổi và phát hiện khuynh hướng phát triển',
        'Chỉ nhìn vào hình thức bề ngoài',
        'Cô lập sự vật khỏi quá khứ và tương lai',
      ],
      answer: 1,
      explain:
        'Quan điểm phát triển yêu cầu xem xét sự vật trong sự vận động, trong khuynh hướng biến đổi của nó, ủng hộ cái mới hợp quy luật.',
    },
    {
      question: 'Khuynh hướng chung của sự phát triển diễn ra theo hình thức nào?',
      options: [
        'Theo đường thẳng tắp, đơn giản',
        'Theo đường xoáy ốc, quanh co, phức tạp nhưng vẫn đi lên',
        'Theo vòng tròn lặp lại y hệt',
        'Theo hướng thụt lùi là chủ đạo',
      ],
      answer: 1,
      explain:
        'Phát triển không diễn ra theo đường thẳng mà quanh co, phức tạp, có thể có bước thụt lùi tạm thời, song xu hướng chung là tiến lên theo hình "xoáy ốc".',
    },
  ],

  'mau-thuan-luong-chat': [
    {
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
    {
      question: 'Mâu thuẫn biện chứng được hiểu là gì?',
      options: [
        'Sự xung đột ngẫu nhiên giữa các sự vật khác nhau',
        'Sự thống nhất và đấu tranh giữa các mặt đối lập trong cùng một sự vật',
        'Trạng thái cân bằng tuyệt đối, không vận động',
        'Sai lầm trong suy luận của con người',
      ],
      answer: 1,
      explain:
        'Mâu thuẫn biện chứng là sự thống nhất và đấu tranh của các mặt đối lập vừa nương tựa, vừa bài trừ nhau ngay trong bản thân sự vật.',
    },
    {
      question: 'Theo quy luật mâu thuẫn, đâu là nguồn gốc, động lực của sự vận động và phát triển?',
      options: [
        'Sự tác động từ bên ngoài',
        'Việc giải quyết mâu thuẫn bên trong giữa các mặt đối lập',
        'Ý muốn chủ quan của con người',
        'Sự đứng yên của sự vật',
      ],
      answer: 1,
      explain:
        'Mâu thuẫn là nguồn gốc, động lực bên trong của sự vận động và phát triển; sự vật phát triển nhờ đấu tranh và giải quyết mâu thuẫn giữa các mặt đối lập.',
    },
    {
      question: 'Khái niệm "độ" trong quy luật lượng - chất chỉ điều gì?',
      options: [
        'Thời điểm chất mới ra đời',
        'Giới hạn mà trong đó lượng thay đổi nhưng chất chưa thay đổi căn bản',
        'Sự thay đổi đột ngột về chất',
        'Mức độ mâu thuẫn của sự vật',
      ],
      answer: 1,
      explain:
        'Độ là khoảng giới hạn mà ở đó sự thay đổi về lượng chưa làm thay đổi căn bản về chất của sự vật; độ được giới hạn bởi hai điểm nút.',
    },
    {
      question: '"Điểm nút" được định nghĩa là gì?',
      options: [
        'Giới hạn lượng thay đổi tự do',
        'Thời điểm mà sự thay đổi về lượng đủ để bắt đầu xảy ra bước nhảy về chất',
        'Trạng thái cân bằng của mâu thuẫn',
        'Chất mới sau khi đã hình thành',
      ],
      answer: 1,
      explain:
        'Điểm nút là thời điểm mà tại đó sự thay đổi về lượng đã đủ làm thay đổi về chất, tức là nơi bắt đầu xảy ra bước nhảy.',
    },
    {
      question: 'Quy luật chuyển hóa lượng - chất chỉ ra điều gì về sự phát triển?',
      options: [
        'Nguồn gốc của sự phát triển',
        'Cách thức của sự vận động, phát triển',
        'Khuynh hướng của sự phát triển',
        'Sự đứng yên tuyệt đối của sự vật',
      ],
      answer: 1,
      explain:
        'Quy luật lượng - chất chỉ ra cách thức chung của sự phát triển: thay đổi dần về lượng đến điểm nút sẽ tạo bước nhảy về chất; còn quy luật mâu thuẫn chỉ ra nguồn gốc, quy luật phủ định của phủ định chỉ ra khuynh hướng.',
    },
  ],

  'thuc-tien': [
    {
      question: 'Theo triết học Mác - Lênin, tiêu chuẩn kiểm tra chân lý là gì?',
      options: ['Ý kiến số đông', 'Suy luận hợp lý thuần túy', 'Thực tiễn', 'Uy tín của người nói'],
      answer: 2,
      explain:
        'Thực tiễn là tiêu chuẩn của chân lý vì nhận thức chỉ được xác nhận khi đi vào hoạt động thực tế và cho thấy kết quả.',
    },
    {
      question: 'Ba hình thức cơ bản của hoạt động thực tiễn là gì?',
      options: [
        'Sản xuất vật chất; chính trị - xã hội; thực nghiệm khoa học',
        'Học tập; lao động; giải trí',
        'Quan sát; suy luận; tưởng tượng',
        'Cảm giác; tri giác; biểu tượng',
      ],
      answer: 0,
      explain:
        'Thực tiễn có ba hình thức cơ bản: hoạt động sản xuất vật chất, hoạt động chính trị - xã hội và hoạt động thực nghiệm khoa học.',
    },
    {
      question: 'Hình thức thực tiễn nào có sớm nhất, cơ bản nhất và quan trọng nhất?',
      options: [
        'Hoạt động thực nghiệm khoa học',
        'Hoạt động chính trị - xã hội',
        'Hoạt động sản xuất vật chất',
        'Hoạt động nghệ thuật',
      ],
      answer: 2,
      explain:
        'Hoạt động sản xuất vật chất là hình thức thực tiễn xuất hiện sớm nhất, cơ bản nhất, quyết định sự tồn tại và phát triển của xã hội loài người.',
    },
    {
      question: 'Vai trò của thực tiễn đối với nhận thức được khái quát như thế nào?',
      options: [
        'Chỉ là nơi áp dụng tri thức đã có',
        'Là cơ sở, động lực, mục đích của nhận thức và là tiêu chuẩn của chân lý',
        'Không liên quan đến quá trình nhận thức',
        'Chỉ có vai trò kiểm tra, không tạo ra tri thức',
      ],
      answer: 1,
      explain:
        'Thực tiễn vừa là cơ sở, động lực, mục đích của nhận thức, vừa là tiêu chuẩn để kiểm tra chân lý của nhận thức.',
    },
    {
      question: 'Con đường biện chứng của quá trình nhận thức chân lý diễn ra theo trình tự nào?',
      options: [
        'Từ tư duy trừu tượng đến trực quan sinh động',
        'Từ trực quan sinh động đến tư duy trừu tượng, rồi đến thực tiễn',
        'Chỉ dừng lại ở cảm giác và tri giác',
        'Chỉ là quá trình suy luận thuần lý tính',
      ],
      answer: 1,
      explain:
        'V.I. Lênin khái quát: "Từ trực quan sinh động đến tư duy trừu tượng, và từ tư duy trừu tượng đến thực tiễn - đó là con đường biện chứng của sự nhận thức chân lý".',
    },
    {
      question: 'Chân lý được hiểu là gì?',
      options: [
        'Ý kiến được nhiều người đồng tình',
        'Tri thức phù hợp với hiện thực khách quan và được thực tiễn kiểm nghiệm',
        'Điều do người có uy tín khẳng định',
        'Mọi suy nghĩ của con người',
      ],
      answer: 1,
      explain:
        'Chân lý là tri thức phù hợp với hiện thực khách quan mà con người phản ánh và được thực tiễn kiểm nghiệm; chân lý có tính khách quan, cụ thể, tương đối và tuyệt đối.',
    },
  ],
}
