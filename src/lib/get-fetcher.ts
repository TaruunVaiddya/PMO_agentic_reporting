export const fetcher = async (path: string) => {
    let response: Response
    try {
      response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        method: "GET",
        credentials: "include", // This should be at the top level, not in headers
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
      throw new Error(bodyText?.detail || "Request failed")
    }
  
    try {
      return await response.json()
    } catch (parseError) {
      throw new Error("Failed to parse JSON response")
    }
  }
   