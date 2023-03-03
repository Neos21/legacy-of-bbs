// Controllers
// ==============================

/**
 * Admin Edit Post
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
  
  // Service : DB : 更新
  const { name, date, comment, count, rank, host } = body;
  const db = context.env.DB;
  const result = await db.prepare('UPDATE posts SET name = ?1, date = ?2, comment = ?3, count = ?4, rank = ?5, host = ?6 WHERE id = ?7').bind(name, date, comment, count, rank, host, id).run();
  if(result.changes === 0) return new Response(JSON.stringify({ error: 'No Updates'       }), { status: 400 });
  if(result.changes >=  2) return new Response(JSON.stringify({ error: 'Too Many Updated' }), { status: 400 });
  
  // Controller : Response
  console.log('Admin Edit Post : ', { result });
  return new Response(JSON.stringify(result));
}
