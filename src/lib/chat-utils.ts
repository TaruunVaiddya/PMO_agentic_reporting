
/**
 * Utility function to extract HTML from markdown code blocks or result field
 */
export const extractHtmlContent = (output: any): string => {
    // console.log('[extractHtmlContent] Input type:', typeof output);

    let htmlContent = '';

    // Check if output has a result field
    if (output && typeof output === 'object' && output.result) {
        htmlContent = output.result;
    } else if (typeof output === 'string') {
        htmlContent = output;
    } else {
        return '';
    }

    // Strip markdown code fences if present
    // Matches: ```html\n...content...\n``` or ```\n...content...\n```
    // Also handles cases where there might be extra whitespace
    const trimmed = htmlContent.trim();

    // Try multiple patterns for code block extraction
    const codeBlockPatterns = [
        /^```(?:html)?\s*\n?([\s\S]*?)\n?\s*```$/,  // Standard code block
        /^```(?:html)?\s*([\s\S]*?)\s*```$/,         // Without newlines
        /^`{3,}(?:html)?\s*\n?([\s\S]*?)\n?\s*`{3,}$/, // Multiple backticks
    ];

    for (const pattern of codeBlockPatterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    // If no code block found but content starts with <!DOCTYPE or <html, return as-is
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<HTML')) {
        return trimmed;
    }

    return trimmed;
};
