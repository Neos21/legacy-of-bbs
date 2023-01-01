// Global Variables
// ==============================

/** @type {number} 1ページ分として取得・レスポンスする投稿の件数・`OFFSET` 値はこの値の `-1` を利用しており、JS 側はこの値の `-1` 分を表示する */
const postsPerPage = 100 + 1;

/** @type {number} デフォルトのページ番号・JS 側にも同値の定義あり */
const defaultPage = 1;

/** @type {number} 名前の最長文字数・HTML 側にも `#input-name` の `maxlength` 属性で同値を指定 */
const maxLengthName = 30;

/** @type {string} アナウンス投稿用の名前・この名前での投稿は許可しない */
const announceBotName = 'Announce Bot';

/** @type {number} コメントの最長文字数・HTML 側にも `#input-comment` の `maxlength` 属性で同値を指定 */
const maxLengthComment = 1000;


// Service Functions
// ==============================

/**
 * ページ番号を特定する
 * 
 * @param {string | null | undefined} paramPage ページ番号のパラメータ
 * @return {number} 正常なページ番号
 */
const detectPage = (paramPage) => {
  if(paramPage == null || String(paramPage).trim() ==='') return defaultPage;
  const numParamPage = Number(paramPage);
  if(Number.isNaN(numParamPage)) return defaultPage;
  const numPage = Math.trunc(numParamPage);
  if(numPage < defaultPage) return defaultPage;
  return numPage;
};

/**
 * ページ番号からオフセット値に変換する
 * 
 * @param {number} page ページ番号 (`1` 始まり)
 * @return {number} SQLite 用の `OFFSET` 値 (`0` 始まり)
 */
const pageToOffset = (page) => ((page - 1) < 0 ? 0 : page - 1) * (postsPerPage - 1);

/**
 * 値を確実に文字列に変換する
 * 
 * @param {string | null | undefined} value 値
 * @return {string} `null`・`undefined` の場合は空文字・その他は `trim()` した値
 */
const convertToTrimmedString = (value) => (value == null) ? '' : String(value).trim();

/**
 * 値が1文字以上・指定文字数以下であることを確認する
 * 
 * @param {string} value 値
 * @param {number} maxLength 最大文字数
 * @return {boolean} 正常値なら `true`・異常値なら `false`
 */
const validateIsWithinRangeString = (value, maxLength) => value !== '' && value.length <= maxLength;

/**
 * 入力チェックする
 * 
 * @param {{ name: string; comment: string; }} body リクエストボディ
 * @return {string | null} 異常があればメッセージを返す・正常なら `null` を返す
 */
const validate = (body) => {
  // Name
  if(!validateIsWithinRangeString(body.name, maxLengthName)) return `名前は ${maxLengthName} 文字以内で入力してください`;
  if(body.name === announceBotName) return '使用できない名前です';
  // Comment
  if(!validateIsWithinRangeString(body.comment, maxLengthComment)) return `コメントは ${maxLengthComment} 文字以内で入力してください`;
  
  return null;
};

/**
 * 現在日時を取得する
 * 
 * @return {string} `YYYY-MM-DD HH:mm` 形式の文字列
 */
const getNowDateString = () => {
  const date = new Date(Date.now() + ((new Date().getTimezoneOffset() + 540) * 60000));
  return            date.getFullYear()
    + '-' + ('0' + (date.getMonth() + 1)).slice(-2)
    + '-' + ('0' +  date.getDate()      ).slice(-2)
    + ' ' + ('0' +  date.getHours()     ).slice(-2)
    + ':' + ('0' +  date.getMinutes()   ).slice(-2);
};


// Controllers
// ==============================

/**
 * Get Posts
 * 
 * @param {EventContext} context Event Context https://developers.cloudflare.com/pages/platform/functions/api-reference/#eventcontext
 * @return {Promise<Response>} Response
 */
