/**
 * Request validation middleware
 * Validates request body, params, and query
 */

/**
 * Validates required fields in request body
 * @param {string[]} fields - Array of required field names
 */
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Validates that ID parameter exists and is a number
 */
export const validateId = (req, res, next) => {
  const id = req.params.id || req.params.projectId || req.params.workerId;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID parameter is required'
    });
  }
  
  if (isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      error: 'ID must be a valid number'
    });
  }
  
  next();
};
