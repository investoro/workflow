/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  /**
   *
   * Default policy for all controllers and actions, unless overridden.
   * (`true` allows public access)
   *
   */

  '*': 'is-authenticated',

  'users/create': ['is-authenticated', 'is-admin'],
  'users/delete': ['is-authenticated', 'is-admin'],

  'projects/create': ['is-authenticated', 'is-admin-or-project-owner-or-board-user'],

  'config/show': true,
  'access-tokens/create': true,
  'access-tokens/exchange-with-oidc': true,
};
