
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        // Add new columns for feature-specific tracking
        await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS neighborhood_finder_calls INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS true_commute_calls INT DEFAULT 0;
    `;

        return NextResponse.json({
            message: 'Database updated successfully',
            columns_added: ['neighborhood_finder_calls', 'true_commute_calls']
        }, { status: 200 });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
