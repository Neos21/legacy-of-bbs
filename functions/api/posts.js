/** @type {number} 1ページあたりに表示する投稿の件数 */
const postsPerPage = 100;

/** @type {number} デフォルトのページ番号 */
const defaultPage = 1;


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
 * Get
 * 
 * @param {EventContext} context Event Context https://developers.cloudflare.com/pages/platform/functions/api-reference/#eventcontext
 * @return {Promise<Response>} Response
 */
export async function onRequestGet(context) {
  const { request } = context;
  const paramPage = new URL(request.url).searchParams.get('page');
  
  const page = detectPage(paramPage);
  const offset = ((page - 1) < 0 ? 0 : page - 1) * postsPerPage;
  console.log('GET : ', { paramPage, page, offset });
  
  const db = context.env.DB;
  //await db.prepare('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, date TEXT, comment TEXT)').run();
  const result = await db.prepare('SELECT * FROM posts ORDER BY id DESC LIMIT ?1 OFFSET ?2').bind(postsPerPage, offset).all();
  const posts = { page, posts: result.results };
  
  return new Response(JSON.stringify(posts));
}

/**
 * Post
 * 
 * @param {EventContext} context Event Context
 * @return {Promise<Response>} Response
 */
export async function onRequestPost(context) {
  const { request } = context;
  const body = await request.json();  // https://developers.cloudflare.com/workers/examples/read-post/
  
  const db = context.env.DB;
  await db.prepare('INSERT INTO posts (name, date, comment) VALUES (?1, ?2, ?3)').bind('名前', '2022-12-31 00:01:02', body.comment).run();
  return new Response('Created', { status: 201 });
}
