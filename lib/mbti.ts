// MBTI × 網球人格文案庫。
//
// 用途：結果頁「語氣 / flavor」的 copy 層，之後接進 ResultScreen。
// ⚠️ 這是文案，不進 score()，也不改 questions.json。
//
// questions.json 的 Q13 目前把 16 型「兩兩成對」（INTJ/INFJ 一個選項…共 8 組 + 跳過），
// 對應到 copy_tags: strategist / explorer / commander / improviser / steady / craftsman /
// captain / showman。若要顯示「單一型」的完整人格（16 選 1），需要一個 16 向的選擇來源
// ——那會動到 Q13 的 options。等你決定要不要把 Q13 拆成 16 型再接。
// 目前先把 16 型完整存下來（by type），供 UI 之後直接取用。

export type MbtiGroup = "analyst" | "diplomat" | "sentinel" | "explorer";

export const MBTI_GROUP_ZH: Record<MbtiGroup, { title: string; blurb: string }> = {
  analyst: {
    title: "分析家（NT 型）· 冷酷戰略家",
    blurb: "靠大腦打球，擅長分析對手弱點、布局球路，把網球當一盤動態西洋棋。",
  },
  diplomat: {
    title: "外交家（NF 型）· 精神信仰者",
    blurb: "極度依賴心態與手感，在場上展現優雅藝術感或強大精神韌性。",
  },
  sentinel: {
    title: "守護者（SJ 型）· 鋼鐵防衛牆",
    blurb: "傳統實力派，基本功扎實、防守滴水不漏，靠高穩定度與低失誤擊潰對手。",
  },
  explorer: {
    title: "探險家（SP 型）· 本能反應野獸",
    blurb: "頂級身體天賦與反射神經，活在當下的對抗，充滿爆發力與隨機應變。",
  },
};

export type MbtiPersona = {
  type: string;
  group: MbtiGroup;
  nickname: string; // 中文暱稱
  role: string; // 網球角色
  description: string;
};

export const MBTI: Record<string, MbtiPersona> = {
  INTJ: { type: "INTJ", group: "analyst", nickname: "建築師", role: "神算布局者",
    description: "每一球都在他的計畫內。不靠蠻力，而是精準預判對手移位，用極致的落點和多拍抽球將對手引入陷阱。" },
  INTP: { type: "INTP", group: "analyst", nickname: "邏輯學家", role: "怪異奇才",
    description: "喜歡在比賽中實驗各種旋轉與角度。雖然有時會因為嘗試奇特打法而失誤，但他的球路常讓對手摸不著頭緒。" },
  ENTJ: { type: "ENTJ", group: "analyst", nickname: "指揮官", role: "進攻主宰者",
    description: "氣場強大，掌控全場節奏。打法侵略性極強，擅長以強力的發球上網或致勝球快速結束進攻，徹底壓制對手。" },
  ENTP: { type: "ENTP", group: "analyst", nickname: "辯論家", role: "戰術百寶箱",
    description: "最討厭一成不變。放短球、切球、急起跳打樣樣來，擅長用層出不窮的變速和心理戰打亂對手的節奏。" },

  INFJ: { type: "INFJ", group: "diplomat", nickname: "提倡者", role: "直覺解讀師",
    description: "能神祕地看穿對手的心理狀態。通常打法沉穩，在對手心態浮躁、出現情緒破綻時，給予致命的一擊。" },
  INFP: { type: "INFP", group: "diplomat", nickname: "調停者", role: "孤獨行者",
    description: "把打網球當作自我修練。手感極其細膩，追求擊球時「人球合一」的完美觸感，但在高壓的關鍵分上容易受到情緒波動影響。" },
  ENFJ: { type: "ENFJ", group: "diplomat", nickname: "主人公", role: "正能量戰士",
    description: "擁有極強的場上感染力。無論落後多少都永不言棄，每一次得分都會大喊激勵自己，常上演驚天大逆轉。" },
  ENFP: { type: "ENFP", group: "diplomat", nickname: "競選者", role: "靈感創造者",
    description: "打球極具觀賞性，充滿天馬行空的底線抽球和跨下擊球。他打球不僅為了贏，更為了享受全場觀眾的驚呼。" },

  ISTJ: { type: "ISTJ", group: "sentinel", nickname: "物流師", role: "機器人防線",
    description: "基本功教科書。沒有華麗的動作，但每一拍的推擋和抽球都有極高的過網高度與穩定度，用零失誤逼到對手崩潰。" },
  ISFJ: { type: "ISFJ", group: "sentinel", nickname: "守衛者", role: "終極救球王",
    description: "擁有驚人的耐力與防守韌性。不管對手球打得多深、多刁鑽，他都能默默地把球擋回去，是球場上的「超級牛皮糖」。" },
  ESTJ: { type: "ESTJ", group: "sentinel", nickname: "總經理", role: "鐵血紀律者",
    description: "嚴格執行教練的戰術。打法規矩、扎實，抓到對手的短球就絕不手軟，用教科書般的正反拍強攻摧毀對手。" },
  ESFJ: { type: "ESFJ", group: "sentinel", nickname: "執政官", role: "全能輔助者",
    description: "雙打的最佳拍檔。單打時打法規矩且顧全大局，在雙打時更是神級隊友，能完美補位並給予搭檔滿滿的心理支持。" },

  ISTP: { type: "ISTP", group: "explorer", nickname: "鑑賞家", role: "冷面殺手",
    description: "借力打力的冷酷大師。對球的彈跳與球速有動物般的直覺，擅長站在底線內迎擊快球，用極短的反應時間打出精準的觸網急墜球。" },
  ISFP: { type: "ISFP", group: "explorer", nickname: "探險家", role: "優雅藝術家",
    description: "單手反拍或隨球上網的動作流暢如畫。他的球風極具協調感，擅長用柔和的手腕控制出極度刁鑽的斜線角度。" },
  ESTP: { type: "ESTP", group: "explorer", nickname: "企業家", role: "極速進攻者",
    description: "追求速度與激情。一有機會就側身正拍暴抽，或是毫不猶豫地頻繁發球上網，用極具壓迫感的節奏逼迫對手犯錯。" },
  ESFP: { type: "ESFP", group: "explorer", nickname: "表演者", role: "網壇巨星",
    description: "球場就是他的舞台。打法充滿激情，喜歡與現場球迷互動、甚至大秀球技，是全場焦點的目光磁鐵。" },
};

/** questions.json Q13 的成對選項 id -> 該組涵蓋的兩個 MBTI 型。 */
export const Q13_OPTION_TO_TYPES: Record<string, string[]> = {
  mbti_intj: ["INTJ", "INFJ"],
  mbti_intp: ["INTP", "INFP"],
  mbti_entj: ["ENTJ", "ENFJ"],
  mbti_entp: ["ENTP", "ENFP"],
  mbti_istj: ["ISTJ", "ISFJ"],
  mbti_istp: ["ISTP", "ISFP"],
  mbti_estj: ["ESTJ", "ESFJ"],
  mbti_estp: ["ESTP", "ESFP"],
};
