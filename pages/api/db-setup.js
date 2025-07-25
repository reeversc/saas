import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Checking database schema...');

    // Check if subscriptions table exists and has correct structure
    const { data: tables, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions');

    if (tableError) {
      console.error('Error checking table existence:', tableError);
      return res.status(500).json({ error: 'Failed to check database schema' });
    }

    if (!tables || tables.length === 0) {
      console.log('Subscriptions table does not exist, creating...');
      
      const { error: createError } = await supabaseAdmin.rpc('create_subscriptions_table', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS subscriptions (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            subscription_id TEXT,
            status TEXT NOT NULL DEFAULT 'inactive',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
          CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_id ON subscriptions(subscription_id);
        `
      });

      if (createError) {
        console.error('Error creating table:', createError);
        // Try alternative approach using direct SQL
        try {
          const { error: directError } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .limit(1);
          
          if (directError && directError.code === 'PGRST116') {
            return res.status(500).json({ 
              error: 'Subscriptions table does not exist. Please create it manually using the SQL in SETUP_CHECKLIST.md',
              details: 'Table creation requires admin privileges'
            });
          }
        } catch (e) {
          console.error('Direct table check failed:', e);
        }
      } else {
        console.log('Subscriptions table created successfully');
      }
    }

    // Check table structure by attempting to query expected columns
    const { data: testData, error: structureError } = await supabaseAdmin
      .from('subscriptions')
      .select('email, subscription_id, status, created_at, updated_at')
      .limit(1);

    if (structureError) {
      console.error('Schema validation error:', structureError);
      return res.status(500).json({ 
        error: 'Table structure validation failed',
        details: structureError.message,
        suggestion: 'Check that the subscriptions table has columns: email, subscription_id, status'
      });
    }

    // Test inserting and retrieving a test record
    const testEmail = `test-${Date.now()}@example.com`;
    
    const { error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        email: testEmail,
        subscription_id: 'test-sub-123',
        status: 'test'
      });

    if (insertError) {
      console.error('Test insert failed:', insertError);
      return res.status(500).json({ 
        error: 'Test insert failed',
        details: insertError.message
      });
    }

    // Clean up test record
    const { error: deleteError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('email', testEmail);

    if (deleteError) {
      console.log('Warning: Could not clean up test record:', deleteError);
    }

    console.log('Database schema validation completed successfully');
    
    res.status(200).json({ 
      success: true,
      message: 'Database schema is properly configured',
      tableExists: true,
      schemaValid: true
    });

  } catch (e) {
    console.error('Unexpected error during database setup:', e);
    res.status(500).json({ 
      error: 'Internal server error during database validation',
      details: e.message
    });
  }
}