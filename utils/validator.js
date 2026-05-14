function trim(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validateRecipe(recipe, options = {}) {
  const data = recipe || {}
  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : []
  const steps = Array.isArray(data.steps) ? data.steps : []

  if (!trim(data.title)) {
    return { valid: false, message: '请输入菜谱标题' }
  }

  if (options.requireCover && !data.coverImage) {
    return { valid: false, message: '请上传菜谱主图' }
  }

  if (ingredients.filter(item => trim(item.name) && trim(item.amount)).length === 0) {
    return { valid: false, message: '请至少添加一个食材' }
  }

  if (steps.filter(item => trim(item.text)).length === 0) {
    return { valid: false, message: '请至少添加一个步骤' }
  }

  return { valid: true, message: '' }
}

function validateRequestReason(reason) {
  if (trim(reason).length > 120) {
    return { valid: false, message: '想吃理由最多 120 个字' }
  }

  return { valid: true, message: '' }
}

module.exports = {
  validateRecipe,
  validateRequestReason
}
