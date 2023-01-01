// Controllers
// ==============================

/**
 * Get Ranks
 * 
 * @param {EventContext} context Event Context
 * @return {Promise<Response>} Response
 */
export async function onRequestGet(context) {
  // Service : DB : 取得
  const db = context.env.DB;
  const result = await db.prepare('SELECT * FROM ranks ORDER BY count DESC').all();
  const ranks = { ranks: result.results };
  
  // Controller : Response
  console.log('Get Ranks : ', { ranks });
  return new Response(JSON.stringify(ranks));
}
