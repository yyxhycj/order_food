const COLLECTIONS = require('../constants/collections')
const {
  REQUEST_STATUS,
  getRequestStatusText
} = require('../constants/request-status')
const { getDb, callFunction } = require('./cloud')
const { formatFriendlyDate } = require('../utils/date')
const userService = require('./user-service')

function normalizeRequest(raw) {
  const request = raw || {}
  const status = request.status || REQUEST_STATUS.PENDING

  return {
    ...request,
    _id: request._id || request.id,
    status,
    statusText: request.statusText || getRequestStatusText(status),
    recipeCoverImage: request.recipeCoverImage || '/images/recipe.png',
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
  return callFunction('createRequest', {
    recipeId: recipe._id,
    reason: reason || ''
  })
}

async function getMyRequests() {
  const db = getDb()
  const user = await userService.getCurrentUser()
  const res = await db.collection(COLLECTIONS.REQUESTS)
    .where({ requesterOpenid: user.openid })
    .orderBy('createdAt', 'desc')
    .get()

  return (res.data || []).map(normalizeRequest)
}

async function getReceivedRequests() {
  const db = getDb()
  const user = await userService.getCurrentUser()
  const res = await db.collection(COLLECTIONS.REQUESTS)
    .where({ authorOpenid: user.openid })
    .orderBy('createdAt', 'desc')
    .get()

  return (res.data || []).map(normalizeRequest)
}

async function getAllRequests() {
  const db = getDb()
  const res = await db.collection(COLLECTIONS.REQUESTS)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get()

  return (res.data || []).map(normalizeRequest)
}

async function updateRequestStatus(id, status, note = '') {
  return callFunction('updateRequestStatus', { id, status, note })
}

async function cancelRequest(id) {
  return updateRequestStatus(id, REQUEST_STATUS.CANCELLED)
}

module.exports = {
  REQUEST_STATUS,
  normalizeRequest,
  createRequest,
  getMyRequests,
  getReceivedRequests,
  getAllRequests,
  updateRequestStatus,
  cancelRequest
}
