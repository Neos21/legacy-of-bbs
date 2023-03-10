// Global Variables
// ==============================

/** @type {number} 1ページ分として取得・レスポンスする投稿の件数 */
const postsPerPage = 100;

/** @type {number} デフォルトのページ番号 */
const defaultPage = 1;

/** @type {number} 名前の最長文字数・HTML 側にも `#input-name` の `maxlength` 属性で同値を指定 */
const maxLengthName = 30;

/** @type {string} アナウンス投稿用の名前・この名前での投稿は許可しない */
const announceBotName = 'Announce Bot';

/** @type {number} コメントの最長文字数・HTML 側にも `#input-comment` の `maxlength` 属性で同値を指定 */
const maxLengthComment = 1000;

/** @type {Array<string>} NG ネーム */
const ngNames = ['Neo', 'Neos21', '管理人'];


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
 * @param {string} name 名前
 * @param {string} comment コメント
 * @param {string} credential 入力クレデンシャル
 * @param {string} envCredential 環境変数クレデンシャル
 * @return {string | null} 異常があればメッセージを返す・正常なら `null` を返す
 */
const validate = (name, comment, credential, envCredential) => {
  // Name
  if(!validateIsWithinRangeString(name, maxLengthName)) return `名前は ${maxLengthName} 文字以内で入力してください`;
  if(name === announceBotName) return '使用できない名前です';
  // Credential
  if(ngNames.some(ngName => ngName === name) && credential !== envCredential) return 'クレデンシャルが間違っています';
  // Comment
  if(!validateIsWithinRangeString(comment, maxLengthComment)) return `コメントは ${maxLengthComment} 文字以内で入力してください`;
  
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

/**
 * クライアント IP を取得する
 * 
 * @param {Request} request リクエスト
 * @return {string} クライアント IP
 */
const getClientIp = (request) => {
  const clientIp = [
    request?.headers?.['x-forwarded-for'],
    request?.headers?.get('x-forwarded-for'),
    request?.headers?.['x-real-ip'],
    request?.headers?.get('x-real-ip'),
    request?.connection?.remoteAddress,
    request?.connection?.socket?.remoteAddress,
    request?.socket?.remoteAddress,
    '0.0.0.0'
  ].find(ip => ip != null);
  return clientIp;
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
  const offset = (page - 1) * postsPerPage;
  // Service : DB : 取得
  const db = context.env.DB;
  const sqlResult = await db.prepare('SELECT * FROM posts ORDER BY id DESC LIMIT ?1 OFFSET ?2').bind(postsPerPage + 1, offset).all();
  // Service : Return Object
  const posts = sqlResult.results;
  const hasBack = offset > 0;  // 前ページがあるか否かは OFFSET 値で判定する
  const hasNext = posts.length === postsPerPage + 1;  // 次ページがあるか否かは LIMIT 値どおりの件数が取得できたか否かで判定する
  if(hasNext) posts.pop();  // 次ページ分のデータを取得していたら削っておく
  const result = { page, posts, hasBack, hasNext };
  
  // Controller : Response
  console.log('Get Posts : ', { paramPage, offset, page: result.page, postsLength: result.posts.length, hasBack: result.hasBack, hasNext: result.hasNext });
  return new Response(JSON.stringify(result));
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
  const name          = convertToTrimmedString(body.name);
  const comment       = convertToTrimmedString(body.comment);
  const credential    = convertToTrimmedString(body.credential);
  const envCredential = context.env.CREDENTIAL;
  const validateResult = validate(name, comment, credential, envCredential);
  // Controller : Bad Response
  if(validateResult) return new Response(JSON.stringify({ error: 'Invalid Request' }), { status: 400 });
  
  // Client IP
  const clientIp = getClientIp(context.request);
  
  // Service : DB
  const db = context.env.DB;
  // Service : 既存のランキングをチェックして処理を分岐する
  const rank = await db.prepare('SELECT count FROM ranks WHERE name = ?1').bind(name).first();
  if(rank?.count == null) {  // 1回目の投稿の場合
    // 最初の昇進資格名を取得する
    const rankTitle = await db.prepare('SELECT rank, count_low FROM rank_titles ORDER BY count_low ASC LIMIT 1').first();
    // 投稿する
    const nowDate = getNowDateString();
    await db.prepare('INSERT INTO posts (name, date, comment, count, rank, host) VALUES (?1, ?2, ?3, ?4, ?5, ?6)').bind(name, nowDate, comment, 1, rankTitle.rank, clientIp).run();
    // ランキングを追加する
    await db.prepare('INSERT INTO ranks (name, count, rank) VALUES (?1, ?2, ?3)').bind(name, 1, rankTitle.rank).run();
    // Announce Bot を投稿する
    await db.prepare('INSERT INTO posts (name, date, comment, count, rank, host) VALUES (?1, ?2, ?3, ?4, ?5, ?6)').bind('Announce Bot', nowDate, `${name} さん！初めまして！`, 0, 'Announce Bot', '0.0.0.0').run();
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
    await db.prepare('INSERT INTO posts (name, date, comment, count, rank, host) VALUES (?1, ?2, ?3, ?4, ?5, ?6)').bind(name, nowDate, comment, count, rankTitle.rank, clientIp).run();
    // ランキングを更新する
    await db.prepare('UPDATE ranks SET count = ?1, rank = $2 WHERE name = ?3').bind(count, rankTitle.rank, name).run();
    // 昇進資格が変わったタイミングなら Announce Bot を投稿する
    if(count === rankTitle.count_low) await db.prepare('INSERT INTO posts (name, date, comment, count, rank, host) VALUES (?1, ?2, ?3, ?4, ?5, ?6)').bind('Announce Bot', nowDate, `${name} さん！投稿回数が${count}回に達成し昇進しました！`, 0, 'Announce Bot', '0.0.0.0').run();
  }
  
  // Controller : Response
  return new Response(JSON.stringify({ result: 'Created' }), { status: 201 });
}
