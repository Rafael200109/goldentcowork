import { supabaseClient } from '@/config/supabaseConfig';

/**
 * Logs an administrative action to the audit_logs table.
 * 
 * @param {string} action - Short description of the action (e.g., 'update_config', 'ban_user')
 * @param {string} targetResource - The resource type being affected (e.g., 'system_settings', 'users')
 * @param {string|null} targetId - ID of the specific resource (optional)
 * @param {object} details - Additional details about the change (optional)
 */
export const logAdminAction = async (action, targetResource, targetId = null, details = {}) => {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      console.warn('Attempted to log admin action without active user session');
      return;
    }

    const { error } = await supabaseClient.from('audit_logs').insert({
      admin_id: user.id,
      action,
      target_resource: targetResource,
      target_id: targetId ? String(targetId) : null,
      details
    });

    if (error) {
      console.error('Failed to write to audit log:', error);
    }
  } catch (err) {
    console.error('Error in logAdminAction:', err);
  }
};