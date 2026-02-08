import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: Request) {
    const session = await auth();

    // Only allow james.kocher@gmail.com
    if (!session || session.user?.email !== 'james.kocher@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const result = await sql`
      SELECT email, name, first_login, last_login, login_count, api_calls, neighborhood_finder_calls, true_commute_calls
      FROM users
      ORDER BY last_login DESC;
    `;

        return NextResponse.json({ users: result.rows }, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
