const { callFunction } = require('./cloud')
const { formatFriendlyDate } = require('../utils/date')

function normalizeComment(raw) {
  const comment = raw || {}
  return {
    ...comment,
    _id: comment._id || comment.id,
    nickname: comment.userName || comment.nickname || '朋友',
    avatarUrl: comment.userAvatar || comment.avatarUrl || '',
    content: comment.content || '',
    createdAtText: formatFriendlyDate(comment.createdAt || comment.created_at),
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
