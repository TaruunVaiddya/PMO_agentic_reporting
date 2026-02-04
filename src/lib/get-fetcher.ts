import { fetchWithAuth } from './fetch-with-auth'

export const fetcher = async (path: string) => {
    let response: Response
    try {
      response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      })
    } catch (networkError) {
      throw networkError instanceof Error
        ? networkError
        : new Error("Network error while fetching")
    }

    if (!response.ok) {
      const bodyText = await response.json()
      // Handle both string and object detail formats
      let errorMessage = "Request failed"
      if (bodyText?.detail) {
        if (typeof bodyText.detail === 'string') {
          errorMessage = bodyText.detail
        } else if (typeof bodyText.detail === 'object' && bodyText.detail.error) {
          errorMessage = bodyText.detail.error
        } else if (typeof bodyText.detail === 'object') {
          errorMessage = JSON.stringify(bodyText.detail)
        }
      }
      throw new Error(errorMessage)
    }

    try {
      return await response.json()
    } catch (parseError) {
      throw new Error("Failed to parse JSON response")
    }
  }
   