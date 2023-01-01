// Controllers
// ==============================

/**
 * Get Rank Titles
 * 
 * @param {EventContext} context Event Context
 * @return {Promise<Response>} Response
 */
export async function onRequestGet(context) {
  // Service : DB : 取得
  const db = context.env.DB;
  const result = await db.prepare('SELECT * FROM rank_titles ORDER BY count_low ASC').all();
  const rankTitles = { rankTitles: result.results };
  
  // Controller : Response
  console.log('Get Rank Titles : ', { rankTitles });
  return new Response(JSON.stringify(rankTitles));
}
