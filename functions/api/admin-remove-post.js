// Controllers
// ==============================

/**
 * Admin Remove Post
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
  
  // Service : DB : 削除
  const db = context.env.DB;
  const result = await db.prepare('DELETE FROM posts WHERE id = ?1').bind(id).run();
  if(result.changes === 0) return new Response(JSON.stringify({ error: 'No Removes'       }), { status: 400 });
  if(result.changes >=  2) return new Response(JSON.stringify({ error: 'Too Many Removed' }), { status: 400 });
  
  // Controller : Response
  console.log('Admin Remove Post : ', { result });
  return new Response(JSON.stringify(result));
}
