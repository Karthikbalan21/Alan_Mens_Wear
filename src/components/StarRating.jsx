function StarRating({ value = 0, onChange, interactive = false, label = 'Rating' }) {
  const roundedValue = Math.round(Number(value || 0))

  return (
    <div className="star-rating" aria-label={`${label}: ${roundedValue} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= roundedValue

        if (!interactive) {
          return (
            <span className={isActive ? 'active' : ''} key={star}>
              ★
            </span>
          )
        }

        return (
          <button
            className={isActive ? 'active' : ''}
            type="button"
            key={star}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}

export default StarRating
