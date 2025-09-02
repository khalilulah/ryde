import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  const sql = neon(`${process.env.DATABASE_URL}`);

  try {
    // Get clerkId from query params (e.g., /api/user?clerkId=123)
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerkId");

    if (!clerkId) {
      return Response.json({ error: "missing clerkId" }, { status: 400 });
    }

    // Fetch user by clerkId
    const rows = await sql`
      SELECT email 
      FROM users 
      WHERE clerk_id = ${clerkId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json({ error: "user not found" }, { status: 404 });
    }

    return Response.json({ email: rows[0].email }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "server error" }, { status: 500 });
  }
}