export async function onRequestGet(context) {
  // Controller : Request
  const paramPage = new URL(context.request.url).searchParams.get('page');
  
  // Service : ページ番号のクエリ文字列からオフセット値を特定する・未指定や不正値はデフォルト値に変換する
  const page = detectPage(paramPage);
  const offset = pageToOffset(page);
  // Service : DB : 取得
  const db = context.env.DB;
  const result = await db.prepare('SELECT * FROM posts ORDER BY id DESC LIMIT ?1 OFFSET ?2').bind(postsPerPage, offset).all();
  // Service : Return Object
  const posts = { page, posts: result.results, postsPerPage };
  
  // Controller : Response
  console.log('Get Posts : ', { paramPage, page, offset, posts: posts.posts.length });
  return new Response(JSON.stringify(posts));
}

/**
 * Post New Post
 * 
 * @param {EventContext} context Event Context
 * @return {Promise<Response>} Response
 */
export async function onRequestPost(context) {
  // Controller : Request
  const body = await context.request.json();  // https://developers.cloudflare.com/workers/examples/read-post/
  
  // Service : Validate
  const name    = convertToTrimmedString(body.name);
  const comment = convertToTrimmedString(body.comment);
  const validateResult = validate({ name, comment });
  if(validateResult) return new Response(JSON.stringify({ error: 'Invalid Request' }), { status: 400 });
  
  // Service : DB
  const db = context.env.DB;
  // Service : 既存のランキングをチェックして処理を分岐する
  const rank = await db.prepare('SELECT count FROM ranks WHERE name = ?1').bind(name).first();
  if(rank?.count == null) {  // 1回目の投稿の場合
    // 最初の昇進資格名を取得する
    const rankTitle = await db.prepare('SELECT rank, count_low FROM rank_titles ORDER BY count_low ASC LIMIT 1').first();
    // 投稿する
    const nowDate = getNowDateString();
    await db.prepare('INSERT INTO posts (name, date, comment, count, rank) VALUES (?1, ?2, ?3, ?4, ?5)').bind(name, nowDate, comment, 1, rankTitle.rank).run();
    // ランキングを追加する
    await db.prepare('INSERT INTO ranks (name, count, rank) VALUES (?1, ?2, ?3)').bind(name, 1, rankTitle.rank).run();
    // Announce Bot を投稿する
    await db.prepare('INSERT INTO posts (name, date, comment, count, rank) VALUES (?1, ?2, ?3, ?4, ?5)').bind('Announce Bot', nowDate, `${name} さん！初めまして！`, 0, 'Announce Bot').run();
  }
  else {  // 2回目以降の投稿の場合
    const count = rank.count + 1;
    // 投稿回数に合う昇進資格名を取得する
    const rankTitles = await db.prepare('SELECT rank, count_low FROM rank_titles ORDER BY count_low ASC').all();
    const rankTitle = rankTitles.results.findLast((rankTitle, index) => {
      const nextRankTitle = rankTitles[index + 1];
      return nextRankTitle != null
        ? rankTitle.count_low <= count && count > nextRankTitle.count_low
        : count >= rankTitle.count_low;
    });
    // 投稿する
    const nowDate = getNowDateString();
    await db.prepare('INSERT INTO posts (name, date, comment, count, rank) VALUES (?1, ?2, ?3, ?4, ?5)').bind(name, nowDate, comment, count, rankTitle.rank).run();
    // ランキングを更新する
    await db.prepare('UPDATE ranks SET count = ?1, rank = $2 WHERE name = ?3').bind(count, rankTitle.rank, name).run();
    // 昇進資格が変わったタイミングなら Announce Bot を投稿する
    if(count === rankTitle.count_low) await db.prepare('INSERT INTO posts (name, date, comment, count, rank) VALUES (?1, ?2, ?3, ?4, ?5)').bind('Announce Bot', nowDate, `${name} さん！投稿回数が${count}回に達成し昇進しました！`, 0, 'Announce Bot').run();
  }
  
  // Controller : Response
  return new Response(JSON.stringify({ result: 'Created' }), { status: 201 });
}
