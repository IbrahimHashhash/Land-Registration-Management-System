function prettyField(field) {
  return String(field).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function apiError(err, fallback = 'Something went wrong') {
  if (err?.code === 'ECONNABORTED') {
    return 'The request timed out — the server may be busy or unreachable.'
  }
  if (!err?.response) {
    return 'Cannot reach the server. Make sure the backend is running at http://127.0.0.1:8000.'
  }
  const { status, data } = err.response
  const detail = data?.detail

  if (Array.isArray(detail)) {
    return detail
      .map(e => {
        const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : (e.loc || 'field')
        return `${prettyField(field)}: ${e.msg}`
      })
      .join(' · ')
  }
  if (typeof detail === 'string') return detail
  if (status === 404) return 'Not found.'
  if (status === 403) return 'You are not allowed to do this.'
  return `${fallback} (HTTP ${status})`
}
