import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, action } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  console.log(`Test webhook called - Action: ${action}, Email: ${email}`);

  try {
    let result;

    switch (action) {
      case 'create':
        // Simulate checkout.session.completed
        result = await supabaseAdmin.from('subscriptions').upsert({
          email: email,
          subscription_id: `test_sub_${Date.now()}`,
          status: 'active'
        });
        break;

      case 'update':
        // Simulate customer.subscription.updated
        result = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('email', email);
        break;

      case 'cancel':
        // Simulate customer.subscription.deleted
        result = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('email', email);
        break;

      case 'check':
        // Check current subscription status
        result = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('email', email)
          .single();
        
        return res.status(200).json({
          success: true,
          action: 'check',
          subscription: result.data,
          error: result.error
        });

      default:
        return res.status(400).json({ error: 'Invalid action. Use: create, update, cancel, or check' });
    }

    if (result.error) {
      console.error(`Test webhook ${action} failed:`, result.error);
      return res.status(500).json({ 
        error: `Test ${action} failed`,
        details: result.error.message 
      });
    }

    console.log(`Test webhook ${action} completed successfully for ${email}`);
    
    res.status(200).json({ 
      success: true,
      action: action,
      email: email,
      message: `Test ${action} completed successfully`
    });

  } catch (e) {
    console.error('Unexpected error in test webhook:', e);
    res.status(500).json({ 
      error: 'Internal server error',
      details: e.message
    });
  }
}

// Example usage:
// POST /api/test-webhook
// { "email": "test@example.com", "action": "create" }
// { "email": "test@example.com", "action": "check" }
// { "email": "test@example.com", "action": "cancel" }