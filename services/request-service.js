const {
  REQUEST_STATUS,
  getRequestStatusText
} = require('../constants/request-status')
const { callFunction } = require('./cloud')
const { formatFriendlyDate } = require('../utils/date')
const cache = require('../utils/cache')

const REQUEST_CACHE_MAX_AGE = 60 * 1000

function normalizeRequest(raw) {
  const request = raw || {}
  const status = request.status || REQUEST_STATUS.PENDING

  return {
    _id: request._id || request.id,
    recipeId: request.recipeId || '',
    recipeTitle: request.recipeTitle || '',
    recipeCoverImage: request.recipeCoverImage || '/images/dish-placeholder.png',
    requesterUserId: request.requesterUserId || '',
    requesterNickname: request.requesterNickname || '家里人',
    authorUserId: request.authorUserId || '',
    authorNickname: request.authorNickname || '家里人',
    reason: request.reason || '',
    status,
    statusText: getRequestStatusText(status),
    note: request.note || '',
    createdAtText: formatFriendlyDate(request.createdAt || request.created_at),
    handledAtText: formatFriendlyDate(request.handledAt || request.handled_at),
    canCancel: status === REQUEST_STATUS.PENDING,
    canAccept: status === REQUEST_STATUS.PENDING,
    canDecline: status === REQUEST_STATUS.PENDING,
    canPrepare: status === REQUEST_STATUS.ACCEPTED,
    canDone: status === REQUEST_STATUS.PREPARING
  }
}

async function createRequest(recipe, reason) {
  const result = await callFunction('createRequest', {
    recipeId: recipe._id,
    reason: reason || ''
  })
  clearRequestCaches()
  return result
}

function getRequestCacheKey(mode) {
  return `cache:v2:requests:${mode}`
}

function getCachedRequests(mode = 'mine') {
  return cache.getAny(getRequestCacheKey(mode))
}

async function listRequests(mode) {
  const cached = cache.get(getRequestCacheKey(mode), REQUEST_CACHE_MAX_AGE)
  if (cached) return cached

  const result = await callFunction('listRequests', { mode })
  const requests = (result.requests || []).map(normalizeRequest)
  cache.set(getRequestCacheKey(mode), requests)
  return requests
}

async function getMyRequests() {
  return listRequests('mine')
}

async function getReceivedRequests() {
  return listRequests('received')
}

async function getAllRequests() {
  return listRequests('all')
}

async function updateRequestStatus(id, status, note = '') {
  const result = await callFunction('updateRequestStatus', { id, status, note })
  clearRequestCaches()
  return result
}

async function cancelRequest(id) {
  return updateRequestStatus(id, REQUEST_STATUS.CANCELLED)
}

module.exports = {
  REQUEST_STATUS,
  normalizeRequest,
  getCachedRequests,
  createRequest,
  getMyRequests,
  getReceivedRequests,
  getAllRequests,
  updateRequestStatus,
  cancelRequest
}

function clearRequestCaches() {
  ;['mine', 'received', 'all'].forEach(mode => {
    cache.remove(getRequestCacheKey(mode))
  })
  cache.removePrefix('cache:v2:recipes:')
  cache.removePrefix('cache:v2:userStats:')
}
