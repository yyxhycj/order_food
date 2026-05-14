const { callFunction } = require('./cloud')
const { formatFriendlyDate } = require('../utils/date')

function normalizeComment(raw) {
  const comment = raw || {}
  return {
    _id: comment._id || '',
    userId: comment.userId || '',
    nickname: comment.nickname || '家里人',
    avatarUrl: comment.avatarUrl || '',
    content: comment.content || '',
    createdAtText: formatFriendlyDate(comment.createdAt),
    canDelete: Boolean(comment.canDelete)
  }
}

async function getComments(recipeId) {
  const result = await callFunction('listComments', { recipeId })
  return (result.comments || []).map(normalizeComment)
}

async function createComment(recipeId, content) {
  const result = await callFunction('createComment', {
    recipeId,
    content: (content || '').trim()
  })
  return normalizeComment(result.comment)
}

async function deleteComment(id) {
  return callFunction('deleteComment', { id })
}

module.exports = {
  normalizeComment,
  getComments,
  createComment,
  deleteComment
}
