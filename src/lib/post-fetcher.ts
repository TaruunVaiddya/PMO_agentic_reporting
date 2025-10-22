export const postFetcher = async (path: string, data: any) => {
    let response: Response
    try {
      response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        method: "POST",
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
      throw new Error(bodyText?.detail || "Request failed")
    }
  
    try {
      return await response.json()
    } catch (parseError) {
      throw new Error("Failed to parse JSON response")
    }
  }