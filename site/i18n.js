/* HANAMI BLOOM i18n — Japanese / English.
   Default language is Japanese (ja). The visitor's choice is saved
   in localStorage ("hanami-lang") and respected on every page.
   Static HTML is Japanese, so the site stays Japanese even if this
   file fails to load. Missing keys fall back to English, never blank.
   Dynamic values (live counters) are never overwritten here — only labels.
   Rarity names (Common/Rare/Epic/Legendary) and proper nouns (HANAMI BLOOM,
   $HANA, SPACE ID, BNB Chain) stay English in every language, matching
   the on-chain metadata.
   JAPANESE NAME RULE (Bryan, 10 Nov 2026): the project's Japanese name
   is 花見. Hero and titles use "花見 BLOOM"; Japanese body text writes
   the project as "花見ブルーム". English mode uses "HANAMI BLOOM".
   No BNB prices anywhere: this file contains no price numbers. */
(function () {
  "use strict";
  var DICT = {
 "en": {
  "agentcheck.btn": "Check Agent ID",
  "agentcheck.checking": "Checking…",
  "agentcheck.fail": "Could not reach the SPACE ID registry right now — please try again.",
  "agentcheck.h": "Check your Agent ID",
  "agentcheck.label": "Wallet address",
  "agentcheck.no": "This wallet does NOT hold a SPACE ID Agent ID — it cannot mint. Get an Agent ID first.",
  "agentcheck.p": "Enter a wallet address. This reads holdsAgentId on the NFT contract through a public RPC — no wallet connection needed.",
  "agentcheck.yes": "This wallet holds a SPACE ID Agent ID — it can mint now.",
  "alt.common": "Common Wildflower preview",
  "alt.epic": "Epic Moonflower preview",
  "alt.hero": "A Legendary Eternal Bloom under the moon",
  "alt.legendary": "Legendary Eternal Bloom preview",
  "alt.rare": "Rare Sakura preview",
  "card.common": "Wildflowers in a field of falling petals. The most common bloom — 2,000 in the deck.",
  "card.epic": "A moonflower that blooms only at night. 300 in the deck.",
  "card.legendary": "The eternal bloom — 33 in the deck. The rarest flower of HANAMI BLOOM.",
  "card.rare": "Classic sakura in full bloom. 1,000 in the deck.",
  "check.agent_id": "SPACE ID Agent ID",
  "check.details_fail": "This bloom is minted, but its details could not be loaded right now.",
  "check.err_addr": "Please enter a valid wallet address (0x followed by 40 hex characters).",
  "check.err_chain": "Could not reach BNB Chain right now — please try again. No numbers were guessed.",
  "check.err_token": "Please enter a token number from 1 to 3,333.",
  "check.h1": "Check",
  "check.held": "NFTs held",
  "check.intro": "Look up a HANAMI BLOOM NFT by token number, or check how many blooms a wallet holds. This reads the live contract on BNB Chain.",
  "check.looking_up": "Looking up token #{n}…",
  "check.mint_status": "Mint status",
  "check.nft.btn": "Check NFT",
  "check.nft.h": "Check an NFT",
  "check.nft.p": "Enter a token number (1 to 3,333). This shows the bloom's owner, image, name and rarity — if the token has been minted.",
  "check.nft.ph": "Token number, e.g. 1",
  "check.not_deployed": "The contract has not been deployed yet — no tokens exist. Please come back once the contract is deployed and minting opens.",
  "check.not_minted": "Token #{n} has not been minted yet.",
  "check.owner": "Owner",
  "check.owner_prefix": "Owner: ",
  "check.read_live": "Read live from the HANAMI BLOOM contract on BNB Chain.",
  "check.token": "Token",
  "check.wallet.btn": "Check wallet",
  "check.wallet.h": "Check a wallet",
  "check.wallet.p": "Enter a wallet address. This shows how many HANAMI BLOOM NFTs the wallet holds and whether it holds a SPACE ID Agent ID.",
  "coll.intro": "3,333 sakura blooms in four rarities, drawn from a shuffled deck. Every mint draws the next flower from the deck — Common, Rare, Epic or Legendary.",
  "common.back_home": "Back to home",
  "common.copied": "Copied!",
  "common.copy_prompt": "Copy prompt",
  "common.nft_contract": "NFT contract:",
  "common.no": "No",
  "common.yes": "Yes",
  "facts.chain": "Chain",
  "facts.chain.v": "BNB Chain (Chain ID 56)",
  "facts.collection": "Collection",
  "facts.collection.v": "HANAMI BLOOM — 3,333 sakura NFTs",
  "facts.detail": "Detail",
  "facts.gate": "Agent gate",
  "facts.gate.v": "SPACE ID Agent ID, checked on-chain",
  "facts.item": "Item",
  "facts.nft": "NFT contract",
  "facts.royalty": "Marketplace royalty",
  "facts.royalty.v": "5% to the creator",
  "facts.standard": "Token standard",
  "facts.status": "Mint status",
  "facts.token": "$HANA token",
  "faq.a1": "No. HANAMI BLOOM is agent-only. Only an AI agent whose wallet holds a SPACE ID Agent ID can mint, and only after you confirm the exact price in your wallet.",
  "faq.a2": "The mint price is not shown on this site. Your agent reads the exact price from the contract for your next mint and shows it in your wallet confirmation before you sign.",
  "faq.a3": "No. Every mint is paid — there is no free mint in HANAMI BLOOM.",
  "faq.a4": "No. There is no per-wallet limit — a wallet may mint as many blooms as it wants.",
  "faq.a5": "Yes — the Market page explains how to list a bloom on Element, step by step. Marketplace royalty is 5% to the creator.",
  "faq.q1": "Can I mint from this website?",
  "faq.q2": "How much does a mint cost?",
  "faq.q3": "Is there a free mint?",
  "faq.q4": "Is there a limit per wallet?",
  "faq.q5": "Can I trade my bloom?",
  "foot.agent_skill": "Agent skill",
  "foot.coming": "Mint is live — agent-only minting is open.",
  "foot.sitemap": "Sitemap",
  "foot.tagline": "HANAMI BLOOM — 3,333 sakura NFTs on BNB Chain. Agent-only mint.",
  "foot.tagline_tail": "— 3,333 sakura NFTs on BNB Chain. Agent-only mint.",
  "gallery.common.p": "<strong>Common Wildflower</strong><br>Wildflowers in a field of falling petals. 2,000 in the deck.",
  "gallery.epic.p": "<strong>Epic Moonflower</strong><br>A moonflower that blooms only at night. 300 in the deck.",
  "gallery.intro": "Preview artwork for the HANAMI BLOOM flowers — one preview per rarity. These are previews; the full collection is drawn from a shuffled deck at mint.",
  "gallery.legendary.p": "The eternal bloom — 33 in the deck. The rarest flower of HANAMI BLOOM.",
  "gallery.rare.p": "<strong>Rare Sakura</strong><br>Classic sakura in full bloom. 1,000 in the deck.",
  "hero.chain": "BNB Chain · ERC-721 · Agent-only",
  "hero.check": "Check a wallet",
  "hero.lead1": "3,333 sakura blooms. One spring, one deck — every mint draws the next flower.",
  "hero.lead2": "Ukiyo-e sakura on BNB Chain. Minting is agent-only — and now open.",
  "hero.see": "See the blooms",
  "how.works": "How it works",
  "market.intro": "Where to trade HANAMI BLOOM flowers once they exist.",
  "market.live": "Mint is live.",
  "market.royalty": "Marketplace royalty is 5% to the creator.",
  "market.trade": "Trading starts once blooms are minted — no listing needed from the team.",
  "meta.desc.check": "Check a wallet's HANAMI BLOOM NFTs or look up a HANAMI BLOOM NFT by token number. Live on BNB Chain.",
  "meta.desc.gallery": "Preview gallery of HANAMI BLOOM flowers: Common Wildflower, Rare Sakura, Epic Moonflower and Legendary Eternal Bloom.",
  "meta.desc.index": "HANAMI BLOOM is a 3,333-piece collection of ukiyo-e sakura NFTs on BNB Chain. Agent-only mint, now live.",
  "meta.desc.market": "Trade HANAMI BLOOM sakura NFTs on Element. How to list a bloom, step by step. Marketplace royalty is 5% to the creator.",
  "meta.desc.mint": "HANAMI BLOOM minting is agent-only. How an AI agent mints sakura NFTs for you on BNB Chain.",
  "meta.title.check": "Check — HANAMI BLOOM",
  "meta.title.gallery": "Gallery — HANAMI BLOOM",
  "meta.title.index": "HANAMI BLOOM — 3,333 Sakura NFTs on BNB Chain",
  "meta.title.market": "Market — HANAMI BLOOM",
  "meta.title.mint": "How to Mint — HANAMI BLOOM",
  "mint.a1": "Check your bloom on the <a href=\"/check.html\">Check page</a>.",
  "mint.a2": "Trade your bloom on the <a href=\"/market.html\">Market page</a> (Element).",
  "mint.after": "After you mint",
  "mint.f1": "You give your agent the prompt below, or point it to <a href=\"/agent-skill.md\">agent-skill.md</a>.",
  "mint.f2": "Your agent checks the contract: mint is open and your wallet holds an Agent ID.",
  "mint.f3": "Your agent reads the exact price for your mint from the contract with <code>currentPrice()</code> and shows it in your wallet confirmation before you sign.",
  "mint.f4": "You confirm. Your agent calls the mint function — there is no public mint button on this site.",
  "mint.f5": "Your agent verifies the mint on-chain and shows you your bloom: image, name and rarity.",
  "mint.flow": "The mint flow",
  "mint.foragents": "For agents",
  "mint.foragents.p": "Full machine-readable instructions: <a href=\"/agent-skill.md\">agent-skill.md</a> and <a href=\"/llms.txt\">llms.txt</a>. The contract is <strong>live</strong> — the address above is the deployed contract.",
  "mint.h1": "How to Mint",
  "mint.how": "How minting works",
  "mint.intro": "<strong>Minting is LIVE.</strong> Minting is <strong>agent-only</strong>. There is no mint button for humans on this site. An AI agent mints for you — and only if your wallet holds a SPACE ID Agent ID.",
  "mint.li1": "You need a wallet on BNB Chain with a <strong>SPACE ID Agent ID</strong> attached to it.",
  "mint.li2": "You need an AI agent that can call contracts for you.",
  "mint.li3": "There is <strong>no limit per wallet</strong> — a wallet may mint as many blooms as it wants.",
  "mint.li4": "There is <strong>no free mint</strong> — every mint is paid.",
  "mint.li5": "The exact price is always read from the contract at mint time and shown in your wallet confirmation before you sign. The price is never shown as a static number on this site.",
  "mkt.element_note": "The collection appears on Element automatically once the first blooms are minted — there is no manual step that can speed this up.",
  "mkt.h1": "Market",
  "mkt.how": "How to list a bloom on Element",
  "mkt.intro": "Trade HANAMI BLOOM flowers on Element once they are minted. A full on-site market may follow later if needed.",
  "mkt.onsite": "A full on-site market may follow later if needed — for now, Element is the marketplace.",
  "mkt.open_element": "Open the collection on Element",
  "mkt.royalty": "Marketplace royalty is 5% to the creator (the Agentic Wallet). The royalty is set in the contract and applies on every secondary sale.",
  "mkt.s1": "Open the HANAMI BLOOM collection on Element (link above) and connect the wallet that holds your bloom.",
  "mkt.s2": "Find your bloom in your wallet on Element and open it.",
  "mkt.s3": "Choose “List” / “Sell” and set your asking price.",
  "mkt.s4": "Confirm the listing in your wallet — the bloom stays in your wallet until it sells.",
  "mkt.s5": "When it sells, you receive the sale price minus the 5% creator royalty and Element's fee. You can cancel the listing any time before it sells.",
  "nav.check": "Check",
  "nav.collection": "Collection",
  "nav.faq": "FAQ",
  "nav.gallery": "Gallery",
  "nav.market": "Market",
  "nav.mint": "Mint",
  "nav.roadmap": "Roadmap",
  "prompt.full": "Full instructions for agents: <a href=\"/agent-skill.md\">agent-skill.md</a> &middot; <a href=\"/llms.txt\">llms.txt</a>",
  "prompt.h": "Agent prompt",
  "prompt.p": "Copy this short prompt to your agent:",
  "rm.done": "Done",
  "rm.next": "Next",
  "rm1.h": "Concept & Artwork",
  "rm1.p": "Concept, rarity and artwork previews finished. This site is live.",
  "rm2.h": "Contract Deploy & Verify",
  "rm2.p": "Contract deployed and source verified on BscScan. Minting is live.",
  "rm3.h": "Mint Opens",
  "rm3.p": "Agent-only mint is now open. No free mint, no per-wallet limit.",
  "rm4.h": "$HANA & Market",
  "rm4.p": "$HANA is live (max supply 1,000,000,000). Trading starts on Element once blooms are minted.",
  "roadmap.intro": "Four phases, marked honestly. Nothing is marked done before it happens.",
  "sec.check": "Check a Wallet",
  "sec.collection": "The Collection",
  "sec.facts": "Facts",
  "sec.token": "$HANA — The Bloom Token",
  "stat.minted": "Minted",
  "stat.nolimit": "Per wallet",
  "stat.supply": "Supply",
  "stat.tiers": "Tiers",
  "status.coming_soon": "COMING SOON",
  "status.live": "MINT IS LIVE",
  "step.elig": "Check eligibility",
  "step.elig.p": "The agent checked the contract: mint was open and the wallet held a SPACE ID Agent ID.",
  "step.price": "See the price",
  "step.price.p": "The agent read the exact price for your next mint from the contract and showed it in your wallet confirmation before you signed. The price was never shown on this site.",
  "step.read": "Read the skill",
  "step.read.p": "Your AI agent read this site and <a href=\"/agent-skill.md\">agent-skill.md</a>.",
  "step.verify": "Mint & verify",
  "step.verify.p": "After you confirmed, the agent minted. The agent verified the mint on-chain and showed you your bloom.",
  "token.intro": "$HANA is the in-project token for HANAMI BLOOM, live on BNB Chain. Every paid mint earns a bonus of 12,000 $HANA, auto-minted to the minter. Max supply 1,000,000,000 — 460,000,000 treasury, 540,000,000 bonus pool.",
  "token.note": "Every paid mint earns 12,000 $HANA. $HANA is live on BNB Chain — max supply 1,000,000,000."
 },
 "ja": {
  "agentcheck.btn": "エージェントIDをチェック",
  "agentcheck.checking": "確認中…",
  "agentcheck.fail": "今SPACE IDレジストリに接続できませんでした — もう一度お試しください。",
  "agentcheck.h": "エージェントIDをチェック",
  "agentcheck.label": "ウォレットアドレス",
  "agentcheck.no": "このウォレットはSPACE IDエージェントIDを持っていません — ミントできません。まずエージェントIDを取得してください。",
  "agentcheck.p": "ウォレットアドレスを入力してください。NFTコントラクトのholdsAgentIdを公開RPCで読み取ります — ウォレット接続は不要です。",
  "agentcheck.yes": "このウォレットはSPACE IDエージェントIDを持っています — 今すぐミントできます。",
  "alt.common": "コモンワイルドフラワーのプレビュー",
  "alt.epic": "エピックムーンフラワーのプレビュー",
  "alt.hero": "月の下のレジェンダリーエターナルブルーム",
  "alt.legendary": "レジェンダリーエターナルブルームのプレビュー",
  "alt.rare": "レアサクラのプレビュー",
  "card.common": "舞い散る花びらの野原に咲く野花。最もよく咲く花 — デッキに2,000体。",
  "card.epic": "夜にだけ咲く月花。デッキに300体。",
  "card.legendary": "永遠の花 — デッキに33体。花見ブルームで最も稀な花です。",
  "card.rare": "満開の桜。デッキに1,000体。",
  "check.agent_id": "SPACE IDエージェントID",
  "check.details_fail": "この花はミント済みですが、詳細を今読み込めませんでした。",
  "check.err_addr": "有効なウォレットアドレスを入力してください（0x + 40文字の16進数）。",
  "check.err_chain": "今BNBチェーンに接続できませんでした — もう一度お試しください。数値を推測することはありません。",
  "check.err_token": "1から3,333までのトークン番号を入力してください。",
  "check.h1": "チェック",
  "check.held": "保有NFT数",
  "check.intro": "トークン番号で花見ブルームのNFTを調べたり、ウォレットが持つ花の数を確認したりできます。BNBチェーン上のライブコントラクトを読み取ります。",
  "check.looking_up": "トークン#{n}を検索中…",
  "check.mint_status": "ミント状況",
  "check.nft.btn": "NFTをチェック",
  "check.nft.h": "NFTをチェック",
  "check.nft.p": "トークン番号を入力してください（1〜3,333）。その花の所有者、画像、名前、レアリティが表示されます — トークンがミント済みの場合。",
  "check.nft.ph": "トークン番号（例：1）",
  "check.not_deployed": "コントラクトはまだデプロイされていません — トークンは存在しません。コントラクトのデプロイとミント開始後にまたお越しください。",
  "check.not_minted": "トークン#{n}はまだミントされていません。",
  "check.owner": "所有者",
  "check.owner_prefix": "所有者：",
  "check.read_live": "BNBチェーン上の花見ブルームコントラクトからライブで読み取りました。",
  "check.token": "トークン",
  "check.wallet.btn": "ウォレットをチェック",
  "check.wallet.h": "ウォレットをチェック",
  "check.wallet.p": "ウォレットアドレスを入力してください。そのウォレットが持つ花見ブルームNFTの数と、SPACE IDエージェントIDを持っているかどうかが表示されます。",
  "coll.intro": "4つのレアリティ、計3,333体の桜。シャッフルされたデッキから引かれます。ミントのたびにデッキの次の花が引かれます — Common、Rare、Epic、Legendaryのいずれかです。",
  "common.back_home": "ホームに戻る",
  "common.copied": "コピーしました！",
  "common.copy_prompt": "プロンプトをコピー",
  "common.nft_contract": "NFTコントラクト：",
  "common.no": "いいえ",
  "common.yes": "はい",
  "facts.chain": "チェーン",
  "facts.chain.v": "BNBチェーン（チェーンID 56）",
  "facts.collection": "コレクション",
  "facts.collection.v": "花見ブルーム — 3,333体の桜NFT",
  "facts.detail": "詳細",
  "facts.gate": "エージェントゲート",
  "facts.gate.v": "SPACE IDエージェントID、オンチェーンで確認",
  "facts.item": "項目",
  "facts.nft": "NFTコントラクト",
  "facts.royalty": "マーケットロイヤリティ",
  "facts.royalty.v": "クリエイターへ5%",
  "facts.standard": "トークン規格",
  "facts.status": "ミント状況",
  "facts.token": "$HANAトークン",
  "faq.a1": "いいえ。花見ブルームはエージェント専用です。SPACE IDエージェントIDを持つウォレットのAIエージェントだけがミントでき、しかもウォレットで正確な価格を確認した後に限ります。",
  "faq.a2": "ミント価格はこのサイトには表示されません。エージェントが次のミントの正確な価格をコントラクトから読み取り、署名前にウォレットの確認画面に表示します。",
  "faq.a3": "いいえ。花見ブルームに無料ミントはありません — すべてのミントは有料です。",
  "faq.a4": "いいえ。1ウォレットあたりの上限はありません — 好きなだけミントできます。",
  "faq.a5": "はい — マーケットページで、Elementへの出品方法をステップごとに説明しています。マーケットロイヤリティはクリエイターへ5%です。",
  "faq.q1": "このサイトからミントできますか？",
  "faq.q2": "ミントの費用はいくらですか？",
  "faq.q3": "無料ミントはありますか？",
  "faq.q4": "1ウォレットあたりの上限はありますか？",
  "faq.q5": "花を取引できますか？",
  "foot.agent_skill": "エージェントスキル",
  "foot.coming": "ミント受付中 — エージェント専用ミントが始まっています。",
  "foot.sitemap": "サイトマップ",
  "foot.tagline": "花見ブルーム — BNBチェーン上の3,333体桜NFT。エージェント専用ミント。",
  "foot.tagline_tail": "— BNBチェーン上の3,333体桜NFT。エージェント専用ミント。",
  "gallery.common.p": "<strong>コモンワイルドフラワー</strong><br>舞い散る花びらの野原に咲く野花。デッキに2,000体。",
  "gallery.epic.p": "<strong>エピックムーンフラワー</strong><br>夜にだけ咲く月花。デッキに300体。",
  "gallery.intro": "花見ブルームの花のアートワークプレビュー — 各レアリティ1点ずつ。これらはプレビューです。全コレクションはミント時にシャッフルされたデッキから引かれます。",
  "gallery.legendary.p": "永遠の花 — デッキに33体。花見ブルームで最も稀な花です。",
  "gallery.rare.p": "<strong>レアサクラ</strong><br>満開の桜。デッキに1,000体。",
  "hero.chain": "BNBチェーン · ERC-721 · エージェント専用",
  "hero.check": "ウォレットをチェック",
  "hero.lead1": "3,333体の桜。ひとつの春、ひとつのデッキ — ミントのたびに次の花が引かれます。",
  "hero.lead2": "BNBチェーン上の浮世絵の桜。ミントはエージェント専用で受付中です。",
  "hero.see": "花を見る",
  "how.works": "仕組み",
  "market.intro": "花見ブルームの花が存在し始めたら、ここで取引できます。",
  "market.live": "ミント受付中です。",
  "market.royalty": "マーケットロイヤリティはクリエイターへ5%です。",
  "market.trade": "取引は花がミントされ始めてから始まります — チームによる出品は不要です。",
  "meta.desc.check": "ウォレットの花見ブルームNFTを確認したり、トークン番号で花見ブルームNFTを調べたりできます。BNBチェーン上で公開中です。",
  "meta.desc.gallery": "花見ブルームの花のプレビューギャラリー：Common Wildflower、Rare Sakura、Epic Moonflower、Legendary Eternal Bloom。",
  "meta.desc.index": "花見ブルームはBNBチェーン上の3,333体からなる浮世絵の桜NFTコレクションです。エージェント専用ミント、受付中。",
  "meta.desc.market": "花見ブルームの桜NFTをElementで取引。出品方法をステップごとに説明。マーケットロイヤリティはクリエイターへ5%です。",
  "meta.desc.mint": "花見ブルームのミントはエージェント専用です。AIエージェントがBNBチェーン上で桜NFTをミントする方法。",
  "meta.title.check": "チェック — 花見 BLOOM",
  "meta.title.gallery": "ギャラリー — 花見 BLOOM",
  "meta.title.index": "花見 BLOOM — BNBチェーン上の3,333体桜NFT",
  "meta.title.market": "マーケット — 花見 BLOOM",
  "meta.title.mint": "ミント方法 — 花見 BLOOM",
  "mint.a1": "<a href=\"/check.html\">チェックページ</a>であなたの花を確認しましょう。",
  "mint.a2": "<a href=\"/market.html\">マーケットページ</a>（Element）であなたの花を取引しましょう。",
  "mint.after": "ミントした後",
  "mint.f1": "下のプロンプトをエージェントに渡すか、<a href=\"/agent-skill.md\">agent-skill.md</a>を指し示します。",
  "mint.f2": "エージェントがコントラクトを確認：ミントは受付中で、ウォレットはエージェントIDを持っています。",
  "mint.f3": "エージェントが<code>currentPrice()</code>でコントラクトからミントの正確な価格を読み取り、署名前にウォレットの確認画面に表示します。",
  "mint.f4": "あなたが確認します。エージェントがミント関数を呼び出します — このサイトに一般公開のミントボタンはありません。",
  "mint.f5": "エージェントはミントをオンチェーンで確認し、あなたの花を表示します：画像、名前、レアリティ。",
  "mint.flow": "ミントの流れ",
  "mint.foragents": "エージェント向け",
  "mint.foragents.p": "機械可読の完全な説明：<a href=\"/agent-skill.md\">agent-skill.md</a>と<a href=\"/llms.txt\">llms.txt</a>。コントラクトは<strong>デプロイ済み</strong>です — 上のアドレスが本番のコントラクトです。",
  "mint.h1": "ミント方法",
  "mint.how": "ミントの仕組み",
  "mint.intro": "<strong>ミントは受付中です。</strong>ミントは<strong>エージェント専用</strong>です。このサイトに人間用のミントボタンはありません。AIエージェントがあなたの代わりにミントします — ウォレットがSPACE IDエージェントIDを持っている場合に限ります。",
  "mint.li1": "BNBチェーン上のウォレットに<strong>SPACE IDエージェントID</strong>が紐付いている必要があります。",
  "mint.li2": "コントラクトを呼び出せるAIエージェントが必要です。",
  "mint.li3": "1ウォレットあたりの<strong>上限はありません</strong> — 好きなだけミントできます。",
  "mint.li4": "<strong>無料ミントはありません</strong> — すべてのミントは有料です。",
  "mint.li5": "正確な価格はミント時に常にコントラクトから読み取られ、署名前にウォレットの確認画面に表示されます。価格がこのサイトに固定の数字として表示されることはありません。",
  "mkt.element_note": "コレクションは最初の花がミントされればElementに自動的に表示されます — 早める手動の手順はありません。",
  "mkt.h1": "マーケット",
  "mkt.how": "Elementへの出品方法",
  "mkt.intro": "花がミントされたら、Elementで花見ブルームの花を取引できます。必要になれば、サイト内の本格的なマーケットが後から追加されるかもしれません。",
  "mkt.onsite": "必要になれば、サイト内の本格的なマーケットが後から追加されるかもしれません — 今はElementがマーケットです。",
  "mkt.open_element": "Elementでコレクションを開く",
  "mkt.royalty": "マーケットロイヤリティはクリエイター（Agentic Wallet）へ5%です。ロイヤリティはコントラクトに設定され、二次販売のたびに適用されます。",
  "mkt.s1": "上のリンクから花見ブルームのコレクションをElementで開き、花を持っているウォレットを接続します。",
  "mkt.s2": "Elementのウォレット内で自分の花を探して開きます。",
  "mkt.s3": "「List」/「Sell」を選び、希望価格を設定します。",
  "mkt.s4": "ウォレットで出品を確認します — 売れるまで花はあなたのウォレットに残ります。",
  "mkt.s5": "売れたら、販売価格から5%のクリエイターロイヤリティとElementの手数料を引いた金額を受け取ります。売れる前ならいつでも出品を取り消せます。",
  "nav.check": "チェック",
  "nav.collection": "コレクション",
  "nav.faq": "FAQ",
  "nav.gallery": "ギャラリー",
  "nav.market": "マーケット",
  "nav.mint": "ミント",
  "nav.roadmap": "ロードマップ",
  "prompt.full": "エージェント向け完全な説明：<a href=\"/agent-skill.md\">agent-skill.md</a> &middot; <a href=\"/llms.txt\">llms.txt</a>",
  "prompt.h": "エージェント用プロンプト",
  "prompt.p": "この短いプロンプトをエージェントにコピーしてください：",
  "rm.done": "完了",
  "rm.next": "次へ",
  "rm1.h": "コンセプトとアートワーク",
  "rm1.p": "コンセプト、レアリティ、アートワークのプレビューが完成しました。このサイトは公開中です。",
  "rm2.h": "コントラクトのデプロイと検証",
  "rm2.p": "コントラクトをデプロイし、BscScanでソースを検証しました。ミントは受付中です。",
  "rm3.h": "ミント開始",
  "rm3.p": "エージェント専用ミントが開始しました。無料ミントなし、1ウォレットあたりの上限なし。",
  "rm4.h": "$HANAとマーケット",
  "rm4.p": "$HANAは公開されました（最大供給量10億）。取引は花がミントされ始めてからElementで始まります。",
  "roadmap.intro": "4つのフェーズを正直に表示します。完了していないものは完了と表示しません。",
  "sec.check": "ウォレットをチェック",
  "sec.collection": "コレクション",
  "sec.facts": "概要",
  "sec.token": "$HANA — 花のトークン",
  "stat.minted": "ミント済み",
  "stat.nolimit": "1ウォレットあたり",
  "stat.supply": "供給量",
  "stat.tiers": "ティア",
  "status.coming_soon": "準備中",
  "status.live": "ミント受付中",
  "step.elig": "条件を確認",
  "step.elig.p": "エージェントがコントラクトを確認：ミントは受付中で、ウォレットはSPACE IDエージェントIDを持っていました。",
  "step.price": "価格を確認",
  "step.price.p": "エージェントが次のミントの正確な価格をコントラクトから読み取り、署名前にウォレットの確認画面に表示します。価格がこのサイトに表示されることはありません。",
  "step.read": "スキルを読む",
  "step.read.p": "あなたのAIエージェントがこのサイトと<a href=\"/agent-skill.md\">agent-skill.md</a>を読みます。",
  "step.verify": "ミントと確認",
  "step.verify.p": "あなたが確認すると、エージェントがミントします。エージェントはミントをオンチェーンで確認し、あなたの花を表示します。",
  "token.intro": "$HANAは花見ブルームのプロジェクト内トークンで、BNBチェーン上で公開されました。有料ミント1回につき12,000 $HANAのボーナスがミントした人に自動で付与されます。最大供給量10億 — トレジャリー4億6,000万、ボーナスプール5億4,000万。",
  "token.note": "有料ミント1回につき12,000 $HANAがもらえます。$HANAはBNBチェーン上で公開されました — 最大供給量10億。"
 }
};
  var KEY = "hanami-lang";
  var LANGS = ["ja", "en"];

  function currentLang() {
    try {
      var s = window.localStorage.getItem(KEY);
      if (s && DICT[s]) return s;
    } catch (e) { /* storage unavailable — fall through to default */ }
    return "ja";
  }

  function t(key, vars) {
    var l = currentLang();
    var s = (DICT[l] && DICT[l][key] !== undefined) ? DICT[l][key]
      : (DICT.en[key] !== undefined ? DICT.en[key] : key);
    if (vars) {
      for (var n in vars) {
        if (Object.prototype.hasOwnProperty.call(vars, n)) {
          s = s.split("{" + n + "}").join(String(vars[n]));
        }
      }
    }
    return s;
  }

  function apply(l) {
    document.documentElement.lang = l;
    var i, els;
    els = document.querySelectorAll("[data-i18n]");
    for (i = 0; i < els.length; i++) {
      els[i].textContent = t(els[i].getAttribute("data-i18n"));
    }
    els = document.querySelectorAll("[data-i18n-html]");
    for (i = 0; i < els.length; i++) {
      els[i].innerHTML = t(els[i].getAttribute("data-i18n-html"));
    }
    els = document.querySelectorAll("[data-i18n-placeholder]");
    for (i = 0; i < els.length; i++) {
      els[i].setAttribute("placeholder", t(els[i].getAttribute("data-i18n-placeholder")));
    }
    els = document.querySelectorAll("[data-i18n-alt]");
    for (i = 0; i < els.length; i++) {
      els[i].setAttribute("alt", t(els[i].getAttribute("data-i18n-alt")));
    }
    var title = document.querySelector("title[data-i18n-title]");
    if (title) document.title = t(title.getAttribute("data-i18n-title"));
    var meta = document.querySelector('meta[name="description"][data-i18n-desc]');
    if (meta) meta.setAttribute("content", t(meta.getAttribute("data-i18n-desc")));
    els = document.querySelectorAll("[data-lang]");
    for (i = 0; i < els.length; i++) {
      els[i].classList.toggle("active", els[i].getAttribute("data-lang") === l);
    }
    /* Re-render the live mint status in the new language. */
    if (window.HANAMI_LIVE_REFRESH) window.HANAMI_LIVE_REFRESH();
  }

  function setLang(l) {
    if (!DICT[l]) l = "ja";
    try { window.localStorage.setItem(KEY, l); } catch (e) { /* ignore */ }
    apply(l);
  }

  window.HANAMI_T = t;
  window.HANAMI_SET_LANG = setLang;
  window.HANAMI_I18N = DICT;

  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-lang]") : null;
    if (b) setLang(b.getAttribute("data-lang"));
  });

  apply(currentLang());
})();
