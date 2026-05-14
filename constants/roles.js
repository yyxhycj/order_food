const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
}

module.exports = {
  ROLES,
  ROLE_TEXT: {
    [ROLES.USER]: '家里人',
    [ROLES.ADMIN]: '管小馆'
  },
  isAdmin(user) {
    return Boolean(user && user.role === ROLES.ADMIN)
  }
}
