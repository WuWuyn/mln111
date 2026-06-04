// Huy hiệu thứ hạng phong cách "ranked emblem" (League of Legends / Hextech):
// sao kim loại nhiều cánh + vành lục giác vát cạnh + viên đá quý trung tâm.
// Toàn bộ màu kim loại lấy từ tier (accent/deep) truyền vào.
export default function RankCrest({ glyph, accent, deep, uid = 'crest' }) {
  const gMetal = `${uid}-metal`
  const gGem = `${uid}-gem`
  const gGlow = `${uid}-glow`
  const fGlow = `${uid}-blur`

  return (
    <svg className="rank-crest" viewBox="0 0 220 200" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={gMetal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="32%" stopColor={accent} />
          <stop offset="78%" stopColor={deep} />
          <stop offset="100%" stopColor="#0a0c16" />
        </linearGradient>
        <radialGradient id={gGem} cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="34%" stopColor={accent} />
          <stop offset="74%" stopColor={deep} />
          <stop offset="100%" stopColor="#070912" />
        </radialGradient>
        <radialGradient id={gGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="60%" stopColor={accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <filter id={fGlow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      {/* Quầng sáng nền */}
      <circle cx="110" cy="100" r="98" fill={`url(#${gGlow})`} />

      {/* Sao chéo phụ tạo chiều sâu */}
      <polygon
        className="crest-spark"
        points="159.5,50.5 132,100 159.5,149.5 110,122 60.5,149.5 88,100 60.5,50.5 110,78"
        fill={accent}
        opacity="0.28"
      />

      {/* Sao 4 cánh chính, kim loại */}
      <polygon
        points="110,6 135,75 202,100 135,125 110,194 85,125 18,100 85,75"
        fill={`url(#${gMetal})`}
        stroke={accent}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Đá quý ở 4 đầu cánh */}
      {[
        [110, 12],
        [196, 100],
        [110, 188],
        [24, 100],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.4" fill="#fff8e6" stroke={accent} strokeWidth="1" />
      ))}

      {/* Vành lục giác vát cạnh */}
      <polygon
        points="110,48 155,74 155,126 110,152 65,126 65,74"
        fill="rgba(7,9,18,0.78)"
        stroke={accent}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <polygon
        points="110,56 148,78 148,122 110,144 72,122 72,78"
        fill="none"
        stroke={accent}
        strokeWidth="0.9"
        opacity="0.55"
      />

      {/* Viên đá quý trung tâm + facet */}
      <polygon points="110,66 144,100 110,134 76,100" fill={`url(#${gGem})`} stroke={accent} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M110,66 L110,134 M76,100 L144,100" stroke={accent} strokeWidth="0.7" opacity="0.5" />
      <path d="M110,66 L76,100 L110,100 Z" fill="#ffffff" opacity="0.16" />

      {/* Glyph hạng */}
      <text
        x="110"
        y="100"
        textAnchor="middle"
        dominantBaseline="central"
        className="crest-glyph"
        fill="#fff8e6"
        filter={`url(#${fGlow})`}
      >
        {glyph}
      </text>
      <text x="110" y="100" textAnchor="middle" dominantBaseline="central" className="crest-glyph" fill="#fff8e6">
        {glyph}
      </text>
    </svg>
  )
}
