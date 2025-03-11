import fetch from "node-fetch";

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

export const handler = async (event) => {
  // Check if API key is available
  if (!SPOONACULAR_API_KEY) {
    console.error('SPOONACULAR_API_KEY is not set in environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API configuration error" })
    };
  }

  const path = event.path;
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};

  // Health check endpoint
  if (path === "/health") {
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: "ok",
        hasApiKey: !!SPOONACULAR_API_KEY
      })
    };
  }

  // Search recipes endpoint
  if (path === "/api/search") {
    let ingredients, diet, intolerances;

    if (method === "POST") {
      try {
        const body = JSON.parse(event.body);
        ingredients = body.ingredients;
        diet = body.diet;
        intolerances = body.intolerances;
        console.log('Parsed body:', { ingredients, diet, intolerances });
      } catch (error) {
        console.error('Error parsing body:', error);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid request body" })
        };
      }
    } else if (method === "GET") {
      ingredients = params.ingredients;
      diet = params.diet;
      intolerances = params.intolerances;
    }
    
    if (!ingredients) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Ingredients are required" })
      };
    }

    try {
      // Clean and validate ingredients
      const ingredientList = ingredients.split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      if (ingredientList.length > 5) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Maximum 5 ingredients allowed" })
        };
      }

      // Build the API URL with parameters
      const searchParams = new URLSearchParams();
      searchParams.append('apiKey', SPOONACULAR_API_KEY);
      searchParams.append('query', ingredientList.join(' '));
      searchParams.append('number', '12');
      searchParams.append('addRecipeInformation', 'true');
      searchParams.append('fillIngredients', 'true');
      searchParams.append('instructionsRequired', 'true');

      // Add diet if specified
      if (diet && diet !== 'none') {
        searchParams.append('diet', diet);
      }

      // Add intolerances if specified
      if (intolerances && intolerances !== 'none') {
        searchParams.append('intolerances', intolerances);
      }

      const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?${searchParams}`;
      console.log('Calling Spoonacular API...');

      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('Spoonacular API response status:', response.status);
      console.log('Spoonacular API response:', data);

      // Check for API errors
      if (response.status === 401) {
        console.error('Unauthorized - API key might be invalid');
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "API authentication failed" })
        };
      }

      if (data.code === 402) {
        return {
          statusCode: 429,
          body: JSON.stringify({ error: "API quota exceeded" })
        };
      }

      // Make sure we have results
      if (!data.results || !Array.isArray(data.results)) {
        console.error('Invalid response format from Spoonacular:', data);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: "Invalid response format from recipe service",
            details: data
          })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(data.results)
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "Failed to fetch recipes",
          details: error.message
        })
      };
    }
  }

  // Get recipe details endpoint
  if (path.startsWith("/api/recipe/")) {
    const id = path.split("/").pop();
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Recipe ID is required" })
      };
    }

    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/${id}/information?apiKey=${SPOONACULAR_API_KEY}`
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Spoonacular API error:', errorData);
        throw new Error('Failed to fetch recipe details from Spoonacular');
      }

      const data = await response.json();

      // Check for API errors
      if (data.code === 402) {
        return {
          statusCode: 429,
          body: JSON.stringify({ error: "API quota exceeded" })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(data)
      };
    } catch (error) {
      console.error('Recipe details error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message || "Failed to fetch recipe details" })
      };
    }
  }

  // Handle 404 for unknown routes
  return {
    statusCode: 404,
    body: JSON.stringify({ error: "Not Found" })
  };
}; 