export const postFetcher = async (path: string, data: any) => {
    let response: Response
    try {
      response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        method: "POST",
        credentials:'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
    } catch (networkError) {
      throw networkError instanceof Error
        ? networkError
        : new Error("Network error while fetching")
    }
  
    if (!response.ok) {
      const bodyText = await response.json()
      // Handle structured error objects from backend
      const detail = bodyText?.detail
      let errorMessage = "Request failed"

      if (typeof detail === 'object' && detail !== null) {
        // Backend returns { error: "message", code: "ERROR_CODE" }
        errorMessage = detail.error || detail.message || JSON.stringify(detail)
      } else if (typeof detail === 'string') {
        errorMessage = detail
      }

      throw new Error(errorMessage)
    }
  
    try {
      return await response.json()
    } catch (parseError) {
      throw new Error("Failed to parse JSON response")
    }
  }