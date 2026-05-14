const RECIPE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
  DELETED: 'deleted'
}

const RECIPE_STATUS_TEXT = {
  [RECIPE_STATUS.DRAFT]: '草稿',
  [RECIPE_STATUS.PUBLISHED]: '已发布',
  [RECIPE_STATUS.HIDDEN]: '已隐藏',
  [RECIPE_STATUS.DELETED]: '已删除'
}

function getRecipeStatusText(status) {
  return RECIPE_STATUS_TEXT[status] || '未知状态'
}

module.exports = {
  RECIPE_STATUS,
  RECIPE_STATUS_TEXT,
  getRecipeStatusText
}
