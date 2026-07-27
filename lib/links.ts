// 對外連結中控。填好後全站自動接上；留空的連結不會顯示（不會有壞連結）。
export const LINKS = {
  // LINE 官方帳號：LINE Official Account Manager → 加入好友 → 複製網址
  // 例：https://lin.ee/xxxxx 或 https://line.me/R/ti/p/@xxxxx
  line: "https://line.me/R/ti/p/@597utwud",
  // 公司官網（HEAD 台灣總代理）
  website: "https://www.headsports.com.tw/",
};

export const hasLine = () => LINKS.line.trim().length > 0;
export const hasWebsite = () => LINKS.website.trim().length > 0;
