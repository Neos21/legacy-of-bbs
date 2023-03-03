// Controllers
// ==============================

/**
 * Admin Find Post
 * 
 * @param {EventContext} context Event Context
 * @return {Promise<Response>} Response
 */
export async function onRequestPost(context) {
  // Controller : Request
  const body = await context.request.json();
  
  // 認証
  const envCredential = context.env.CREDENTIAL;
  if(body.credential !== envCredential) return new Response(JSON.stringify({ error: 'Invalid Credential' }), { status: 400 });
  
  // Validate
  const id = body.id;
  if(body.id == null || String(id).trim() === '') return new Response(JSON.stringify({ error: 'Invalid Request' }), { status: 400 });
  
  // Service : DB : 取得
  const db = context.env.DB;
  const result = await db.prepare('SELECT id, name, date, comment, count, rank, host FROM posts WHERE id = ?1').bind(id).first();
  if(result == null) return new Response(JSON.stringify({ error: 'The Post Not Found' }), { status: 400 });
  
  // Controller : Response
  console.log('Admin Find Post : ', { result });
  return new Response(JSON.stringify(result));
}
