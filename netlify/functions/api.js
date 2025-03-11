import fetch from "node-fetch";

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

export const handler = async (event) => {
  const path = event.path;
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};

  // Health check endpoint
  if (path === "/health") {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: "ok" })
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
      } catch (error) {
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
      const searchParams = new URLSearchParams({
        apiKey: SPOONACULAR_API_KEY,
        includeIngredients: ingredientList.join(','),
        addRecipeInformation: true,
        number: 12,
        instructionsRequired: true,
        fillIngredients: true,
        sort: 'max-used-ingredients'
      });

      // Add diet if specified
      if (diet && diet !== 'none') {
        searchParams.append('diet', diet);
      }

      // Add intolerances if specified
      if (intolerances && intolerances !== 'none') {
        searchParams.append('intolerances', intolerances);
      }

      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?${searchParams}`
      );
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
        body: JSON.stringify(data.results || [])
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch recipes" })
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
        body: JSON.stringify({ error: "Failed to fetch recipe details" })
      };
    }
  }

  // Handle 404 for unknown routes
  return {
    statusCode: 404,
    body: JSON.stringify({ error: "Not Found" })
  };
}; 