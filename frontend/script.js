document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recipe-form');
    if (!form) {
        console.error('Recipe form not found');
        return;
    }

    const resultsContainer = document.getElementById('recipe-results');
    const errorContainer = document.getElementById('error-message');
    const recipeDetails = document.getElementById('recipe-details');
    const recipeGrid = document.getElementById('recipe-grid');
    const recipeContent = document.getElementById('recipe-content');
    const loading = document.getElementById('loading');
    const searchSummary = document.getElementById('search-summary');
    const backToResults = document.getElementById('back-to-results');

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous results and errors
        if (resultsContainer) resultsContainer.innerHTML = '';
        if (errorContainer) errorContainer.innerHTML = '';
        
        // Show loading state
        if (resultsContainer) resultsContainer.innerHTML = '<p>Loading recipes...</p>';

        // Get form data
        const ingredients = document.getElementById('ingredients')?.value || '';
        const diet = document.getElementById('diet')?.value || 'none';
        const intolerances = document.getElementById('intolerances')?.value || 'none';

        try {
            console.log('Sending request with:', { ingredients, diet, intolerances });
            
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ingredients,
                    diet,
                    intolerances
                })
            });

            const data = await response.json();
            console.log('API Response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch recipes');
            }

            if (!Array.isArray(data)) {
                throw new Error('Invalid response format from API');
            }
            
            if (data.length === 0) {
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<p>No recipes found with these ingredients. Try different ingredients or fewer restrictions.</p>';
                }
                return;
            }

            // Display recipes
            if (resultsContainer) {
                resultsContainer.innerHTML = data.map(recipe => `
                    <div class="recipe-card">
                        <img src="${recipe.image}" alt="${recipe.title}">
                        <h3>${recipe.title}</h3>
                        <p>Ready in ${recipe.readyInMinutes} minutes</p>
                        <p>Used ingredients: ${recipe.usedIngredientCount || 'N/A'}</p>
                        <button onclick="showRecipeDetails('${recipe.id}')">View Recipe</button>
                    </div>
                `).join('');
            }

        } catch (error) {
            console.error('Error:', error);
            if (errorContainer) {
                errorContainer.innerHTML = `<p class="error">${error.message}</p>`;
            }
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
            }
        }
    });

    // Handle back to results button
    backToResults.addEventListener('click', () => {
        recipeDetails.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
    });

    // Function to display recipe results
    function displayResults(recipes) {
        recipeGrid.innerHTML = '';
        
        recipes.forEach(recipe => {
            const col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-lg-4';
            
            col.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="position-relative">
                        <img src="${recipe.image}" class="card-img-top recipe-image" alt="${recipe.title}">
                        <div class="position-absolute top-0 end-0 m-2">
                            <span class="badge bg-dark">
                                <i class="bi bi-clock me-1"></i>${recipe.readyInMinutes} min
                            </span>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${recipe.title}</h5>
                        <div class="mb-3">
                            <span class="badge bg-secondary me-1">
                                <i class="bi bi-people me-1"></i>${recipe.servings} servings
                            </span>
                            ${recipe.diets.map(diet => 
                                `<span class="badge bg-info me-1">${diet}</span>`
                            ).join('')}
                        </div>
                        <p class="card-text flex-grow-1">${recipe.summary}</p>
                        <button class="btn btn-primary mt-3" onclick="showRecipeDetails('${recipe.id}')">
                            <i class="bi bi-eye me-2"></i>View Recipe
                        </button>
                    </div>
                </div>
            `;
            
            recipeGrid.appendChild(col);
        });
    }

    // Function to view recipe details
    async function showRecipeDetails(recipeId) {
        const resultsContainer = document.getElementById('recipe-results');
        const errorContainer = document.getElementById('error-message');

        try {
            if (resultsContainer) {
                resultsContainer.innerHTML = '<p>Loading recipe details...</p>';
            }
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }

            const response = await fetch(`/api/recipe/${recipeId}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch recipe details');
            }

            const recipe = await response.json();

            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="recipe-details">
                        <button onclick="location.reload()" class="back-button">← Back to Results</button>
                        <h2>${recipe.title}</h2>
                        <img src="${recipe.image}" alt="${recipe.title}">
                        <div class="recipe-info">
                            <p>Ready in ${recipe.readyInMinutes} minutes</p>
                            <p>Servings: ${recipe.servings}</p>
                            ${recipe.diets?.length ? `<p>Diets: ${recipe.diets.join(', ')}</p>` : ''}
                        </div>
                        <h3>Ingredients:</h3>
                        <ul>
                            ${recipe.extendedIngredients?.map(ing => `
                                <li>${ing.original}</li>
                            `).join('') || '<li>No ingredients available</li>'}
                        </ul>
                        <h3>Instructions:</h3>
                        ${recipe.instructions ? `
                            <div class="instructions">
                                ${recipe.instructions}
                            </div>
                        ` : '<p>No instructions available.</p>'}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error:', error);
            if (errorContainer) {
                errorContainer.innerHTML = `<p class="error">${error.message}</p>`;
            }
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
            }
        }
    }
});

