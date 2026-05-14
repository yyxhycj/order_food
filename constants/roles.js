const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
}

module.exports = {
  ROLES,
  ROLE_TEXT: {
    [ROLES.USER]: '朋友',
    [ROLES.ADMIN]: '管理员'
  },
  isAdmin(user) {
    return Boolean(user && user.role === ROLES.ADMIN)
  }
}