async function searchRecipes() {
    const ingredients = document.getElementById('ingredients').value;
    const dietaryRestrictions = document.getElementById('dietaryRestrictions').value;
    
    if (!ingredients) {
        alert('Please enter ingredients');
        return;
    }

    // Clean and validate ingredients
    const ingredientList = ingredients.split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

    if (ingredientList.length > 5) {
        alert('Please enter no more than 5 ingredients');
        return;
    }

    try {
        const queryParams = new URLSearchParams({
            ingredients: ingredientList.join(','),
            intolerances: dietaryRestrictions
        });

        const response = await fetch(`/api/search?${queryParams}`);
        const data = await response.json();
        
        if (data.error) {
            document.getElementById('results').innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
            return;
        }

        if (!data.results || data.results.length === 0) {
            document.getElementById('results').innerHTML = '<div class="alert alert-info">No recipes found with these ingredients and restrictions. Try different ingredients or fewer restrictions.</div>';
            return;
        }

        const resultsHtml = data.results.map(recipe => `
            <div class="card recipe-card">
                <img src="${recipe.image}" class="card-img-top recipe-image" alt="${recipe.title}">
                <div class="card-body">
                    <h5 class="card-title">${recipe.title}</h5>
                    <p class="card-text">Ready in ${recipe.readyInMinutes} minutes</p>
                    <p class="card-text">Servings: ${recipe.servings}</p>
                    <button class="btn btn-primary" onclick="viewRecipeDetails(${recipe.id})">View Recipe</button>
                </div>
            </div>
        `).join('');

        document.getElementById('results').innerHTML = resultsHtml;
    } catch (error) {
        document.getElementById('results').innerHTML = '<div class="alert alert-danger">Failed to fetch recipes</div>';
    }
}

async function viewRecipeDetails(id) {
    try {
        const response = await fetch(`/api/recipe?id=${id}`);
        const recipe = await response.json();
        
        if (recipe.error) {
            alert(recipe.error);
            return;
        }

        // Handle instructions - try analyzedInstructions first, fall back to plain instructions
        let instructionsHtml = '';
        if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0 && recipe.analyzedInstructions[0].steps) {
            instructionsHtml = `
                <ol class="list-group list-group-numbered">
                    ${recipe.analyzedInstructions[0].steps.map(step => 
                        `<li class="list-group-item">${step.step}</li>`
                    ).join('')}
                </ol>
            `;
        } else if (recipe.instructions) {
            // Split plain instructions by periods to create steps
            const steps = recipe.instructions
                .split('.')
                .filter(step => step.trim().length > 0)
                .map(step => step.trim());
            
            instructionsHtml = `
                <ol class="list-group list-group-numbered">
                    ${steps.map(step => 
                        `<li class="list-group-item">${step}</li>`
                    ).join('')}
                </ol>
            `;
        } else {
            instructionsHtml = '<p class="text-muted">No instructions available for this recipe.</p>';
        }

        const detailsHtml = `
            <div class="card">
                <img src="${recipe.image}" class="card-img-top recipe-image" alt="${recipe.title}">
                <div class="card-body">
                    <h5 class="card-title">${recipe.title}</h5>
                    <p class="card-text">Ready in ${recipe.readyInMinutes} minutes</p>
                    <p class="card-text">Servings: ${recipe.servings}</p>
                    <div class="mb-4">
                        <h6 class="text-danger">Ingredients:</h6>
                        <ul class="list-group">
                            ${recipe.extendedIngredients.map(ing => 
                                `<li class="list-group-item">${ing.original}</li>`
                            ).join('')}
                        </ul>
                    </div>
                    <div class="mb-4">
                        <h6 class="text-danger">Instructions:</h6>
                        <div class="instructions">
                            ${instructionsHtml}
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="searchRecipes()">Back to Results</button>
                </div>
            </div>
        `;

        document.getElementById('results').innerHTML = detailsHtml;
    } catch (error) {
        console.error('Recipe detail error:', error);
        alert('Failed to fetch recipe details');
    }
} 